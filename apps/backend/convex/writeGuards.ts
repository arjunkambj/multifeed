import type { MutationCtx } from "./_generated/server";

/**
 * Serialize mutations that touch the same logical scope via OCC: writers take
 * a writeGuards row keyed by `scope`, so concurrent mutations touching the
 * same scope conflict and retry instead of racing past their checks.
 */
export async function serializeScope(ctx: MutationCtx, scope: string) {
  const guard = await ctx.db
    .query("writeGuards")
    .withIndex("by_scope", (q) => q.eq("scope", scope))
    .unique();
  const now = Date.now();
  if (guard) {
    await ctx.db.patch("writeGuards", guard._id, { updatedAt: now });
  } else {
    await ctx.db.insert("writeGuards", { scope, updatedAt: now });
  }
}
