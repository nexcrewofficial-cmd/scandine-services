import type { CreatePrinterInput, UpdatePrinterInput } from "./printer.interface.js";
import { createPrinterSchema, updatePrinterSchema } from "./printer.validation.js";
import { flattenUpdate } from "../../../shared/utils/update.util.js";
import { FilterQuery } from "mongoose";
import { PrinterModel, IPrinterDocument } from "./printer.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import {
  PrinterStatus,
  PrinterType,
  StationTag,
  PrinterQueryFilters,
  PaginatedResult,
} from "@scan-and-dine/shared-types";
import {
  parsePaginationQuery,
  parseBooleanFilter,
  escapeRegex,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

export class PrinterService {
  static async list(
    venueId: string,
    rawQuery: PrinterQueryFilters = {}
  ): Promise<PaginatedResult<IPrinterDocument>> {
    const { page, limit, skip, hasPaging, search, sort } = parsePaginationQuery(rawQuery, {
      name: 1,
    });

    const query: FilterQuery<IPrinterDocument> = { venueId, deletedAt: null };

    if (rawQuery.status && typeof rawQuery.status === "string") {
      query.status = rawQuery.status as PrinterStatus;
    }

    if (rawQuery.printerType && typeof rawQuery.printerType === "string") {
      query.printerType = rawQuery.printerType as PrinterType;
    }

    if (rawQuery.stationTag && typeof rawQuery.stationTag === "string") {
      query.stationTag = rawQuery.stationTag as StationTag;
    }

    const isActive = parseBooleanFilter(rawQuery.isActive);
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { ipAddress: regex }, { macAddress: regex }];
    }

    const total = await PrinterModel.countDocuments(query);
    const mQuery = PrinterModel.find(query).sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }

  static async create(venueId: string, data: CreatePrinterInput): Promise<IPrinterDocument> {
    const sanitized = createPrinterSchema.parse(data);
    return PrinterModel.create({ ...sanitized, venueId });
  }

  static async update(
    venueId: string,
    id: string,
    updates: UpdatePrinterInput
  ): Promise<IPrinterDocument> {
    const printer = await PrinterModel.findOneAndUpdate(
      { _id: id, venueId, deletedAt: null },
      { $set: flattenUpdate(updatePrinterSchema.parse(updates)) },
      { new: true, runValidators: true }
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
