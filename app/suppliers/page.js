"use client";

import { useState, useEffect } from "react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch");
      }
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add supplier");
      }

      setMessage({ type: "success", text: "Supplier added successfully!" });
      setFormData({ name: "", contactPerson: "", email: "" });
      fetchSuppliers();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fadeIn">
      <div className="page-header">
        <h1 className="page-title">Suppliers <span style={{ color: "var(--primary)" }}>Management</span></h1>
        <p className="page-subtitle">Manage your global network of product suppliers.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
        {/* Add Supplier Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Add New Supplier</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. TechCorp Solutions"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  className="input"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. contact@techcorp.com"
                />
              </div>
              {message.text && (
                <div className={`message ${message.type === "success" ? "message-success" : "message-error"}`}>
                  {message.text}
                </div>
              )}
              <button className="btn btn-primary" disabled={submitting} style={{ width: "100%", marginTop: "4px" }}>
                {submitting ? "Adding..." : "Add Supplier"}
              </button>
            </form>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="card" style={{ minHeight: "400px" }}>
          <div className="card-header">
            <h3 className="card-title">Existing Suppliers</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="empty-state"><p>Loading suppliers...</p></div>
            ) : suppliers.length === 0 ? (
              <div className="empty-state"><p>No suppliers found. Add one to get started.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {suppliers.map((s) => (
                  <div key={s._id} style={{
                    padding: "14px 16px",
                    borderRadius: "8px",
                    background: "#f9fafb",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{s.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--primary)" }}>{s.contactPerson}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{s.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
