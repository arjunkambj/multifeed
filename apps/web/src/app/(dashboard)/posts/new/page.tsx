import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { CreatePostComposer } from "@/components/posts/CreatePostComposer";

export const metadata: Metadata = {
  title: "New post",
};

export default function NewPostPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="new-post" />}>
      <CreatePostComposer />
    </Suspense>
  );
}
