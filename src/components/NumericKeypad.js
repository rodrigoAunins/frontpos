// src/components/NumericKeypad.js
import React from 'react';
import './NumericKeypad.css';

export default function NumericKeypad({ onKeyPress }) {
  const handleClick = (key) => {
    if (onKeyPress) {
      onKeyPress(key);
    }
  };

  return (
    <div className="numeric-keypad">
      <div className="nk-row">
        <button onClick={() => handleClick('7')}>7</button>
        <button onClick={() => handleClick('8')}>8</button>
        <button onClick={() => handleClick('9')}>9</button>
      </div>
      <div className="nk-row">
        <button onClick={() => handleClick('4')}>4</button>
        <button onClick={() => handleClick('5')}>5</button>
        <button onClick={() => handleClick('6')}>6</button>
      </div>
      <div className="nk-row">
        <button onClick={() => handleClick('1')}>1</button>
        <button onClick={() => handleClick('2')}>2</button>
        <button onClick={() => handleClick('3')}>3</button>
      </div>
      <div className="nk-row">
        <button onClick={() => handleClick('0')}>0</button>
        <button onClick={() => handleClick('.')}>.</button>
        <button onClick={() => handleClick('del')}>←</button>
      </div>
    </div>
  );
}
