import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { db } from '../../prisma/db';
import { Role } from '../../types/enums';

export const createDepartmentUserController = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    const existingUser = await db.orm.public.User
      .where({ email })
      .first();

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.orm.public.User
      .select('id', 'name', 'email', 'role', 'isDeleted', 'createdAt')
      .create({
        name,
        email,
        password: hashedPassword,
        role
      });

    return res.status(201).json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsersController = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await db.orm.public.User
      .where({ isDeleted: 0 })
      .select('id', 'name', 'email', 'role', 'createdAt')
      .orderBy((user) => user.createdAt.desc())
      .all();

    return res.status(200).json({ success: true, users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
