"use client";

import { TeamMembersTableHead } from "@/components/team/TeamMembersTable";
import { Skeleton } from "@multifeed/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@multifeed/ui/components/table";

export function TeamTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-4 border-card">
      <Table className="min-w-[880px]">
        <TeamMembersTableHead />
        <TableBody>
          <TableRow data-static>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton shape="circle" className="size-9 shrink-0" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
