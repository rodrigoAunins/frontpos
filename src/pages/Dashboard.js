// src/pages/Dashboard.js
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Admin pages
import AdminUsersPage from './AdminUsersPage';
import AdminCategoriesPage from './AdminCategoriesPage';
import AdminBrandsPage from './AdminBrandsPage';
import AdminProductsPage from './AdminProductsPage';
import AdminReportsPage from './AdminReportsPage';
import AdminExcelUploadPage from './AdminExcelUploadPage';

// Cashier pages
import CashierCajaPage from './CashierCajaPage';
import CashierVentasPage from './CashierVentasPage';

export default function Dashboard({
  currentUser,
  currentSession,
  setCurrentSession,
  onLogout
}) {
  const navigate = useNavigate();

  if (!currentUser) {
    // Si no hay usuario, volver a login
    navigate('/');
  }

  return (
    <div id="dashboard">
      <Navbar
        currentUser={currentUser}
        currentSession={currentSession}
        setCurrentSession={setCurrentSession}
        onLogout={onLogout}
      />
      <div className="container mt-4" id="contentArea">
        <Routes>
          {/* Admin */}
          {currentUser?.role === 'admin' && (
            <>
              <Route path="/" element={<AdminUsersPage />} />
              <Route path="/usuarios" element={<AdminUsersPage />} />
              <Route path="/categorias" element={<AdminCategoriesPage />} />
              <Route path="/marcas" element={<AdminBrandsPage />} />
              <Route path="/productos" element={<AdminProductsPage />} />
              <Route path="/admin-excel" element={<AdminExcelUploadPage />} />
              <Route path="/reportes" element={<AdminReportsPage />} />
            </>
          )}

          {/* Cashier */}
          {currentUser?.role === 'cashier' && (
            <>
              <Route path="/" element={<CashierCajaPage currentUser={currentUser} currentSession={currentSession} setCurrentSession={setCurrentSession}/>} />
              <Route path="/caja" element={<CashierCajaPage currentUser={currentUser} currentSession={currentSession} setCurrentSession={setCurrentSession}/>} />
              <Route path="/ventas" element={<CashierVentasPage currentUser={currentUser} currentSession={currentSession} />} />
            </>
          )}

          <Route path="*" element={<p>Página no encontrada</p>} />
        </Routes>
      </div>
    </div>
  );
}
