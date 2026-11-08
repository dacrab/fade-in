/**
 * Upper bound for admin/owner list queries. Those screens are not paginated,
 * so cap the read to keep query cost predictable as data grows.
 */
export const MAX_LIST_ROWS = 500
