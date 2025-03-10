import React, { useEffect, useState } from 'react';
import PinnedCart from '../components/PinnedCart';
import PaymentModal from '../components/PaymentModal';
import { BACKEND_URL } from '../services/api';
import './CashierVentasPage.css'; // Importamos el CSS de esta página

/** Teclado Virtual para pantallas táctiles */
function VirtualKeyboard({ onKeyPress, onClose }) {
  const rows = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['0','.'],
  ];

  const handleClick = (val) => {
    if (onKeyPress) onKeyPress(val);
  };

  return (
    <div
      style={{
        background: '#f8f8f8',
        border: '1px solid #ccc',
        padding: '8px',
        marginBottom: '10px',
        borderRadius: '6px',
        maxWidth: '350px'
      }}
    >
      <div className="d-flex justify-content-end">
        <button className="btn btn-sm btn-danger mb-1" onClick={onClose}>
          Cerrar
        </button>
      </div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} style={{ marginBottom: '5px', display: 'flex' }}>
          {row.map(letter => (
            <button
              key={letter}
              type="button"
              style={{ margin: '2px', minWidth: '32px' }}
              className="btn btn-secondary btn-sm"
              onClick={() => handleClick(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', marginTop: '5px' }}>
        <button
          className="btn btn-secondary btn-sm mr-2"
          onClick={() => handleClick(' ')}
        >
          Espacio
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleClick('del')}
        >
          Borrar
        </button>
      </div>
    </div>
  );
}

export default function CashierVentasPage({ currentUser, currentSession }) {
  // -------------------- HOOKS DE ESTADO --------------------
  const [step, setStep] = useState(0);

  // Categorías y marcas
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Paginación
  const SALE_CATEGORIES_LIMIT = 10;
  const SALE_BRANDS_LIMIT = 10;
  const [catPage, setCatPage] = useState(0);
  const [brandPage, setBrandPage] = useState(0);

  // Buscador y teclado para marcas
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [showBrandKeyboard, setShowBrandKeyboard] = useState(false);

  // Selecciones
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState(null);

  // Carrito
  const [saleItems, setSaleItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Búsqueda de productos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);

  // -------------------- HOOKS useEffect --------------------
  // 1) Cargar categorías si hay sesión
  useEffect(() => {
    if (currentSession) {
      loadCategories();
    }
  }, [currentSession, catPage]);  
  // Incluimos catPage aquí, así recarga al cambiar página

  // 2) Cuando step=1, category seleccionada, o se cambie brandSearchTerm/brandPage => cargar marcas
  useEffect(() => {
    if (step === 1 && selectedCategoryId) {
      loadBrands(selectedCategoryId);
    }
  }, [step, selectedCategoryId, brandSearchTerm, brandPage]);

  // -------------------- SI NO HAY SESIÓN, MOSTRAMOS ALERTA --------------------
  if (!currentSession) {
    return (
      <div className="alert alert-warning text-center mt-4">
        <h4>No hay caja abierta</h4>
        <p>Debes abrir caja antes de hacer ventas.</p>
      </div>
    );
  }

  // -------------------- FUNCIONES --------------------
  // Carga categorías => /categories
  const loadCategories = async () => {
    try {
      const offset = catPage * SALE_CATEGORIES_LIMIT;
      const url = `${BACKEND_URL}/categories?limit=${SALE_CATEGORIES_LIMIT}&offset=${offset}&order=name:asc`;
      const resp = await fetch(url);
      const data = await resp.json();
      setCategories(data);
      setStep(0);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  // Carga marcas => /brands
  const loadBrands = async (catId) => {
    try {
      const offset = brandPage * SALE_BRANDS_LIMIT;
      let url = `${BACKEND_URL}/brands?limit=${SALE_BRANDS_LIMIT}&offset=${offset}&order=name:asc`;

      if (catId) {
        url += `&categoryId=${encodeURIComponent(catId)}`;
      }
      if (brandSearchTerm.trim()) {
        url += `&searchTerm=${encodeURIComponent(brandSearchTerm.trim())}`;
      }

      const resp = await fetch(url);
      const data = await resp.json();
      setBrands(data);
      setStep(1);
    } catch (err) {
      console.error("Error al cargar marcas:", err);
    }
  };

  // Seleccionar categoría
  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId);
    setBrandSearchTerm('');
    setBrandPage(0);
    loadBrands(catId);
  };

  // Seleccionar marca
  const handleSelectBrand = (brandId) => {
    setSelectedBrandId(brandId);
    setStep(2);
    setProductSearchTerm('');
  };

  // Volver a categorías
  const goToCategories = () => {
    setSelectedCategoryId(null);
    setBrandPage(0);
    setStep(0);
    loadCategories();
  };

  // Volver a marcas
  const goToBrands = () => {
    if (selectedCategoryId) {
      setSelectedBrandId(null);
      setStep(1);
      setBrandPage(0);
    }
  };

  // -------------------- CARRITO --------------------
  const addProductToCart = (prod) => {
    if (prod.stock < 1) {
      alert("No hay stock disponible.");
      return;
    }
    const idx = saleItems.findIndex(it => it.productId === prod.id && !it.variantColor);
    if (idx >= 0) {
      if (saleItems[idx].quantity + 1 > prod.stock) {
        alert("Stock insuficiente.");
        return;
      }
      const updated = [...saleItems];
      updated[idx].quantity++;
      setSaleItems(updated);
    } else {
      setSaleItems([...saleItems, {
        productId: prod.id,
        productName: prod.name,
        price: prod.price,
        originalPrice: prod.price,
        quantity: 1,
        variantColor: null,
        roundUpCount: 0,
        roundDownCount: 0
      }]);
    }
  };

  const removeItem = (idx) => {
    const updated = [...saleItems];
    updated.splice(idx, 1);
    setSaleItems(updated);
  };

  const changeItemQuantity = (idx, newQty) => {
    if (newQty < 1) return;
    const updated = [...saleItems];
    updated[idx].quantity = newQty;
    setSaleItems(updated);
  };

  const roundItemPrice = (idx, direction) => {
    const updated = [...saleItems];
    const item = updated[idx];
    if (!item) return;

    if (direction === 'down') {
      if (item.roundDownCount === 0) {
        item.price = Math.floor(item.price);
        item.roundDownCount = 1;
      } else {
        const mod = item.price % 500;
        item.price -= mod;
        if (item.price < 0) item.price = 0;
      }
      item.roundUpCount = 0;
    } else {
      if (item.roundUpCount === 0) {
        item.price = Math.ceil(item.price);
        item.roundUpCount = 1;
      } else {
        const mod = item.price % 500;
        if (mod === 0) {
          item.price += 500;
        } else {
          item.price += (500 - mod);
        }
      }
      item.roundDownCount = 0;
    }
    setSaleItems(updated);
  };

  const resetPrice = (idx) => {
    const updated = [...saleItems];
    const item = updated[idx];
    if (!item) return;
    item.price = item.originalPrice;
    item.roundUpCount = 0;
    item.roundDownCount = 0;
    setSaleItems(updated);
  };

  const finalizeSale = () => {
    if (saleItems.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    setShowPaymentModal(true);
  };

  // Procesar venta en segundo plano
  const processHeavySale = async (saleItemsCopy) => {
    const saleTotal = saleItemsCopy.reduce((acc, item) => acc + item.quantity * item.price, 0);
    try {
      await fetch(`${BACKEND_URL}/deduct-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleItems: saleItemsCopy })
      });
      await fetch(`${BACKEND_URL}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleItems: saleItemsCopy, saleTotal })
      });
    } catch (error) {
      console.error("Error en el procesamiento en segundo plano de la venta:", error);
    }
  };

  // -------------------- RENDER --------------------
  // Total de la venta
  const total = saleItems.reduce((a, it) => a + it.quantity * it.price, 0);

  // Teclado virtual (productos)
  const handleKeyboardPress = (val) => {
    if (val === 'del') {
      setProductSearchTerm('');
    } else {
      setProductSearchTerm(prev => prev + val);
    }
  };

  // Teclado virtual (marcas)
  const handleBrandKeyboardPress = (val) => {
    if (val === 'del') {
      setBrandSearchTerm('');
    } else {
      setBrandSearchTerm(prev => prev + val);
    }
  };

  return (
    <div className="cashier-ventas-wrapper">
      {/* CONTENIDO PRINCIPAL */}
      <div className="content-area">
        <div className="p-3">
          <h2>Registrar Venta</h2>
          {/* Breadcrumb */}
          <p style={{ fontSize: '1.1rem' }}>
            <span style={{ cursor: 'pointer' }} onClick={goToCategories}>
              Categorías
            </span>
            {" / "}
            <span
              style={{
                cursor: step >= 1 ? 'pointer' : 'default',
                color: step >= 1 ? '' : '#999'
              }}
              onClick={() => step >= 1 && goToBrands()}
            >
              Marcas
            </span>
            {" / "}
            <span
              style={{
                cursor: step === 2 ? 'pointer' : 'default',
                color: step === 2 ? '' : '#999'
              }}
              onClick={() => {
                if (step === 2 && selectedBrandId) {
                  setStep(2);
                }
              }}
            >
              Productos
            </span>
          </p>
        </div>

        <div className="p-3">
          {/* PASO 0 => Categorías */}
          {step === 0 && (
            <>
              <h4>Categorías</h4>
              <ul className="list-group">
                {categories.map(cat => (
                  <li
                    key={cat.id}
                    className="list-group-item list-group-item-action"
                    style={{ fontSize: '1.2rem', cursor: 'pointer' }}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-between mt-2">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCatPage(Math.max(0, catPage - 1));
                  }}
                >
                  Anterior
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCatPage(catPage + 1);
                  }}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}

          {/* PASO 1 => Marcas */}
          {step === 1 && (
            <>
              <h4>Marcas</h4>
              <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                <div className="d-flex">
                  <button
                    type="button"
                    className="btn btn-sm btn-info mr-2"
                    onClick={() => setShowBrandKeyboard(!showBrandKeyboard)}
                  >
                    {showBrandKeyboard ? 'Ocultar Teclado' : 'Teclado'}
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Buscar marca..."
                    value={brandSearchTerm}
                    onChange={e => setBrandSearchTerm(e.target.value)}
                  />
                </div>
                {showBrandKeyboard && (
                  <VirtualKeyboard
                    onKeyPress={handleBrandKeyboardPress}
                    onClose={() => setShowBrandKeyboard(false)}
                  />
                )}
              </div>
              <div className="row">
                {brands.map(br => (
                  <div key={br.id} className="col-md-3 mb-3">
                    <div
                      className="card brand-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectBrand(br.id)}
                    >
                      <img src={br.image} alt={br.name} className="card-img-top" />
                      <div className="card-body text-center">
                        <h6>{br.name}</h6>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-between">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setBrandPage(Math.max(0, brandPage - 1));
                  }}
                >
                  Anterior
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setBrandPage(brandPage + 1);
                  }}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}

          {/* PASO 2 => Productos */}
          {step === 2 && selectedBrandId && (
            <>
              <h4>Productos</h4>
              <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                <div className="d-flex">
                  <button
                    type="button"
                    className="btn btn-sm btn-info mr-2"
                    onClick={() => setShowKeyboard(!showKeyboard)}
                  >
                    {showKeyboard ? 'Ocultar Teclado' : 'Teclado'}
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Buscar..."
                    value={productSearchTerm}
                    onChange={e => setProductSearchTerm(e.target.value)}
                  />
                </div>
                {showKeyboard && (
                  <VirtualKeyboard
                    onKeyPress={handleKeyboardPress}
                    onClose={() => setShowKeyboard(false)}
                  />
                )}
              </div>

              <ProductSearch
                brandId={selectedBrandId}
                categoryId={null}
                initialSearch={productSearchTerm}
                limit={8}
                onSelectProduct={addProductToCart}
              />
            </>
          )}
        </div>

        {/* MODAL DE PAGO */}
        {showPaymentModal && (
          <PaymentModal
            saleItems={saleItems}
            total={total}
            currentUser={currentUser}
            currentSession={currentSession}
            onClose={() => setShowPaymentModal(false)}
            onSaleProcessed={() => {
              const saleItemsCopy = [...saleItems];
              setSaleItems([]);
              setShowPaymentModal(false);
              goToCategories(); // Regresar a categorías
              processHeavySale(saleItemsCopy);
            }}
          />
        )}
      </div>

      {/* Carrito fijo a la derecha */}
      <PinnedCart
        className={`pinned-cart ${showPaymentModal ? 'hidden' : ''}`}
        saleItems={saleItems}
        onRemoveItem={removeItem}
        onQuantityChange={changeItemQuantity}
        onRoundPrice={roundItemPrice}
        onResetPrice={resetPrice}
        onFinalizeSale={finalizeSale}
      />
    </div>
  );
}

