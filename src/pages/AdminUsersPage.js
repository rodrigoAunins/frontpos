// src/pages/AdminUsersPage.js
import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');

  const USERS_LIMIT = 10;

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      const offset = page * USERS_LIMIT;
      const resp = await fetch(`${BACKEND_URL}/users?limit=${USERS_LIMIT}&offset=${offset}&order=username:asc`);
      const data = await resp.json();
      if (data.length === 0 && page > 0) {
        setPage(page - 1);
        return;
      }
      setUsers(data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${BACKEND_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      setUsername('');
      setPassword('');
      setRole('admin');
      loadUsers();
    } catch (error) {
      console.error("Error creando usuario:", error);
      alert("Error creando usuario.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este usuario?")) return;
    try {
      await fetch(`${BACKEND_URL}/users/${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      alert("No se pudo eliminar el usuario.");
    }
  };

  return (
    <div>
      <h3><i className="fa-solid fa-users"></i> Gestión de Usuarios</h3>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="form-group">
          <label>Usuario</label>
          <input
            type="text"
            className="form-control"
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
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Rol</label>
          <select
            className="form-control"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="cashier">Cajero</option>
          </select>
        </div>
        <button className="btn btn-success btn-custom">Agregar Usuario</button>
      </form>

      <h4>Usuarios existentes</h4>
      <table className="table table-bordered">
        <thead>
          <tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                  <i className="fa-solid fa-trash"></i> Borrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="d-flex justify-content-between">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(Math.max(page-1, 0))}
        >
          Anterior
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(page+1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
