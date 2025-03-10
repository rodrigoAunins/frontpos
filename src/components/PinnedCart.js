import React from 'react';
import './PinnedCart.css';

export default function PinnedCart({
  saleItems,
  onRemoveItem,
  onQuantityChange,
  onRoundPrice,
  onResetPrice,
  onFinalizeSale,
  className // Se acepta clase adicional para modificar estilos desde el padre
}) {
  const total = saleItems.reduce((sum, it) => sum + it.quantity * it.price, 0);

  return (
    <div className={`pinned-cart ${className ? className : ''}`}>
      <h5>Carrito</h5>
      {saleItems.length === 0 ? (
        <p className="text-muted">Sin productos</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm cart-table">
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
                    <td className="product-name">{item.productName}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm quantity-input"
                        min={1}
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
                      <button className="btn p-0 text-success round-btn" onClick={() => onRoundPrice(idx, 'up')}>
                        <i className="bi bi-arrow-up-square-fill"></i>
                      </button>
                    </td>
                    <td>
                      <button className="btn p-0 text-danger round-btn" onClick={() => onRoundPrice(idx, 'down')}>
                        <i className="bi bi-arrow-down-square-fill"></i>
                      </button>
                    </td>
                    <td>
                      <button className="btn p-0 text-warning round-btn" onClick={() => onResetPrice(idx)}>
                        <i className="bi bi-arrow-counterclockwise"></i>
                      </button>
                    </td>
                    <td>
                      <button className="btn p-0 text-danger round-btn" onClick={() => onRemoveItem(idx)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <h5 className="mt-3">Total: ${total.toFixed(2)}</h5>
      <button className="btn btn-success btn-block" disabled={saleItems.length === 0} onClick={onFinalizeSale}>
        Finalizar Venta
      </button>
    </div>
  );
}
