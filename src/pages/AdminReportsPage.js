import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../services/api';
import * as XLSX from 'xlsx';

export default function AdminReportPage() {
  const [reportDate, setReportDate] = useState("");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [salesReportContent, setSalesReportContent] = useState("");
  const [stockReportContent, setStockReportContent] = useState("");
  const [cashiers, setCashiers] = useState([]);

  // Cargar cajeros para el filtro
  useEffect(() => {
    async function loadCashiers() {
      try {
        const resp = await fetch(`${BACKEND_URL}/users?limit=99999&offset=0&order=username:asc`);
        const users = await resp.json();
        setCashiers(users.filter(u => u.role === "cashier"));
      } catch (error) {
        console.error("Error cargando cajeros:", error);
      }
    }
    loadCashiers();
  }, []);

  // Función para obtener detalle del producto (con caché)
  async function getProductDetail(productId, productCache) {
    if (productCache[productId]) return productCache[productId];
    try {
      const resp = await fetch(`${BACKEND_URL}/products/${productId}`);
      const prod = await resp.json();
      productCache[productId] = prod;
      return prod;
    } catch (error) {
      console.error(`Error al obtener producto ${productId}:`, error);
      return null;
    }
  }

  // Función para generar el reporte de ventas (una fila por cada producto)
  async function generateSalesReport() {
    if (!reportDate) {
      alert("Seleccione una fecha");
      return;
    }
    try {
      // Cargar ventas filtradas por fecha y cajero
      const respSales = await fetch(`${BACKEND_URL}/sales?limit=99999&offset=0&order=date:asc`);
      let sales = await respSales.json();
      // Filtrar por fecha
      sales = sales.filter(sale => sale.date.slice(0, 10) === reportDate);
      // Filtrar por cajero si no es "all"
      if (cashierFilter !== "all") {
        sales = sales.filter(sale => String(sale.cashierId) === String(cashierFilter));
      }

      // Cargar usuarios para obtener nombre del cajero
      const respUsers = await fetch(`${BACKEND_URL}/users?limit=99999&offset=0&order=username:asc`);
      const users = await respUsers.json();

      // Cargar todas las marcas para obtener el nombre de la marca
      const respBrands = await fetch(`${BACKEND_URL}/brands?limit=99999&offset=0&order=name:asc`);
      const brands = await respBrands.json();
      const brandMap = {};
      brands.forEach(b => {
        brandMap[b.id] = b.name;
      });

      // Dividir ventas: activas (no canceladas) y canceladas
      const activeSales = sales.filter(s => !s.isCancelled);
      const cancelledSales = sales.filter(s => s.isCancelled);

      const productCache = {};
      let totalDaySales = 0;
      let totalStockUsed = 0;

      // ---- HTML final ----
      let html = `<div class="report-section" style="padding:1rem; border:1px solid #ccc; border-radius:8px; margin-bottom:1rem;">`;

      // ~~~~~~~~~~~~~~~~~~~~~~~
      // 1) Ventas NO canceladas
      // ~~~~~~~~~~~~~~~~~~~~~~~
      html += `<h4>Ventas Activas (No Canceladas)</h4>`;
      if (activeSales.length === 0) {
        html += `<p>No hay ventas activas en esta fecha.</p>`;
      } else {
        html += `<table class="table table-bordered" style="width:100%;">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Hora</th>
              <th>Cajero</th>
              <th>Marca</th>
              <th>Nombre del Producto</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>`;

        for (const sale of activeSales) {
          totalDaySales += sale.total || 0;
          const cashier = users.find(u => String(u.id) === String(sale.cashierId));
          const cashierName = cashier ? cashier.username : "Desconocido";

          if (sale.items && sale.items.length > 0) {
            // Cada item en una fila
            for (const item of sale.items) {
              totalStockUsed += item.quantity;
              const prod = await getProductDetail(item.productId, productCache);
              const brandName = prod && prod.brandId ? (brandMap[prod.brandId] || "N/A") : "N/A";

              html += `<tr>
                         <td>${sale.id || "(sin ID)"}</td>
                         <td>${new Date(sale.date).toLocaleTimeString()}</td>
                         <td>${cashierName}</td>
                         <td>${brandName}</td>
                         <td>${item.productName}</td>
                         <td>${item.quantity}</td>
                       </tr>`;
            }
          }
        }

        html += `</tbody></table>`;
        html += `<p><strong>Total del Día (Ventas Activas):</strong> $${totalDaySales.toFixed(2)}</p>`;
        html += `<p><strong>Total de Stock Consumido (Ventas Activas):</strong> ${totalStockUsed} unidades</p>`;
      }

      // ~~~~~~~~~~~~~~~~~~~~~~~
      // 2) Ventas CANCELADAS
      // ~~~~~~~~~~~~~~~~~~~~~~~
      html += `<hr /><h4>Ventas Canceladas</h4>`;
      if (cancelledSales.length === 0) {
        html += `<p>No hay ventas canceladas en esta fecha.</p>`;
      } else {
        html += `<table class="table table-bordered" style="width:100%;">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Hora</th>
              <th>Cajero</th>
              <th>Marca</th>
              <th>Nombre del Producto</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>`;

        for (const sale of cancelledSales) {
          const cashier = users.find(u => String(u.id) === String(sale.cashierId));
          const cashierName = cashier ? cashier.username : "Desconocido";

          if (sale.items && sale.items.length > 0) {
            for (const item of sale.items) {
              const prod = await getProductDetail(item.productId, productCache);
              const brandName = prod && prod.brandId ? (brandMap[prod.brandId] || "N/A") : "N/A";

              html += `<tr>
                         <td>${sale.id || "(sin ID)"}</td>
                         <td>${new Date(sale.date).toLocaleTimeString()}</td>
                         <td>${cashierName}</td>
                         <td>${brandName}</td>
                         <td>${item.productName}</td>
                         <td>${item.quantity}</td>
                       </tr>`;
            }
          }
        }

        html += `</tbody></table>`;
      }

      // Cierro el container del reporte
      html += `</div>`;
      setSalesReportContent(html);

    } catch (error) {
      console.error("Error generando reporte de ventas:", error);
      setSalesReportContent("<div class='text-danger'>Error generando reporte de ventas.</div>");
    }
  }

  // Función para exportar el reporte de ventas a Excel (solo NO canceladas)
  async function exportSalesReportToExcel() {
    if (!reportDate) {
      alert("Seleccione una fecha");
      return;
    }
    try {
      // Cargar ventas filtradas
      const respSales = await fetch(`${BACKEND_URL}/sales?limit=99999&offset=0&order=date:asc`);
      let sales = await respSales.json();
      // Filtrar por fecha
      sales = sales.filter(sale => sale.date.slice(0, 10) === reportDate);
      // Filtrar por cajero si no es "all"
      if (cashierFilter !== "all") {
        sales = sales.filter(sale => String(sale.cashierId) === String(cashierFilter));
      }

      // Quedarnos solo con las NO canceladas
      const activeSales = sales.filter(s => !s.isCancelled);

      // Cargar usuarios
      const respUsers = await fetch(`${BACKEND_URL}/users?limit=99999&offset=0&order=username:asc`);
      const users = await respUsers.json();
      // Cargar todas las marcas
      const respBrands = await fetch(`${BACKEND_URL}/brands?limit=99999&offset=0&order=name:asc`);
      const brands = await respBrands.json();
      const brandMap = {};
      brands.forEach(b => {
        brandMap[b.id] = b.name;
      });

      const productCache = {};
      const ventasData = [];
      ventasData.push(["Ticket", "Hora", "Cajero", "Marca", "Nombre del Producto", "Cantidad"]);

      for (const sale of activeSales) {
        const cashier = users.find(u => String(u.id) === String(sale.cashierId));
        const cashierName = cashier ? cashier.username : "Desconocido";

        if (sale.items && sale.items.length > 0) {
          for (const item of sale.items) {
            const prod = await getProductDetail(item.productId, productCache);
            const brandName = prod && prod.brandId ? (brandMap[prod.brandId] || "N/A") : "N/A";
            ventasData.push([
              sale.id || "(sin ID)",
              new Date(sale.date).toLocaleTimeString(),
              cashierName,
              brandName,
              item.productName,
              item.quantity
            ]);
          }
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(ventasData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "VentasActivas");
      const filename = `ReporteVentas_${reportDate}_${cashierFilter === "all" ? "Todos" : cashierFilter}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exportando reporte de ventas a Excel:", error);
      alert("No se pudo exportar el reporte de ventas a Excel.");
    }
  }

  // Función para generar el reporte de stock
  async function generateStockReport() {
    try {
      const respProds = await fetch(`${BACKEND_URL}/products?limit=99999&offset=0&order=name:asc`);
      const products = await respProds.json();

      // Cargar todas las marcas y categorías para el reporte de stock
      const respBrands = await fetch(`${BACKEND_URL}/brands?limit=99999&offset=0&order=name:asc`);
      const brands = await respBrands.json();
      const brandMap = {};
      brands.forEach(b => {
        brandMap[b.id] = b.name;
      });

      const respCategories = await fetch(`${BACKEND_URL}/categories?limit=99999&offset=0&order=name:asc`);
      const categories = await respCategories.json();
      const categoryMap = {};
      categories.forEach(c => {
        categoryMap[c.id] = c.name;
      });

      let html = `<div class="report-section" style="padding:1rem; border:1px solid #ccc; border-radius:8px;">
                 <h4>Reporte de Stock</h4>
                 <table class="table table-bordered" style="width:100%;">
                   <thead>
                     <tr>
                       <th>Nombre del Producto</th>
                       <th>Descripción</th>
                       <th>Precio</th>
                       <th>Categoría</th>
                       <th>Marca</th>
                       <th>Código de Barras</th>
                       <th>Stock</th>
                     </tr>
                   </thead>
                   <tbody>`;
      products.forEach(prod => {
        const categoryName = prod.categoryId ? (categoryMap[prod.categoryId] || "N/A") : "N/A";
        const brandName = prod.brandId ? (brandMap[prod.brandId] || "N/A") : "N/A";
        html += `<tr>
                   <td>${prod.name}</td>
                   <td>${prod.description || ""}</td>
                   <td>${prod.price !== undefined ? prod.price : ""}</td>
                   <td>${categoryName}</td>
                   <td>${brandName}</td>
                   <td>${prod.barcode || ""}</td>
                   <td>${prod.stock !== undefined ? prod.stock : ""}</td>
                 </tr>`;
      });
      html += `</tbody></table></div>`;
      setStockReportContent(html);
    } catch (error) {
      console.error("Error generando reporte de stock:", error);
      setStockReportContent("<div class='text-danger'>Error generando reporte de stock.</div>");
    }
  }

  // Función para exportar el reporte de stock a Excel
  async function exportStockReportToExcel() {
    try {
      const respProds = await fetch(`${BACKEND_URL}/products?limit=99999&offset=0&order=name:asc`);
      const products = await respProds.json();

      // Cargar todas las marcas y categorías
      const respBrands = await fetch(`${BACKEND_URL}/brands?limit=99999&offset=0&order=name:asc`);
      const brands = await respBrands.json();
      const brandMap = {};
      brands.forEach(b => {
        brandMap[b.id] = b.name;
      });

      const respCategories = await fetch(`${BACKEND_URL}/categories?limit=99999&offset=0&order=name:asc`);
      const categories = await respCategories.json();
      const categoryMap = {};
      categories.forEach(c => {
        categoryMap[c.id] = c.name;
      });

      const stockData = [];
      stockData.push(["Nombre del Producto", "Descripción", "Precio", "Categoría", "Marca", "Código de Barras", "Stock"]);
      products.forEach(prod => {
        const categoryName = prod.categoryId ? (categoryMap[prod.categoryId] || "N/A") : "N/A";
        const brandName = prod.brandId ? (brandMap[prod.brandId] || "N/A") : "N/A";
        stockData.push([
          prod.name,
          prod.description || "",
          prod.price !== undefined ? prod.price : "",
          categoryName,
          brandName,
          prod.barcode || "",
          prod.stock !== undefined ? prod.stock : ""
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(stockData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Stock");
      const filename = `ReporteStock_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exportando reporte de stock a Excel:", error);
      alert("No se pudo exportar el reporte de stock a Excel.");
    }
  }

  return (
    <div className="container mt-3">
      <h3><i className="fa-solid fa-chart-line"></i> Reportes</h3>
      <div className="row">
        {/* Sección de Reporte de Ventas */}
        <div className="col-md-6">
          <h4>Reporte de Ventas</h4>
          <div className="mb-3">
            <label>Seleccionar Fecha</label>
            <input
              type="date"
              className="form-control"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Filtrar por Cajero</label>
            <select
              className="form-control"
              value={cashierFilter}
              onChange={e => setCashierFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {cashiers.map(c => (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <button
              className="btn btn-primary btn-custom me-2"
              onClick={generateSalesReport}
            >
              <i className="fa-solid fa-file-alt"></i> Generar Reporte de Ventas
            </button>
            <button
              className="btn btn-secondary btn-custom"
              onClick={exportSalesReportToExcel}
            >
              <i className="fa-solid fa-file-export"></i> Exportar Ventas a Excel
            </button>
          </div>
          {salesReportContent && (
            <div id="salesReportContent" dangerouslySetInnerHTML={{ __html: salesReportContent }}></div>
          )}
        </div>
        {/* Sección de Reporte de Stock */}
        <div className="col-md-6">
          <h4>Reporte de Stock</h4>
          <div className="mb-3">
            <button
              className="btn btn-success btn-custom me-2"
              onClick={generateStockReport}
            >
              <i className="fa-solid fa-boxes-stacked"></i> Generar Reporte de Stock
            </button>
            <button
              className="btn btn-secondary btn-custom"
              onClick={exportStockReportToExcel}
            >
              <i className="fa-solid fa-file-export"></i> Exportar Stock a Excel
            </button>
          </div>
          {stockReportContent && (
            <div id="stockReportContent" dangerouslySetInnerHTML={{ __html: stockReportContent }}></div>
          )}
        </div>
      </div>
    </div>
  );
}
