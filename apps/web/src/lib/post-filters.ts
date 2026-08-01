export const POST_LIBRARY_FILTERS = [
  "all",
  "scheduled",
  "published",
  "draft",
] as const;

export type PostLibraryFilter = (typeof POST_LIBRARY_FILTERS)[number];

export const isPostLibraryFilter = (
  value: unknown,
): value is PostLibraryFilter =>
  POST_LIBRARY_FILTERS.some((filter) => filter === value);
