"use client";

import { useState, useMemo } from "react";
import { type ProductCatalogItem } from "@/lib/product-catalog";

export function QRWorkspace({
  products = [],
}: {
  products?: ProductCatalogItem[];
}) {
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const generateQRCode = async (product: ProductCatalogItem) => {
    setSelectedProduct(product);
    setLoading(true);
    setError("");
    setQrCode(null);

    try {
      const res = await fetch(`/api/qrcode?sku=${encodeURIComponent(product.sku)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate QR code");
      }
      const data = await res.json();
      setQrCode(data.qrCode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCode || !selectedProduct) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `qrcode-${selectedProduct.sku}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fadeIn">
      <div className="page-header">
        <h1 className="page-title">
          Product QR <span style={{ color: "var(--brand)" }}>Catalog</span>
        </h1>
        <p className="page-subtitle">Select a product to generate its unique identification QR code.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
        {/* ── Product List Section ── */}
        <section className="app-card">
          <div className="app-card__header">
            <div>
              <h2>Inventory Items</h2>
              <p>{products.length} products total</p>
            </div>
          </div>

          <div className="app-product-filters" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="app-product-filters__search-wrap" style={{ flex: 1 }}>
              <svg className="app-product-filters__search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="app-product-filters__search"
                type="search"
                placeholder="Search products by name or SKU…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="app-table-wrap" style={{ maxHeight: "600px", overflowY: "auto" }}>
            <table className="app-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    style={{ 
                      cursor: "pointer", 
                      background: selectedProduct?.id === product.id ? "var(--panel-muted)" : "transparent" 
                    }}
                    onClick={() => generateQRCode(product)}
                  >
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td><code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{product.sku}</code></td>
                    <td>{product.category}</td>
                    <td>
                      <button className="app-link-button">Select</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="app-empty-state">
                <p>No products match your search.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── QR Preview Section ── */}
        <aside style={{ position: "sticky", top: "24px" }}>
          <section className="app-card">
            <div className="app-card__header">
              <h2>QR Preview</h2>
            </div>
            <div className="app-form" style={{ minHeight: "400px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {!selectedProduct ? (
                <div className="app-empty-state" style={{ padding: "0" }}>
                  <div style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><path d="M14 14h3v3h-3z"/></svg>
                  </div>
                  <p>Select a product from the list to generate its QR code.</p>
                </div>
              ) : loading ? (
                <div className="app-empty-state">
                  <p>Generating QR Code...</p>
                </div>
              ) : error ? (
                <div className="app-alert app-alert--error">
                  {error}
                </div>
              ) : qrCode ? (
                <div className="qr-result" style={{ margin: 0, border: "none", background: "transparent", animation: "scaleUp 0.3s ease-out" }}>
                  <div className="qr-image-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt={`QR Code for ${selectedProduct.sku}`} />
                  </div>
                  <div style={{ marginTop: "24px", textAlign: "center", width: "100%" }}>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "4px" }}>{selectedProduct.name}</div>
                    <div style={{ color: "var(--text-muted)", marginBottom: "20px" }}>SKU: {selectedProduct.sku}</div>
                    
                    <button onClick={handleDownload} className="app-button" style={{ width: "100%" }}>
                      Download PNG Label
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
