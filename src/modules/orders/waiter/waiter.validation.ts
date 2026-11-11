import { z } from 'zod';

export const manualOrderSchema = z.object({
  tableNumber: z.string().min(1, 'Table number is required'),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, 'menuItemId is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        specialInstructions: z.string().optional(),
        modifiersSelected: z
          .array(
            z.object({
              groupName: z.string(),
              optionName: z.string(),
              extraPrice: z.number().default(0),
            })
          )
          .optional(),
      })
    )
    .min(1, 'Order must contain at least one item'),
  notes: z.string().optional(),
});

export const voidOrderSchema = z.object({
  managerPin: z.string().length(4, 'Manager PIN must be exactly 4 digits'),
  reason: z.string().min(3, 'A valid reason is required to void an order'),
});

export const collectCashSchema = z.object({
  amountReceived: z.number().min(0, 'Amount received must be non-negative'),
});

export const remoteBillPrintSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  tableNumber: z.string().min(1, 'tableNumber is required'),
});
