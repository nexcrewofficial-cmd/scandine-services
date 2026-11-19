import { z } from "zod";
import { PrinterType, PrinterStatus } from "./printer.enum.js";
import { StationTag } from "../menu-items/menu-item.enum.js";
import { nameSchema } from "../../../shared/validation/menu.validation.js";

export const createPrinterSchema = z
  .object({
    name: nameSchema,
    macAddress: nameSchema,
    ipAddress: z.string().ip(),
    port: z.number().int().min(1).max(65535).optional(),
    printerType: z.nativeEnum(PrinterType).optional(),
    stationTag: z.nativeEnum(StationTag).optional(),
    status: z.nativeEnum(PrinterStatus).optional(),
    rules: z
      .object({
        printCustomerReceipt: z.boolean().optional(),
        printKOT: z.boolean().optional(),
        autoPrintNewOrder: z.boolean().optional(),
      })
      .strict()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export const updatePrinterSchema = createPrinterSchema.partial();
