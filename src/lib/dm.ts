import { prisma } from "./db";

/**
 * İki kullanıcı arasındaki konuşmayı tek bir kanonik anahtarla saklamak için
 * userAId < userBId garantisi veriyoruz. Bu sayede unique constraint çakışmaz.
 */
export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getOrCreateConversation(meId: string, otherId: string) {
  if (meId === otherId) {
    throw new Error("Kendine mesaj gönderemezsin");
  }
  const [userAId, userBId] = canonicalPair(meId, otherId);
  return prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
}

export function otherUserOf(c: { userAId: string; userBId: string }, meId: string) {
  return c.userAId === meId ? c.userBId : c.userAId;
}
