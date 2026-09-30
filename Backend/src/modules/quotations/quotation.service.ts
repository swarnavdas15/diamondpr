import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export const listQuotations = async () => {
  const quotations = await db.orm.public.Quotation
    .where({ isDeleted: 0 })
    .include('followUps', (f) => f.orderBy((log) => log.createdAt.desc()))
    .orderBy((q) => q.createdAt.desc())
    .all();

  return quotations;
};

export const createQuotation = async (data: any) => {
  const existingQuotations = await db.orm.public.Quotation.all();
  const count = existingQuotations.length;
  const quotationNumber = `QT-2026-${String(1001 + count).padStart(3, '0')}`;

  const quotation = await db.orm.public.Quotation.create({
    quotationNumber: data.quotationNumber || quotationNumber,
    companyName: data.companyName,
    clientCode: data.clientCode,
    clientId: data.clientId ? dbId(data.clientId) : null,
    contactPerson: data.contactPerson,
    mobileNumber: data.mobileNumber,
    email: data.email,
    inquiryRef: data.inquiryRef ?? null,
    quotationAmount: BigInt(data.quotationAmount || 0),
    expectedOrderValue: data.expectedOrderValue ? BigInt(data.expectedOrderValue) : null,
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
    updatePayload.quotationAmount = BigInt(updatePayload.quotationAmount);
  }
  if (updatePayload.convertedOrderValue !== undefined) {
    updatePayload.convertedOrderValue = BigInt(updatePayload.convertedOrderValue);
  }
  if (updatePayload.lostValue !== undefined) {
    updatePayload.lostValue = BigInt(updatePayload.lostValue);
  }
  if (updatePayload.expectedOrderValue !== undefined) {
    updatePayload.expectedOrderValue = BigInt(updatePayload.expectedOrderValue);
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
