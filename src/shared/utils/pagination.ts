import { CONSTANTS } from '@core/config';
import { Pagination, PaginatedResult } from '@shared/types';

export function parsePagination(query: Record<string, string | undefined>): Pagination {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(
    CONSTANTS.PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit ?? String(CONSTANTS.PAGINATION.DEFAULT_LIMIT), 10) || CONSTANTS.PAGINATION.DEFAULT_LIMIT),
  );
  return { page, limit, offset: (page - 1) * limit };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: Pagination,
): PaginatedResult<T> {
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}
