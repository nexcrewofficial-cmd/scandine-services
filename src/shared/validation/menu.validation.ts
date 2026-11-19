import { z } from "zod";
import { errorMessage } from "../constants/messages.constant.js";

export const nameSchema = z
  .string()
  .trim()
  .min(1, errorMessage.isRequired("Name"));
export const amountSchema = z
  .number()
  .finite()
  .min(0, errorMessage.invalid("Amount"));
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, errorMessage.invalid("ID"));
export const idParamsSchema = z.object({ id: objectIdSchema }).strict();
export const daysSchema = z.array(
  z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
);
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, errorMessage.invalid("Time"));
export const dateSchema = z
  .union([z.string().datetime({ offset: true }), z.date()])
  .pipe(z.coerce.date());
