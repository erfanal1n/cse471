"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

import { type SupplierManagementItem } from "@/lib/supplier-management";

type SupplierFormState = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  selectedProductIds: string[];
};

function createEmptyFormState(): SupplierFormState {
  return {
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    selectedProductIds: [],
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function supplierToFormState(supplier: SupplierManagementItem): SupplierFormState {
  return {
    name: supplier.name,
    contactPerson: supplier.contactPerson ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    address: supplier.address ?? "",
    selectedProductIds: supplier.productIds,
  };
}

export function SupplierWorkspace({
  initialSuppliers,
  availableProducts = [],
}: {
  initialSuppliers: SupplierManagementItem[];
  availableProducts?: { id: string; name: string; sku: string }[];
}) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [formState, setFormState] = useState<SupplierFormState>(createEmptyFormState);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const metrics = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeCount = suppliers.length; // Simplified for now

    return {
      totalSuppliers,
      activeCount,
    };
  }, [suppliers]);

  const sortedSuppliers = useMemo(
    () =>
      [...suppliers].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [suppliers],
  );

  const resetForm = () => {
    setFormState(createEmptyFormState());
    setEditingSupplierId(null);
  };

  const handleUnauthorized = (status: number) => {
    if (status !== 401) {
      return false;
    }

    router.push("/login");
    router.refresh();

    return true;
  };

  const handleInputChange = (field: keyof SupplierFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEdit = (supplier: SupplierManagementItem) => {
    setErrorMessage("");
    setFeedbackMessage("");
    setEditingSupplierId(supplier.id);
    setFormState(supplierToFormState(supplier));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (supplier: SupplierManagementItem) => {
    const shouldDelete = window.confirm(`Delete ${supplier.name} from the supplier list?`);

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      setErrorMessage("");
      setFeedbackMessage("");

      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to delete the supplier.");
        return;
      }

      setSuppliers((current) => current.filter((item) => item.id !== supplier.id));

      if (editingSupplierId === supplier.id) {
        resetForm();
      }

      setFeedbackMessage("Supplier removed.");
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      setErrorMessage("");
      setFeedbackMessage("");

      const payload = {
        name: formState.name.trim(),
        contactPerson: formState.contactPerson.trim() || undefined,
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        address: formState.address.trim() || undefined,
        productIds: formState.selectedProductIds,
      };

      if (payload.productIds.length < 1 || payload.productIds.length > 2) {
        setErrorMessage("Please select one or two products.");
        return;
      }

      const response = await fetch(
        editingSupplierId ? `/api/suppliers/${editingSupplierId}` : "/api/suppliers",
        {
          method: editingSupplierId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { error?: string; supplier?: SupplierManagementItem }
        | null;

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok || !data?.supplier) {
        setErrorMessage(data?.error ?? "Unable to save the supplier.");
        return;
      }

      const savedSupplier = data.supplier;

      setSuppliers((current) => {
        if (editingSupplierId) {
          return current.map((item) => (item.id === savedSupplier.id ? savedSupplier : item));
        }

        return [savedSupplier, ...current];
      });

      resetForm();
      setFeedbackMessage(editingSupplierId ? "Supplier updated." : "Supplier created.");
    });
  };

  return (
    <div className="app-stack">
      <section className="app-metrics">
        <div className="app-metric-card">
          <span className="app-metric-card__label">Total Suppliers</span>
          <strong className="app-metric-card__value">{metrics.totalSuppliers}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Active Sources</span>
          <strong className="app-metric-card__value">{metrics.activeCount}</strong>
        </div>
      </section>

      <section className="app-card">
        <div className="app-card__header">
          <div>
            <h2>{editingSupplierId ? "Edit Supplier" : "Add Supplier"}</h2>
            <p>Manage your procurement sources and contact information.</p>
          </div>
          {editingSupplierId ? (
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
              <span>Supplier Name</span>
              <input
                onChange={(event) => handleInputChange("name", event.target.value)}
                placeholder="Global Imports Ltd."
                required
                value={formState.name}
              />
            </label>

            <label className="app-form__field">
              <span>Contact Person</span>
              <input
                onChange={(event) => handleInputChange("contactPerson", event.target.value)}
                placeholder="John Doe"
                value={formState.contactPerson}
              />
            </label>

            <label className="app-form__field">
              <span>Email Address</span>
              <input
                onChange={(event) => handleInputChange("email", event.target.value)}
                placeholder="contact@globalimports.com"
                type="email"
                value={formState.email}
              />
            </label>

            <label className="app-form__field">
              <span>Phone Number</span>
              <input
                onChange={(event) => handleInputChange("phone", event.target.value)}
                placeholder="+8801700000000"
                value={formState.phone}
              />
            </label>
          </div>

          <label className="app-form__field">
            <span>Office Address</span>
            <textarea
              onChange={(event) => handleInputChange("address", event.target.value)}
              placeholder="Suite 501, Crystal Tower, Banani, Dhaka"
              rows={2}
              value={formState.address}
            />
          </label>

          <div className="app-form__field">
            <span>Linked Products (Select 1 or 2)</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginTop: "8px" }}>
              {availableProducts.map(product => (
                <label key={product.id} className="app-size-chip" style={{ width: "100%", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formState.selectedProductIds.includes(product.id)}
                    onChange={(e) => {
                      const id = product.id;
                      setFormState(prev => {
                        const isSelected = prev.selectedProductIds.includes(id);
                        if (isSelected) {
                          return { ...prev, selectedProductIds: prev.selectedProductIds.filter(i => i !== id) };
                        } else {
                          if (prev.selectedProductIds.length >= 2) return prev;
                          return { ...prev, selectedProductIds: [...prev.selectedProductIds, id] };
                        }
                      });
                    }}
                  />
                  <span style={{ width: "100%", justifyContent: "flex-start", padding: "8px 12px", fontSize: "0.85rem" }}>
                    {product.name} ({product.sku})
                  </span>
                </label>
              ))}
            </div>
            {availableProducts.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No products available to link.</p>
            )}
          </div>

          {errorMessage ? <p className="app-alert app-alert--error">{errorMessage}</p> : null}
          {feedbackMessage ? (
            <p className="app-alert app-alert--success">{feedbackMessage}</p>
          ) : null}

          <div className="app-form__actions">
            <button className="app-button" disabled={isPending} type="submit">
              {isPending
                ? editingSupplierId
                  ? "Saving..."
                  : "Creating..."
                : editingSupplierId
                  ? "Save Changes"
                  : "Add Supplier"}
            </button>
          </div>
        </form>
      </section>

      <section className="app-card">
        <div className="app-card__header">
          <div>
            <h2>Suppliers List</h2>
            <p>{sortedSuppliers.length} records</p>
          </div>
        </div>

        {sortedSuppliers.length === 0 ? (
          <div className="app-empty-state">
            <h3>No suppliers yet</h3>
            <p>Add your first supplier using the form above.</p>
          </div>
        ) : (
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Email / Phone</th>
                  <th>Producing Products</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <div className="app-table__cell-stack">
                        <strong>{supplier.name}</strong>
                        <span>Added {formatDate(supplier.createdAt)}</span>
                      </div>
                    </td>
                    <td>{supplier.contactPerson || "—"}</td>
                    <td>
                      <div className="app-table__cell-stack">
                        <span>{supplier.email || "—"}</span>
                        <span>{supplier.phone || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="app-table__cell-stack">
                        {supplier.products.map(p => (
                          <strong key={p.id} style={{ fontSize: "0.8rem", color: "var(--brand)" }}>
                            {p.name} ({p.sku})
                          </strong>
                        ))}
                        {supplier.products.length === 0 && <span>None</span>}
                      </div>
                    </td>
                    <td style={{ maxWidth: "200px" }}>{supplier.address || "—"}</td>
                    <td>
                      <div className="app-table__actions">
                        <button
                          className="app-link-button"
                          disabled={isPending}
                          onClick={() => handleEdit(supplier)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="app-link-button app-link-button--danger"
                          disabled={isPending}
                          onClick={() => handleDelete(supplier)}
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
