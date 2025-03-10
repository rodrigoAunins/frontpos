import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import NumericKeypad from './NumericKeypad';
import { BACKEND_URL } from '../services/api';
import './PaymentModal.css';

const PaymentModal = ({
  saleItems,
  total, // Si total es undefined se calcula a partir de saleItems
  currentUser,
  currentSession,
  onClose,
  onSaleProcessed
}) => {
  // Calcula el total si no se pasa
  const computedTotal =
    total !== undefined && total !== null
      ? total
      : saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // Estado para bloquear el botón

  const parsedAmountPaid = parseFloat(amountPaid) || 0;
  const change = parsedAmountPaid - computedTotal;

  useEffect(() => {
    if (paymentMethod !== 'efectivo') {
      // Para otros métodos, el monto recibido se fija igual al total
      setAmountPaid(computedTotal.toFixed(2));
    } else {
      setAmountPaid('');
    }
  }, [paymentMethod, computedTotal]);

  const handleKeypadPress = (key) => {
    if (key === 'del') {
      setAmountPaid((prev) => prev.slice(0, -1));
    } else {
      setAmountPaid((prev) => (prev || '') + key);
    }
  };

  const handleProcessPayment = async () => {
    if (isProcessing) return; // Evitar múltiples clics
    setIsProcessing(true);
    console.log("=== INICIANDO PROCESO DE PAGO ===");
    console.log("Monto recibido:", parsedAmountPaid, "Total venta:", computedTotal);
    
    if (paymentMethod === 'efectivo' && parsedAmountPaid < computedTotal) {
      alert("El monto en efectivo es insuficiente.");
      console.log("Error: monto insuficiente.");
      setIsProcessing(false);
      return;
    }
    if (!saleItems || saleItems.length === 0) {
      alert("El carrito está vacío");
      setIsProcessing(false);
      return;
    }

    // Verificar stock de forma concurrente
    try {
      await Promise.all(saleItems.map(async (item) => {
        console.log("Verificando stock para:", item);
        const productResp = await fetch(`${BACKEND_URL}/products/${item.productId}`);
        if (!productResp.ok) {
          throw new Error(`Producto no encontrado: ${item.productName}`);
        }
        const product = await productResp.json();
        if (item.variantColor) {
          const variant = product.variants.find(v => v.color === item.variantColor);
          if (!variant || variant.stock < item.quantity) {
            throw new Error(`Stock insuficiente para la variante ${item.variantColor} de ${item.productName}`);
          }
        } else {
          if (product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${item.productName}`);
          }
        }
      }));
    } catch (err) {
      alert(err.message);
      console.log(err.message);
      setIsProcessing(false);
      return;
    }

    // Generar un id único para la venta (porque el back espera un id manual)
    const saleId = Date.now().toString() + '-' + Math.floor(Math.random() * 1000).toString();
    console.log("Sale ID generado:", saleId);

    // Preparar los ítems para enviar solo las propiedades requeridas
    const processedItems = saleItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      quantity: item.quantity
    }));

    // Construir el objeto de venta, incluyendo el id generado
    const saleRecord = {
      id: saleId,
      cashierId: currentUser?.id || null,
      sessionId: currentSession?.id || null,
      items: processedItems,
      total: computedTotal,
      amountPaid: parsedAmountPaid,
      change: paymentMethod === 'efectivo' ? parseFloat(change.toFixed(2)) : 0,
      paymentMethod: paymentMethod
    };

    console.log("Registro de venta a enviar:", saleRecord);

    try {
      const saleResp = await fetch(`${BACKEND_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleRecord)
      });
      console.log("Respuesta registro venta:", saleResp.status);
      if (!saleResp.ok) {
        const errorData = await saleResp.json();
        console.error("Error al registrar la venta:", errorData);
        throw new Error(`Error al registrar la venta: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Error registrando la venta:", error);
      alert("No se pudo registrar la venta. Revisa la consola para más detalles.");
      setIsProcessing(false);
      return;
    }

    // Generar el PDF de la factura de forma inmediata
    console.log("Generando PDF de la factura...");
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(12);
    doc.text("Factura", 10, y);
    y += 10;
    doc.text(`Venta ID: ${saleId}`, 10, y);
    y += 10;
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 10, y);
    y += 10;
    doc.text(`Método de Pago: ${paymentMethod}`, 10, y);
    y += 10;
    doc.text("Productos:", 10, y);
    y += 10;
    processedItems.forEach(item => {
      doc.text(`${item.productName} x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`, 10, y);
      y += 10;
    });
    doc.text(`Total: $${computedTotal.toFixed(2)}`, 10, y);
    y += 10;
    doc.text(`Recibido: $${parsedAmountPaid.toFixed(2)}`, 10, y);
    y += 10;
    doc.text(`Cambio: $${paymentMethod === 'efectivo' ? change.toFixed(2) : '0.00'}`, 10, y);
    doc.save("factura.pdf");
    console.log("PDF generado y guardado.");

    // Confirmar la venta inmediatamente y limpiar la UI
    console.log("Venta confirmada. Procediendo a actualizar stock en segundo plano.");
    onSaleProcessed();
    onClose();

    // Actualizar stock en segundo plano sin bloquear al usuario
    setTimeout(async () => {
      try {
        await Promise.all(saleItems.map(async (item) => {
          const productResp = await fetch(`${BACKEND_URL}/products/${item.productId}`);
          if (!productResp.ok) {
            console.error(`Producto no encontrado en actualización de stock: ${item.productName}`);
            return;
          }
          const product = await productResp.json();
          console.log("Actualizando stock para producto:", product.id);
          if (item.variantColor) {
            const variant = product.variants.find(v => v.color === item.variantColor);
            if (variant) {
              variant.stock -= item.quantity;
              console.log(`Nuevo stock para variante ${item.variantColor} en segundo plano:`, variant.stock);
            }
          } else {
            product.stock -= item.quantity;
            console.log(`Nuevo stock para ${product.name} en segundo plano:`, product.stock);
          }
          const updateResp = await fetch(`${BACKEND_URL}/products/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
          });
          console.log("Respuesta actualización stock en segundo plano:", updateResp.status);
        }));
        console.log("Actualización de stock en segundo plano completada.");
      } catch (error) {
        console.error("Error en la actualización de stock en segundo plano:", error);
      }
    }, 0);
    setIsProcessing(false);
  };

  return (
    <div className="payment-modal-backdrop">
      <div className="payment-modal">
        <div className="modal-header">
          <h5>Procesar Pago y Generar Factura</h5>
          <button className="close btn btn-sm btn-light" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body">
          <p>
            <strong>Total a Pagar: </strong>${computedTotal.toFixed(2)}
          </p>
          <div className="form-group">
            <label>Tipo de Pago</label>
            <select
              className="form-control"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                console.log("Método de pago seleccionado:", e.target.value);
              }}
            >
              <option value="efectivo">Efectivo</option>
              <option value="debito">Tarjeta de Débito</option>
              <option value="credito">Tarjeta de Crédito</option>
              <option value="transferencia">Transferencia</option>
              <option value="qr">QR</option>
            </select>
          </div>
          <div className="form-group">
            <label>Monto Recibido</label>
            <input
              type="number"
              className="form-control"
              disabled={paymentMethod !== 'efectivo'}
              value={amountPaid}
              onChange={(e) => {
                setAmountPaid(e.target.value);
                console.log("Monto modificado:", e.target.value);
              }}
            />
          </div>
          {paymentMethod === 'efectivo' && (
            <NumericKeypad onKeyPress={handleKeypadPress} />
          )}
          <p>
            <strong>Cambio: </strong>
            {paymentMethod === 'efectivo' && !isNaN(change)
              ? `$${change.toFixed(2)}`
              : '$0.00'}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-success" onClick={handleProcessPayment} disabled={isProcessing}>
            Procesar
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
