/**
 * STRICT DATA MASKING RULE:
 * Purchase, Production, Quality Testing, and Dispatch users must NEVER see:
 * - Client Name / Company Name
 * - Client Contact Details (contactName, contactNo, email, address, gstNumber)
 * - Financial Budget
 * 
 * They should ONLY see:
 * - Client Code
 * - Order Number
 * - PO Number
 * - Technical Requirements
 * - Internal References
 * 
 * Sales, Admin, and Super Admin remain authorized to view full customer details.
 */

export function isRestrictedRole(role?: string, userVisibility?: string): boolean {
  if (userVisibility === 'CODE_ONLY') return true;
  if (userVisibility === 'FULL') return false;
  if (!role) return true;
  return ['PURCHASE', 'PRODUCTION', 'QUALITY_TESTING', 'DISPATCH'].includes(role);
}

export function maskOrderData(order: any, userRole?: string, userVisibility?: string): any {
  if (!order) return order;

  // Resolve client code accurately from order or client object (handling DB clientcode vs JS clientCode)
  const resolvedClientCode =
    order.clientCode ||
    order.client?.clientcode ||
    order.client?.clientCode ||
    'CL-UNKNOWN';

  if (isRestrictedRole(userRole, userVisibility)) {
    const masked = { ...order };
    delete masked.budget;
    masked.clientCode = resolvedClientCode;

    if (masked.client) {
      masked.client = {
        id: masked.client.id,
        clientCode: resolvedClientCode,
        clientcode: resolvedClientCode,
        companyName: `🔒 Hidden (${resolvedClientCode})`,
        contactName: '🔒 MASKED',
        contactNo: '🔒 MASKED',
        email: '🔒 MASKED',
        address: '🔒 MASKED',
        gstNumber: '🔒 MASKED',
      };
    }
    return masked;
  }

  // Unmasked - ensure clientCode and clientcode are consistently available
  const unmasked = { ...order };
  unmasked.clientCode = resolvedClientCode;

  if (unmasked.client) {
    unmasked.client.clientCode = resolvedClientCode;
    unmasked.client.clientcode = resolvedClientCode;
  }

  return unmasked;
}

export function maskOrderList(orders: any[], userRole?: string, userVisibility?: string): any[] {
  if (!Array.isArray(orders)) return orders;
  return orders.map((o) => maskOrderData(o, userRole, userVisibility));
}
