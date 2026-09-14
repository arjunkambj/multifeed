"use client";

import { PostsTableHead } from "@/components/posts/PostsTable";
import { Skeleton } from "@multifeed/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@multifeed/ui/components/table";

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
            <TableRow data-static key={index}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="size-7" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
