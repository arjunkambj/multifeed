"use client";

import { useSearchParams } from "next/navigation";
import type { Id } from "@convex/_generated/dataModel";
import { CreatePostComposer } from "@/components/posts/CreatePostComposer";

export function CreatePostPageClient() {
  const searchParams = useSearchParams();
  const at = searchParams.get("at");
  const from = searchParams.get("from");
  const edit = searchParams.get("edit");
  const initialScheduledFor = at ? Number(at) : undefined;
  const duplicateFromId =
    from && from.length > 0 ? (from as Id<"posts">) : undefined;
  const editPostId =
    edit && edit.length > 0 ? (edit as Id<"posts">) : undefined;

  return (
    <CreatePostComposer
      initialScheduledFor={
        initialScheduledFor && !Number.isNaN(initialScheduledFor)
          ? initialScheduledFor
          : undefined
      }
      duplicateFromId={duplicateFromId}
      editPostId={editPostId}
    />
  );
}
