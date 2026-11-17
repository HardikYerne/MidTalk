import {MongoClient,type Db} from "mongodb";import {env} from "../../config/env.js";
let client:MongoClient|undefined;let db:Db|undefined;
export async function connectMongo():Promise<Db>{if(db)return db;client=new MongoClient(env.mongodbUri,{maxPoolSize:50,minPoolSize:2,serverSelectionTimeoutMS:8000});await client.connect();db=client.db(env.mongodbDb);
 const indexes:Record<string,any[]>={
 users:[[{emailNormalized:1},{unique:true,name:"users_email_unique"}],[{usernameNormalized:1},{unique:true,name:"users_username_unique"}]],
 sessions:[[{tokenHash:1},{unique:true}],[{expiresAt:1},{expireAfterSeconds:0}],[{userId:1,revokedAt:1},{}]],devices:[[{userId:1,deviceId:1},{unique:true}]],
 contacts:[[{ownerId:1,contactId:1},{unique:true}]],messageRequests:[[{recipientId:1,status:1,createdAt:-1},{}],[{senderId:1,recipientId:1,status:1},{}]],blocks:[[{ownerId:1,blockedUserId:1},{unique:true}]],
 conversations:[[{participants:1,lastMessageAt:-1},{}],[{participantPairKey:1},{unique:true,partialFilterExpression:{type:"DIRECT"},name:"direct_conversation_unique"}]],messages:[[{conversationId:1,seq:1},{unique:true}],[{conversationId:1,senderId:1,clientMessageId:1},{unique:true}],[{conversationId:1,createdAt:-1},{}]],participantState:[[{conversationId:1,userId:1},{unique:true}]],
 files:[[{ownerId:1,createdAt:-1},{}],[{conversationId:1,status:1},{}]],fileParts:[[{fileId:1,partNumber:1},{unique:true}]],
 meetings:[[{"participants.userId":1,startsAt:1},{}]],meetingParticipants:[[{meetingId:1,userId:1},{unique:true}]],meetingArtifacts:[[{meetingId:1,createdAt:1},{}]],
 communities:[[{slug:1},{unique:true}]],channels:[[{communityId:1,slug:1},{unique:true}]],memberships:[[{userId:1,communityId:1},{unique:true}],[{communityId:1,role:1},{}]],invitations:[[{tokenHash:1},{unique:true}]],
 projects:[[{communityId:1,createdAt:-1},{}]],projectMembers:[[{projectId:1,userId:1},{unique:true}]],documents:[[{projectId:1,documentId:1},{unique:true}]],
 notifications:[[{userId:1,createdAt:-1},{}]],outbox:[[{status:1,availableAt:1},{}],[{eventId:1},{unique:true}]],auditEvents:[[{actorId:1,createdAt:-1},{}]],
 agents:[[{ownerId:1},{unique:true}]],agentMemory:[[{agentId:1,createdAt:-1},{}]],agentActions:[[{agentId:1,createdAt:-1},{}]],agentSuggestions:[[{ownerId:1,status:1,createdAt:-1},{}]],cryptoDeviceBundles:[[{userId:1,deviceId:1},{unique:true}]],meetingConsents:[[{meetingId:1,userId:1},{unique:true}]]
 };
 for(const [name,defs] of Object.entries(indexes)){const c=db.collection(name);for(const [keys,opts] of defs)await c.createIndex(keys,opts);}
 return db;}
export function getDb():Db{if(!db)throw new Error("MongoDB is not connected");return db;}
export function getMongoClient():MongoClient{if(!client)throw new Error("MongoDB is not connected");return client;}export async function closeMongo(){await client?.close();client=undefined;db=undefined;}
