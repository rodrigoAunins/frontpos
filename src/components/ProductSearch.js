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

  // Función para generar el reporte de ventas
  async function generateSalesReport() {
    if (!reportDate) {
      alert("Seleccione una fecha");
      return;
    }
    try {
      // Cargar ventas
      const respSales = await fetch(`${BACKEND_URL}/sales?limit=99999&offset=0&order=date:asc`);
      let sales = await respSales.json();
      sales = sales.filter(sale => sale.date.slice(0, 10) === reportDate);
      if (cashierFilter !== "all") {
        sales = sales.filter(sale => sale.cashierId === cashierFilter);
      }
      // Cargar usuarios para obtener el nombre del cajero
      const respUsers = await fetch(`${BACKEND_URL}/users?limit=99999&offset=0&order=username:asc`);
      const users = await respUsers.json();

      // Cache para detalles de productos
      const productCache = {};
      async function getProductDetail(productId) {
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

      let totalDaySales = 0;
      let totalStockUsed = 0;
      let html = `<div class="report-section" style="padding:1rem; border:1px solid #ccc; border-radius:8px; margin-bottom:1rem;">
                    <h4>Reporte de Ventas ${cashierFilter === "all" ? "Totales" : "del Cajero"}</h4>`;
      if (sales.length === 0) {
        html += `<p>No hay ventas en esta fecha.</p>`;
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
        for (const sale of sales) {
          totalDaySales += sale.total || 0;
          const cashier = users.find(u => u.id === sale.cashierId);
          if (sale.items) {
            for (const item of sale.items) {
              totalStockUsed += item.quantity;
              const prod = await getProductDetail(item.productId);
              const brand = prod && prod.brand ? prod.brand : "N/A";
              html += `<tr>
                         <td>${sale.id || "(sin ID)"}</td>
                         <td>${new Date(sale.date).toLocaleTimeString()}</td>
                         <td>${cashier ? cashier.username : 'Desconocido'}</td>
                         <td>${brand}</td>
                         <td>${item.productName}</td>
                         <td>${item.quantity}</td>
                       </tr>`;
            }
          }
        }
        html += `</tbody></table>`;
        html += `<p><strong>Total del Día:</strong> $${totalDaySales.toFixed(2)}</p>`;
        html += `<p><strong>Total de Stock Consumido:</strong> ${totalStockUsed} unidades</p>`;
      }
      html += `</div>`;
      setSalesReportContent(html);
    } catch (error) {
      console.error("Error generando reporte de ventas:", error);
      setSalesReportContent("<div class='text-danger'>Error generando reporte de ventas.</div>");
    }
  }

  // Función para generar el reporte de stock
  async function generateStockReport() {
    try {
      const respProds = await fetch(`${BACKEND_URL}/products?limit=99999&offset=0&order=name:asc`);
      const products = await respProds.json();
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
        html += `<tr>
                   <td>${prod.name}</td>
                   <td>${prod.description || ""}</td>
                   <td>${prod.price !== undefined ? prod.price : ""}</td>
                   <td>${prod.category || ""}</td>
                   <td>${prod.brand || ""}</td>
                   <td>${prod.barcode || ""}</td>
                   <td>${prod.stock}</td>
                 </tr>`;
      });
      html += `</tbody></table></div>`;
      setStockReportContent(html);
    } catch (error) {
      console.error("Error generando reporte de stock:", error);
      setStockReportContent("<div class='text-danger'>Error generando reporte de stock.</div>");
    }
  }

  // Función para exportar el reporte de ventas a Excel
  async function exportSalesReportToExcel() {
    try {
      const respSales = await fetch(`${BACKEND_URL}/sales?limit=99999&offset=0&order=date:asc`);
      let sales = await respSales.json();
      sales = sales.filter(sale => sale.date.slice(0, 10) === reportDate);
      if (cashierFilter !== "all") {
        sales = sales.filter(sale => sale.cashierId === cashierFilter);
      }
      const respUsers = await fetch(`${BACKEND_URL}/users?limit=99999&offset=0&order=username:asc`);
      const users = await respUsers.json();

      // Cache para detalles de productos en la exportación
      const productCache = {};
      async function getProductDetail(productId) {
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

      const ventasData = [];
      ventasData.push(["Ticket", "Hora", "Cajero", "Marca", "Nombre del Producto", "Cantidad"]);
      for (const sale of sales) {
        const cashier = users.find(u => u.id === sale.cashierId);
        if (sale.items) {
          for (const item of sale.items) {
            const prod = await getProductDetail(item.productId);
            const brand = prod && prod.brand ? prod.brand : "N/A";
            ventasData.push([
              sale.id || "(sin ID)",
              new Date(sale.date).toLocaleTimeString(),
              cashier ? cashier.username : "Desconocido",
              brand,
              item.productName,
              item.quantity
            ]);
          }
        }
      }
      const ws = XLSX.utils.aoa_to_sheet(ventasData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas");
      const filename = `ReporteVentas_${reportDate}_${cashierFilter === "all" ? "Todos" : cashierFilter}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exportando reporte de ventas a Excel:", error);
      alert("No se pudo exportar el reporte de ventas a Excel.");
    }
  }

  return (
    <div className="container mt-3">
      <h3><i className="fa-solid fa-chart-line"></i> Reportes</h3>
      <div className="row mb-3">
        <div className="col-md-4">
          <label>Seleccionar Fecha</label>
          <input
            type="date"
            className="form-control"
            value={reportDate}
            onChange={e => setReportDate(e.target.value)}
          />
        </div>
        <div className="col-md-4">
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
      </div>
      <div className="mb-3">
        <button
          className="btn btn-primary btn-custom me-2"
          onClick={generateSalesReport}
        >
          <i className="fa-solid fa-file-alt"></i> Generar Reporte de Ventas
        </button>
        <button
          className="btn btn-secondary btn-custom me-2"
          onClick={exportSalesReportToExcel}
        >
          <i className="fa-solid fa-file-export"></i> Exportar Ventas a Excel
        </button>
        <button
          className="btn btn-success btn-custom"
          onClick={generateStockReport}
        >
          <i className="fa-solid fa-boxes-stacked"></i> Generar Reporte de Stock
        </button>
      </div>
      {salesReportContent && (
        <div id="salesReportContent" dangerouslySetInnerHTML={{ __html: salesReportContent }}></div>
      )}
      {stockReportContent && (
        <div id="stockReportContent" dangerouslySetInnerHTML={{ __html: stockReportContent }}></div>
      )}
    </div>
  );
}
