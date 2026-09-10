/**
 * Hexclave team permission IDs checked by API routes.
 *
 * Custom team permissions defined in the Hexclave dashboard:
 * - `manage_billing` — granted to admins; gates checkout + customer portal.
 * - `manage_connections` — granted to admins and members; gates OAuth connect.
 * Ungranted permissions fail closed (the route returns 403).
 */
export const MANAGE_BILLING_PERMISSION = "manage_billing";
export const MANAGE_CONNECTIONS_PERMISSION = "manage_connections";
