export enum PaymentStatus {
  UNPAID = 'UNPAID',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  CASH = 'CASH',
  ONLINE = 'ONLINE',
  UPI = 'UPI',
}
