import { z } from 'zod';

export const createClientSchema = z.object({
  clientCode: z.string().min(2, 'Client code is required'),
  companyName: z.string().min(2, 'Company name is required'),
  contactNo: z.string().min(10, 'Valid contact number required'),
  email: z.string().email().optional(),
  gstNumber: z.string().optional(),
  address: z.string().optional()
});

export const createOrderSchema = z.object({
  poNumber: z.string().min(2, 'PO Number is required'),
  clientId: z.string().uuid('Valid Client ID required'),
  requirements: z.string().min(3, 'Requirements detail required'),
  stageSequence: z.array(z.string()).min(1, 'At least one stage required in pipeline'),
  items: z.array(z.object({
    itemName: z.string().min(1, 'Item name is required'),
    size: z.string().min(1, 'Size specification required'),
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    unitPrice: z.number().positive().optional()
  })).min(1, 'Order must contain at least one item')
});