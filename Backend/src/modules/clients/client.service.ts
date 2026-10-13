import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export const parseClientWithDob = (client: any) => {
  if (!client) return client;
  const rawRemarks = client.remarks || '';
  const match = rawRemarks.match(/\[DOB:([\d\-]+)\]/);
  const dateOfBirth = match ? match[1] : undefined;
  const cleanRemarks = rawRemarks.replace(/\[DOB:[\d\-]+\]\s*/, '').trim();
  return {
    ...client,
    dateOfBirth,
    remarks: cleanRemarks,
  };
};

export const createClient = async (data: {
  companyName: string;
  contactName?: string;
  contactNo: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  websiteUrl?: string;
  remarks?: string;
  dateOfBirth?: string;
  createdById: string;
}) => {
  // Auto-generate Client Code
  const allClients = await db.orm.public.Client.all();
  const existingCodes = new Set(allClients.map((c: any) => ((c as any).clientcode || (c as any).clientCode || '').toLowerCase()).filter(Boolean));
  let maxNum = 1000;
  for (const c of allClients) {
    const match = ((c as any).clientcode || '').match(/^CL-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  let candidateNum = maxNum + 1;
  let clientcode = `CL-${candidateNum}`;
  while (existingCodes.has(clientcode.toLowerCase())) {
    candidateNum++;
    clientcode = `CL-${candidateNum}`;
  }

  let combinedRemarks = data.remarks || '';
  if (data.dateOfBirth) {
    const dobStr = String(data.dateOfBirth).trim();
    if (dobStr) {
      combinedRemarks = `[DOB:${dobStr}] ${combinedRemarks}`.trim();
    }
  }

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
    remarks: combinedRemarks || null,
    createdById: dbId(data.createdById),
  });

  // Automatically create a CompanyContact for the primary contact
  let primaryContactNotes: string | null = null;
  if (data.dateOfBirth) {
    primaryContactNotes = `[DOB:${String(data.dateOfBirth).trim()}]`;
  }

  await db.orm.public.CompanyContact.create({
    companyId: client.id,
    fullName: data.contactName || 'Primary Contact',
    mobile: data.contactNo,
    email: data.email ?? null,
    designation: 'Primary Contact',
    notes: primaryContactNotes,
  });

  return parseClientWithDob(client);
};

export const listClients = async (filter?: { includeTemporary?: boolean; temporaryOnly?: boolean } | boolean) => {
  const isTempOnly = typeof filter === 'boolean' ? filter : filter?.temporaryOnly;
  const includeTemp = typeof filter === 'object' ? filter?.includeTemporary : false;

  const clients = await db.orm.public.Client.where({ isDeleted: 0 }).orderBy((c) => c.createdAt.desc()).all();
  const parsed = clients.map(parseClientWithDob);

  if (isTempOnly) {
    return parsed.filter((c: any) => {
      const code = ((c.clientcode || c.clientCode || '') as string).trim().toUpperCase();
      return Boolean(c.isTemporary) || code.startsWith('TMP') || code.startsWith('TEMP');
    });
  }

  if (!includeTemp) {
    return parsed.filter((c: any) => {
      const code = ((c.clientcode || c.clientCode || '') as string).trim().toUpperCase();
      return !c.isTemporary && !code.startsWith('TMP') && !code.startsWith('TEMP');
    });
  }

  return parsed;
};

export const getClientById = async (id: string) => {
  const client = await db.orm.public.Client.where({ id: dbId(id), isDeleted: 0 }).first();
  return parseClientWithDob(client);
};

export const promoteClient = async (id: string) => {
  const client = await getClientById(id);
  if (!client) throw new Error('Client not found');

  const currentCode = ((client as any).clientcode || (client as any).clientCode || '').toUpperCase();
  if (currentCode.startsWith('TMP') || currentCode.startsWith('TEMP') || (client as any).isTemporary) {
    const allClients = await db.orm.public.Client.all();
    const existingCodes = new Set(allClients.map((c: any) => ((c as any).clientcode || (c as any).clientCode || '').toLowerCase()).filter(Boolean));
    const permClients = allClients.filter((c: any) => (c.clientcode || '').toUpperCase().startsWith('CL-'));
    let maxNum = 1000;
    for (const c of permClients) {
      const match = (c.clientcode || '').match(/^CL-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    let candidateNum = maxNum + 1;
    let newClientCode = `CL-${candidateNum}`;
    while (existingCodes.has(newClientCode.toLowerCase())) {
      candidateNum++;
      newClientCode = `CL-${candidateNum}`;
    }

    await db.orm.public.Client.where({ id: dbId(id) }).update({ clientcode: newClientCode });

    try {
      const linkedQuotations = await db.orm.public.Quotation.where({ clientId: dbId(id) }).all();
      for (const q of linkedQuotations) {
        await db.orm.public.Quotation.where({ id: q.id }).update({ clientCode: newClientCode });
      }
    } catch (e) {
      console.warn('Could not update quotations clientCode on promote:', e);
    }

    try {
      const linkedOrders = await db.orm.public.Order.where({ clientId: dbId(id) }).all();
      for (const o of linkedOrders) {
        await db.orm.public.Order.where({ id: o.id }).update({ clientCode: newClientCode });
      }
    } catch (e) {
      console.warn('Could not update orders clientCode on promote:', e);
    }

    return await getClientById(id);
  }

  return client;
};

export const promoteTemporaryClient = promoteClient;

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
  const existing = await db.orm.public.Client.where({ id: dbId(id) }).first();
  const updateData: any = {};
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.contactName !== undefined) updateData.contactName = data.contactName;
  if (data.contactNo !== undefined) updateData.contactNo = data.contactNo;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber;
  if (data.panNumber !== undefined) updateData.panNumber = data.panNumber;
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
  if (data.clientCode !== undefined) {
    updateData.clientcode = data.clientCode;
    if (existing && existing.clientcode !== data.clientCode) {
      try {
        const linkedQuotes = await db.orm.public.Quotation.where({ clientId: dbId(id) }).all();
        for (const q of linkedQuotes) {
          await db.orm.public.Quotation.where({ id: q.id }).update({ clientCode: data.clientCode });
        }
        const linkedOrders = await db.orm.public.Order.where({ clientId: dbId(id) }).all();
        for (const o of linkedOrders) {
          await db.orm.public.Order.where({ id: o.id }).update({ clientCode: data.clientCode });
        }
      } catch (e) {
        console.warn('Could not cascade update clientCode on updateClient:', e);
      }
    }
  }

  if (data.dateOfBirth !== undefined || data.remarks !== undefined) {
    const prevMatch = (existing?.remarks || '').match(/\[DOB:([\d\-]+)\]/);
    const existingDob = prevMatch ? prevMatch[1] : undefined;
    const targetDob = data.dateOfBirth !== undefined ? String(data.dateOfBirth).trim() : existingDob;
    const baseRemarks = data.remarks !== undefined ? data.remarks : (existing?.remarks || '').replace(/\[DOB:[\d\-]+\]\s*/, '').trim();
    if (targetDob) {
      updateData.remarks = `[DOB:${targetDob}] ${baseRemarks}`.trim();
    } else {
      updateData.remarks = baseRemarks || null;
    }
  }

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

  const clientId = dbId(id);

  // Safely delete linked draft quotations so no foreign key / orphan issues
  try {
    await db.orm.public.Quotation.where({ clientId }).delete();
  } catch (err) {
    console.warn('Error deleting linked quotations:', err);
  }

  try {
    await db.orm.public.CompanyContact.where({ companyId: clientId }).delete();
  } catch (err) {
    console.warn('Error deleting linked contacts:', err);
  }

  await db.orm.public.Client.where({ id: clientId }).delete();
  return { success: true, message: 'Temporary client permanently deleted' };
};

