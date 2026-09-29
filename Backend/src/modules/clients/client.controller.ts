import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as clientService from './client.service';

export const handleCreateClient = async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, contactName, contactNo, email, address, gstNumber } = req.body;
    if (!companyName || !contactNo) {
      return res.status(400).json({ error: 'Company name and contact number are required' });
    }

    const createdById = req.user?.userId || '';
    const client = await clientService.createClient({
      companyName,
      contactName,
      contactNo,
      email,
      address,
      gstNumber,
      createdById,
    });

    return res.status(201).json({ message: 'Client created successfully', client });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create client' });
  }
};

export const handleListClients = async (req: AuthRequest, res: Response) => {
  try {
    const clients = await clientService.listClients();
    return res.status(200).json({ clients });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch clients' });
  }
};

import { uploadToCloudinary } from '../../utils/cloudinary';

export const handleUploadProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    
    // Save to database
    const updatedClient = await clientService.updateClientProfileImage(id, cloudinaryUrl);

    return res.status(200).json({ 
      message: 'Profile image uploaded successfully', 
      profileImage: cloudinaryUrl,
      client: updatedClient 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to upload image' });
  }
};

export const handleCreateCompanyContact = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, fullName, designation, department, email, mobile, whatsapp, reportsToId, notes } = req.body;
    if (!companyId || !fullName) {
      return res.status(400).json({ error: 'companyId and fullName are required' });
    }
    const contact = await clientService.createCompanyContact({
      companyId, fullName, designation, department, email, mobile, whatsapp, reportsToId, notes
    });
    return res.status(201).json({ message: 'Contact created', contact });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create contact' });
  }
};

export const handleListCompanyContacts = async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await clientService.listCompanyContacts();
    return res.status(200).json({ contacts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list contacts' });
  }
};

export const handleUploadContactProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.contactId as string;
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    const updatedContact = await clientService.updateCompanyContactProfileImage(id, cloudinaryUrl);

    return res.status(200).json({ 
      message: 'Contact profile image uploaded successfully', 
      profileImage: cloudinaryUrl,
      contact: updatedContact 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to upload contact image' });
  }
};
