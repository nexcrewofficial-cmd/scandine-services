export enum TransactionType {
  CHARGE = 'CHARGE',
  REFUND = 'REFUND',
  PAYOUT = 'PAYOUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  DISPUTED = 'DISPUTED',
}
