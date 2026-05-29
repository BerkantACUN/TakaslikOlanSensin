import Link from "next/link";
import { favorites } from "@/lib/repo";
import { requireUser } from "@/lib/auth";
import { FeedPost, type FeedPostData } from "@/components/posts/FeedPost";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const me = await requireUser();
  const favs = await favorites.listForUser(me.id);

  const cards: FeedPostData[] = favs.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt as any,
    owner: {
      id: p.owner.id,
      username: p.owner.username,
      avatarName: p.owner.avatarName,
      department: p.owner.department ?? null,
    },
    offer: { title: p.offer.title, type: p.offer.type },
    request: { title: p.request.title, type: p.request.type },
    favoritedByMe: true,
    isMine: p.ownerId === me.id,
    authed: true,
  }));

  return (
    <div className="page-container py-6 md:py-8 max-w-[640px]">
      <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight">
        Favorilerim
      </h1>
      <p className="text-[13px] text-[var(--color-slate)] mt-1 mb-6">
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
        <div className="space-y-5">
          {cards.map((p) => (
            <FeedPost key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
