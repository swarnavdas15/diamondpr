import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const createUser = async (data: {
  name: string;
  username: string;
  email: string;
  password?: string;
  role: Role;
}) => {
  const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
  if (existingUsername) throw new Error('Username already exists');

  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) throw new Error('Email already exists');

  const rawPassword = data.password || 'Welcome@123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return { user, generatedPassword: rawPassword };
};

export const listAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const toggleUserStatus = async (userId: string, isActive: boolean) => {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
};

export const updateUserRole = async (userId: string, role: Role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
};
