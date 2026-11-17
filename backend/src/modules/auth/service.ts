import argon2 from "argon2";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {ObjectId} from "mongodb";
import type {FastifyInstance} from "fastify";
import {env} from "../../config/env.js";
import {getDb} from "../../infrastructure/database/mongo.js";

const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const refreshToken=()=>randomBytes(48).toString("base64url");
export class AuthError extends Error{
 constructor(public code:string,message:string,public statusCode:number){super(message);}
}
export class AuthService{
 constructor(private app:FastifyInstance){}
 async register(input:{email:string;username:string;displayName:string;password:string}){
  const db=getDb(),emailNormalized=input.email.toLowerCase(),usernameNormalized=input.username.toLowerCase();
  const passwordHash=await argon2.hash(input.password,{type:argon2.argon2id,memoryCost:19456,timeCost:2,parallelism:1});
  const now=new Date();
  try{
   const result=await db.collection("users").insertOne({
    email:input.email,emailNormalized,username:input.username,usernameNormalized,
    displayName:input.displayName,passwordHash,status:"ACTIVE",createdAt:now,updatedAt:now
   });
   return {id:result.insertedId.toHexString(),email:input.email,username:input.username,displayName:input.displayName,createdAt:now};
  }catch(e){
   if(typeof e==="object"&&e!==null&&"code" in e&&e.code===11000)
    throw new AuthError("IDENTITY_UNAVAILABLE","Email or username is already in use.",409);
   throw e;
  }
 }
 async login(input:{identifier:string;password:string;deviceName:string}){
  const id=input.identifier.toLowerCase();
  const user=await getDb().collection("users").findOne({$or:[{emailNormalized:id},{usernameNormalized:id}]});
  const valid=user?await argon2.verify(user.passwordHash,input.password).catch(()=>false):false;
  if(!user||!valid||user.status!=="ACTIVE")throw new AuthError("INVALID_CREDENTIALS","Invalid username/email or password.",401);
  const deviceId=randomUUID(),raw=refreshToken(),now=new Date();
  await getDb().collection("sessions").insertOne({
   userId:user._id,tokenHash:hash(raw),deviceId,deviceName:input.deviceName,
   createdAt:now,expiresAt:new Date(now.getTime()+env.refreshTokenTtlDays*86400000)
  });
  await getDb().collection("devices").updateOne({userId:user._id,deviceId},{
   $set:{deviceName:input.deviceName,lastSeenAt:now,status:"ACTIVE"},
   $setOnInsert:{createdAt:now}
  },{upsert:true});
  const accessToken=await this.app.jwt.sign({sub:user._id.toString(),username:user.username,deviceId},{expiresIn:env.accessTokenTtl});
  return {user:this.publicUser(user),accessToken,refreshToken:raw,tokenType:"Bearer"};
 }
 async refresh(raw:string){
  const db=getDb(),tokenHash=hash(raw);
  const session=await db.collection("sessions").findOne({tokenHash,revokedAt:{$exists:false},expiresAt:{$gt:new Date()}});
  if(!session)throw new AuthError("INVALID_REFRESH_TOKEN","Refresh token is invalid or expired.",401);
  const next=refreshToken();
  const updated=await db.collection("sessions").updateOne(
   {_id:session._id,tokenHash,revokedAt:{$exists:false}},
   {$set:{tokenHash:hash(next),rotatedAt:new Date()}}
  );
  if(updated.modifiedCount!==1)throw new AuthError("REFRESH_TOKEN_REUSE","Refresh token has already been used.",401);
  const user=await db.collection("users").findOne({_id:session.userId});
  if(!user||user.status!=="ACTIVE")throw new AuthError("ACCOUNT_UNAVAILABLE","Account is unavailable.",403);
  const accessToken=await this.app.jwt.sign({sub:user._id.toString(),username:user.username,deviceId:session.deviceId},{expiresIn:env.accessTokenTtl});
  return {user:this.publicUser(user),accessToken,refreshToken:next,tokenType:"Bearer"};
 }
 async logout(raw:string){
  await getDb().collection("sessions").updateOne({tokenHash:hash(raw),revokedAt:{$exists:false}},{$set:{revokedAt:new Date()}});
 }
 private publicUser(user:any){
  return {id:user._id.toString(),email:user.email,username:user.username,displayName:user.displayName,createdAt:user.createdAt};
 }
}
