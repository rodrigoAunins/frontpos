import React, { useState } from 'react';
import { BACKEND_URL } from '../services/api';

export default function AdminExcelUploadPage() {
  const [file, setFile] = useState(null);
  const [mapping, setMapping] = useState({
    nombreProducto: 'Nombre del Producto',
    descripcion: 'Descripción',
    precio: 'Precio',
    categoria: 'Categoría',
    marca: 'Marca',
    codigoBarras: 'Código de Barras'
  });
  const [summary, setSummary] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleMappingChange = (field, value) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Selecciona un archivo Excel');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    // Agregamos cada campo del mapping al formData
    Object.keys(mapping).forEach(key => {
      formData.append(key, mapping[key]);
    });
    try {
      const res = await fetch(`${BACKEND_URL}/admin/excel-import`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error(error);
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mt-3">
      <h3>Importar Excel de Productos</h3>
      <div className="card p-3">
        <div className="form-group">
          <label>Selecciona el archivo Excel</label>
          <input 
            type="file" 
            accept=".xls,.xlsx" 
            className="form-control-file" 
            onChange={handleFileChange} 
          />
        </div>
        <h5>Mapeo de columnas</h5>
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input 
            type="text" 
            className="form-control" 
            value={mapping.nombreProducto} 
            onChange={(e) => handleMappingChange('nombreProducto', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <input 
            type="text" 
            className="form-control" 
            value={mapping.descripcion} 
            onChange={(e) => handleMappingChange('descripcion', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label>Precio</label>
          <input 
            type="text" 
            className="form-control" 
            value={mapping.precio} 
            onChange={(e) => handleMappingChange('precio', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label>Categoría</label>
          <input 
            type="text" 
            className="form-control" 
            value={mapping.categoria} 
            onChange={(e) => handleMappingChange('categoria', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label>Marca</label>
          <input 
            type="text" 
            className="form-control" 
            value={mapping.marca} 
            onChange={(e) => handleMappingChange('marca', e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label>Código de Barras</label>
          <input 
            type="text" 
            className="form-control" 
            value={mapping.codigoBarras} 
            onChange={(e) => handleMappingChange('codigoBarras', e.target.value)} 
          />
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleUpload} 
          disabled={uploading}
        >
          {uploading ? 'Subiendo...' : 'Subir Excel'}
        </button>
      </div>
      {summary && (
        <div className="alert alert-info mt-3">
          <h5>Resumen de Importación</h5>
          <p>Filas procesadas: {summary.rowsProcessed}</p>
          <p>Categorías creadas: {summary.categoriesCreated}</p>
          <p>Marcas creadas: {summary.brandsCreated}</p>
          <p>Productos creados: {summary.productsCreated}</p>
          <p>Productos actualizados: {summary.productsUpdated}</p>
        </div>
      )}
    </div>
  );
}
