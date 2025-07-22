// src/pages/Perfil.tsx

import React, { useState, useEffect } from 'react';
import { User, Mail, CreditCard, MapPin, Save, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import axios from 'axios';

interface PerfilData {
  email: string;
  nombre_fiscal: string;
  nif: string;
  direccion: string;
  codigo_postal: string;
  ciudad: string;
  provincia: string;
  tipo_irpf_default: number;
  regimen_iva: string;
}

function Perfil() {
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<PerfilData>({
    email: '',
    nombre_fiscal: '',
    nif: '',
    direccion: '',
    codigo_postal: '',
    ciudad: '',
    provincia: '',
    tipo_irpf_default: 7,
    regimen_iva: 'general'
  });

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/user/perfil/');
      const data = response.data;
      
      // Combinar datos del perfil con el email del usuario
      const userResponse = await axios.get('http://localhost:8000/api/user/me/');
      const perfilCompleto = {
        ...data,
        email: userResponse.data.email
      };
      
      setPerfil(perfilCompleto);
      setFormData(perfilCompleto);
    } catch (error) {
      console.error('Error fetching perfil:', error);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // No enviamos email ni NIF ya que no se pueden cambiar
      const { email, nif, ...datosActualizables } = formData;
      
      await axios.patch('http://localhost:8000/api/user/perfil/', datosActualizables);
      
      setSuccess('Perfil actualizado correctamente');
      setPerfil(formData);
      
      // Actualizar el usuario en localStorage
      const user = authService.getStoredUser();
      if (user && user.perfil) {
        user.perfil.nombre_fiscal = formData.nombre_fiscal;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error updating perfil:', error);
      setError('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PerfilData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) return <div className="loading">Cargando perfil...</div>;
  if (!perfil) return <div>No se pudo cargar el perfil</div>;

  return (
    <div className="perfil-page">
      <div className="page-header">
        <h1 className="page-title">Mi Perfil</h1>
        <p className="page-subtitle">Gestiona tu información fiscal y de contacto</p>
      </div>

      <div className="card">
        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <Save size={20} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="perfil-form">
          <div className="form-section">
            <h3 className="form-section-title">Información de cuenta</h3>
            
            <div className="form-group">
              <label className="form-label">
                <Mail size={18} />
                <span style={{ marginLeft: '0.5rem' }}>Email</span>
              </label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                disabled
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Información fiscal</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <User size={18} />
                  <span style={{ marginLeft: '0.5rem' }}>Nombre Fiscal</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre_fiscal}
                  onChange={(e) => handleChange('nombre_fiscal', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={18} />
                  <span style={{ marginLeft: '0.5rem' }}>NIF</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nif}
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">% IRPF por defecto</label>
                <select
                  className="form-select"
                  value={formData.tipo_irpf_default}
                  onChange={(e) => handleChange('tipo_irpf_default', parseInt(e.target.value))}
                >
                  <option value={7}>7% (Mínimo autónomos primer año)</option>
                  <option value={15}>15% (General)</option>
                  <option value={20}>20%</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Régimen IVA</label>
                <select
                  className="form-select"
                  value={formData.regimen_iva}
                  onChange={(e) => handleChange('regimen_iva', e.target.value)}
                >
                  <option value="general">Régimen General</option>
                  <option value="simplificado">Régimen Simplificado</option>
                  <option value="recargo">Recargo de Equivalencia</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Dirección</h3>
            
            <div className="form-group">
              <label className="form-label">
                <MapPin size={18} />
                <span style={{ marginLeft: '0.5rem' }}>Dirección</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
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
                  onChange={(e) => handleChange('codigo_postal', e.target.value)}
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
                  onChange={(e) => handleChange('ciudad', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Provincia</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.provincia}
                  onChange={(e) => handleChange('provincia', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Perfil;