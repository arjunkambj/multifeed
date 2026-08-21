import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { PostLibrary } from "@/components/posts/PostLibrary";

export const metadata: Metadata = {
  title: "Posts",
};

export default function PostsPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="posts" />}>
      <PostLibrary />
    </Suspense>
  );
}
