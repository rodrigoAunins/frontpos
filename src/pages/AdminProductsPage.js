import React, { useState, useEffect } from 'react';
import { BACKEND_URL, convertToWebp } from '../services/api';

export default function AdminProductsPage() {
  // Estado del formulario de creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newStock, setNewStock] = useState(0);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);

  // Manejo de variantes
  const [useVariants, setUseVariants] = useState(false);
  const [newVariantsText, setNewVariantsText] = useState('');

  // Modal de edición
  const [editProduct, setEditProduct] = useState(null);

  // “Reload Key” para forzar recarga del ProductSearch tras crear/editar/borrar
  const [reloadKey, setReloadKey] = useState(0);

  // Campos de categorías y marcas (para el formulario)
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Al montar, cargamos las categorías y marcas (para el formulario).
  useEffect(() => {
    loadCategoriesAndBrands();
  }, []);

  async function loadCategoriesAndBrands() {
    try {
      // Cargamos categorías
      const respC = await fetch(`${BACKEND_URL}/categories?limit=99999&offset=0&order=name:asc`);
      const dataC = await respC.json();
      setCategories(dataC);

      // Cargamos marcas
      const respB = await fetch(`${BACKEND_URL}/brands?limit=99999&offset=0&order=name:asc`);
      const dataB = await respB.json();
      setBrands(dataB);
    } catch (err) {
      console.error("Error al cargar categorías/marcas:", err);
    }
  }

  // ------------------- CREAR PRODUCTO -------------------
  async function handleCreateProduct(e) {
    e.preventDefault();
    if (!newImageFile) {
      alert("Seleccione una imagen para el producto.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const webpData = await convertToWebp(base64);

        const bodyData = {
          name: newName,
          description: newDescription,
          price: parseFloat(newPrice),
          categoryId: newCategoryId,
          brandId: newBrandId,
          barcode: newBarcode,
          image: webpData,
        };

        // Manejo de variantes
        let variantsArray = [];
        if (useVariants && newVariantsText.trim()) {
          const lines = newVariantsText.split('\n');
          for (let line of lines) {
            const [color, variantStock] = line.split('|');
            variantsArray.push({
              color: color?.trim() || '',
              stock: parseInt(variantStock || '0'),
            });
          }
        }
        if (useVariants && variantsArray.length > 0) {
          bodyData.variants = variantsArray;
        } else {
          bodyData.stock = parseInt(newStock);
        }

        const resp = await fetch(`${BACKEND_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });
        if (!resp.ok) {
          alert("Error al crear producto");
          return;
        }

        // Limpia form
        setNewName('');
        setNewDescription('');
        setNewPrice(0);
        setNewStock(0);
        setNewCategoryId('');
        setNewBrandId('');
        setNewBarcode('');
        setNewImageFile(null);
        setUseVariants(false);
        setNewVariantsText('');
        setShowCreateForm(false);

        // Forzamos recarga del ProductSearch
        setReloadKey(prev => prev + 1);
      } catch (error) {
        console.error("Error al crear producto =>", error);
      }
    };
    reader.readAsDataURL(newImageFile);
  }

  // ------------------- EDITAR PRODUCTO (MODAL) -------------------
  async function handleUpdateProduct(updated, file) {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const webpData = await convertToWebp(base64);
        updated.image = webpData;
        await doUpdate(updated);
      };
      reader.readAsDataURL(file);
    } else {
      await doUpdate(updated);
    }
  }
  async function doUpdate(updated) {
    await fetch(`${BACKEND_URL}/products/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setEditProduct(null);
    setReloadKey(prev => prev + 1); // recarga ProductSearch
  }

  // ------------------- ELIMINAR PRODUCTO (desde ProductSearch) -------------------
  async function handleDeleteProduct(id) {
    if (!window.confirm("¿Seguro que desea eliminar el producto?")) return;
    try {
      await fetch(`${BACKEND_URL}/products/${id}`, { method: 'DELETE' });
      // Forzamos recarga
      setReloadKey(prev => prev + 1);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  }

  return (
    <div className="container mt-3">
      <h3>Gestión de Productos</h3>

      {/* Botón para mostrar/ocultar formulario de creación */}
      <div className="mb-3">
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cerrar Formulario' : 'Agregar Nuevo Producto'}
        </button>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <form onSubmit={handleCreateProduct} className="card p-3 mb-4">
          <h5>Nuevo Producto</h5>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              className="form-control"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              className="form-control"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group col-md-3">
              <label>Precio</label>
              <input
                type="number"
                className="form-control"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
            </div>
            <div className="form-group col-md-3">
              <label>Stock (sin variantes)</label>
              <input
                type="number"
                className="form-control"
                value={newStock}
                disabled={useVariants}
                onChange={(e) => setNewStock(e.target.value)}
                required={!useVariants}
              />
            </div>
            <div className="form-group col-md-3">
              <label>Categoría</label>
              <select
                className="form-control"
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group col-md-3">
              <label>Marca</label>
              <select
                className="form-control"
                value={newBrandId}
                onChange={(e) => setNewBrandId(e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {brands
                  .filter((b) => b.categoryId === newCategoryId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
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
                onChange={(e) => setNewBarcode(e.target.value)}
              />
            </div>
            <div className="form-group col-md-6">
              <label>Imagen</label>
              <input
                type="file"
                accept="image/*"
                className="form-control-file"
                onChange={(e) => setNewImageFile(e.target.files[0])}
                required
              />
            </div>
          </div>

          {/* Check “usar variantes” */}
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="useVariantsCheck"
              checked={useVariants}
              onChange={(e) => setUseVariants(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="useVariantsCheck">
              ¿Usar variantes (color/talla)?
            </label>
          </div>
          {useVariants && (
            <div className="form-group">
              <label>Variantes (Color|Stock, uno por línea)</label>
              <textarea
                className="form-control"
                value={newVariantsText}
                onChange={(e) => setNewVariantsText(e.target.value)}
                placeholder="Rojo|10&#10;Verde|20"
              />
            </div>
          )}

          <button type="submit" className="btn btn-success">
            Guardar
          </button>
        </form>
      )}

      <h4>Productos</h4>
      {/* ProductSearch: se encarga de listar y buscar productos, con “reloadKey” para recargar */}
      <ProductSearch
        reloadKey={reloadKey}
        onEdit={(prod) => setEditProduct(prod)}
        onDelete={(id) => handleDeleteProduct(id)}
      />

      {/* Modal de edición si editProduct no es null */}
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

/* --------------------- MODAL DE EDICIÓN --------------------- */
function EditProductModal({ product, categories, brands, onClose, onUpdate }) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || '');
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [brandId, setBrandId] = useState(product.brandId);
  const [barcode, setBarcode] = useState(product.barcode || '');
  const [file, setFile] = useState(null);

  // parsear variantsJson inicial
  let initialVariants = [];
  if (product.variantsJson) {
    try {
      initialVariants = JSON.parse(product.variantsJson);
    } catch {}
  }

  const [useVariants, setUseVariants] = useState(initialVariants.length > 0);
  const [variantsText, setVariantsText] = useState(() => {
    if (initialVariants.length > 0) {
      return initialVariants.map((v) => `${v.color}|${v.stock}`).join('\n');
    }
    return '';
  });

  function handleSubmit(e) {
    e.preventDefault();

    let variantsArr = [];
    if (useVariants && variantsText.trim()) {
      const lines = variantsText.split('\n');
      for (let line of lines) {
        const [color, st] = line.split('|');
        variantsArr.push({
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
      categoryId,
      brandId,
      barcode
    };

    if (useVariants && variantsArr.length > 0) {
      updated.variants = variantsArr;
    } else {
      updated.stock = parseInt(stock);
      updated.variants = [];
    }

    onUpdate(updated, file);
  }

  return (
    <div
      className="modal"
      style={{
        display: 'block',
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content custom-modal">
          <div className="modal-header">
            <h5 className="modal-title">Editar Producto</h5>
            <button className="close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {/* Nombre y Precio */}
              <div className="form-row">
                <div className="form-group col-md-6">
                  <label>Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group col-md-6">
                  <label>Precio</label>
                  <input
                    type="number"
                    className="form-control"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>
              {/* Descripción */}
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {/* Stock / Categoría / Marca / Barcode */}
              <div className="form-row">
                <div className="form-group col-md-3">
                  <label>Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={stock}
                    disabled={useVariants}
                    onChange={(e) => setStock(e.target.value)}
                    required={!useVariants}
                  />
                </div>
                <div className="form-group col-md-3">
                  <label>Categoría</label>
                  <select
                    className="form-control"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setBrandId(''); // resetea marca
                    }}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group col-md-3">
                  <label>Marca</label>
                  <select
                    className="form-control"
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    required
                  >
                    {brands
                      .filter((b) => b.categoryId === categoryId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group col-md-3">
                  <label>Código de barras</label>
                  <input
                    type="text"
                    className="form-control"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>
              </div>
              {/* Checkbox para usar variantes */}
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="editUseVariantsCheck"
                  checked={useVariants}
                  onChange={(e) => setUseVariants(e.target.checked)}
                />
                <label
                  htmlFor="editUseVariantsCheck"
                  className="form-check-label"
                >
                  ¿Usar variantes (color/talla)?
                </label>
              </div>
              {useVariants && (
                <div className="form-group">
                  <label>Variantes (Color|Stock)</label>
                  <textarea
                    className="form-control"
                    value={variantsText}
                    onChange={(e) => setVariantsText(e.target.value)}
                  />
                </div>
              )}
              {/* Imagen (opcional) */}
              <div className="form-group">
                <label>Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control-file"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
              {product.image && (
                <div className="text-center mb-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: 100, height: 100, objectFit: 'cover' }}
                  />
                </div>
              )}
              {/* Botones footer */}
              <div className="modal-footer">
                <button type="submit" className="btn btn-success">
                  Actualizar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Componente Reutilizable: ProductSearch (para listar y buscar productos)
   ------------------------------------------------------------------ */
function ProductSearch({
  reloadKey = 0,     // Si cambia, forzamos recarga
  limit = 10,       // Cuántos productos por página
  onEdit,           // Callback para editar
  onDelete,         // Callback para eliminar
}) {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);

  // Cada vez que cambie "page" o "searchTerm" o "reloadKey", recargamos
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, reloadKey]);

  async function loadData() {
    try {
      const offset = page * limit;
      let url = `${BACKEND_URL}/products?limit=${limit}&offset=${offset}&order=name:asc`;
      if (searchTerm.trim()) {
        url += `&searchTerm=${encodeURIComponent(searchTerm.trim())}`;
      }

      const resp = await fetch(url);
      const data = await resp.json();
      if (data.length === 0 && page > 0) {
        setPage(Math.max(0, page - 1));
        return;
      }
      setProducts(data);
    } catch (error) {
      console.error("Error en ProductSearch loadData:", error);
    }
  }

  function handleEditClick(prod) {
    if (onEdit) onEdit(prod);
  }
  function handleDeleteClick(id) {
    if (onDelete) onDelete(id);
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '6px' }}>
      <h5>Listado / Búsqueda de Productos</h5>
      {/* Buscador local => server side => searchTerm en la query */}
      <div className="form-group mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar en el servidor..."
          value={searchTerm}
          onChange={(e) => {
            setPage(0);
            setSearchTerm(e.target.value);
          }}
        />
      </div>

      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Código</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            return (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>${p.price}</td>
                <td>{p.stock}</td>
                <td>{p.barcode}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm mr-1"
                    onClick={() => handleEditClick(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteClick(p.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Paginación local del ProductSearch */}
      <div className="d-flex justify-content-between">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(Math.max(0, page - 1))}
        >
          Anterior
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
