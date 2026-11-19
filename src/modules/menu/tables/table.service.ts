import { TableModel, ITableDocument } from "./table.model.js";
import type { CreateTableInput, UpdateTableInput } from "./table.interface.js";
import { generateAPIError, errorMessage } from "../../../shared/middlewares/index.js";
import { OrderModel } from "../../orders/orders/order.model.js";
import { CartModel } from "../../orders/cart/cart.model.js";
import { OrderStatus } from "@scan-and-dine/shared-types";

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export class TableService {
  static async list(venueId: string): Promise<ITableDocument[]> {
    return TableModel.find({ venueId, deletedAt: null }).sort({ tableNumber: 1 });
  }

  static async getById(venueId: string, id: string): Promise<ITableDocument> {
    const table = await TableModel.findOne({ _id: id, venueId, deletedAt: null });
    if (!table) return await generateAPIError(errorMessage.notFound("Table"), 404);
    return table;
  }

  static async create(venueId: string, input: CreateTableInput): Promise<ITableDocument> {
    const existing = await TableModel.exists({ venueId, tableNumber: input.tableNumber, deletedAt: null });
    if (existing) return await generateAPIError(errorMessage.alreadyExists("Table number"), 409);
    try {
      return await TableModel.create({ ...input, venueId });
    } catch (error) {
      if (isDuplicateKeyError(error)) return await generateAPIError(errorMessage.alreadyExists("Table number"), 409);
      throw error;
    }
  }

  private static async assertNoActiveUse(venueId: string, tableNumber: string): Promise<void> {
    const [order, cart] = await Promise.all([
      OrderModel.exists({
        venueId, tableNumber, deletedAt: null,
        status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
      }),
      CartModel.exists({ venueId, tableNumber, "items.0": { $exists: true } }),
    ]);
    if (order || cart) return await generateAPIError(errorMessage.tableOccupied, 409);
  }

  static async update(venueId: string, id: string, input: UpdateTableInput): Promise<ITableDocument> {
    if (Object.keys(input).length === 0) {
      return await generateAPIError(errorMessage.isRequired("At least one table field"), 400);
    }
    const current = await this.getById(venueId, id);
    if ((input.tableNumber !== undefined && input.tableNumber !== current.tableNumber) || input.isActive === false) {
      await this.assertNoActiveUse(venueId, current.tableNumber);
    }
    if (input.tableNumber !== undefined) {
      const existing = await TableModel.exists({
        venueId, tableNumber: input.tableNumber, deletedAt: null, _id: { $ne: id },
      });
      if (existing) return await generateAPIError(errorMessage.alreadyExists("Table number"), 409);
    }
    let table: ITableDocument | null;
    try {
      table = await TableModel.findOneAndUpdate(
        { _id: id, venueId, deletedAt: null },
        { $set: input },
        { new: true, runValidators: true },
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) return await generateAPIError(errorMessage.alreadyExists("Table number"), 409);
      throw error;
    }
    if (!table) return await generateAPIError(errorMessage.notFound("Table"), 404);
    return table;
  }

  static async delete(venueId: string, id: string): Promise<void> {
    const current = await this.getById(venueId, id);
    await this.assertNoActiveUse(venueId, current.tableNumber);
    const table = await TableModel.findOneAndUpdate(
      { _id: id, venueId, deletedAt: null },
      { $set: { deletedAt: new Date(), isActive: false } },
    );
    if (!table) return await generateAPIError(errorMessage.notFound("Table"), 404);
  }
}
