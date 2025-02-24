// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, storeSessionToLocalStorage } from '../services/api';

export default function LoginPage({ currentUser, onLogin, setCurrentSession }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Si ya hay usuario logueado
  if (currentUser) {
    navigate('/dashboard');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const allUsers = await fetchAllUsers();
      const user = allUsers.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
        storeSessionToLocalStorage(user, null);
        // Redirigir
        navigate('/dashboard');
      } else {
        alert("Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Error al hacer login:", error);
      alert("No se pudo iniciar sesión");
    }
  };

  return (
    <div id="loginPage" className="container">
      <h2 className="text-center mb-4"><i className="fa-solid fa-sign-in-alt"></i> Ingresar</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Usuario</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ingrese usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            placeholder="Ingrese contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block btn-custom">
          Ingresar
        </button>
      </form>
    </div>
  );
}
