// src/pages/AdminBrandsPage.js
import React, { useEffect, useState } from 'react';
import { BACKEND_URL, convertToWebp } from '../services/api';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState(null);

  const [editBrand, setEditBrand] = useState(null);

  const BRANDS_LIMIT = 10;

  useEffect(() => {
    loadBrands();
    loadCategories();
  }, [page]);

  const loadBrands = async () => {
    try {
      const offset = page * BRANDS_LIMIT;
      const resp = await fetch(`${BACKEND_URL}/brands?limit=${BRANDS_LIMIT}&offset=${offset}&order=name:asc`);
      const data = await resp.json();
      if (data.length === 0 && page > 0) {
        setPage(page - 1);
        return;
      }
      setBrands(data);
    } catch (error) {
      console.error("Error cargando marcas:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/categories?limit=99999&offset=0&order=name:asc`);
      const data = await resp.json();
      setCategories(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Selecciona una imagen");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target.result;
        const webpData = await convertToWebp(base64);
        await fetch(`${BACKEND_URL}/brands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, categoryId, image: webpData })
        });
        setName('');
        setFile(null);
        setCategoryId('');
        loadBrands();
      } catch (error) {
        console.error("Error creando marca:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta marca?")) return;
    try {
      await fetch(`${BACKEND_URL}/brands/${id}`, { method: 'DELETE' });
      loadBrands();
    } catch (error) {
      console.error("Error eliminando marca:", error);
    }
  };

  const handleEditClick = (brand) => {
    setEditBrand(brand);
  };

  const handleUpdateBrand = async (updatedBrand, newFile) => {
    if (newFile) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const webpData = await convertToWebp(base64);
        await fetch(`${BACKEND_URL}/brands/${updatedBrand.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: updatedBrand.name,
            categoryId: updatedBrand.categoryId,
            image: webpData
          })
        });
        setEditBrand(null);
        loadBrands();
      };
      reader.readAsDataURL(newFile);
    } else {
      await fetch(`${BACKEND_URL}/brands/${updatedBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedBrand.name,
          categoryId: updatedBrand.categoryId
        })
      });
      setEditBrand(null);
      loadBrands();
    }
  };

  return (
    <div>
      <h3><i className="fa-solid fa-tag"></i> Gestión de Marcas</h3>
      <form onSubmit={handleAddBrand} className="mb-4">
        <div className="form-group">
          <label>Nombre de la Marca</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Categoría</label>
          <select
            className="form-control"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Imagen de la Marca</label>
          <input
            type="file"
            accept="image/*"
            className="form-control-file"
            onChange={e => setFile(e.target.files[0])}
            required
          />
        </div>
        <button type="submit" className="btn btn-success btn-custom">Agregar Marca</button>
      </form>
      <h4>Marcas</h4>
      <div className="row">
        {brands.map(b => {
          const cat = categories.find(c => c.id === b.categoryId);
          return (
            <div key={b.id} className="col-md-3">
              <div className="card brand-card">
                <img src={b.image} className="card-img-top" alt={b.name} />
                <div className="card-body text-center">
                  <h5 className="card-title">{b.name}</h5>
                  <p><small>Categoría: {cat ? cat.name : 'Sin categoría'}</small></p>
                  <button className="btn btn-sm btn-primary" onClick={() => handleEditClick(b)}>
                    <i className="bi bi-pencil-square"></i> Editar
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id)}>
                    <i className="fa-solid fa-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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

      {editBrand && (
        <EditBrandModal
          brand={editBrand}
          categories={categories}
          onClose={() => setEditBrand(null)}
          onUpdate={handleUpdateBrand}
        />
      )}
    </div>
  );
}

function EditBrandModal({ brand, categories, onClose, onUpdate }) {
  const [name, setName] = useState(brand.name);
  const [categoryId, setCategoryId] = useState(brand.categoryId);
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updated = { ...brand, name, categoryId };
    await onUpdate(updated, file);
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content custom-modal">
          <div className="modal-header">
            <h5 className="modal-title">Editar Marca</h5>
            <button className="close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la Marca</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  className="form-control"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Imagen de la Marca</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control-file"
                  onChange={e => setFile(e.target.files[0])}
                />
              </div>
              {brand.image && (
                <div className="text-center mb-2">
                  <img
                    src={brand.image}
                    alt={brand.name}
                    style={{ width: 100, height: 100, objectFit: 'cover' }}
                  />
                </div>
              )}
              <button type="submit" className="btn btn-success btn-custom">
                Actualizar
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-custom"
                onClick={onClose}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
