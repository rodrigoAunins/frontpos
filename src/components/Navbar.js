// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storeSessionToLocalStorage } from '../services/api';

export default function Navbar({ currentUser, currentSession, setCurrentSession, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Si es cajero y tiene caja abierta
    if (currentUser?.role === "cashier" && currentSession) {
      alert("Debe cerrar la caja antes de salir.");
      return;
    }
    onLogout();
    storeSessionToLocalStorage(null, null);
    navigate('/');
  };

  const handleCameraClick = () => {
    alert("Función de escaneo con cámara en React: implementa un componente con html5-qrcode.");
  };

  return (
    <nav className="navbar navbar-expand-lg">
      <Link className="navbar-brand" to="/dashboard">
        <i className="fa-solid fa-makeup-brush"></i> Maquillaje POS
      </Link>
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
        <span className="navbar-toggler-icon">
          <i className="fa-solid fa-bars"></i>
        </span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav mr-auto">
          {currentUser?.role === 'admin' && (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/usuarios">
                  <i className="fa-solid fa-users"></i> Usuarios
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/categorias">
                  <i className="fa-solid fa-tags"></i> Categorías
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/marcas">
                  <i className="fa-solid fa-tag"></i> Marcas
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/productos">
                  <i className="fa-solid fa-boxes-stacked"></i> Productos
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/reportes">
                  <i className="fa-solid fa-chart-line"></i> Reportes
                </Link>
              </li>
            </>
          )}
          {currentUser?.role === 'cashier' && (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/caja">
                  <i className="fa-solid fa-cash-register"></i> Caja
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard/ventas">
                  <i className="fa-solid fa-shopping-cart"></i> Ventas
                </Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-sm btn-info ml-2" onClick={handleCameraClick}>
                  <i className="fa-solid fa-camera"></i> Leer con Cámara
                </button>
              </li>
            </>
          )}
        </ul>
        <span className="navbar-text" id="currentUser">
          {currentUser?.username} ({currentUser?.role})
        </span>
        <button className="btn btn-outline-light ml-2 btn-custom" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
