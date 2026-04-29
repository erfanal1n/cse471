"use client";

import { useState, useEffect } from "react";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    stockLevel: 0,
    supplier: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, suppRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/suppliers")
      ]);

      if (!prodRes.ok) {
        const data = await prodRes.json();
        throw new Error(`Inventory API: ${data.error || "Failed to fetch"}`);
      }
      if (!suppRes.ok) {
        const data = await suppRes.json();
        throw new Error(`Suppliers API: ${data.error || "Failed to fetch"}`);
      }

      const [prodData, suppData] = await Promise.all([
        prodRes.json(),
        suppRes.json()
      ]);

      setProducts(prodData);
      setSuppliers(suppData);
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
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add product");
      }

      setMessage({ type: "success", text: "Product added successfully!" });
      setFormData({ name: "", sku: "", stockLevel: 0, supplier: "" });
      fetchData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Pie chart helpers
  const CHART_COLORS = [
    "#1a56db", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  ];

  const totalStock = products.reduce((sum, p) => sum + (p.stockLevel || 0), 0);

  const buildConicGradient = () => {
    if (products.length === 0 || totalStock === 0) return "conic-gradient(#e5e7eb 0deg 360deg)";
    let current = 0;
    const stops = products.map((p, i) => {
      const start = current;
      const end = current + (p.stockLevel / totalStock) * 360;
      current = end;
      return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  };

  return (
    <div className="fadeIn">
      <div className="page-header">
        <h1 className="page-title">Inventory <span style={{ color: "var(--primary)" }}>Tracking</span></h1>
        <p className="page-subtitle">Monitor stock levels and manage product logistics.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
        {/* Add Product Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Add Product</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wireless Mouse"
                />
              </div>
              <div className="form-group">
                <label className="form-label">SKU (Unique ID)</label>
                <input
                  className="input"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. WM-101"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Stock Level</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  required
                  value={formData.stockLevel}
                  onChange={(e) => setFormData({ ...formData, stockLevel: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select
                  className="input"
                  required
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {message.text && (
                <div className={`message ${message.type === "success" ? "message-success" : "message-error"}`}>
                  {message.text}
                </div>
              )}
              <button className="btn btn-primary" disabled={submitting} style={{ width: "100%", marginTop: "4px" }}>
                {submitting ? "Adding..." : "Add to Inventory"}
              </button>
            </form>
          </div>
        </div>

        {/* Inventory List */}
        <div className="card" style={{ minHeight: "400px" }}>
          <div className="card-header">
            <h3 className="card-title">Stock Overview</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="empty-state"><p>Loading inventory...</p></div>
            ) : products.length === 0 ? (
              <div className="empty-state"><p>No products in stock. Add one to see it here.</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {products.map((p) => (
                  <div key={p._id} style={{
                    padding: "14px 16px",
                    borderRadius: "8px",
                    background: "#f9fafb",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{p.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--primary)" }}>SKU: {p.sku}</div>
                      {p.supplier && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Supplier: {p.supplier.name}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: p.stockLevel < 10 ? "var(--danger)" : "var(--success)"
                      }}>
                        {p.stockLevel}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Units</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pie Chart — Stock Distribution */}
      {!loading && products.length > 0 && (
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Stock Distribution</h3>
          </div>
          <div className="chart-wrapper">
            <div
              className="chart-donut"
              style={{ background: buildConicGradient() }}
            >
              <div className="chart-donut-hole">
                <div className="chart-donut-total">{totalStock}</div>
                <div className="chart-donut-label">Total</div>
              </div>
            </div>

            <div className="chart-legend">
              {products.map((p, i) => {
                const pct = totalStock > 0 ? ((p.stockLevel / totalStock) * 100).toFixed(1) : 0;
                return (
                  <div key={p._id} className="chart-legend-item">
                    <div
                      className="chart-legend-color"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="chart-legend-name">{p.name}</span>
                    <span className="chart-legend-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
