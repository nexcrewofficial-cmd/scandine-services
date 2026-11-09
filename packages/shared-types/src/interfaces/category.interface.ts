export interface ICategory {
  _id?: string;
  venueId: string;
  name: string;
  description?: string;
  sortOrder: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
