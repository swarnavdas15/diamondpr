import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as quotationService from './quotation.service';

export const handleListQuotations = async (req: AuthRequest, res: Response) => {
  try {
    const quotations = await quotationService.listQuotations();
    return res.status(200).json({ success: true, quotations });
  } catch (err: any) {
    console.error('Error in handleListQuotations:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch quotations' });
  }
};

export const handleCreateQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, clientCode, contactPerson, mobileNumber, email, quotationAmount } = req.body;
    if (!companyName || !clientCode || !mobileNumber) {
      return res.status(400).json({ success: false, error: 'Company name, client code, and mobile number are required' });
    }

    const quotation = await quotationService.createQuotation(req.body);
    return res.status(201).json({ success: true, quotation });
  } catch (err: any) {
    console.error('Error in handleCreateQuotation:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to create quotation' });
  }
};

export const handleUpdateQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const quotation = await quotationService.updateQuotation(id, req.body);
    return res.status(200).json({ success: true, quotation });
  } catch (err: any) {
    console.error('Error in handleUpdateQuotation:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to update quotation' });
  }
};

export const handleAddQuotationFollowUp = async (req: AuthRequest, res: Response) => {
  try {
    const quotationId = req.params.id as string;
    const { followUpDate, notes } = req.body;
    if (!followUpDate) {
      return res.status(400).json({ success: false, error: 'Follow-up date is required' });
    }
    if (!notes) req.body.notes = 'No notes provided';

    const createdByName = req.user?.name || 'Sales User';
    const followUp = await quotationService.addQuotationFollowUp(quotationId, req.body, createdByName);
    return res.status(201).json({ success: true, followUp });
  } catch (err: any) {
    console.error('Error in handleAddQuotationFollowUp:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to add follow-up' });
  }
};

export const handleDeleteQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await quotationService.deleteQuotation(id);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Error in handleDeleteQuotation:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to delete quotation' });
  }
};
