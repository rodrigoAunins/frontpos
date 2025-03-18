import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../services/api';

export default function CancelSaleModal({ onClose }) {
  const [allSales, setAllSales] = useState([]);
  const [saleId, setSaleId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar todas las ventas apenas se abre el modal
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/sales?limit=99999&offset=0&order=date:asc`);
        if (!resp.ok) {
          console.error('Error al cargar todas las ventas:', resp.status);
          return;
        }
        const data = await resp.json();
        setAllSales(data);
      } catch (error) {
        console.error('Error al cargar todas las ventas:', error);
      }
    })();
  }, []);

  const handleCancelSale = async () => {
    if (!saleId) {
      alert('Debes ingresar el ID de la venta.');
      return;
    }
    setIsProcessing(true);

    // 1) Buscar la venta en nuestro "allSales"
    const sale = allSales.find(s => String(s.id) === String(saleId));
    if (!sale) {
      alert(`No se encontró la venta ${saleId} en la lista cargada. Verifica el ID.`);
      setIsProcessing(false);
      return;
    }
    if (!sale.items || sale.items.length === 0) {
      alert(`La venta ${saleId} no tiene items (o no fueron devueltos por el backend).`);
      setIsProcessing(false);
      return;
    }

    // 2) Reponer el stock de cada item
    try {
      await Promise.all(
        sale.items.map(async (item) => {
          console.log(`Reponiendo stock del productoId ${item.productId}: +${item.quantity}`);
          // Obtener el producto
          const productResp = await fetch(`${BACKEND_URL}/products/${item.productId}`);
          if (!productResp.ok) {
            console.error(`Producto ${item.productId} no encontrado al reponer stock: ${item.productName}`);
            return;
          }
          const product = await productResp.json();

          // Sumar stock
          if (item.variantColor) {
            const variant = product.variants?.find(v => v.color === item.variantColor);
            if (variant) {
              variant.stock += item.quantity;
              console.log(`Nuevo stock variante "${item.variantColor}": ${variant.stock}`);
            }
          } else {
            product.stock += item.quantity;
            console.log(`Nuevo stock producto "${product.name}": ${product.stock}`);
          }

          // Guardar el producto actualizado
          const updateResp = await fetch(`${BACKEND_URL}/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
          });
          if (!updateResp.ok) {
            console.error(`Error al actualizar stock del producto ${product.id}`);
          }
        })
      );
      console.log('Reposición de stock completada');
    } catch (err) {
      console.error('Error reponiendo stock:', err);
      alert('Hubo un error reponiendo el stock. Revisa la consola.');
      setIsProcessing(false);
      return;
    }

    // 3) Llamar al endpoint /sales/:id/cancel para marcar la venta como cancelada
    try {
      const resp = await fetch(`${BACKEND_URL}/sales/${saleId}/cancel`, {
        method: 'PATCH',
      });
      if (!resp.ok) {
        let errMsg = `Error al cancelar la venta (status ${resp.status})`;
        // Si el backend envía un body con "message", lo mostramos
        try {
          const errData = await resp.json();
          if (errData?.message) {
            errMsg = errData.message;
          } else {
            errMsg = JSON.stringify(errData);
          }
        } catch {/* ignore parse errors */}
        throw new Error(errMsg);
      }
      alert(`La venta ${saleId} fue cancelada con éxito. (Stock repuesto)`);
      onClose();
    } catch (err) {
      console.error('Error al cancelar venta:', err);
      alert(`No se pudo cancelar la venta: ${err.message}`);
    }

    setIsProcessing(false);
  };

  // ~~~~~ ESTILOS para el pop up ~~~~~
  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  };

  const modalStyle = {
    backgroundColor: '#fff',
    borderRadius: '6px',
    padding: '20px',
    minWidth: '350px',
    maxWidth: '90%',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <div className="modal-header">
          <h5 className="modal-title">Cancelar Venta</h5>
          <button
            type="button"
            className="close btn btn-sm btn-light"
            onClick={onClose}
            disabled={isProcessing}
          >
            <span>&times;</span>
          </button>
        </div>

        <div className="modal-body">
          <p>
            Se han cargado previamente todas las ventas en memoria.  
            Ingresa el <strong>ID</strong> de la venta que deseas cancelar:
          </p>
          <div className="form-group">
            <label>ID de la Venta</label>
            <input
              type="text"
              className="form-control"
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              disabled={isProcessing}
              placeholder="Ej: 1742073262095-912"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-danger"
            onClick={handleCancelSale}
            disabled={isProcessing}
          >
            Cancelar Venta
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
