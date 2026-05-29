/* Oracle satırları ham olarak büyük harfli kolon adlarıyla döner.
   Repository katmanı bunları camelCase'e map'ler. Bu dosya UI tarafından
   tüketilen normalize edilmiş tipleri tanımlar. */

export type ResourceType =
  | "BOOK"
  | "PDF"
  | "NOTES"
  | "SLIDES"
  | "EXAM"
  | "PROJECT"
  | "OTHER";

export type PostStatus = "ACTIVE" | "RESERVED" | "COMPLETED" | "CANCELLED";

export type ExchangeStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export type ReportReason =
  | "SPAM"
  | "INAPPROPRIATE"
  | "FRAUD"
  | "HARASSMENT"
  | "OTHER";

export type ReportStatus = "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";

export interface Department {
  id: string;
  name: string;
  faculty: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarName: string | null;
  bio: string | null;
  departmentId: string | null;
  createdAt: Date;
}

export interface UserDetailed extends User {
  department: Department | null;
  skills: string[];
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  description: string | null;
  departmentId: string | null;
  department?: Department | null;
}

export interface Post {
  id: string;
  title: string;
  description: string | null;
  status: PostStatus;
  ownerId: string;
  offerId: string;
  requestId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDetailed extends Post {
  owner: User & { department: Department | null };
  offer: Resource;
  request: Resource;
  favoritedByMe?: boolean;
}

export interface Exchange {
  id: string;
  postId: string;
  requesterId: string;
  status: ExchangeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeMessage {
  exchangeId: string;
  messageNo: number;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  exchangeId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userAId: string;
  userBId: string;
  lastMessageAt: Date;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}
