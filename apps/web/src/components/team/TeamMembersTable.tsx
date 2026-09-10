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

const tableHeadClassName =
  "relative h-8 bg-card px-4 py-2 after:absolute after:inset-y-1 after:right-0 after:w-px after:bg-border";

export function TeamMembersTableHead() {
  return (
    <TableHeader className="bg-card [&_tr]:border-b-0">
      <TableRow className="border-b-0 hover:bg-card">
        <TableHead className={tableHeadClassName}>Member</TableHead>
        <TableHead className={tableHeadClassName}>Email</TableHead>
        <TableHead className={tableHeadClassName}>Last active</TableHead>
        <TableHead className="h-8 bg-card px-4 py-2">Status</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function TeamMembersTable({ rows }: { rows: TeamTableRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border-4 border-card">
      <Table className="min-w-[880px]">
        <TeamMembersTableHead />
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                className="px-4 py-10 text-center text-muted-foreground"
                colSpan={4}
              >
                No team members yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const initials = getInitials(row.name ?? row.email);

              return (
                <TableRow className="border-border" key={row.id}>
                  <TableCell className="px-4">
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
                  <TableCell className="px-4 text-sm text-muted-foreground">
                    {row.email}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-muted-foreground">
                    {row.lastActivity}
                  </TableCell>
                  <TableCell className="px-4 text-sm font-medium text-foreground">
                    {row.status}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
