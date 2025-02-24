// src/components/NumericKeypad.js
import React, { useEffect } from 'react';

export default function NumericKeypad({ visible, onKeyPress }) {
  useEffect(() => {
    // Podrías montar eventos, etc. si fuera necesario
  }, []);

  if (!visible) return null;

  const handleClick = (key) => {
    onKeyPress(key);
  };

  return (
    <div
      id="numericKeypad"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: '#f8f9fa',
        borderTop: '2px solid #ccc',
        padding: '10px'
      }}
    >
      {['7','8','9','4','5','6','1','2','3','0','.'].map((k, idx) => {
        if (idx % 3 === 0) {
          // Cada 3 elementos, salta de fila (puedes mejorar la presentación)
        }
        return (
          <button
            key={k}
            className="btn btn-secondary"
            style={{ width: 60, height: 60, margin: 5, fontSize: '1.2rem' }}
            onClick={() => handleClick(k)}
          >
            {k}
          </button>
        );
      })}
      <button
        className="btn btn-danger"
        style={{ width: 60, height: 60, margin: 5, fontSize: '1.2rem' }}
        onClick={() => handleClick('del')}
      >
        ←
      </button>
    </div>
  );
}
