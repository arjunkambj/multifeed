"use client";

import type { TeamTableRow } from "@/components/team/TeamMembersContent";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@multifeed/ui/components/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@multifeed/ui/components/table";

const getInitials = (value: string | null) =>
  value
    ?.split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function TeamMembersTableHead() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Member</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Last active</TableHead>
        <TableHead>Status</TableHead>
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
            <TableRow data-static>
              <TableCell colSpan={4}>
                <div className="py-8 text-center text-muted-foreground">
                  No team members yet.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const initials = getInitials(row.name ?? row.email);

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {row.imageUrl && (
                          <AvatarImage
                            alt={row.name ?? undefined}
                            src={row.imageUrl}
                          />
                        )}
                        <AvatarFallback>{initials}</AvatarFallback>
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
                  <TableCell>
                    <span className="text-muted-foreground">{row.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {row.lastActivity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {row.status}
                    </span>
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
