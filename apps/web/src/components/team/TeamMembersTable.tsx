"use client";

import type { TeamTableRow } from "@/components/team/TeamMembersContent";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getInitials = (value: string | null) =>
  value
    ?.split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function TeamMembersTable({
  membersError,
  rows,
}: {
  membersError: Error | null;
  rows: TeamTableRow[];
}) {
  return (
    <Table className="min-w-[880px]">
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Last active</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              className="px-4 py-10 text-center text-muted-foreground"
              colSpan={4}
            >
              {membersError?.message ?? "No team members yet."}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const initials = getInitials(row.name ?? row.email);

            return (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 rounded-full">
                      {row.imageUrl && (
                        <AvatarImage
                          alt={row.name ?? undefined}
                          src={row.imageUrl}
                        />
                      )}
                      <AvatarFallback className="text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.subtitle}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.email}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.lastActivity}
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">
                  {row.status}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
