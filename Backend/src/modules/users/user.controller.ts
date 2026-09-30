import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as userService from './user.service';

export const handleCreateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, username, mobileNumber, employeeId } = req.body;
    if (!name || !email || !role || !username) {
      return res.status(400).json({ error: 'Name, username, email, and role are required' });
    }

    const result = await userService.createUser({ name, email, password, role, username, mobileNumber, employeeId });
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

export const handleDeleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await userService.deleteUser(id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete user' });
  }
};

export const handleResetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { password } = req.body;
    await userService.resetPassword(id, password);
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to reset password' });
  }
};

export const handleUpdateUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, role, mobileNumber, employeeId, clientDataVisibility } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (clientDataVisibility !== undefined) updateData.clientDataVisibility = clientDataVisibility;

    await userService.updateUserDetails(id, updateData);
    return res.status(200).json({ message: 'User updated successfully', user: updateData });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update user' });
  }
};