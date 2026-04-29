export type SupplierManagementItem = {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  productIds: string[];
  products: { id: string; name: string; sku: string }[];
  createdAt: string;
  updatedAt: string;
};

type SupplierLike = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  products?: { id: string; name: string; sku: string }[];
  createdAt: Date;
  updatedAt: Date;
};

export function serializeSupplier(supplier: SupplierLike): SupplierManagementItem {
  return {
    id: supplier.id,
    name: supplier.name,
    contactPerson: supplier.contactPerson ?? undefined,
    email: supplier.email ?? undefined,
    phone: supplier.phone ?? undefined,
    address: supplier.address ?? undefined,
    productIds: supplier.products?.map(p => p.id) ?? [],
    products: supplier.products ?? [],
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}
