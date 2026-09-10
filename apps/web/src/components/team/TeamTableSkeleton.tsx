"use client";

import { TeamMembersTableHead } from "@/components/team/TeamMembersTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function TeamTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-4 border-card">
      <Table className="min-w-[880px]">
        <TeamMembersTableHead />
        <TableBody>
          <TableRow className="border-border hover:bg-transparent">
            <TableCell className="px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32 rounded-xl" />
                  <Skeleton className="h-3 w-20 rounded-xl" />
                </div>
              </div>
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="h-4 w-40 rounded-xl" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="h-4 w-28 rounded-xl" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="h-4 w-16 rounded-xl" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
