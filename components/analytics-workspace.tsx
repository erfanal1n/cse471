"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie } from "react-chartjs-2";

import { type ProductCatalogItem } from "@/lib/product-catalog";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export function AnalyticsWorkspace({
  products,
}: {
  products: ProductCatalogItem[];
}) {
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stockQuantity < 5);
  }, [products]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + p.stockQuantity;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    return {
      labels,
      datasets: [
        {
          label: "Stock Quantity",
          data,
          backgroundColor: [
            "#3d7db8",
            "#12263f",
            "#8b5cf6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#06b6d4",
          ],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    };
  }, [products]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          font: {
            family: "'Segoe UI', sans-serif",
            size: 12,
            weight: 600,
          },
        },
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="app-stack">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        {/* ── Low Stock Alert Section ── */}
        <section className="app-card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="app-card__header">
            <div>
              <h2 style={{ color: lowStockProducts.length > 0 ? "var(--danger)" : "inherit", display: "flex", alignItems: "center", gap: "8px" }}>
                {lowStockProducts.length > 0 && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                )}
                Low Stock Alerts
              </h2>
              <p>Products with less than 5 units remaining.</p>
            </div>
          </div>
          
          <div style={{ padding: "20px", flex: 1 }}>
            {lowStockProducts.length === 0 ? (
              <div className="app-empty-state">
                <p>All products are well stocked.</p>
              </div>
            ) : (
              <div className="app-table-wrap">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product) => (
                      <tr key={product.id}>
                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>
                          <span style={{ 
                            background: "var(--danger-bg)", 
                            color: "var(--danger)", 
                            padding: "4px 10px", 
                            borderRadius: "999px", 
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            border: "1px solid #f0c2c2"
                          }}>
                            {product.stockQuantity} Left
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ── Inventory Analytics Section ── */}
        <section className="app-card">
          <div className="app-card__header">
            <div>
              <h2>Category Distribution</h2>
              <p>Total stock quantity grouped by category.</p>
            </div>
          </div>
          <div style={{ padding: "24px", height: "400px" }}>
            {products.length === 0 ? (
              <div className="app-empty-state">
                <p>No inventory data available.</p>
              </div>
            ) : (
              <Pie data={categoryData} options={chartOptions as any} />
            )}
          </div>
        </section>
      </div>

      {/* ── Quick Summary ── */}
      <section className="app-metrics">
        <div className="app-metric-card">
          <span className="app-metric-card__label">Alerts Active</span>
          <strong className="app-metric-card__value" style={{ color: lowStockProducts.length > 0 ? "var(--danger)" : "inherit" }}>
            {lowStockProducts.length}
          </strong>
        </div>
        <div className="app-metric-card">
          <span className="app-metric-card__label">Total Categories</span>
          <strong className="app-metric-card__value">{Object.keys(categoryData.labels).length}</strong>
        </div>
      </section>
    </div>
  );
}
