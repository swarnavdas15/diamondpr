import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createClient = async (data: {
  companyName: string;
  contactName?: string;
  contactNo: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  createdById: string;
}) => {
  // Auto-generate Client Code (CL-1001, CL-1002...)
  const count = await prisma.client.count();
  const clientCode = `CL-${1001 + count}`;

  return prisma.client.create({
    data: {
      clientCode,
      companyName: data.companyName,
      contactName: data.contactName,
      contactNo: data.contactNo,
      email: data.email,
      address: data.address,
      gstNumber: data.gstNumber,
      createdById: data.createdById,
    },
  });
};

export const listClients = async () => {
  return prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

export const getClientById = async (id: string) => {
  return prisma.client.findUnique({
    where: { id },
    include: {
      orders: true,
    },
  });
};
