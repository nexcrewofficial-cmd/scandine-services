import {
  BasePaginationQuery,
  ParsedPagination,
  PaginationMeta,
} from "../types/query.interface.js";

export * from "../types/query.interface.js";

export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export function parseBooleanFilter(value: unknown): boolean | undefined {
  if (value === "true" || value === true || value === "1") {
    return true;
  }
  if (value === "false" || value === false || value === "0") {
    return false;
  }
  return undefined;
}

export function parsePaginationQuery(
  query: BasePaginationQuery | Record<string, unknown>,
  defaultSort: Record<string, 1 | -1> = { createdAt: -1 }
): ParsedPagination {
  const pageStr = query.page;
  const limitStr = query.limit;
  const hasPaging = pageStr !== undefined || limitStr !== undefined;

  const page = Math.max(1, parseInt(String(pageStr || "1"), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(limitStr || "20"), 10) || 20));
  const skip = (page - 1) * limit;

  const rawSearch = typeof query.search === "string" ? query.search.trim() : typeof query.q === "string" ? query.q.trim() : undefined;
  const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

  let sort: Record<string, 1 | -1> = { ...defaultSort };
  if (typeof query.sortBy === "string" && query.sortBy.trim()) {
    const field = query.sortBy.trim();
    const orderStr = typeof query.sortOrder === "string" ? query.sortOrder.toLowerCase() : "";
    const isAsc = orderStr === "asc" || orderStr === "1";
    sort = { [field]: isAsc ? 1 : -1 };
  }

  return {
    page,
    limit,
    skip,
    hasPaging,
    search,
    sort,
  };
}

export function buildPaginationMeta(
  total: number,
  count: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    count,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
