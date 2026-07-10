import type { Id } from "@convex/_generated/dataModel";
import { CreatePostComposer } from "@/components/posts/CreatePostComposer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const at = first(params.at);
  const from = first(params.from);
  const edit = first(params.edit);
  const initialScheduledFor = at ? Number(at) : undefined;

  return (
    <CreatePostComposer
      initialScheduledFor={
        initialScheduledFor && !Number.isNaN(initialScheduledFor)
          ? initialScheduledFor
          : undefined
      }
      duplicateFromId={from ? (from as Id<"posts">) : undefined}
      editPostId={edit ? (edit as Id<"posts">) : undefined}
    />
  );
}
