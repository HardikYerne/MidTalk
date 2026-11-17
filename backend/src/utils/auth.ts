import type {FastifyRequest} from "fastify";import {ObjectId} from "mongodb";
export function currentUserId(req:FastifyRequest):ObjectId{const id=(req.user as {sub?:string}|undefined)?.sub;if(!id||!ObjectId.isValid(id))throw Object.assign(new Error("Unauthenticated"),{statusCode:401});return new ObjectId(id);}
export function publicUser(u:any){return {id:u._id.toString(),username:u.username,displayName:u.displayName,avatarUrl:u.avatarUrl??null,bio:u.bio??"",status:u.presenceStatus??"OFFLINE",lastSeenAt:u.lastSeenAt??null};}
export function isDuplicate(e:unknown){return typeof e==="object"&&e!==null&&"code" in e&&(e as any).code===11000;}
