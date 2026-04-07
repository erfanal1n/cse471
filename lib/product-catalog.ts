export const PRODUCT_SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "One Size",
] as const;

export const PRODUCT_CATEGORY_SUGGESTIONS = [
  "T-Shirts",
  "Hoodies",
  "Accessories",
  "Shirts",
  "Pants",
  "Outerwear",
] as const;

export type ProductCatalogItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  sizes: string[];
  price: number;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
};

type ProductLike = {
  id: string;
  name: string;
  sku: string;
  category: string;
  sizes: string[];
  price: number;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeProduct(product: ProductLike): ProductCatalogItem {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    sizes: product.sizes,
    price: product.price,
    stockQuantity: product.stockQuantity,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
