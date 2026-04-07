export type CustomerDirectoryItem = {
  id: string;
  name: string;
  phone: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
};

type CustomerLike = {
  id: string;
  name: string;
  phone: string;
  deliveryAddress: string;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeCustomer(customer: CustomerLike): CustomerDirectoryItem {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    deliveryAddress: customer.deliveryAddress,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}
