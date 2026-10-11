import { Order } from '../types';

/**
 * Calculates the active operational manufacturing stage for any order.
 * Guarantees that once a quotation is converted/approved and an order is created,
 * the status accurately shows the current active workflow stage (PURCHASE,
 * PRODUCTION, QUALITY TESTING, DISPATCH, or COMPLETED) and NEVER "QUOTATION".
 */
export const getOrderActiveStage = (order: Order): string => {
  if (!order) return 'PENDING';

  // 1. Fully Completed or Shipped
  if (order.status === 'COMPLETED' || order.dispatchStatus === 'COMPLETED') {
    return 'COMPLETED';
  }

  // 2. Dispatch Phase
  if (order.dispatchRequired && (order.dispatchStatus === 'IN_PROGRESS' || order.qualityStatus === 'COMPLETED')) {
    return 'DISPATCH';
  }

  // 3. QC / Quality Testing Phase
  if (order.qualityTestingRequired && (order.qualityStatus === 'IN_PROGRESS' || order.productionStatus === 'COMPLETED')) {
    return 'QUALITY TESTING';
  }

  // 4. Production Phase (In progress or purchase already completed)
  if (order.productionRequired && (order.productionStatus === 'IN_PROGRESS' || (order.purchaseRequired && order.purchaseStatus === 'COMPLETED'))) {
    return 'PRODUCTION';
  }

  // 5. Purchase / Raw Material Procurement Phase
  if (order.purchaseRequired) {
    if (order.purchaseStatus === 'COMPLETED') {
      if (order.productionRequired) return 'PRODUCTION';
      if (order.qualityTestingRequired) return 'QUALITY TESTING';
      if (order.dispatchRequired) return 'DISPATCH';
      return 'PURCHASE DONE';
    }
    if (order.purchaseStatus === 'IN_PROGRESS') {
      const purQty = order.purchaseQuantity || 0;
      return purQty > 0 ? `PURCHASE (${purQty}/${order.requiredQuantity})` : 'PURCHASE (PENDING RECEIVE)';
    }
    return 'PURCHASE';
  }

  // 6. Direct Production (if Purchase not required)
  if (order.productionRequired) {
    return 'PRODUCTION';
  }

  // 7. Direct Quality Testing
  if (order.qualityTestingRequired) {
    return 'QUALITY TESTING';
  }

  // 8. Direct Dispatch
  if (order.dispatchRequired) {
    return 'DISPATCH';
  }

  // 9. Initial Confirmed Order Fallback (never QUOTATION)
  const raw = String(order.currentStage || '').toUpperCase();
  if (!raw || raw === 'QUOTATION' || raw === 'SALES' || raw === 'INITIATION') {
    return 'ORDER CONFIRMED';
  }

  return raw.replace(/_/g, ' ');
};
