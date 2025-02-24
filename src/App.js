// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { restoreSessionFromLocalStorage, storeSessionToLocalStorage } from './services/api';

// Importar las páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    const { user, session } = restoreSessionFromLocalStorage();
    if (user) setCurrentUser(user);
    if (session) setCurrentSession(session);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    storeSessionToLocalStorage(user, currentSession);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentSession(null);
    storeSessionToLocalStorage(null, null);
  };

  return (
-   <BrowserRouter>
      <Routes>
        {/* Ruta de Login */}
        <Route
          path="/"
          element={
            <LoginPage
              currentUser={currentUser}
              onLogin={handleLogin}
              setCurrentSession={setCurrentSession}
            />
          }
        />
        {/* Dashboard + subrutas */}
        <Route
          path="/dashboard/*"
          element={
            <Dashboard
              currentUser={currentUser}
              currentSession={currentSession}
              setCurrentSession={setCurrentSession}
              onLogout={handleLogout}
            />
          }
        />
      </Routes>
-   </BrowserRouter>
  );
}

export default App;
