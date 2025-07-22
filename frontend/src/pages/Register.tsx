// src/pages/Register.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, MapPin, AlertCircle, CreditCard } from 'lucide-react';
import { authService } from '../services/authService';
import Logo from '../components/Logo';
import '../styles/Auth.css';

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password1: '',
    password2: '',
    nombre_fiscal: '',
    nif: '',
    direccion: '',
    codigo_postal: '',
    ciudad: '',
    provincia: '',
    tipo_irpf_default: 7
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateStep1 = () => {
    if (formData.password1 !== formData.password2) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (formData.password1.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verificar si el NIF ya existe
      const nifExists = await authService.checkNIF(formData.nif);
      if (nifExists) {
        setError('Ya existe un usuario registrado con este NIF');
        setLoading(false);
        return;
      }

      await authService.register(formData);
      navigate('/');
    } catch (err: any) {
      if (err.response?.data) {
        const errors = err.response.data;
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('Error al registrar. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-large">
        <div className="auth-header">
          <Logo size={80} className="auth-logo" />
          <h2>Crear Cuenta</h2>
          <p>Registro para autónomos - Paso {step} de 2</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }} className="auth-form">
          {step === 1 ? (
            <>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={18} />
                  Email
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={18} />
                  Contraseña
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password1}
                  onChange={(e) => setFormData({ ...formData, password1: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={18} />
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password2}
                  onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                  placeholder="Repite la contraseña"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Siguiente
              </button>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <User size={18} />
                    Nombre Fiscal
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nombre_fiscal}
                    onChange={(e) => setFormData({ ...formData, nombre_fiscal: e.target.value })}
                    placeholder="Nombre completo o razón social"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <CreditCard size={18} />
                    NIF
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value.toUpperCase() })}
                    placeholder="12345678A"
                    maxLength={9}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={18} />
                  Dirección
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Calle Example, 123"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Código Postal</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                    placeholder="28001"
                    maxLength={5}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Madrid"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Provincia</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    placeholder="Madrid"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">% IRPF por defecto</label>
                <select
                  className="form-select"
                  value={formData.tipo_irpf_default}
                  onChange={(e) => setFormData({ ...formData, tipo_irpf_default: parseInt(e.target.value) })}
                >
                  <option value={7}>7% (Mínimo autónomos)</option>
                  <option value={15}>15% (General)</option>
                  <option value={20}>20%</option>
                </select>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                >
                  Atrás
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta? 
            <Link to="/login" className="auth-link"> Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;