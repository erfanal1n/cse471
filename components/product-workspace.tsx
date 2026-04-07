"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

import {
  PRODUCT_CATEGORY_SUGGESTIONS,
  PRODUCT_SIZE_OPTIONS,
  type ProductCatalogItem,
} from "@/lib/product-catalog";

type ProductFormState = {
  name: string;
  sku: string;
  category: string;
  sizes: string[];
  price: string;
  stockQuantity: string;
};

function createEmptyFormState(): ProductFormState {
  return {
    name: "",
    sku: "",
    category: "",
    sizes: [],
    price: "",
    stockQuantity: "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function productToFormState(product: ProductCatalogItem): ProductFormState {
  return {
    name: product.name,
    sku: product.sku,
    category: product.category,
    sizes: [...product.sizes],
    price: String(product.price),
    stockQuantity: String(product.stockQuantity),
  };
}

export function ProductWorkspace({
  initialProducts,
}: {
  initialProducts: ProductCatalogItem[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [formState, setFormState] = useState<ProductFormState>(createEmptyFormState);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stockQuantity, 0);
    const totalValue = products.reduce(
      (sum, product) => sum + product.price * product.stockQuantity,
      0,
    );
    const categoryCount = new Set(products.map((product) => product.category)).size;

    return {
      totalProducts,
      totalStock,
      totalValue,
      categoryCount,
    };
  }, [products]);

  const sortedProducts = useMemo(
    () =>
      [...products].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [products],
  );

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();

    return [...PRODUCT_CATEGORY_SUGGESTIONS, ...products.map((product) => product.category)]
      .map((value) => value.trim())
      .filter((value) => {
        if (!value || seen.has(value)) {
          return false;
        }

        seen.add(value);
        return true;
      });
  }, [products]);

  const resetForm = () => {
    setFormState(createEmptyFormState());
    setEditingProductId(null);
  };

  const handleUnauthorized = (status: number) => {
    if (status !== 401) {
      return false;
    }

    router.push("/login");
    router.refresh();

    return true;
  };

  const handleInputChange = (field: keyof ProductFormState, value: string | string[]) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFormState((current) => {
      const exists = current.sizes.includes(size);

      return {
        ...current,
        sizes: exists
          ? current.sizes.filter((item) => item !== size)
          : [...current.sizes, size],
      };
    });
  };

  const handleEdit = (product: ProductCatalogItem) => {
    setErrorMessage("");
    setFeedbackMessage("");
    setEditingProductId(product.id);
    setFormState(productToFormState(product));
  };

  const handleDelete = (product: ProductCatalogItem) => {
    const shouldDelete = window.confirm(`Delete ${product.name} (${product.sku})?`);

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      setErrorMessage("");
      setFeedbackMessage("");

      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to delete the product.");
        return;
      }

      setProducts((current) => current.filter((item) => item.id !== product.id));

      if (editingProductId === product.id) {
        resetForm();
      }

      setFeedbackMessage("Product removed.");
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      setErrorMessage("");
      setFeedbackMessage("");

      const payload = {
        name: formState.name.trim(),
        sku: formState.sku.trim().toUpperCase(),
        category: formState.category.trim(),
        sizes: formState.sizes,
        price: Number(formState.price),
        stockQuantity: Number(formState.stockQuantity),
      };

      const response = await fetch(
        editingProductId ? `/api/products/${editingProductId}` : "/api/products",
        {
          method: editingProductId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { error?: string; product?: ProductCatalogItem }
        | null;

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok || !data?.product) {
        setErrorMessage(data?.error ?? "Unable to save the product.");
        return;
      }

      setProducts((current) => {
        if (editingProductId) {
          return current.map((item) => (item.id === data.product?.id ? data.product : item));
        }

        return [data.product, ...current];
      });

      resetForm();
      setFeedbackMessage(editingProductId ? "Product updated." : "Product created.");
    });
  };

  return (
    <div className="app-stack">
      <section className="app-metrics">
        <div className="app-metric-card">
          <span className="app-metric-card__label">Products</span>
          <strong className="app-metric-card__value">{metrics.totalProducts}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Stock Units</span>
          <strong className="app-metric-card__value">{metrics.totalStock}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Categories</span>
          <strong className="app-metric-card__value">{metrics.categoryCount}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Inventory Value</span>
          <strong className="app-metric-card__value">{formatCurrency(metrics.totalValue)}</strong>
        </div>
      </section>

      <section className="app-card">
        <div className="app-card__header">
          <div>
            <h2>{editingProductId ? "Edit Product" : "Add Product"}</h2>
          </div>
          {editingProductId ? (
            <button
              className="app-button app-button--secondary"
              disabled={isPending}
              onClick={resetForm}
              type="button"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <form className="app-form" onSubmit={handleSubmit}>
          <div className="app-form__grid">
            <label className="app-form__field">
              <span>Product Name</span>
              <input
                onChange={(event) => handleInputChange("name", event.target.value)}
                placeholder="Classic Cotton Tee"
                required
                value={formState.name}
              />
            </label>

            <label className="app-form__field">
              <span>SKU</span>
              <input
                onChange={(event) => handleInputChange("sku", event.target.value.toUpperCase())}
                placeholder="TSH-001"
                required
                value={formState.sku}
              />
            </label>

            <label className="app-form__field">
              <span>Category</span>
              <select
                onChange={(event) => handleInputChange("category", event.target.value)}
                required
                value={formState.category}
              >
                <option value="">Select category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="app-form__field">
              <span>Price (BDT)</span>
              <input
                min="0"
                onChange={(event) => handleInputChange("price", event.target.value)}
                placeholder="850"
                required
                step="0.01"
                type="number"
                value={formState.price}
              />
            </label>

            <label className="app-form__field">
              <span>Stock Quantity</span>
              <input
                min="0"
                onChange={(event) => handleInputChange("stockQuantity", event.target.value)}
                placeholder="120"
                required
                step="1"
                type="number"
                value={formState.stockQuantity}
              />
            </label>
          </div>

          <div className="app-form__field">
            <span>Sizes</span>
            <div className="app-size-grid">
              {PRODUCT_SIZE_OPTIONS.map((size) => (
                <label key={size} className="app-size-chip">
                  <input
                    checked={formState.sizes.includes(size)}
                    onChange={() => handleSizeToggle(size)}
                    type="checkbox"
                  />
                  <span>{size}</span>
                </label>
              ))}
            </div>
          </div>

          {errorMessage ? <p className="app-alert app-alert--error">{errorMessage}</p> : null}
          {feedbackMessage ? (
            <p className="app-alert app-alert--success">{feedbackMessage}</p>
          ) : null}

          <div className="app-form__actions">
            <button className="app-button" disabled={isPending} type="submit">
              {isPending
                ? editingProductId
                  ? "Saving..."
                  : "Creating..."
                : editingProductId
                  ? "Save Changes"
                  : "Add Product"}
            </button>
          </div>
        </form>
      </section>

      <section className="app-card">
        <div className="app-card__header">
          <div>
            <h2>Products</h2>
            <p>{sortedProducts.length} items</p>
          </div>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="app-empty-state">
            <h3>No products yet</h3>
            <p>Add the first product using the form above.</p>
          </div>
        ) : (
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Sizes</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>{product.sizes.join(", ")}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.stockQuantity}</td>
                    <td>{formatDate(product.updatedAt)}</td>
                    <td>
                      <div className="app-table__actions">
                        <button
                          className="app-link-button"
                          disabled={isPending}
                          onClick={() => handleEdit(product)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="app-link-button app-link-button--danger"
                          disabled={isPending}
                          onClick={() => handleDelete(product)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
