import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as userService from './user.service';

export const handleCreateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, username, email, password, role } = req.body;
    if (!name || !username || !email || !role) {
      return res.status(400).json({ error: 'Name, username, email, and role are required' });
    }

    const result = await userService.createUser({ name, username, email, password, role });
    return res.status(201).json({
      message: 'User account successfully created',
      ...result,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create user' });
  }
};

export const handleListUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await userService.listAllUsers();
    return res.status(200).json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list users' });
  }
};

export const handleToggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;
    const updated = await userService.toggleUserStatus(id, Boolean(isActive));
    return res.status(200).json({ message: 'User status updated', user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update user status' });
  }
};

export const handleUpdateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    const updated = await userService.updateUserRole(id, role);
    return res.status(200).json({ message: 'User role updated', user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update user role' });
  }
};
