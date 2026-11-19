export interface CreateTableInput {
  tableNumber: string;
  capacity: number;
  isActive?: boolean;
}

export interface UpdateTableInput {
  tableNumber?: string;
  capacity?: number;
  isActive?: boolean;
}
