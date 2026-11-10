export interface ICustomerLoyalty {
  venueId: string;
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export interface ICustomerMetrics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastVisitDate?: Date;
}

export interface ICustomer {
  _id?: string;
  deviceUUID: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  preferredLanguage?: string;
  marketingOptIn?: boolean;
  loyalty?: ICustomerLoyalty[];
  metrics?: ICustomerMetrics;
  favoriteItemIds?: string[];
  isBanned?: boolean;
  banReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
