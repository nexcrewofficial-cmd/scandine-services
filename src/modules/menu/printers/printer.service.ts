import { PrinterModel, IPrinterDocument } from "./printer.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import { IPrinter } from "@scan-and-dine/shared-types";

export class PrinterService {
  static async list(venueId: string): Promise<IPrinterDocument[]> {
    return PrinterModel.find({ venueId, deletedAt: null });
  }

  static async create(venueId: string, data: Partial<IPrinter>): Promise<IPrinterDocument> {
    return PrinterModel.create({ ...data, venueId });
  }

  static async update(
    venueId: string,
    id: string,
    updates: Partial<IPrinter>
  ): Promise<IPrinterDocument> {
    const printer = await PrinterModel.findOneAndUpdate(
      { _id: id, venueId, deletedAt: null },
      updates,
      { new: true }
    );
    if (!printer) {
      throw AppError.notFound(errorMessage.notFound("Printer"));
    }
    return printer;
  }

  static async delete(venueId: string, id: string): Promise<void> {
    const printer = await PrinterModel.findOneAndUpdate(
      { _id: id, venueId },
      { deletedAt: new Date() }
    );
    if (!printer) {
      throw AppError.notFound(errorMessage.notFound("Printer"));
    }
  }
}
