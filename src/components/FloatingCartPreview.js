// src/components/FloatingCartPreview.js
import React from 'react';
import '../css/FloatingCartPreview.css'; // CSS opcional para estilos

export default function FloatingCartPreview({
  saleItems,
  onRemoveItem,
  onRoundPrice,
  onResetPrice,
  onQuantityChange,
  onFinalizeSale
}) {
  // Calculamos el total
  const total = saleItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="floating-cart-preview">
      <h5>Carrito</h5>
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th>↑</th>
            <th>↓</th>
            <th>⟳</th>
            <th>✕</th>
          </tr>
        </thead>
        <tbody>
          {saleItems.map((item, idx) => {
            const subtotal = (item.quantity * item.price).toFixed(2);
            return (
              <tr key={idx}>
                <td>{item.productName}</td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ width: '60px' }}
                    min="1"
                    value={item.quantity}
                    onChange={e => {
                      const newQty = parseInt(e.target.value, 10) || 1;
                      onQuantityChange(idx, newQty);
                    }}
                  />
                </td>
                <td>${item.price.toFixed(2)}</td>
                <td>${subtotal}</td>
                <td>
                  <button
                    className="btn btn-link text-success p-0"
                    onClick={() => onRoundPrice(idx, 'up')}
                    title="Redondear hacia arriba"
                  >
                    <i className="bi bi-arrow-up-square"></i>
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn-link text-danger p-0"
                    onClick={() => onRoundPrice(idx, 'down')}
                    title="Redondear hacia abajo"
                  >
                    <i className="bi bi-arrow-down-square"></i>
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn-link text-warning p-0"
                    onClick={() => onResetPrice(idx)}
                    title="Resetear precio"
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn-link text-danger p-0"
                    onClick={() => onRemoveItem(idx)}
                    title="Quitar ítem"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h5>Total: ${total.toFixed(2)}</h5>
      <button
        className="btn btn-success btn-block"
        onClick={onFinalizeSale}
        disabled={saleItems.length === 0}
      >
        Finalizar Venta
      </button>
    </div>
  );
}
