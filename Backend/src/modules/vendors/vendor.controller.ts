import { Request, Response } from 'express';
import {
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorById,
} from './vendor.service';

export const handleListVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await listVendors();
    return res.json({ success: true, vendors });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch vendors' });
  }
};

export const handleCreateVendor = async (req: Request, res: Response) => {
  try {
    const { vendorName, contactPerson, mobileNumber, email, materialSupplied } = req.body;
    if (!vendorName || !contactPerson || !mobileNumber || !email || !materialSupplied) {
      return res.status(400).json({
        success: false,
        error: 'vendorName, contactPerson, mobileNumber, email, and materialSupplied are required.',
      });
    }

    const vendor = await createVendor(req.body);
    return res.status(201).json({ success: true, vendor });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to create vendor' });
  }
};

export const handleUpdateVendor = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.id as string;
    if (!vendorId) {
      return res.status(400).json({ success: false, error: 'Vendor ID is required' });
    }

    const existing = await getVendorById(vendorId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const updated = await updateVendor(vendorId, req.body);
    return res.json({ success: true, vendor: updated });
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to update vendor' });
  }
};

export const handleDeleteVendor = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.id as string;
    if (!vendorId) {
      return res.status(400).json({ success: false, error: 'Vendor ID is required' });
    }

    const existing = await getVendorById(vendorId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    await deleteVendor(vendorId);
    return res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to delete vendor' });
  }
};
