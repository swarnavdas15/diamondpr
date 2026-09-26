import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import bcrypt from 'bcryptjs';

export const createUser = async (data: {
  name: string;
  username?: string;
  email: string;
  password?: string;
  role: any;
}) => {
  const existingEmail = await db.orm.public.User.where({ email: data.email, isDeleted: 0 }).first();
  if (existingEmail) throw new Error('Email already exists');

  const rawPassword = data.password || 'Welcome@123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = await db.orm.public.User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role as any,
  });

  return { user, generatedPassword: rawPassword };
};

export const listAllUsers = async () => {
  return await db.orm.public.User
    .where({ isDeleted: 0 })
    .orderBy((u) => u.createdAt.desc())
    .all();
};

export const toggleUserStatus = async (userId: string, _isActive: boolean) => {
  return await db.orm.public.User
    .where({ id: dbId(userId) })
    .first();
};

export const updateUserRole = async (userId: string, role: any) => {
  return await db.orm.public.User
    .where({ id: dbId(userId) })
    .update({ role: role as any });
};