/* ---------------------------------------------------------
   Componente ProductSearch
--------------------------------------------------------- */
function ProductSearch({
  categoryId = null,
  brandId = null,
  initialSearch = '',
  limit = 10,
  onSelectProduct,
}) {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [products, setProducts] = useState([]);

  const [iconSize, setIconSize] = useState(() => {
    const saved = localStorage.getItem("productSearchIconSize");
    if (saved) return Number(saved);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return Math.floor(window.innerWidth / 6);
    }
    return 220;
  });

  // Guardar iconSize en localStorage
  useEffect(() => {
    localStorage.setItem("productSearchIconSize", iconSize);
  }, [iconSize]);

  // Cargar productos cuando cambien page, searchTerm, brandId, categoryId
  useEffect(() => {
    loadData();
  }, [page, searchTerm, brandId, categoryId]);

  // Resetear page y searchTerm cuando cambie initialSearch
  useEffect(() => {
    setSearchTerm(initialSearch);
    setPage(0);
  }, [initialSearch]);

  async function loadData() {
    if (!brandId && !categoryId) {
      setProducts([]);
      return;
    }

    const offset = page * limit;
    let url = `${BACKEND_URL}/products?limit=${limit}&offset=${offset}&order=name:asc`;

    if (brandId) {
      url += `&brandId=${encodeURIComponent(brandId)}`;
    }
    if (categoryId) {
      url += `&categoryId=${encodeURIComponent(categoryId)}`;
    }
    if (searchTerm.trim()) {
      url += `&searchTerm=${encodeURIComponent(searchTerm.trim())}`;
    }

    try {
      const resp = await fetch(url);
      const data = await resp.json();

      // Retroceder si no hay data y no estamos en page 0
      if (data.length === 0 && page > 0) {
        setPage(Math.max(0, page - 1));
        return;
      }

      setProducts(data);
    } catch (error) {
      console.error("Error en ProductSearch loadData:", error);
    }
  }

  function handleSelectProduct(prod) {
    if (onSelectProduct) {
      onSelectProduct(prod);
    }
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '6px' }}>
      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label htmlFor="iconSizeRange" style={{ fontSize: '1rem', marginRight: '10px' }}>
          Tamaño de iconos:
        </label>
        <input
          type="range"
          id="iconSizeRange"
          min="50"
          max="300"
          value={iconSize}
          onChange={(e) => setIconSize(Number(e.target.value))}
          style={{ verticalAlign: 'middle' }}
        />
        <span style={{ marginLeft: '10px', fontSize: '1rem' }}>{iconSize}px</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'flex-start',
        }}
      >
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              width: `${iconSize}px`,
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
              background: '#f9f9f9',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => handleSelectProduct(p)}
          >
            <div style={{ marginBottom: '10px' }}>
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  style={{
                    width: '100%',
                    height: `${iconSize * 0.68}px`,
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: `${iconSize * 0.68}px`,
                    background: '#ccc',
                    borderRadius: '4px',
                  }}
                />
              )}
            </div>

            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '6px' }}>
              {p.name}
            </div>
            <div style={{ fontSize: '1rem', marginBottom: '4px' }}>
              <strong>${p.price}</strong> | Stock: {p.stock}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
              Cód: {p.barcode}
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-between" style={{ marginTop: '20px' }}>
        <button
          style={{ fontSize: '1.1rem', padding: '10px 16px' }}
          className="btn btn-secondary"
          onClick={() => setPage(Math.max(0, page - 1))}
        >
          Anterior
        </button>
        <button
          style={{ fontSize: '1.1rem', padding: '10px 16px' }}
          className="btn btn-secondary"
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
