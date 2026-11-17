import {env} from "./config/env.js";import {buildApp} from "./app.js";import {runOutboxWorker,stopOutboxWorker} from "./modules/platform/outbox-worker.js";
const app=await buildApp();void runOutboxWorker().catch(error=>app.log.error({err:error},"Outbox worker stopped"));
try{await app.listen({host:env.host,port:env.port});}catch(error){app.log.error(error);stopOutboxWorker();await app.close();process.exit(1);}
const shutdown=async(signal:string)=>{app.log.info({signal},"Shutting down API");stopOutboxWorker();await app.close();process.exit(0);};process.on("SIGINT",()=>void shutdown("SIGINT"));process.on("SIGTERM",()=>void shutdown("SIGTERM"));
