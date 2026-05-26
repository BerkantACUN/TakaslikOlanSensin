import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PostCard, type PostCardData } from "@/components/posts/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const me = await requireUser();

  const favs = await prisma.favorite.findMany({
    where: { userId: me.id },
    orderBy: { addedAt: "desc" },
    include: {
      post: {
        include: {
          owner: { include: { department: { select: { name: true } } } },
          offer: { select: { title: true, type: true } },
          request: { select: { title: true, type: true } },
        },
      },
    },
  });

  const cards: PostCardData[] = favs.map((f: any) => ({
    id: f.post.id,
    title: f.post.title,
    description: f.post.description,
    status: f.post.status,
    createdAt: f.post.createdAt,
    owner: {
      id: f.post.owner.id,
      username: f.post.owner.username,
      avatarName: f.post.owner.avatarName,
      department: f.post.owner.department,
    },
    offer: f.post.offer,
    request: f.post.request,
    favoritedByMe: true,
    isMine: f.post.ownerId === me.id,
    authed: true,
  }));

  return (
    <div className="page-container py-8 md:py-10">
      <h1 className="text-[32px] md:text-[36px] font-bold tracking-tight">
        Favorilerim
      </h1>
      <p className="text-[14px] text-[var(--color-slate)] mt-1 mb-6">
        Daha sonra göz atmak için kaydettiğin ilanlar.
      </p>

      {cards.length === 0 ? (
        <EmptyState
          icon={<Icon.Heart />}
          title="Favori listen boş"
          description="İlanlardaki kalp simgesine basarak buraya kaydedebilirsin."
          action={
            <Link href="/posts">
              <Button variant="outline">
                İlanları keşfet <Icon.ArrowRight size={14} />
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cards.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
