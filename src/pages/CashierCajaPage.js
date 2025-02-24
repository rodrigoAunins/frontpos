// src/pages/CashierCajaPage.js
import React, { useEffect, useState } from 'react';
import { storeSessionToLocalStorage } from '../services/api';

export default function CashierCajaPage({ currentUser, currentSession, setCurrentSession }) {
  const [initialAmount, setInitialAmount] = useState('');

  useEffect(() => {
    // if currentSession, fill UI
  }, [currentSession]);

  const openCaja = () => {
    const amt = parseFloat(initialAmount);
    if (isNaN(amt)) {
      alert("Ingrese un monto válido");
      return;
    }
    const sessionObj = {
      id: Date.now().toString(),
      cashierId: currentUser.id,
      startTime: new Date().toISOString(),
      initialAmount: amt
    };
    setCurrentSession(sessionObj);
    storeSessionToLocalStorage(currentUser, sessionObj);
    alert("Caja abierta. Ahora puedes ir a 'Ventas'.");
  };

  const closeCaja = () => {
    // Lógica de cerrar caja
    alert("Caja cerrada. (No se calculan ventas en este ejemplo).");
    setCurrentSession(null);
    storeSessionToLocalStorage(currentUser, null);
  };

  return (
    <div>
      <h3><i className="fa-solid fa-cash-register"></i> Gestión de Caja</h3>
      {!currentSession && (
        <div>
          <div className="form-group">
            <label>Monto Inicial</label>
            <input
              type="number"
              className="form-control"
              placeholder="Ingrese monto inicial"
              value={initialAmount}
              onChange={e=>setInitialAmount(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openCaja}>
            <i className="fa-solid fa-door-open"></i> Abrir Caja
          </button>
        </div>
      )}
      {currentSession && (
        <div>
          <p>Caja abierta desde: {new Date(currentSession.startTime).toLocaleString()}</p>
          <p>Monto Inicial: ${currentSession.initialAmount}</p>
          <button className="btn btn-danger" onClick={closeCaja}>
            <i className="fa-solid fa-door-closed"></i> Cerrar Caja
          </button>
        </div>
      )}
    </div>
  );
}
