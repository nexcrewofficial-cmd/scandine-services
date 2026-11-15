/**
 * Common Query, Filter, and Pagination Interfaces
 * Reusable across all domain modules to avoid type duplication.
 */

export type SortOrderType = "asc" | "desc" | "1" | "-1" | 1 | -1;

export interface BasePaginationQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  q?: string;
  sortBy?: string;
  sortOrder?: SortOrderType;
  [key: string]: unknown;
}

export interface DateRangeFilter {
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface PriceRangeFilter {
  minPrice?: string | number;
  maxPrice?: string | number;
}

export interface ActiveStatusFilter {
  isActive?: string | boolean;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  hasPaging: boolean;
  search?: string;
  sort: Record<string, 1 | -1>;
}

export interface PaginationMeta {
  total: number;
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ==========================================
// DOMAIN-SPECIFIC FILTER INTERFACES
// ==========================================

// 1. Menu Domain Query Interfaces
export interface CategoryQueryFilters extends BasePaginationQuery, ActiveStatusFilter {
  onlyActive?: string | boolean;
}

export interface MenuItemQueryFilters
  extends BasePaginationQuery,
    ActiveStatusFilter,
    PriceRangeFilter {
  categoryId?: string;
  isAvailable?: string | boolean;
  stationTag?: string;
  dietaryTag?: string;
}

export interface InventoryQueryFilters extends BasePaginationQuery, ActiveStatusFilter {
  category?: string;
  lowStock?: string | boolean;
}

export interface PrinterQueryFilters extends BasePaginationQuery, ActiveStatusFilter {
  status?: string;
  printerType?: string;
  stationTag?: string;
}

export interface PromoQueryFilters extends BasePaginationQuery {
  status?: string;
  discountType?: string;
}

// 2. Orders Domain Query Interfaces
export interface OrderQueryFilters extends BasePaginationQuery, DateRangeFilter {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  orderType?: string;
  tableNumber?: string;
  customerUUID?: string;
}

export interface TransactionQueryFilters extends BasePaginationQuery, DateRangeFilter {
  status?: string;
  transactionType?: string;
  orderId?: string;
  minAmount?: string | number;
  maxAmount?: string | number;
}

// 3. Auth Domain Query Interfaces
export interface StaffQueryFilters extends BasePaginationQuery, ActiveStatusFilter {
  role?: string;
  employmentType?: string;
}

export interface ShiftQueryFilters extends BasePaginationQuery, DateRangeFilter {
  userId?: string;
  status?: string;
}
