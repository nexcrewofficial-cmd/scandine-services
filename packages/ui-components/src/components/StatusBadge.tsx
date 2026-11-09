import React from 'react';
import { Badge } from './Badge.js';

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'READY':
    case 'SERVED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'PAID':
      return <Badge variant="success">{status}</Badge>;

    case 'PREPARING':
    case 'COOKING':
    case 'IN_PROGRESS':
    case 'SENT_TO_KITCHEN':
      return <Badge variant="warning">{status}</Badge>;

    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'UNPAID':
    case 'PAST_DUE':
      return <Badge variant="danger">{status}</Badge>;

    case 'BROWSING':
      return <Badge variant="purple">{status}</Badge>;

    case 'CANCELLED':
    case 'FAILED':
    case 'DISPUTED':
      return <Badge variant="danger">{status}</Badge>;

    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
