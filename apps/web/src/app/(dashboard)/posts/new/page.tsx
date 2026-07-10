import { Suspense } from "react";
import { Spinner } from "@heroui/react";
import { CreatePostPageClient } from "./CreatePostPageClient";

export default function NewPostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <CreatePostPageClient />
    </Suspense>
  );
}