export const bulkDeleteTemporaryClientsPermanent = async (ids: string[]) => {
  const results = { deleted: 0, failed: [] as { id: string; error: string }[] };
  for (const id of ids) {
    if (id) {
      try {
        await deleteTemporaryClientPermanent(id);
        results.deleted++;
      } catch (err: any) {
        results.failed.push({ id, error: err.message || 'Unknown error' });
      }
    }
  }
  return results;
};

export const parseContactWithDob = (contact: any) => {
  if (!contact) return contact;
  const rawNotes = contact.notes || '';
  const match = rawNotes.match(/\[DOB:([\d\-]+)\]/);
  const dateOfBirth = match ? match[1] : undefined;
  const cleanNotes = rawNotes.replace(/\[DOB:[\d\-]+\]\s*/, '').trim();
  return {
    ...contact,
    dateOfBirth,
    notes: cleanNotes,
  };
};

export const createCompanyContact = async (data: any) => {
  let combinedNotes = data.notes || '';
  if (data.dateOfBirth) {
    const dobStr = String(data.dateOfBirth).trim();
    if (dobStr) {
      combinedNotes = `[DOB:${dobStr}] ${combinedNotes}`.trim();
    }
  }

  const contact = await db.orm.public.CompanyContact.create({
    companyId: data.companyId,
    fullName: data.fullName,
    designation: data.designation ?? null,
    department: data.department ?? null,
    email: data.email ?? null,
    mobile: data.mobile ?? null,
    whatsapp: data.whatsapp ?? null,
    reportsToId: data.reportsToId ? dbId(data.reportsToId) : null,
    notes: combinedNotes || null,
  });

  return parseContactWithDob(contact);
};

export const listCompanyContacts = async () => {
  const contacts = await db.orm.public.CompanyContact.where({ isDeleted: 0 }).orderBy((c) => c.createdAt.desc()).all();
  return contacts.map(parseContactWithDob);
};

export const updateCompanyContact = async (id: string, data: any) => {
  const existing = await db.orm.public.CompanyContact.where({ id: dbId(id) }).first();
  const updateData: any = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.designation !== undefined) updateData.designation = data.designation;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.mobile !== undefined) updateData.mobile = data.mobile;
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
  if (data.reportsToId !== undefined) updateData.reportsToId = data.reportsToId ? dbId(data.reportsToId) : null;

  if (data.dateOfBirth !== undefined || data.notes !== undefined) {
    const prevMatch = (existing?.notes || '').match(/\[DOB:([\d\-]+)\]/);
    const existingDob = prevMatch ? prevMatch[1] : undefined;
    const targetDob = data.dateOfBirth !== undefined ? String(data.dateOfBirth).trim() : existingDob;
    const baseNotes = data.notes !== undefined ? data.notes : (existing?.notes || '').replace(/\[DOB:[\d\-]+\]\s*/, '').trim();
    if (targetDob) {
      updateData.notes = `[DOB:${targetDob}] ${baseNotes}`.trim();
    } else {
      updateData.notes = baseNotes || null;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.orm.public.CompanyContact.where({ id: dbId(id) }).update(updateData);
  }

  const updated = await db.orm.public.CompanyContact.where({ id: dbId(id) }).first();
  return parseContactWithDob(updated);
};

export const deleteCompanyContact = async (id: string) => {
  await db.orm.public.CompanyContact.where({ id: dbId(id) }).update({ isDeleted: 1 });
  return { success: true };
};

export const updateCompanyContactProfileImage = async (id: string, imageUrl: string) => {
  return await db.orm.public.CompanyContact
    .where({ id: dbId(id) })
    .update({ profileImage: imageUrl });
};

