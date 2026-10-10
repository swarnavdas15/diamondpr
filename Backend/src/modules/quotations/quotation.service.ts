import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export const listQuotations = async () => {
  const quotations = await db.orm.public.Quotation
    .include('followUps', (f) => f.orderBy((log) => log.createdAt.desc()))
    .orderBy((q) => q.createdAt.desc())
    .all();

  return quotations;
};

export const createQuotation = async (data: any) => {
  const existingQuotations = await db.orm.public.Quotation.all();
  const count = existingQuotations.length;
  const quotationNumber = `QT-2026-${String(1001 + count).padStart(3, '0')}`;

  let targetClientId = data.clientId;
  let targetClientCode = data.clientCode;

  // AGAR CLIENT ID NAHI MILI TOH BACKEND KHUD TEMPORARY CLIENT BANAYEGA
  if (!targetClientId) {
    if (!data.companyName) {
      throw new Error('Client selection or Company Name is required');
    }

    // Auto generate TMP code if not provided
    if (!targetClientCode) {
      const allClients = await db.orm.public.Client.all();
      let maxNum = 1000;
      for (const c of allClients) {
        const code = c.clientcode || '';
        if (code.startsWith('TMP-')) {
          const num = parseInt(code.slice(4), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      targetClientCode = `TMP-${maxNum + 1}`;
    }

    // Create Temporary Client in DB
    const newTempClient = await db.orm.public.Client.create({
      companyName: data.companyName,
      clientcode: targetClientCode,
      contactName: data.contactPerson || null,
      contactNo: data.mobileNumber || null,
      email: data.email || null,
      isTemporary: true,
    });

    targetClientId = newTempClient.id;
  }

  const quotation = await db.orm.public.Quotation.create({
    quotationNumber: data.quotationNumber || quotationNumber,
    companyName: data.companyName,
    clientCode: targetClientCode || 'TMP-1001',
    clientId: dbId(targetClientId),
    contactPerson: data.contactPerson,
    mobileNumber: data.mobileNumber,
    email: data.email,
    inquiryRef: data.inquiryRef ?? null,
    quotationAmount: Number(data.quotationAmount || 0),
    expectedOrderValue: data.expectedOrderValue ? Number(data.expectedOrderValue) : null,
    salesExecutive: data.salesExecutive || 'Sales Executive',
    salesExecutiveUserId: data.salesExecutiveUserId ? dbId(data.salesExecutiveUserId) : null,
    followUpDate: data.followUpDate ?? null,
    status: data.status || 'SENT',
    remarks: data.remarks ?? null,
    sentVia: data.sentVia ?? null,
    sentAt: data.sentAt ?? null,
    sentNotes: data.sentNotes ?? null,
    negotiationDate: data.negotiationDate ?? null,
    expectedClosureDate: data.expectedClosureDate ?? null,
  });

  return quotation;
};

export const updateQuotation = async (id: string, data: any) => {
  const updatePayload: any = { ...data };
  delete updatePayload.id;

  if (updatePayload.quotationAmount !== undefined) {
    updatePayload.quotationAmount = Number(updatePayload.quotationAmount);
  }
  if (updatePayload.convertedOrderValue !== undefined) {
    updatePayload.convertedOrderValue = Number(updatePayload.convertedOrderValue);
  }
  if (updatePayload.lostValue !== undefined) {
    updatePayload.lostValue = Number(updatePayload.lostValue);
  }
  if (updatePayload.expectedOrderValue !== undefined) {
    updatePayload.expectedOrderValue = Number(updatePayload.expectedOrderValue);
  }

  const updated = await db.orm.public.Quotation
    .where({ id: dbId(id) })
    .update(updatePayload);

  return updated;
};

export const addQuotationFollowUp = async (quotationId: string, data: any, createdByName: string) => {
  const followUp = await db.orm.public.QuotationFollowUp.create({
    quotationId: dbId(quotationId),
    followUpDate: data.followUpDate,
    notes: data.notes,
    status: data.status || 'PENDING',
    createdByName,
  });

  if (data.followUpDate) {
    await db.orm.public.Quotation
      .where({ id: dbId(quotationId) })
      .update({ followUpDate: data.followUpDate });
  }

  return followUp;
};

export const deleteQuotation = async (id: string) => {
  await db.orm.public.Quotation.where({ id: dbId(id) }).delete();
  return { success: true };
};