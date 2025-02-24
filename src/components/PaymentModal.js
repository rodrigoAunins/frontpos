// src/components/PaymentModal.js
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

export default function PaymentModal({
  saleItems,
  total,
  onClose,
  onSaleProcessed
}) {
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  const change = parseFloat(amountPaid || 0) - total;

  const handleProcessPayment = () => {
    if (parseFloat(amountPaid) < total) {
      alert("El monto recibido es insuficiente.");
      return;
    }
    try {
      // Generar PDF (ejemplo simple)
      const doc = new jsPDF();
      let y = 10;
      doc.setFontSize(12);
      doc.text("Factura", 10, y); y += 10;
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 10, y); y += 10;
      doc.text(`Tipo de Pago: ${paymentMethod}`, 10, y); y += 10;
      doc.text("Productos:", 10, y); y += 10;
      saleItems.forEach(item => {
        doc.text(
          `${item.productName} - Cant: ${item.quantity} - Precio: $${item.price.toFixed(2)}`,
          10, y
        );
        y += 10;
      });
      doc.text(`Total: $${total.toFixed(2)}`, 10, y); y += 10;
      doc.text(`Monto Recibido: $${parseFloat(amountPaid).toFixed(2)}`, 10, y); y += 10;
      doc.text(`Devolución: $${change.toFixed(2)}`, 10, y);
      doc.save("factura.pdf");

      // Llamar callback que, por ejemplo, borra el carrito
      onSaleProcessed();
    } catch (error) {
      console.error("Error procesando venta:", error);
      alert("Error procesando venta");
    }
  };

  return (
    <div
      className="modal"
      style={{
        display: 'block',
        background: 'rgba(0,0,0,0.5)'
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content custom-modal">
          <div className="modal-header">
            <h5 className="modal-title">Procesar Pago y Generar Factura</h5>
            <button className="close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p><strong>Total a pagar:</strong> ${total.toFixed(2)}</p>
            <div className="form-group">
              <label>Monto Recibido</label>
              <input
                type="number"
                className="form-control"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tipo de Pago</label>
              <select
                className="form-control"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="debito">Tarjeta de Débito</option>
                <option value="credito">Tarjeta de Crédito</option>
              </select>
            </div>
            <p>Devolución: ${isNaN(change) ? '0.00' : change.toFixed(2)}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-success" onClick={handleProcessPayment}>
              Procesar Pago
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
