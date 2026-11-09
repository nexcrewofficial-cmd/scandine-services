import { IOrderItem, IOrderFinancials } from '@scan-and-dine/shared-types';

export class OrderUtils {
  static generateOrderNumber(): string {
    const random = Math.floor(100 + Math.random() * 900);
    return `#${random}`;
  }

  static calculateFinancials(
    items: IOrderItem[],
    taxRate = 5,
    discountAmount = 0,
    tipAmount = 0
  ): IOrderFinancials {
    const subtotal = items.reduce((acc, item) => {
      const modifierSum = item.modifiersSelected.reduce((mAcc, m) => mAcc + m.extraPrice, 0);
      const lineItemTotal = (item.unitPrice + modifierSum) * item.quantity;
      item.itemTotal = Math.round(lineItemTotal * 100) / 100;
      return acc + item.itemTotal;
    }, 0);

    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const totalTax = Math.round(((subtotalAfterDiscount * taxRate) / 100) * 100) / 100;
    const platformFee = Math.round(subtotalAfterDiscount * 0.015 * 100) / 100; // 1.5% SaaS commission
    const grandTotal = Math.round((subtotalAfterDiscount + totalTax + tipAmount) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax,
      discountTotal: Math.round(discountAmount * 100) / 100,
      tipAmount: Math.round(tipAmount * 100) / 100,
      platformFee,
      grandTotal,
    };
  }
}
