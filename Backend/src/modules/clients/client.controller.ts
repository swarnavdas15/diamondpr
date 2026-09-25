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
