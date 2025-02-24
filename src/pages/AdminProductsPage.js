// src/pages/AdminProductsPage.js
import React, { useEffect, useState } from 'react';
import { BACKEND_URL, convertToWebp } from '../services/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [page, setPage] = useState(0);
  const PRODUCTS_LIMIT = 10;

  // Para crear un producto nuevo
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newStock, setNewStock] = useState(0);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newVariants, setNewVariants] = useState('');

  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    await loadProducts();
    await loadCategories();
    await loadBrands();
  };

  const loadProducts = async () => {
    try {
      const offset = page * PRODUCTS_LIMIT;
      const resp = await fetch(`${BACKEND_URL}/products?limit=${PRODUCTS_LIMIT}&offset=${offset}&order=name:asc`);
      const data = await resp.json();
      if (data.length === 0 && page > 0) {
        setPage(page - 1);
        return;
      }
      setProducts(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
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

  const loadBrands = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/brands?limit=99999&offset=0&order=name:asc`);
      const data = await resp.json();
      setBrands(data);
    } catch (error) {
      console.error("Error cargando marcas:", error);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newImageFile) {
      alert("Selecciona una imagen para el producto.");
      return;
    }
    const variantsArray = [];
    if (newVariants.trim()) {
      const lines = newVariants.split('\n');
      for (let line of lines) {
        const [color, variantStock] = line.split('|');
        variantsArray.push({ color: color?.trim(), stock: parseInt(variantStock || '0') });
      }
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const webpData = await convertToWebp(base64);
        await fetch(`${BACKEND_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            description: newDescription,
            price: parseFloat(newPrice),
            stock: parseInt(newStock),
            categoryId: newCategoryId,
            brandId: newBrandId,
            barcode: newBarcode,
            image: webpData,
            variants: variantsArray
          })
        });
        // Limpia campos
        setNewName('');
        setNewDescription('');
        setNewPrice(0);
        setNewStock(0);
        setNewCategoryId('');
        setNewBrandId('');
        setNewBarcode('');
        setNewImageFile(null);
        setNewVariants('');
        setPage(0);
        loadProducts();
      } catch (error) {
        console.error("Error creando producto:", error);
      }
    };
    reader.readAsDataURL(newImageFile);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este producto?")) return;
    try {
      await fetch(`${BACKEND_URL}/products/${id}`, { method: 'DELETE' });
      loadProducts();
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  };

  const handleEditClick = (prod) => {
    setEditProduct(prod);
  };

  const handleUpdateProduct = async (updatedProd, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const webpData = await convertToWebp(base64);
        await fetch(`${BACKEND_URL}/products/${updatedProd.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProdWithImage(updatedProd, webpData))
        });
        setEditProduct(null);
        loadProducts();
      };
      reader.readAsDataURL(file);
    } else {
      await fetch(`${BACKEND_URL}/products/${updatedProd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProd)
      });
      setEditProduct(null);
      loadProducts();
    }
  };

  const updatedProdWithImage = (p, webpData) => {
    return {
      ...p,
      image: webpData
    };
  };

  return (
    <div>
      <h3><i className="fa-solid fa-boxes-stacked"></i> Gestión de Productos</h3>

      {/* Form Crear Producto */}
      <form onSubmit={handleCreateProduct} className="mb-4">
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input
            type="text"
            className="form-control"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <textarea
            className="form-control"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group col-md-3">
            <label>Precio</label>
            <input
              type="number"
              className="form-control"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              required
            />
          </div>
          <div className="form-group col-md-3">
            <label>Stock (sin variantes)</label>
            <input
              type="number"
              className="form-control"
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              required
            />
          </div>
          <div className="form-group col-md-3">
            <label>Categoría</label>
            <select
              className="form-control"
              value={newCategoryId}
              onChange={e => setNewCategoryId(e.target.value)}
              required
            >
              <option value="">Elige...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group col-md-3">
            <label>Marca</label>
            <select
              className="form-control"
              value={newBrandId}
              onChange={e => setNewBrandId(e.target.value)}
              required
            >
              <option value="">Elige...</option>
              {brands.filter(b => b.categoryId === newCategoryId).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group col-md-6">
            <label>Código de Barras</label>
            <input
              type="text"
              className="form-control"
              value={newBarcode}
              onChange={e => setNewBarcode(e.target.value)}
            />
          </div>
          <div className="form-group col-md-6">
            <label>Imagen del Producto</label>
            <input
              type="file"
              accept="image/*"
              className="form-control-file"
              onChange={e => setNewImageFile(e.target.files[0])}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Variantes (Color|Stock, uno por línea)</label>
          <textarea
            className="form-control"
            placeholder="Ej: Rojo|10&#10;Verde|20"
            value={newVariants}
            onChange={e => setNewVariants(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-success btn-custom">
          Agregar Producto
        </button>
      </form>

      <h4>Productos</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Marca</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Variantes</th>
            <th>Código de Barras</th>
            <th>Imagen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map(prod => {
            const cat = categories.find(c => c.id === prod.categoryId);
            const br = brands.find(b => b.id === prod.brandId);
            const variantsText = prod.variants?.map(v => `${v.color}(${v.stock})`).join(', ') || '';
            return (
              <tr key={prod.id}>
                <td>{prod.id}</td>
                <td>{prod.name}</td>
                <td>{cat ? cat.name : ''}</td>
                <td>{br ? br.name : ''}</td>
                <td>${prod.price}</td>
                <td>{prod.stock}</td>
                <td>{variantsText}</td>
                <td>{prod.barcode || ''}</td>
                <td>
                  {prod.image && (
                    <img
                      src={prod.image}
                      alt={prod.name}
                      style={{ width: 50, height: 50, objectFit: 'cover' }}
                    />
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEditClick(prod)}
                  >
                    <i className="fa-solid fa-edit"></i> Editar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(prod.id)}
                  >
                    <i className="fa-solid fa-trash"></i> Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
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

      {editProduct && (
        <EditProductModal
          product={editProduct}
          categories={categories}
          brands={brands}
          onClose={() => setEditProduct(null)}
          onUpdate={handleUpdateProduct}
        />
      )}
    </div>
  );
}

function EditProductModal({ product, categories, brands, onClose, onUpdate }) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || '');
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [brandId, setBrandId] = useState(product.brandId);
  const [barcode, setBarcode] = useState(product.barcode || '');
  const [file, setFile] = useState(null);
  const [variantsText, setVariantsText] = useState(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.map(v => `${v.color}|${v.stock}`).join('\n');
    }
    return '';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let variants = [];
    if (variantsText.trim()) {
      const lines = variantsText.split('\n');
      for (let line of lines) {
        const [color, st] = line.split('|');
        variants.push({
          color: color?.trim() || '',
          stock: parseInt(st || '0')
        });
      }
    }
    const updated = {
      ...product,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      categoryId,
      brandId,
      barcode,
      variants
    };
    await onUpdate(updated, file);
  };

  return (
    <div className="modal" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content custom-modal">
          <div className="modal-header">
            <h5 className="modal-title">Editar Producto</h5>
            <button className="close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group col-md-6">
                  <label>Precio</label>
                  <input
                    type="number"
                    className="form-control"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group col-md-3">
                  <label>Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group col-md-3">
                  <label>Categoría</label>
                  <select
                    className="form-control"
                    value={categoryId}
                    onChange={e => {
                      setCategoryId(e.target.value);
                      setBrandId('');
                    }}
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group col-md-3">
                  <label>Marca</label>
                  <select
                    className="form-control"
                    value={brandId}
                    onChange={e => setBrandId(e.target.value)}
                    required
                  >
                    {brands
                      .filter(b => b.categoryId === categoryId)
                      .map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                  </select>
                </div>
                <div className="form-group col-md-3">
                  <label>Código de barras</label>
                  <input
                    type="text"
                    className="form-control"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Variantes (Color|Stock, uno por línea)</label>
                <textarea
                  className="form-control"
                  value={variantsText}
                  onChange={e => setVariantsText(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control-file"
                  onChange={e => setFile(e.target.files[0])}
                />
              </div>
              {product.image && (
                <div id="currentProductImage" className="text-center mb-2">
                  <img
                    src={product.image}
                    alt={product.name}
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
