import { StationTag, DietaryTag, Allergen } from '../enums/menu.enum.js';
import { IModifierGroup, ITimeWindow } from '../interfaces/menu-item.interface.js';

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

export interface CreateCategoryDTO {
  venueId: string;
  name: string;
  description?: string;
  sortOrder?: number;
  imageUrl?: string;
}
