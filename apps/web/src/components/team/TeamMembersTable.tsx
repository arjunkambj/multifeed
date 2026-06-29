"use client";

import type { TeamTableRow } from "@/components/team/TeamMembersContent";

import { Avatar, Table } from "@heroui/react";

const memberColumns = [
  { id: "member", label: "Member", isRowHeader: true },
  { id: "email", label: "Email", isRowHeader: false },
  { id: "lastActivity", label: "Last active", isRowHeader: false },
  { id: "status", label: "Status", isRowHeader: false },
] as const;

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
    <Table className="[&_.table__row:hover_.table__cell]:bg-surface [&_.table__row[data-hovered=true]_.table__cell]:bg-surface">
      <Table.ScrollContainer>
        <Table.Content aria-label="Team members" className="min-w-[880px]">
          <Table.Header columns={memberColumns}>
            {(column) => (
              <Table.Column id={column.id} isRowHeader={column.isRowHeader}>
                {column.label}
              </Table.Column>
            )}
          </Table.Header>
          <Table.Body
            items={rows}
            renderEmptyState={() => (
              <div className="px-4 py-10 text-center text-sm text-muted">
                {membersError?.message ?? "No team members yet."}
              </div>
            )}
          >
            {(row) => {
              const initials = getInitials(row.name ?? row.email);

              return (
                <Table.Row id={row.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 rounded-full">
                        {row.imageUrl && (
                          <Avatar.Image
                            alt={row.name ?? undefined}
                            src={row.imageUrl}
                          />
                        )}
                        <Avatar.Fallback className="text-xs font-semibold">
                          {initials}
                        </Avatar.Fallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {row.name}
                        </p>
                        <p className="text-xs text-muted">{row.subtitle}</p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-sm text-muted">
                    {row.email}
                  </Table.Cell>
                  <Table.Cell className="text-sm text-muted">
                    {row.lastActivity}
                  </Table.Cell>
                  <Table.Cell className="text-sm font-medium text-foreground">
                    {row.status}
                  </Table.Cell>
                </Table.Row>
              );
            }}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
