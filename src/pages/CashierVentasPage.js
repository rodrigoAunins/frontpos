// src/pages/CashierVentasPage.js
import React, { useEffect, useState } from 'react';
import {
  prefetchData,
  fetchCategories,
  fetchBrands,
  fetchProducts,
  getDataFromCache
} from '../services/api';
import PaymentModal from '../components/PaymentModal';

export default function CashierVentasPage({ currentUser, currentSession }) {
  // Paginaciones
  const SALE_CATEGORIES_LIMIT = 10;
  const SALE_BRANDS_LIMIT = 10;
  const SALE_PRODUCTS_LIMIT = 10;

  const [catPage, setCatPage] = useState(0);
  const [brandPage, setBrandPage] = useState(0);
  const [prodPage, setProdPage] = useState(0);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState(null);

  const [saleItems, setSaleItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Calcular total
  const total = saleItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

  useEffect(() => {
    if (!currentSession) {
      // Manejo: si no hay caja abierta, podemos mostrar un mensaje o algo
      return;
    }
    // Prefetch data
    (async () => {
      try {
        await prefetchData('prefetch_categories', fetchCategories, 50);
        await prefetchData('prefetch_brands', fetchBrands, 50);
        await prefetchData('prefetch_products', fetchProducts, 50);
        loadCategories();
      } catch (error) {
        console.error("Error prefetch data:", error);
      }
    })();
  }, [currentSession]);

  // Carga
  const loadCategories = () => {
    const all = getDataFromCache('prefetch_categories') || [];
    const offset = catPage * SALE_CATEGORIES_LIMIT;
    const subset = all.slice(offset, offset + SALE_CATEGORIES_LIMIT);
    if (subset.length === 0 && catPage > 0) {
      setCatPage(catPage - 1);
    } else {
      setCategories(subset);
    }
  };

  const loadBrands = (catId) => {
    const all = getDataFromCache('prefetch_brands') || [];
    const filtered = all.filter(b => b.categoryId == catId);
    const offset = brandPage * SALE_BRANDS_LIMIT;
    const subset = filtered.slice(offset, offset + SALE_BRANDS_LIMIT);
    if (subset.length === 0 && brandPage > 0) {
      setBrandPage(brandPage - 1);
    } else {
      setBrands(subset);
    }
  };

  const loadProducts = (brandId) => {
    const all = getDataFromCache('prefetch_products') || [];
    const filtered = all.filter(p => p.brandId == brandId && p.stock > 0);
    const offset = prodPage * SALE_PRODUCTS_LIMIT;
    const subset = filtered.slice(offset, offset + SALE_PRODUCTS_LIMIT);
    if (subset.length === 0 && prodPage > 0) {
      setProdPage(prodPage - 1);
    } else {
      setProducts(subset);
    }
  };

  // Selecciones
  const handleSelectCategory = (id) => {
    setSelectedCategoryId(id);
    setBrandPage(0);
    setSelectedBrandId(null);
    loadBrands(id);
    setProducts([]);
  };

  const handleSelectBrand = (id) => {
    setSelectedBrandId(id);
    setProdPage(0);
    loadProducts(id);
  };

  // Agregar producto (aquí puedes abrir un modal para cantidad, variantes, etc.)
  const addProduct = (p) => {
    // Verificar stock
    if (p.stock < 1) {
      alert("No hay stock de este producto.");
      return;
    }
    const existingIndex = saleItems.findIndex(si => si.productId === p.id);
    if (existingIndex >= 0) {
      // Verificar stock
      if (saleItems[existingIndex].quantity + 1 > p.stock) {
        alert("Stock insuficiente.");
        return;
      }
      const newItems = [...saleItems];
      newItems[existingIndex].quantity += 1;
      setSaleItems(newItems);
    } else {
      setSaleItems([...saleItems, {
        productId: p.id,
        productName: p.name,
        price: p.price,
        quantity: 1
      }]);
    }
  };

  const removeItem = (index) => {
    const newItems = [...saleItems];
    newItems.splice(index, 1);
    setSaleItems(newItems);
  };

  // Finalizar venta => abrir modal de pago
  const finalizeSale = () => {
    if (saleItems.length === 0) {
      alert("No hay productos en el carrito.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handleSaleProcessed = () => {
    // Limpia el carrito y cierra
    setSaleItems([]);
    setShowPaymentModal(false);
  };

  if (!currentSession) {
    return (
      <div className="alert alert-warning text-center">
        Debes abrir la caja antes de realizar ventas.
      </div>
    );
  }

  return (
    <div>
      <h3><i className="fa-solid fa-shopping-cart"></i> Registrar Venta</h3>
      <div className="row">
        {/* Columna izquierda: Categorías, Marcas, Productos */}
        <div className="col-md-8">
          <h5>Categorías</h5>
          <div className="row">
            {categories.map(cat => (
              <div key={cat.id} className="col-md-4 mb-3">
                <div className="card category-card" onClick={() => handleSelectCategory(cat.id)}>
                  <img src={cat.image} className="card-img-top" alt={cat.name} />
                  <div className="card-body text-center">
                    <h6>{cat.name}</h6>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Botones paginación categorías */}
          <div className="d-flex justify-content-between mb-3">
            <button
              className="btn btn-secondary btn-sm"
              onClick={()=> { setCatPage(Math.max(catPage-1,0)); loadCategories(); }}
            >
              Anterior
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={()=> { setCatPage(catPage+1); loadCategories(); }}
            >
              Siguiente
            </button>
          </div>

          {/* Marcas */}
          {selectedCategoryId && (
            <>
              <hr />
              <h5>Marcas</h5>
              <div className="row">
                {brands.map(br => (
                  <div key={br.id} className="col-md-4 mb-3">
                    <div className="card brand-card" onClick={() => handleSelectBrand(br.id)}>
                      <img src={br.image} className="card-img-top" alt={br.name} />
                      <div className="card-body text-center">
                        <h6>{br.name}</h6>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Paginación marcas */}
              <div className="d-flex justify-content-between mb-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={()=> { setBrandPage(Math.max(brandPage-1,0)); loadBrands(selectedCategoryId); }}
                >
                  Anterior
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={()=> { setBrandPage(brandPage+1); loadBrands(selectedCategoryId); }}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}

          {/* Productos */}
          {selectedBrandId && (
            <>
              <hr />
              <h5>Productos</h5>
              <div className="row">
                {products.map(prod => (
                  <div key={prod.id} className="col-md-4 mb-3">
                    <div className="card product-card" onClick={()=> addProduct(prod)}>
                      <img src={prod.image} className="card-img-top" alt={prod.name} />
                      <div className="card-body text-center">
                        <h6>{prod.name}</h6>
                        <p>${prod.price} - Stock: {prod.stock}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Paginación productos */}
              <div className="d-flex justify-content-between mb-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={()=> { setProdPage(Math.max(prodPage-1,0)); loadProducts(selectedBrandId); }}
                >
                  Anterior
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={()=> { setProdPage(prodPage+1); loadProducts(selectedBrandId); }}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>
        {/* Columna derecha: Resumen de venta */}
        <div className="col-md-4">
          <h5>Resumen de Venta</h5>
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Subtotal</th>
                <th>Quitar</th>
              </tr>
            </thead>
            <tbody>
              {saleItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>${(item.quantity * item.price).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn-link text-danger"
                      onClick={()=> removeItem(idx)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h5>Total: ${total.toFixed(2)}</h5>
          <button className="btn btn-success btn-block btn-custom" onClick={finalizeSale}>
            Finalizar Venta
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          saleItems={saleItems}
          total={total}
          currentUser={currentUser}
          currentSession={currentSession}
          onClose={()=>setShowPaymentModal(false)}
          onSaleProcessed={handleSaleProcessed}
        />
      )}
    </div>
  );
}
