import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';
import bcrypt from 'bcryptjs';

export const createUser = async (data: {
  name: string;
  username: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  employeeId?: string;
  role: any;
}) => {
  const existingEmail = await db.orm.public.User.where({ email: data.email, isDeleted: 0 }).first();
  if (existingEmail) throw new Error('Email already exists');
  
  const existingUsername = await db.orm.public.User.where({ username: data.username, isDeleted: 0 }).first();
  if (existingUsername) throw new Error('Username already exists');

  const rawPassword = data.password || 'Welcome@123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = await db.orm.public.User.create({
    name: data.name,
    username: data.username,
    email: data.email,
    password: hashedPassword,
    mobileNumber: data.mobileNumber ?? null,
    employeeId: data.employeeId ?? null,
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
    .update({ isActive: _isActive });
};

export const updateUserRole = async (userId: string, role: any) => {
  return await db.orm.public.User
    .where({ id: dbId(userId) })
    .update({ role: role as any });
};

export const deleteUser = async (userId: string) => {
  return await db.orm.public.User.where({ id: dbId(userId) }).update({ isDeleted: 1 });
};

export const resetPassword = async (userId: string, newPass: string) => {
  const hashed = await bcrypt.hash(newPass, 10);
  return await db.orm.public.User.where({ id: dbId(userId) }).update({ password: hashed });
};

export const updateUserDetails = async (userId: string, data: any) => {
  return await db.orm.public.User.where({ id: dbId(userId) }).update(data);
};