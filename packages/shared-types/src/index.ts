export type UserId=string;
export type ConversationId=string;
export type MessageId=string;
export type FileId=string;
export type MessageRequestStatus="PENDING"|"ACCEPTED"|"REJECTED"|"CANCELLED"|"EXPIRED";
export type MessageDeliveryStatus="SENT"|"DELIVERED"|"READ";
export interface ApiError{error:string;message:string}
export interface PaginatedResult<T>{items:T[];nextCursor:string|null}
