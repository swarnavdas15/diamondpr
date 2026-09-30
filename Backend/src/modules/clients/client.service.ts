import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export const createClient = async (data: {
  companyName: string;
  contactName?: string;
  contactNo: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  createdById: string;
}) => {
  // Auto-generate Client Code
  const existingClients = await db.orm.public.Client.all();
  const count = existingClients.length;
  const clientcode = `CL-${1001 + count}`;

  const client = await db.orm.public.Client.create({
    clientcode,
    companyName: data.companyName,
    contactNo: data.contactNo,
    email: data.email ?? null,
    address: data.address ?? null,
    gstNumber: data.gstNumber ?? null,
    createdById: dbId(data.createdById),
  });

  return client;
};

export const listClients = async () => {
  const clients = await db.orm.public.Client.orderBy((c) => c.createdAt.desc()).all();
  return clients;
};

export const getClientById = async (id: string) => {
  const client = await db.orm.public.Client.where({ id: dbId(id) }).first();
  return client;
};

export const updateClientProfileImage = async (id: string, imageUrl: string) => {
  const updated = await db.orm.public.Client
    .where({ id: dbId(id) })
    .update({ profileImage: imageUrl });
  
  // Also update it in OrderService ? The client route in order.service creates client.
  return updated;
};

export const createCompanyContact = async (data: any) => {
  return await db.orm.public.CompanyContact.create({
    companyId: data.companyId,
    fullName: data.fullName,
    designation: data.designation ?? null,
    department: data.department ?? null,
    email: data.email ?? null,
    mobile: data.mobile ?? null,
    whatsapp: data.whatsapp ?? null,
    reportsToId: data.reportsToId ? dbId(data.reportsToId) : null,
    notes: data.notes ?? null,
  });
};

export const listCompanyContacts = async () => {
  return await db.orm.public.CompanyContact.where({ isDeleted: 0 }).orderBy((c) => c.createdAt.desc()).all();
};

export const updateCompanyContactProfileImage = async (id: string, imageUrl: string) => {
  return await db.orm.public.CompanyContact
    .where({ id: dbId(id) })
    .update({ profileImage: imageUrl });
};

