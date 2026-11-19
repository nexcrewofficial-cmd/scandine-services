import { UserRole } from "./user.enum.js";
import { AuthenticatedUser } from "../../../shared/middlewares/auth.middleware.js";
import { generateAPIError } from "../../../shared/middlewares/app-error.js";
import { errorMessage } from "../../../shared/constants/messages.constant.js";

export const assignableStaffRoles = [
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN_STAFF,
] as const;

export async function authorizeStaffMutation(
  actor: AuthenticatedUser,
  venueId: string,
  targetRole?: UserRole,
  assignedRole?: UserRole
): Promise<void> {
  if (!venueId || actor.venueId !== venueId ||
      (actor.role !== UserRole.VENUE_ADMIN && actor.role !== UserRole.MANAGER)) {
    return await generateAPIError(errorMessage.forbidden, 403);
  }

  const canManage = (role: UserRole): boolean =>
    assignableStaffRoles.some((allowed) => allowed === role) &&
    (actor.role === UserRole.VENUE_ADMIN || role !== UserRole.MANAGER);

  if ((targetRole !== undefined && !canManage(targetRole)) ||
      (assignedRole !== undefined && !canManage(assignedRole))) {
    return await generateAPIError(errorMessage.forbidden, 403);
  }
}
