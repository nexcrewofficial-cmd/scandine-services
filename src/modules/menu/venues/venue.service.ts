import { VenueModel, IVenueDocument } from "./venue.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import { IVenue } from "@scan-and-dine/shared-types";

export class VenueService {
  static async getVenueBySlug(slug: string): Promise<IVenueDocument> {
    const venue = await VenueModel.findOne({ slug: slug.toLowerCase(), isActive: true });
    if (!venue) {
      throw AppError.notFound(errorMessage.notFound("Venue"));
    }
    return venue;
  }

  static async getVenueById(venueId: string): Promise<IVenueDocument> {
    const venue = await VenueModel.findById(venueId);
    if (!venue) {
      throw AppError.notFound(errorMessage.notFound("Venue"));
    }
    return venue;
  }

  static async updateSettings(
    venueId: string,
    updates: Partial<IVenue>
  ): Promise<IVenueDocument> {
    const venue = await VenueModel.findByIdAndUpdate(venueId, updates, { new: true });
    if (!venue) {
      throw AppError.notFound(errorMessage.notFound("Venue"));
    }
    return venue;
  }
}
