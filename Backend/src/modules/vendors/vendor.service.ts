import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export interface CreateVendorInput {
  vendorCode?: string;
  vendorName: string;
  companyName?: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson: string;
  mobileNumber: string;
  alternateMobile?: string;
  email: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  materialSupplied: string;
  vendorCategory?: string;
  paymentTerms?: string;
  leadTime?: string;
  status?: string;
  remarks?: string;
  notes?: string;
}

export const listVendors = async () => {
  const vendors = await db.orm.public.Vendor.orderBy((v) => v.createdAt.desc()).all();
  return vendors;
};

export const getVendorById = async (id: string) => {
  const vendor = await db.orm.public.Vendor.where({ id: dbId(id) }).first();
  return vendor;
};

export const createVendor = async (data: CreateVendorInput) => {
  let vendorCode = data.vendorCode ? data.vendorCode.trim() : '';

  if (!vendorCode) {
    const existingVendors = await db.orm.public.Vendor.all();
    vendorCode = `VND-${1001 + existingVendors.length}`;
  }

  // Check duplicate vendor code
  const existingWithCode = await db.orm.public.Vendor.where({ vendorCode }).first();
  if (existingWithCode) {
    throw new Error(`Vendor Code "${vendorCode}" already exists.`);
  }

  const vendor = await db.orm.public.Vendor.create({
    vendorCode,
    vendorName: data.vendorName,
    companyName: data.companyName ?? null,
    gstNumber: data.gstNumber ?? null,
    panNumber: data.panNumber ?? null,
    contactPerson: data.contactPerson,
    mobileNumber: data.mobileNumber,
    alternateMobile: data.alternateMobile ?? null,
    email: data.email,
    website: data.website ?? null,
    addressLine1: data.addressLine1 ?? null,
    addressLine2: data.addressLine2 ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    pinCode: data.pinCode ?? null,
    country: data.country ?? null,
    materialSupplied: data.materialSupplied,
    vendorCategory: data.vendorCategory ?? null,
    paymentTerms: data.paymentTerms ?? null,
    leadTime: data.leadTime ?? null,
    status: data.status || 'ACTIVE',
    remarks: data.remarks ?? null,
    notes: data.notes ?? null,
  });

  return vendor;
};

export const updateVendor = async (id: string, data: Partial<CreateVendorInput>) => {
  const updateData: Record<string, any> = {};

  if (data.vendorName !== undefined) updateData['vendorName'] = data.vendorName;
  if (data.companyName !== undefined) updateData['companyName'] = data.companyName ?? null;
  if (data.gstNumber !== undefined) updateData['gstNumber'] = data.gstNumber ?? null;
  if (data.panNumber !== undefined) updateData['panNumber'] = data.panNumber ?? null;
  if (data.contactPerson !== undefined) updateData['contactPerson'] = data.contactPerson;
  if (data.mobileNumber !== undefined) updateData['mobileNumber'] = data.mobileNumber;
  if (data.alternateMobile !== undefined) updateData['alternateMobile'] = data.alternateMobile ?? null;
  if (data.email !== undefined) updateData['email'] = data.email;
  if (data.website !== undefined) updateData['website'] = data.website ?? null;
  if (data.addressLine1 !== undefined) updateData['addressLine1'] = data.addressLine1 ?? null;
  if (data.addressLine2 !== undefined) updateData['addressLine2'] = data.addressLine2 ?? null;
  if (data.city !== undefined) updateData['city'] = data.city ?? null;
  if (data.state !== undefined) updateData['state'] = data.state ?? null;
  if (data.pinCode !== undefined) updateData['pinCode'] = data.pinCode ?? null;
  if (data.country !== undefined) updateData['country'] = data.country ?? null;
  if (data.materialSupplied !== undefined) updateData['materialSupplied'] = data.materialSupplied;
  if (data.vendorCategory !== undefined) updateData['vendorCategory'] = data.vendorCategory ?? null;
  if (data.paymentTerms !== undefined) updateData['paymentTerms'] = data.paymentTerms ?? null;
  if (data.leadTime !== undefined) updateData['leadTime'] = data.leadTime ?? null;
  if (data.status !== undefined) updateData['status'] = data.status;
  if (data.remarks !== undefined) updateData['remarks'] = data.remarks ?? null;
  if (data.notes !== undefined) updateData['notes'] = data.notes ?? null;

  const updated = await db.orm.public.Vendor.where({ id: dbId(id) }).update(updateData);
  return updated;
};

export const deleteVendor = async (id: string) => {
  const deleted = await db.orm.public.Vendor.where({ id: dbId(id) }).delete();
  return deleted;
};
