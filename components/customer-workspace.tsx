"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

import { type CustomerDirectoryItem } from "@/lib/customer-directory";
import { DeliveryMap } from "@/components/delivery-map";

type CustomerFormState = {
  name: string;
  phone: string;
  deliveryAddress: string;
};

function createEmptyFormState(): CustomerFormState {
  return {
    name: "",
    phone: "",
    deliveryAddress: "",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function customerToFormState(customer: CustomerDirectoryItem): CustomerFormState {
  return {
    name: customer.name,
    phone: customer.phone,
    deliveryAddress: customer.deliveryAddress,
  };
}

export function CustomerWorkspace({
  initialCustomers,
}: {
  initialCustomers: CustomerDirectoryItem[];
}) {
  const router = useRouter();
  const [metricsReferenceTime] = useState(() => Date.now());
  const [customers, setCustomers] = useState(initialCustomers);
  const [formState, setFormState] = useState<CustomerFormState>(createEmptyFormState);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const updatedToday = customers.filter((customer) => {
      const updatedDate = new Date(customer.updatedAt);
      const now = new Date();

      return (
        updatedDate.getFullYear() === now.getFullYear() &&
        updatedDate.getMonth() === now.getMonth() &&
        updatedDate.getDate() === now.getDate()
      );
    }).length;
    const newThisWeek = customers.filter((customer) => {
      const createdAt = new Date(customer.createdAt).getTime();
      const sevenDaysAgo = metricsReferenceTime - 7 * 24 * 60 * 60 * 1000;

      return createdAt >= sevenDaysAgo;
    }).length;
    const uniqueAreaCount = new Set(
      customers.map((customer) => customer.deliveryAddress.split(",")[0]?.trim() ?? ""),
    ).size;

    return {
      totalCustomers,
      updatedToday,
      newThisWeek,
      uniqueAreaCount,
    };
  }, [customers, metricsReferenceTime]);

  const sortedCustomers = useMemo(
    () =>
      [...customers].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [customers],
  );

  const resetForm = () => {
    setFormState(createEmptyFormState());
    setEditingCustomerId(null);
  };

  const handleUnauthorized = (status: number) => {
    if (status !== 401) {
      return false;
    }

    router.push("/login");
    router.refresh();

    return true;
  };

  const handleInputChange = (field: keyof CustomerFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEdit = (customer: CustomerDirectoryItem) => {
    setErrorMessage("");
    setFeedbackMessage("");
    setEditingCustomerId(customer.id);
    setFormState(customerToFormState(customer));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (customer: CustomerDirectoryItem) => {
    const shouldDelete = window.confirm(`Delete ${customer.name} from the customer directory?`);

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      setErrorMessage("");
      setFeedbackMessage("");

      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to delete the customer.");
        return;
      }

      setCustomers((current) => current.filter((item) => item.id !== customer.id));

      if (editingCustomerId === customer.id) {
        resetForm();
      }

      setFeedbackMessage("Customer removed.");
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      setErrorMessage("");
      setFeedbackMessage("");

      const payload = {
        name: formState.name.trim(),
        phone: formState.phone.trim(),
        deliveryAddress: formState.deliveryAddress.trim(),
      };

      const response = await fetch(
        editingCustomerId ? `/api/customers/${editingCustomerId}` : "/api/customers",
        {
          method: editingCustomerId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { error?: string; customer?: CustomerDirectoryItem }
        | null;

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (!response.ok || !data?.customer) {
        setErrorMessage(data?.error ?? "Unable to save the customer.");
        return;
      }

      const savedCustomer = data.customer;

      setCustomers((current) => {
        if (editingCustomerId) {
          return current.map((item) => (item.id === savedCustomer.id ? savedCustomer : item));
        }

        return [savedCustomer, ...current];
      });

      resetForm();
      setFeedbackMessage(editingCustomerId ? "Customer updated." : "Customer created.");
    });
  };

  return (
    <div className="app-stack">
      <section className="app-metrics">
        <div className="app-metric-card">
          <span className="app-metric-card__label">Customers</span>
          <strong className="app-metric-card__value">{metrics.totalCustomers}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Updated Today</span>
          <strong className="app-metric-card__value">{metrics.updatedToday}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">New This Week</span>
          <strong className="app-metric-card__value">{metrics.newThisWeek}</strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Address Areas</span>
          <strong className="app-metric-card__value">{metrics.uniqueAreaCount}</strong>
        </div>
      </section>

      <section className="app-card">
        <div className="app-card__header">
          <div>
            <h2>{editingCustomerId ? "Edit Customer" : "Add Customer"}</h2>
            <p>Maintain names, phone numbers, and delivery destinations in one place.</p>
          </div>
          {editingCustomerId ? (
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
              <span>Customer Name</span>
              <input
                onChange={(event) => handleInputChange("name", event.target.value)}
                placeholder="Ayesha Rahman"
                required
                value={formState.name}
              />
            </label>

            <label className="app-form__field">
              <span>Phone</span>
              <input
                onChange={(event) => handleInputChange("phone", event.target.value)}
                placeholder="+8801712345678"
                required
                value={formState.phone}
              />
            </label>
          </div>

          <label className="app-form__field">
            <span>Delivery Address</span>
            <textarea
              onChange={(event) => handleInputChange("deliveryAddress", event.target.value)}
              placeholder="House 12, Road 7, Dhanmondi, Dhaka"
              required
              rows={3}
              value={formState.deliveryAddress}
            />
          </label>

          {formState.deliveryAddress.trim() ? (
            <DeliveryMap address={formState.deliveryAddress} />
          ) : null}

          {errorMessage ? <p className="app-alert app-alert--error">{errorMessage}</p> : null}
          {feedbackMessage ? (
            <p className="app-alert app-alert--success">{feedbackMessage}</p>
          ) : null}

          <div className="app-form__actions">
            <button className="app-button" disabled={isPending} type="submit">
              {isPending
                ? editingCustomerId
                  ? "Saving..."
                  : "Creating..."
                : editingCustomerId
                  ? "Save Changes"
                  : "Add Customer"}
            </button>
          </div>
        </form>
      </section>

      <section className="app-card">
        <div className="app-card__header">
          <div>
            <h2>Customer Directory</h2>
            <p>{sortedCustomers.length} records</p>
          </div>
        </div>

        {sortedCustomers.length === 0 ? (
          <div className="app-empty-state">
            <h3>No customers yet</h3>
            <p>Add the first customer using the form above.</p>
          </div>
        ) : (
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Delivery Address</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="app-table__cell-stack">
                        <strong>{customer.name}</strong>
                        <span>Created {formatDate(customer.createdAt)}</span>
                      </div>
                    </td>
                    <td>{customer.phone}</td>
                    <td>{customer.deliveryAddress}</td>
                    <td>{formatDate(customer.updatedAt)}</td>
                    <td>
                      <div className="app-table__actions">
                        <button
                          className="app-link-button"
                          disabled={isPending}
                          onClick={() => handleEdit(customer)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="app-link-button app-link-button--danger"
                          disabled={isPending}
                          onClick={() => handleDelete(customer)}
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
