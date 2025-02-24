// src/pages/AdminCategoriesPage.js
import React, { useEffect, useState } from 'react';
import { BACKEND_URL, convertToWebp } from '../services/api';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);

  const [editCategory, setEditCategory] = useState(null);

  const CATEGORIES_LIMIT = 10;

  useEffect(() => {
    loadCategories();
  }, [page]);

  const loadCategories = async () => {
    try {
      const offset = page * CATEGORIES_LIMIT;
      const resp = await fetch(`${BACKEND_URL}/categories?limit=${CATEGORIES_LIMIT}&offset=${offset}&order=name:asc`);
      const data = await resp.json();
      if (data.length === 0 && page > 0) {
        setPage(page - 1);
        return;
      }
      setCategories(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const handleAddCategory = async (e) => {
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
        await fetch(`${BACKEND_URL}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, image: webpData })
        });
        setName('');
        setFile(null);
        loadCategories();
      } catch (error) {
        console.error("Error creando categoría:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta categoría?")) return;
    try {
      await fetch(`${BACKEND_URL}/categories/${id}`, { method: 'DELETE' });
      loadCategories();
    } catch (error) {
      console.error("Error eliminando categoría:", error);
    }
  };

  const handleEditClick = (cat) => {
    setEditCategory(cat);
  };

  const handleUpdateCategory = async (updatedCat, newFile) => {
    if (newFile) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const webpData = await convertToWebp(base64);
        await fetch(`${BACKEND_URL}/categories/${updatedCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: updatedCat.name, image: webpData })
        });
        setEditCategory(null);
        loadCategories();
      };
      reader.readAsDataURL(newFile);
    } else {
      // Solo nombre
      await fetch(`${BACKEND_URL}/categories/${updatedCat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updatedCat.name })
      });
      setEditCategory(null);
      loadCategories();
    }
  };

  return (
    <div>
      <h3><i className="fa-solid fa-tags"></i> Gestión de Categorías</h3>
      <form onSubmit={handleAddCategory} className="mb-4" id="categoryForm">
        <div className="form-group">
          <label>Nombre de Categoría</label>
          <input
            type="text"
            id="categoryName"
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Imagen de Categoría</label>
          <input
            type="file"
            id="categoryImage"
            accept="image/*"
            className="form-control-file"
            onChange={e => setFile(e.target.files[0])}
            required
          />
        </div>
        <button type="submit" className="btn btn-success btn-custom">
          Agregar Categoría
        </button>
      </form>
      <h4>Categorías</h4>
      <div className="row">
        {categories.map(cat => (
          <div key={cat.id} className="col-md-3">
            <div className="card category-card">
              <img src={cat.image} className="card-img-top" alt={cat.name} />
              <div className="card-body text-center">
                <h5 className="card-title">{cat.name}</h5>
                <button className="btn btn-sm btn-primary" onClick={() => handleEditClick(cat)}>
                  <i className="bi bi-pencil-square"></i> Editar
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id)}>
                  <i className="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
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

      {/* Modal de edición */}
      {editCategory && (
        <EditCategoryModal
          category={editCategory}
          onClose={() => setEditCategory(null)}
          onUpdate={handleUpdateCategory}
        />
      )}
    </div>
  );
}

function EditCategoryModal({ category, onClose, onUpdate }) {
  const [name, setName] = useState(category.name);
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedCat = { ...category, name };
    await onUpdate(updatedCat, file);
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content custom-modal">
          <div className="modal-header">
            <h5 className="modal-title">Editar Categoría</h5>
            <button className="close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Imagen de la Categoría</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control-file"
                  onChange={e => setFile(e.target.files[0])}
                />
              </div>
              {category.image && (
                <div className="text-center mb-2">
                  <img
                    src={category.image}
                    alt={category.name}
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
