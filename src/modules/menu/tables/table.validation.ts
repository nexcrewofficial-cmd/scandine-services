import { z } from "zod";
import { errorMessage } from "../../../shared/constants/messages.constant.js";

export const createTableSchema = z.object({
  tableNumber: z.string().trim().min(1, errorMessage.isRequired("Table number")),
  capacity: z.number().int().min(1, errorMessage.invalid("Capacity")),
  isActive: z.boolean().optional(),
}).strict();

export const updateTableSchema = createTableSchema.partial();
