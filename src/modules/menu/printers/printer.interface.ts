import { PrinterType, PrinterStatus } from './printer.enum.js';
import { StationTag } from '../menu-items/menu-item.enum.js';

export * from './printer.enum.js';

export interface IPrinterRules {
  printCustomerReceipt: boolean;
  printKOT: boolean;
  autoPrintNewOrder: boolean;
}

export interface IPrinter {
  _id?: string;
  venueId: string;
  name: string;
  macAddress: string;
  ipAddress: string;
  port?: number;
  printerType: PrinterType;
  stationTag?: StationTag;
  status: PrinterStatus;
  rules: IPrinterRules;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
