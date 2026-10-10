import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export const createClient = async (data: {
  companyName: string;
  contactName?: string;
  contactNo: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  websiteUrl?: string;
  createdById: string;
}) => {
  // Auto-generate Client Code
  const count = await db.orm.public.Client.count();
  const clientcode = `CL-${1001 + Number(count)}`;

  const client = await db.orm.public.Client.create({
    clientcode,
    companyName: data.companyName,
    contactName: data.contactName ?? null,
    contactNo: data.contactNo,
    email: data.email ?? null,
    address: data.address ?? null,
    gstNumber: data.gstNumber ?? null,
    panNumber: data.panNumber ?? null,
    websiteUrl: data.websiteUrl ?? null,
    createdById: dbId(data.createdById),
  });

  // Automatically create a CompanyContact for the primary contact
  await db.orm.public.CompanyContact.create({
    companyId: client.id,
    fullName: data.contactName || 'Primary Contact',
    mobile: data.contactNo,
    email: data.email ?? null,
    designation: 'Primary Contact'
  });

  return client;
};

export const listClients = async (temporaryOnly?: boolean) => {
  const clients = await db.orm.public.Client.where({ isDeleted: 0 }).orderBy((c) => c.createdAt.desc()).all();
  if (temporaryOnly) {
    return clients.filter((c: any) => (c.clientcode || '').startsWith('TMP-'));
  }
  return clients;
};

export const getClientById = async (id: string) => {
  const client = await db.orm.public.Client.where({ id: dbId(id), isDeleted: 0 }).first();
  return client;
};

export const promoteClient = async (id: string) => {
  const client = await getClientById(id);
  if (!client) throw new Error('Client not found');

  const currentCode = (client as any).clientcode || (client as any).clientCode || '';
  if (currentCode.startsWith('TMP-')) {
    const allClients = await db.orm.public.Client.where({ isDeleted: 0 }).all();
    const permClients = allClients.filter((c: any) => (c.clientcode || '').startsWith('CL-'));
    let maxNum = 1000;
    for (const c of permClients) {
      const match = (c.clientcode || '').match(/^CL-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newClientCode = `CL-${maxNum + 1}`;

    await db.orm.public.Client.where({ id: dbId(id) }).update({ clientcode: newClientCode });

    const linkedQuotations = await db.orm.public.Quotation.where({ clientId: dbId(id) }).all();
    for (const q of linkedQuotations) {
      await db.orm.public.Quotation.where({ id: q.id }).update({ clientCode: newClientCode });
    }

    const linkedOrders = await db.orm.public.Order.where({ clientId: dbId(id) }).all();
    for (const o of linkedOrders) {
      await db.orm.public.Order.where({ id: o.id }).update({ clientCode: newClientCode });
    }

    return await getClientById(id);
  }

  return client;
};

export const updateClientProfileImage = async (id: string, imageUrl: string) => {
  const updated = await db.orm.public.Client
    .where({ id: dbId(id) })
    .update({ profileImage: imageUrl });
  return updated;
};

export const updatePrimaryContactProfileImage = async (clientId: string, imageUrl: string) => {
  const updated = await db.orm.public.CompanyContact
    .where({ companyId: dbId(clientId), designation: 'Primary Contact' })
    .update({ profileImage: imageUrl });
  return updated;
};

export const updateClient = async (id: string, data: any) => {
  const updateData: any = {};
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.contactName !== undefined) updateData.contactName = data.contactName;
  if (data.contactNo !== undefined) updateData.contactNo = data.contactNo;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber;
  if (data.panNumber !== undefined) updateData.panNumber = data.panNumber;
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
  if (data.industry !== undefined) updateData.industry = data.industry;
  if (data.remarks !== undefined) updateData.remarks = data.remarks;
  if (data.clientCode !== undefined) updateData.clientcode = data.clientCode;

  if (Object.keys(updateData).length > 0) {
    await db.orm.public.Client.where({ id: dbId(id) }).update(updateData);
  }
  return await getClientById(id);
};

export const deleteClient = async (id: string) => {
  await db.orm.public.Client.where({ id: dbId(id) }).update({ isDeleted: 1 });
  return true;
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

