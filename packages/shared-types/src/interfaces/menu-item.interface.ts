import { StationTag, DietaryTag, Allergen } from '../enums/menu.enum.js';

export interface IModifierOption {
  name: string;
  extraPrice: number;
  isDefault?: boolean;
}

export interface IModifierGroup {
  name: string;
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: IModifierOption[];
}

export interface ITimeWindow {
  days: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[];
  startTime: string; // "08:00"
  endTime: string;   // "11:00"
}

export interface IMenuItemMedia {
  imageUrl?: string;
  videoUrl?: string;
}

export interface IMenuItem {
  _id?: string;
  venueId: string;
  categoryId: string;
  name: string;
  shortName?: string;
  description?: string;
  media?: IMenuItemMedia;
  price: number;
  costPrice?: number;
  taxOverride?: number;
  stationTag: StationTag;
  modifierGroups?: IModifierGroup[];
  dietaryTags?: DietaryTag[];
  allergens?: Allergen[];
  calories?: number;
  isAvailable: boolean;
  timeWindows?: ITimeWindow[];
  soldOutUntil?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
