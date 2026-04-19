"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

import { type CustomerDirectoryItem } from "@/lib/customer-directory";
import {
  formatOrderStatus,
  ORDER_STATUS_OPTIONS,
  type OrderCatalogItem,
  type OrderStatusValue,
} from "@/lib/order-management";
import { type ProductCatalogItem } from "@/lib/product-catalog";
import { DeliveryMap } from "@/components/delivery-map";

type OrderItemFormState = {
  rowId: string;
  productId: string;
  size: string;
  quantity: string;
};

type OrderFormState = {
  orderNumber: string;
  selectedCustomerId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  notes: string;
  status: OrderStatusValue;
  items: OrderItemFormState[];
};

function createRowId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `row-${Math.random().toString(36).slice(2)}`;
}

function createEmptyOrderItem(): OrderItemFormState {
  return {
    rowId: createRowId(),
    productId: "",
    size: "",
    quantity: "1",
  };
}

function createEmptyOrderFormState(): OrderFormState {
  return {
    orderNumber: "",
    selectedCustomerId: "",
    customerName: "",
    customerEmail: "",
    shippingAddress: "",
    notes: "",
    status: "PENDING",
    items: [createEmptyOrderItem()],
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

function orderToFormState(
  order: OrderCatalogItem,
  customers: CustomerDirectoryItem[],
): OrderFormState {
  const matchedCustomer = customers.find(
    (customer) =>
      customer.name.trim().toLowerCase() === order.customerName.trim().toLowerCase() &&
      customer.deliveryAddress.trim().toLowerCase() ===
        order.shippingAddress.trim().toLowerCase(),
  );

  return {
    orderNumber: order.orderNumber,
    selectedCustomerId: matchedCustomer?.id ?? "",
    customerName: order.customerName,
    customerEmail: order.customerEmail ?? "",
    shippingAddress: order.shippingAddress,
    notes: order.notes ?? "",
    status: order.status,
    items: order.items.map((item) => ({
      rowId: item.id,
      productId: item.productId,
      size: item.size,
      quantity: String(item.quantity),
    })),
  };
}

export function OrderWorkspace({
  initialCustomers,
  initialOrders,
  initialProducts,
}: {
  initialCustomers: CustomerDirectoryItem[];
  initialOrders: OrderCatalogItem[];
  initialProducts: ProductCatalogItem[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [formState, setFormState] = useState<OrderFormState>(createEmptyOrderFormState);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const productsById = useMemo(
    () => new Map(initialProducts.map((product) => [product.id, product])),
    [initialProducts],
  );

  const productOptions = useMemo(
    () => [...initialProducts].sort((left, right) => left.name.localeCompare(right.name)),
    [initialProducts],
  );
  const customersById = useMemo(
    () => new Map(initialCustomers.map((customer) => [customer.id, customer])),
    [initialCustomers],
  );
  const customerOptions = useMemo(
    () => [...initialCustomers].sort((left, right) => left.name.localeCompare(right.name)),
    [initialCustomers],
  );

  const hasProducts = productOptions.length > 0;
  const selectedCustomer = customersById.get(formState.selectedCustomerId);

  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => order.status === "PENDING").length;
    const totalUnits = orders.reduce((sum, order) => sum + order.totalItems, 0);
    const bookedValue = orders
      .filter((order) => order.status !== "CANCELLED")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      totalOrders,
      pendingOrders,
      totalUnits,
      bookedValue,
    };
  }, [orders]);

  const draftSummary = useMemo(() => {
    const totalItems = formState.items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      return Number.isInteger(quantity) && quantity > 0 ? sum + quantity : sum;
    }, 0);

    const totalAmount = Number(
      formState.items
        .reduce((sum, item) => {
          const product = productsById.get(item.productId);
          const quantity = Number(item.quantity);

          if (!product || !Number.isInteger(quantity) || quantity < 1) {
            return sum;
          }

          return sum + product.price * quantity;
        }, 0)
        .toFixed(2),
    );

    return {
      totalItems,
      totalAmount,
    };
  }, [formState.items, productsById]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [orders],
  );

  const resetForm = () => {
    setFormState(createEmptyOrderFormState());
    setEditingOrderId(null);
  };

  const handleUnauthorized = (status: number) => {
    if (status !== 401) {
      return false;
    }

    router.push("/login");
    router.refresh();

    return true;
  };

  const handleInputChange = (
    field: Exclude<keyof OrderFormState, "items">,
    value: string | OrderStatusValue,
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const selected = customersById.get(customerId);

    setFormState((current) => ({
      ...current,
      selectedCustomerId: customerId,
      customerName: selected ? selected.name : current.customerName,
      shippingAddress: selected ? selected.deliveryAddress : current.shippingAddress,
    }));
  };

  const handleItemChange = (
    rowId: string,
    field: keyof Omit<OrderItemFormState, "rowId">,
    value: string,
  ) => {
    setFormState((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.rowId !== rowId) {
          return item;
        }

        if (field === "productId") {
          const selectedProduct = productsById.get(value);
          const nextSize = selectedProduct?.sizes.includes(item.size)
            ? item.size
            : (selectedProduct?.sizes[0] ?? "");

          return {
            ...item,
            productId: value,
            size: nextSize,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    }));
  };

  const handleAddItem = () => {
    setFormState((current) => ({
      ...current,
      items: [...current.items, createEmptyOrderItem()],
    }));
  };

  const handleRemoveItem = (rowId: string) => {
    setFormState((current) => {
      if (current.items.length === 1) {
        return {
          ...current,
          items: [createEmptyOrderItem()],
        };
      }

      return {
        ...current,
        items: current.items.filter((item) => item.rowId !== rowId),
      };
    });
  };

  const handleEdit = (order: OrderCatalogItem) => {
    setErrorMessage("");
    setFeedbackMessage("");
    setEditingOrderId(order.id);
    setFormState(orderToFormState(order, initialCustomers));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (order: OrderCatalogItem) => {
    const shouldDelete = window.confirm(`Delete order ${order.orderNumber}?`);

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      setErrorMessage("");
      setFeedbackMessage("");

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to delete the order.");
        return;
      }

      setOrders((current) => current.filter((item) => item.id !== order.id));

      if (editingOrderId === order.id) {
        resetForm();
      }

      setFeedbackMessage("Order removed.");
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasProducts) {
      setErrorMessage("Add products before creating an order.");
      return;
    }

    startTransition(async () => {
      setErrorMessage("");
      setFeedbackMessage("");

      const payload = {
        orderNumber: formState.orderNumber.trim().toUpperCase(),
        customerName: formState.customerName.trim(),
        customerEmail: formState.customerEmail.trim().toLowerCase(),
        shippingAddress: formState.shippingAddress.trim(),
        notes: formState.notes.trim(),
        status: formState.status,
        items: formState.items.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: Number(item.quantity),
        })),
      };

      const response = await fetch(
        editingOrderId ? `/api/orders/${editingOrderId}` : "/api/orders",
        {
          method: editingOrderId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { error?: string; order?: OrderCatalogItem }
        | null;

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok || !data?.order) {
        setErrorMessage(data?.error ?? "Unable to save the order.");
        return;
      }

      const savedOrder = data.order;

      setOrders((current) => {
        if (editingOrderId) {
          return current.map((item) => (item.id === savedOrder.id ? savedOrder : item));
        }

        return [savedOrder, ...current];
      });

      resetForm();
      setFeedbackMessage(editingOrderId ? "Order updated." : "Order created.");
    });
  };

  return (
    <div className="app-stack">
      <section className="app-metrics">
        <div className="app-metric-card">
          <span className="app-metric-card__label">Orders</span>
          <strong className="app-metric-card__value">{metrics.totalOrders}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Pending</span>
          <strong className="app-metric-card__value">{metrics.pendingOrders}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Units Ordered</span>
          <strong className="app-metric-card__value">{metrics.totalUnits}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Booked Value</span>
          <strong className="app-metric-card__value">{formatCurrency(metrics.bookedValue)}</strong>
        </div>
      </section>

      <section className="app-card">
        <div className="app-card__header">
          <div>
            <h2>{editingOrderId ? "Edit Order" : "Create Order"}</h2>
            <p>Build an order, add items, and manage fulfillment status.</p>
          </div>
          {editingOrderId ? (
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
              <span>Order Number</span>
              <input
                onChange={(event) => handleInputChange("orderNumber", event.target.value)}
                placeholder="ORD-1001"
                required
                value={formState.orderNumber}
              />
            </label>

            <label className="app-form__field">
              <span>Status</span>
              <select
                onChange={(event) =>
                  handleInputChange("status", event.target.value as OrderStatusValue)
                }
                value={formState.status}
              >
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatOrderStatus(status)}
                  </option>
                ))}
              </select>
            </label>
            {customerOptions.length > 0 ? (
              <label className="app-form__field app-form__field--full">
                <span>Saved Customer</span>
                <select
                  onChange={(event) => handleCustomerSelect(event.target.value)}
                  value={formState.selectedCustomerId}
                >
                  <option value="">Manual entry</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>

                {selectedCustomer ? (
                  <div className="app-customer-quicklook">
                    <span className="app-customer-pill">{selectedCustomer.phone}</span>
                    <span className="app-customer-quicklook__address">
                      {selectedCustomer.deliveryAddress}
                    </span>
                  </div>
                ) : null}
              </label>
            ) : null}
          </div>

          <div className="app-form__grid">
            <label className="app-form__field">
              <span>Customer Name</span>
              <input
                onChange={(event) => handleInputChange("customerName", event.target.value)}
                placeholder="Ayesha Rahman"
                required
                value={formState.customerName}
              />
            </label>

            <label className="app-form__field">
              <span>Customer Email</span>
              <input
                onChange={(event) => handleInputChange("customerEmail", event.target.value)}
                placeholder="ayesha@example.com"
                type="email"
                value={formState.customerEmail}
              />
            </label>
          </div>

          <label className="app-form__field">
            <span>Shipping Address</span>
            <textarea
              onChange={(event) => handleInputChange("shippingAddress", event.target.value)}
              placeholder="House 12, Road 7, Dhanmondi, Dhaka"
              required
              rows={3}
              value={formState.shippingAddress}
            />
          </label>

          {formState.shippingAddress.trim() ? (
            <DeliveryMap address={formState.shippingAddress} />
          ) : null}

          <label className="app-form__field">
            <span>Notes</span>
            <textarea
              onChange={(event) => handleInputChange("notes", event.target.value)}
              placeholder="Handle with care. Confirm delivery before 5 PM."
              rows={3}
              value={formState.notes}
            />
          </label>

          <section className="app-form__section app-order-builder">
            <div className="app-order-builder__top">
              <div>
                <h3>Order Items</h3>
                <p>Select products from the catalog and set quantities.</p>
              </div>

              <div className="app-order-builder__tools">
                <div className="app-order-builder__stats">
                  <div className="app-order-builder__stat">
                    <span>Rows</span>
                    <strong>{formState.items.length}</strong>
                  </div>
                  <div className="app-order-builder__stat">
                    <span>Draft Units</span>
                    <strong>{draftSummary.totalItems}</strong>
                  </div>
                  <div className="app-order-builder__stat">
                    <span>Draft Total</span>
                    <strong>{formatCurrency(draftSummary.totalAmount)}</strong>
                  </div>
                </div>

                <button
                  className="app-button app-button--secondary"
                  disabled={!hasProducts || isPending}
                  onClick={handleAddItem}
                  type="button"
                >
                  Add Item
                </button>
              </div>
            </div>

            {!hasProducts ? (
              <p className="app-alert app-alert--error">
                Add products on the <Link href="/">Products page</Link> before creating orders.
              </p>
            ) : null}

            <div className="app-order-items">
              {formState.items.map((item, index) => {
                const selectedProduct = productsById.get(item.productId);
                const quantity = Number(item.quantity);
                const lineTotal =
                  selectedProduct && Number.isInteger(quantity) && quantity > 0
                    ? selectedProduct.price * quantity
                    : 0;
                const itemHint = selectedProduct
                  ? `${selectedProduct.sku} / ${formatCurrency(selectedProduct.price)} each`
                  : "Pick a product, then choose size and quantity.";
                const sizeHint = selectedProduct
                  ? `Available sizes: ${selectedProduct.sizes.join(", ")}`
                  : "Sizes will appear after you select a product.";

                return (
                  <article key={item.rowId} className="app-order-item-card">
                    <div className="app-order-item-card__header">
                      <div className="app-order-item-card__title">
                        <span className="app-order-item-card__index">Item {index + 1}</span>
                        <div>
                          <h3>{selectedProduct?.name ?? "Select a product"}</h3>
                          <p>{itemHint}</p>
                        </div>
                      </div>

                      <button
                        className="app-chip-button app-chip-button--danger"
                        disabled={isPending}
                        onClick={() => handleRemoveItem(item.rowId)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="app-order-item-card__grid app-order-item-card__grid--primary">
                      <label className="app-form__field">
                        <span>Product</span>
                        <select
                          onChange={(event) =>
                            handleItemChange(item.rowId, "productId", event.target.value)
                          }
                          required
                          value={item.productId}
                        >
                          <option value="">Select product</option>
                          {productOptions.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                        <small className="app-inline-helper">{itemHint}</small>
                      </label>
                    </div>

                    <div className="app-order-item-card__grid app-order-item-card__grid--secondary">
                      <label className="app-form__field">
                        <span>Size</span>
                        <select
                          disabled={!selectedProduct}
                          onChange={(event) =>
                            handleItemChange(item.rowId, "size", event.target.value)
                          }
                          required
                          value={item.size}
                        >
                          <option value="">Select size</option>
                          {(selectedProduct?.sizes ?? []).map((size) => (
                            <option key={`${item.rowId}-${size}`} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                        <small className="app-inline-helper">{sizeHint}</small>
                      </label>

                      <label className="app-form__field">
                        <span>Quantity</span>
                        <input
                          min="1"
                          onChange={(event) =>
                            handleItemChange(item.rowId, "quantity", event.target.value)
                          }
                          required
                          step="1"
                          type="number"
                          value={item.quantity}
                        />
                        <small className="app-inline-helper">
                          Choose how many units to include in this order.
                        </small>
                      </label>

                      <div className="app-form__field">
                        <span>Line Total</span>
                        <div className="app-order-item-card__meta">
                          <strong>{formatCurrency(lineTotal)}</strong>
                          <small>
                            Unit price:{" "}
                            {selectedProduct
                              ? formatCurrency(selectedProduct.price)
                              : "Select product"}
                          </small>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {errorMessage ? <p className="app-alert app-alert--error">{errorMessage}</p> : null}
          {feedbackMessage ? (
            <p className="app-alert app-alert--success">{feedbackMessage}</p>
          ) : null}

          <div className="app-form__actions">
            <button className="app-button" disabled={isPending || !hasProducts} type="submit">
              {isPending
                ? editingOrderId
                  ? "Saving..."
                  : "Creating..."
                : editingOrderId
                  ? "Save Changes"
                  : "Create Order"}
            </button>
          </div>
        </form>
      </section>

      <section className="app-card">
        <div className="app-card__header">
          <div>
            <h2>Orders</h2>
            <p>{sortedOrders.length} records</p>
          </div>
        </div>

        {sortedOrders.length === 0 ? (
          <div className="app-empty-state">
            <h3>No orders yet</h3>
            <p>Create the first order using the form above.</p>
          </div>
        ) : (
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="app-table__cell-stack">
                        <strong>{order.orderNumber}</strong>
                        <span>{order.totalItems} units</span>
                      </div>
                    </td>
                    <td>
                      <div className="app-table__cell-stack">
                        <strong>{order.customerName}</strong>
                        {order.customerEmail ? <span>{order.customerEmail}</span> : null}
                        <span>{order.shippingAddress}</span>
                      </div>
                    </td>
                    <td>
                      <ul className="app-detail-list">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <strong>{item.productName}</strong>
                            <span>
                              {item.sku} / {item.size} / Qty {item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <span className="app-status-badge" data-status={order.status}>
                        {formatOrderStatus(order.status)}
                      </span>
                    </td>
                    <td>
                      <div className="app-table__cell-stack">
                        <strong>{formatCurrency(order.totalAmount)}</strong>
                        {order.notes ? <span>{order.notes}</span> : null}
                      </div>
                    </td>
                    <td>{formatDate(order.updatedAt)}</td>
                    <td>
                      <div className="app-table__actions">
                        <button
                          className="app-link-button"
                          disabled={isPending}
                          onClick={() => handleEdit(order)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="app-link-button app-link-button--danger"
                          disabled={isPending}
                          onClick={() => handleDelete(order)}
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
