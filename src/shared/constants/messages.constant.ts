/**
 * Centralized Application Messages & Reusable Message Builders
 *
 * Rules:
 * 1. Pass the entity/field name first to reusable builder functions (e.g., errorMessage.notFound("Order")).
 * 2. Every string literal is strictly written in double quotes ("").
 */

export const errorMessage = {
  // ── REUSABLE MESSAGE BUILDERS (Pass entity / field name first) ──
  notFound: (field: string = "Resource"): string => `${field} not found`,
  alreadyExists: (field: string = "Resource"): string => `${field} already exists`,
  isRequired: (field: string = "Field"): string => `${field} is required`,
  invalid: (field: string = "Value"): string => `Invalid ${field} provided`,
  inactive: (field: string = "Account"): string => `${field} is currently inactive`,
  alreadyCompleted: (field: string = "Operation"): string => `This ${field.toLowerCase()} has already been completed`,
  alreadyCancelled: (field: string = "Order"): string => `This ${field.toLowerCase()} has already been cancelled`,
  alreadyVoided: (field: string = "Order"): string => `This ${field.toLowerCase()} has already been voided`,
  accessDenied: (field: string = "Resource"): string => `You do not have access to this ${field.toLowerCase()}`,

  // ── STATIC GENERIC & SECURITY ERRORS ──
  internalServerError: "An unexpected internal server error occurred",
  badRequest: "Bad request. Please verify your input",
  unauthorized: "Authentication required to access this resource",
  forbidden: "You do not have permission to perform this action",
  invalidCredentials: "The email or password entered is incorrect",
  invalidPin: "Invalid 4-digit PIN entered",
  tokenExpired: "Session token has expired. Please sign in again",
  sessionExpired: "Active session has expired",
  cartEmpty: "Your cart is empty. Please add items before checking out",
  cartSessionNotFound: "Active cart session not found",
  paymentFailed: "Payment processing failed. Please try again",
  tableOccupied: "Table is currently occupied",
  outsideGeofence: "You must be physically present at the venue to place an order",
  validationFailed: "Input validation failed",
  modifierRequired: "A required modifier selection is missing",
} as const;

export const successMessage = {
  // ── REUSABLE MESSAGE BUILDERS (Pass entity / field name first) ──
  fetched: (field: string = "Data"): string => `${field} fetched successfully`,
  created: (field: string = "Resource"): string => `${field} created successfully`,
  updated: (field: string = "Resource"): string => `${field} updated successfully`,
  deleted: (field: string = "Resource"): string => `${field} deleted successfully`,
  cleared: (field: string = "Resource"): string => `${field} cleared successfully`,
  statusUpdated: (field: string = "Status"): string => `${field} status updated successfully`,
  verified: (field: string = "Input"): string => `${field} verified successfully`,

  // ── STATIC COMMON SYSTEM SUCCESS MESSAGES ──
  dataFetched: "Data fetched successfully",
  operationSuccess: "Operation completed successfully",
  orderCreated: "Order created successfully",
  orderStatusUpdated: "Order status updated successfully",
  orderCancelled: "Order cancelled successfully",
  orderVoided: "Order voided with manager approval",
  foodServed: "Order marked as served successfully",
  refundProcessed: "Refund processed successfully",
  loginSuccess: "Logged in successfully",
  logoutSuccess: "Logged out successfully",
  pinVerified: "PIN verified successfully",
  clockedIn: "Clocked in successfully",
  clockedOut: "Clocked out successfully",
  staffCreated: "Staff member created successfully",
  staffUpdated: "Staff member updated successfully",
  categoryCreated: "Menu category created successfully",
  categoryUpdated: "Menu category updated successfully",
  itemAddedToCart: "Item added to cart successfully",
  cartCleared: "Cart cleared successfully",
  waiterCalled: "Waiter has been called to your table",
  tableStatusUpdated: "Table floor status updated successfully",
  billPrintRequested: "Bill print requested successfully",
  paymentCollected: "Payment collected and table cleared successfully",
  stockUpdated: "Item availability updated successfully",
  itemRestocked: "Item marked as in stock",
  itemOutOfStock: "Item marked as out of stock",
  ticketAdvanced: "KDS ticket advanced successfully",
  ticketReverted: "KDS ticket reverted successfully",
  kdsItemStatusUpdated: "Kitchen station item status updated",
  kotPrinted: "Kitchen order ticket printed successfully",
} as const;
