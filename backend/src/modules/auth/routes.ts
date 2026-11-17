import type {FastifyInstance,FastifyReply} from "fastify";
import {ObjectId} from "mongodb";
import {getDb} from "../../infrastructure/database/mongo.js";
import {AuthError,AuthService} from "./service.js";import {env} from "../../config/env.js";
import {loginSchema,registerSchema} from "./schemas.js";
function handleError(error:unknown,reply:FastifyReply){
 if(error instanceof AuthError)return reply.code(error.statusCode).send({error:error.code,message:error.message});
 throw error;
}
export async function authRoutes(app:FastifyInstance){
 const auth=new AuthService(app);
 app.post("/auth/register",async(req,reply)=>{
  const p=registerSchema.safeParse(req.body);
  if(!p.success)return reply.code(400).send({error:"VALIDATION_ERROR",details:p.error.flatten()});
  try{return reply.code(201).send({user:await auth.register(p.data)});}catch(e){return handleError(e,reply);}
 });
 app.post("/auth/login",async(req,reply)=>{
  const p=loginSchema.safeParse(req.body);
  if(!p.success)return reply.code(400).send({error:"VALIDATION_ERROR",details:p.error.flatten()});
  try{const result=await auth.login(p.data);reply.setCookie("midtalk_refresh",result.refreshToken,{httpOnly:true,secure:env.cookieSecure,sameSite:"lax",path:"/api/v1/auth",maxAge:30*24*60*60});return {user:result.user,accessToken:result.accessToken,tokenType:result.tokenType};}catch(e){return handleError(e,reply);}
 });
 app.post("/auth/refresh",async(req,reply)=>{
  const raw=(req.cookies as any)?.midtalk_refresh;
  if(!raw)return reply.code(401).send({error:"INVALID_REFRESH_TOKEN"});
  try{const result=await auth.refresh(raw);reply.setCookie("midtalk_refresh",result.refreshToken,{httpOnly:true,secure:env.cookieSecure,sameSite:"lax",path:"/api/v1/auth",maxAge:30*24*60*60});return {user:result.user,accessToken:result.accessToken,tokenType:result.tokenType};}catch(e){return handleError(e,reply);}
 });
 app.post("/auth/logout",async(req,reply)=>{
  const raw=(req.cookies as any)?.midtalk_refresh;
  if(raw)await auth.logout(raw);reply.clearCookie("midtalk_refresh",{path:"/api/v1/auth"});return reply.code(204).send();
 });
 app.get("/auth/me",{preHandler:[app.authenticate]},async(req,reply)=>{
  const user=await getDb().collection("users").findOne({_id:new ObjectId(req.user.sub)});
  if(!user)return reply.code(404).send({error:"USER_NOT_FOUND"});
  return {user:authProfile(user)};
 });
}
function authProfile(user:any){
 return {id:user._id.toString(),email:user.email,username:user.username,displayName:user.displayName,createdAt:user.createdAt};
}
