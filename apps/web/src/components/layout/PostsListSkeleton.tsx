"use client";

import { PostsTableHead } from "@/components/posts/PostsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function PostsListSkeleton() {
  return (
    <div
      aria-label="Loading posts"
      className="overflow-hidden rounded-2xl border-4 border-card"
      role="status"
    >
      <Table className="min-w-[880px] table-fixed">
        <PostsTableHead />
        <TableBody>
          {Array.from({ length: 4 }, (_, index) => (
            <TableRow
              className="border-border hover:bg-transparent"
              key={index}
            >
              <TableCell className="px-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32 rounded-xl" />
                    <Skeleton className="h-3 w-48 rounded-xl" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-4 w-28 rounded-xl" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-6 w-16 rounded-xl" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-4 w-16 rounded-xl" />
              </TableCell>
              <TableCell className="px-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24 rounded-xl" />
                  <Skeleton className="h-3 w-14 rounded-xl" />
                </div>
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="size-7 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
