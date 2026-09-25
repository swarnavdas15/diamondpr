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

export function isRestrictedRole(role?: string): boolean {
  if (!role) return true;
  return ['PURCHASE', 'PRODUCTION', 'QUALITY_TESTING', 'DISPATCH'].includes(role);
}

export function maskOrderData(order: any, userRole?: string): any {
  if (!order) return order;

  if (isRestrictedRole(userRole)) {
    const masked = { ...order };
    delete masked.budget;

    if (masked.client) {
      masked.client = {
        id: masked.client.id,
        clientCode: masked.client.clientCode,
        companyName: '🔒 MASKED (Confidential)',
        contactName: '🔒 MASKED',
        contactNo: '🔒 MASKED',
        email: '🔒 MASKED',
        address: '🔒 MASKED',
        gstNumber: '🔒 MASKED',
      };
    }
    return masked;
  }

  return order;
}

export function maskOrderList(orders: any[], userRole?: string): any[] {
  if (!Array.isArray(orders)) return orders;
  return orders.map((o) => maskOrderData(o, userRole));
}
