import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

async function generateNextClientCode(isTemporary: boolean): Promise<string> {
  const prefix = isTemporary ? 'TMP' : 'CL';
  const pattern = `${prefix}-`;
  
  const existingClients = await db.orm.public.Client.where({ isDeleted: 0 }).all();
  let maxNum = 1000;
  
  for (const c of existingClients) {
    const code = c.clientcode || '';
    if (code.startsWith(pattern)) {
      const numStr = code.slice(pattern.length);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  
  return `${prefix}-${maxNum + 1}`;
}

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
  isTemporary?: boolean;
  clientCode?: string;
}) => {
  const isTemp = !!data.isTemporary;
  
  let clientcode = data.clientCode && data.clientCode.trim() ? data.clientCode.trim() : await generateNextClientCode(isTemp);
  
  const clientStatus = isTemp ? 'PROSPECT' : 'ACTIVE';

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
    createdById: data.createdById ? dbId(data.createdById) : undefined,
    isTemporary: isTemp,
    status: clientStatus,
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

export const listClients = async (filter?: { includeTemporary?: boolean; temporaryOnly?: boolean }) => {
  let query = db.orm.public.Client.where({ isDeleted: 0 });
  if (filter?.temporaryOnly) {
    query = query.where({ isTemporary: true });
  } else if (!filter?.includeTemporary) {
    query = query.where({ isTemporary: false });
  }
  const clients = await query.orderBy((c) => c.createdAt.desc()).all();
  return clients;
};

export const promoteTemporaryClient = async (id: string) => {
  const client = await db.orm.public.Client.where({ id: dbId(id), isDeleted: 0 }).first();
  if (!client) throw new Error('Client not found');

  if (!client.isTemporary) {
    return client;
  }

  let finalClientCode = client.clientcode;
  if (finalClientCode.startsWith('TMP-')) {
    finalClientCode = await generateNextClientCode(false);
  }

  await db.orm.public.Client
    .where({ id: dbId(id) })
    .update({
      isTemporary: false,
      clientcode: finalClientCode,
      status: 'ACTIVE',
    });

  // Update clientCode on any linked quotations
  try {
    const quotations = await db.orm.public.Quotation.where({ clientId: dbId(id) }).all();
    for (const q of quotations) {
      await db.orm.public.Quotation.where({ id: q.id }).update({ clientCode: finalClientCode });
    }
  } catch (err) {
    console.warn('Could not update quotations clientCode on promote:', err);
  }

  // Update clientCode on any linked orders
  try {
    const orders = await db.orm.public.Order.where({ clientId: dbId(id) }).all();
    for (const o of orders) {
      await db.orm.public.Order.where({ id: o.id }).update({ clientCode: finalClientCode });
    }
  } catch (err) {
    console.warn('Could not update orders clientCode on promote:', err);
  }

  return await getClientById(id);
};

export const getClientById = async (id: string) => {
  const client = await db.orm.public.Client.where({ id: dbId(id), isDeleted: 0 }).first();
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
  if (data.status !== undefined) updateData.status = data.status;

  if (Object.keys(updateData).length > 0) {
    await db.orm.public.Client.where({ id: dbId(id) }).update(updateData);
  }
  return await getClientById(id);
};

export const deleteClient = async (id: string) => {
  await db.orm.public.Client.where({ id: dbId(id) }).update({ isDeleted: 1 });
  return true;
};

export const deleteTemporaryClientPermanent = async (id: string) => {
  const client = await db.orm.public.Client.where({ id: dbId(id), isDeleted: 0 }).first();
  if (!client) {
    throw new Error('Client not found');
  }

  if (!client.isTemporary) {
    throw new Error('Only temporary clients can be permanently deleted via this endpoint');
  }

  const clientId = dbId(id);

  // Delete linked quotations (orphan draft quotations)
  await db.orm.public.Quotation.where({ clientId }).delete();

  // Hard delete the client
  await db.orm.public.Client.where({ id: clientId }).delete();

  return { success: true, message: 'Temporary client permanently deleted' };
};

export const bulkDeleteTemporaryClientsPermanent = async (ids: string[]) => {
  const results = { deleted: 0, failed: [] as { id: string; error: string }[] };

  for (const id of ids) {
    try {
      const client = await db.orm.public.Client.where({ id: dbId(id), isDeleted: 0 }).first();
      if (!client) {
        results.failed.push({ id, error: 'Client not found' });
        continue;
      }

      if (!client.isTemporary) {
        results.failed.push({ id, error: 'Client is not temporary' });
        continue;
      }

      const clientId = dbId(id);

      // Delete linked quotations
      await db.orm.public.Quotation.where({ clientId }).delete();

      // Hard delete the client
      await db.orm.public.Client.where({ id: clientId }).delete();

      results.deleted++;
    } catch (err: any) {
      results.failed.push({ id, error: err.message || 'Unknown error' });
    }
  }

  return results;
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

