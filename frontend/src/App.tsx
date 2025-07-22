// src/App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Calculator, FileText, TrendingUp, Home, LogOut, User, Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Ingresos from './pages/Ingresos';
import Gastos from './pages/Gastos';
import Resumen from './pages/Resumen';
import Perfil from './pages/Perfil';
import Login from './pages/Login';
import Register from './pages/Register';
import Logo from './components/Logo';
import { authService } from './services/authService';
import './App.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function Navigation() {
  const location = useLocation();
  const [user, setUser] = useState(authService.getStoredUser());
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/ingresos', label: 'Ingresos', icon: TrendingUp },
    { path: '/gastos', label: 'Gastos', icon: FileText },
    { path: '/resumen', label: 'Resumen', icon: Calculator },
  ];

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  // No mostrar navegación en páginas de auth
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="nav-container">
      <div className="nav-brand">
        <Logo variant="horizontal" size={40} />
      </div>
      <div className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="nav-user">
        <Link to="/perfil" className="user-info-link">
          <div className="user-info">
            <User size={18} />
            <span>{user?.perfil?.nombre_fiscal || user?.email}</span>
          </div>
        </Link>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} />
          Salir
        </button>
      </div>
    </nav>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token válido al cargar la app
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await authService.getCurrentUser();
        } catch (error) {
          // Token inválido, limpiar
          authService.logout();
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/ingresos" element={
              <ProtectedRoute>
                <Ingresos />
              </ProtectedRoute>
            } />
            <Route path="/gastos" element={
              <ProtectedRoute>
                <Gastos />
              </ProtectedRoute>
            } />
            <Route path="/resumen" element={
              <ProtectedRoute>
                <Resumen />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;