import {randomUUID} from "node:crypto";import {getDb} from "../infrastructure/database/mongo.js";
export async function enqueueOutbox(type:string,payload:Record<string,unknown>,session?:any){const doc={eventId:randomUUID(),type,payload,status:"PENDING",attempts:0,availableAt:new Date(),createdAt:new Date()};await getDb().collection("outbox").insertOne(doc,{session});return doc;}
