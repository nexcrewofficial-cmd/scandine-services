import { StationTag, DietaryTag, Allergen } from './menu-item.enum.js';
import { BaseEventPayload } from '../../../shared/event-bus/index.js';

export * from './menu-item.enum.js';

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
  startTime: string;
  endTime: string;
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

export interface CreateMenuItemDTO {
  venueId: string;
  categoryId: string;
  name: string;
  shortName?: string;
  description?: string;
  price: number;
  costPrice?: number;
  stationTag: StationTag;
  modifierGroups?: IModifierGroup[];
  dietaryTags?: DietaryTag[];
  allergens?: Allergen[];
  calories?: number;
  timeWindows?: ITimeWindow[];
}

export interface UpdateMenuItemDTO extends Partial<CreateMenuItemDTO> {
  isAvailable?: boolean;
}

export interface ItemStockEventPayload extends BaseEventPayload {
  menuItemId: string;
  isAvailable: boolean;
}

