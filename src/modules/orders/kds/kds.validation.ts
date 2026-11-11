import { z } from 'zod';
import { OrderStatus, KdsItemStatus } from '@scan-and-dine/shared-types';

export const updateTicketStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const updateItemStatusSchema = z.object({
  kdsStatus: z.nativeEnum(KdsItemStatus),
});

export const printKOTSchema = z.object({
  stationTag: z.string().optional(),
});

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

