import { Suspense } from "react";
import { preloadQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { PostLibrary } from "@/components/posts/PostLibrary";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { requireDashboardSession } from "@/hexclave/dashboard-session";
import { isPostLibraryFilter } from "@/lib/post-filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function PostsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const filter = isPostLibraryFilter(rawStatus) ? rawStatus : "all";
  const args =
    filter === "all"
      ? ({ limit: 100 } as const)
      : ({ status: filter, limit: 100 } as const);
  const { convexToken } = await requireDashboardSession();
  const preloaded = await preloadQuery(api.posts.list, args, {
    token: convexToken,
  });

  return <PostLibrary filter={filter} preloaded={preloaded} />;
}

export default function PostsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="posts" />}>
      <PostsContent searchParams={searchParams} />
    </Suspense>
  );
}
