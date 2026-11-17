import "fastify";
import type { Db } from "mongodb";
declare module "fastify" {
 interface FastifyInstance {
  authenticate:(request:FastifyRequest,reply:FastifyReply)=>Promise<void>;
  mongo:Db;
 }
 interface FastifyRequest { user:{sub:string;username:string;deviceId:string}; }
}
