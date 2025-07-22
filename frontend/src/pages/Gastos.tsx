// src/pages/Gastos.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { gastosService } from '../services/api';
import { Gasto, Trimestre } from '../types';

function Gastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Filtros
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as Trimestre;
  
  // Leer filtros del localStorage si vienen del Resumen
  const savedTrimestre = localStorage.getItem('filtro_trimestre');
  const savedAño = localStorage.getItem('filtro_año');
  
  const [selectedTrimestre, setSelectedTrimestre] = useState<Trimestre>(
    savedTrimestre ? parseInt(savedTrimestre) as Trimestre : currentQuarter
  );
  const [selectedAño, setSelectedAño] = useState(
    savedAño ? parseInt(savedAño) : currentYear
  );

  // Limpiar localStorage después de usar los filtros
  useEffect(() => {
    if (savedTrimestre || savedAño) {
      localStorage.removeItem('filtro_trimestre');
      localStorage.removeItem('filtro_año');
    }
  }, []);

  // Form state
  const [formData, setFormData] = useState<Partial<Gasto>>({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    descripcion: '',
    proveedor: '',
    importe: 0,
    iva_porcentaje: 21,
    trimestre: selectedTrimestre,
    año: selectedAño,
  });

  useEffect(() => {
    fetchGastos();
  }, [selectedTrimestre, selectedAño]);

  const fetchGastos = async () => {
    try {
      setLoading(true);
      const data = await gastosService.getAll(selectedTrimestre, selectedAño);
      setGastos(data);
    } catch (error) {
      console.error('Error fetching gastos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = new FormData();
      
      // Añadir todos los campos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          dataToSend.append(key, value.toString());
        }
      });

      // Añadir archivo si existe
      if (selectedFile) {
        dataToSend.append('factura', selectedFile);
      }

      if (editingGasto) {
        await gastosService.update(editingGasto.id!, dataToSend);
      } else {
        await gastosService.create(dataToSend);
      }
      
      setShowForm(false);
      setEditingGasto(null);
      setSelectedFile(null);
      resetForm();
      fetchGastos();
    } catch (error) {
      console.error('Error saving gasto:', error);
    }
  };

  const handleEdit = (gasto: Gasto) => {
    setEditingGasto(gasto);
    setFormData({
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
      proveedor: gasto.proveedor,
      importe: gasto.importe,
      iva_porcentaje: gasto.iva_porcentaje,
      trimestre: gasto.trimestre,
      año: gasto.año,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
      try {
        await gastosService.delete(id);
        fetchGastos();
      } catch (error) {
        console.error('Error deleting gasto:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      descripcion: '',
      proveedor: '',
      importe: 0,
      iva_porcentaje: 21,
      trimestre: selectedTrimestre,
      año: selectedAño,
    });
    setSelectedFile(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.importe), 0);
  const totalIVA = gastos.reduce((sum, gasto) => sum + Number(gasto.iva_importe || 0), 0);

  return (
    <div className="gastos-page">
      <div className="page-header">
        <h1 className="page-title">Gestión de Gastos</h1>
        <p className="page-subtitle">Registra tus gastos deducibles y facturas</p>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filter-group">
          <label className="filter-label">Trimestre</label>
          <select
            className="form-select"
            value={selectedTrimestre}
            onChange={(e) => setSelectedTrimestre(Number(e.target.value) as Trimestre)}
          >
            <option value={1}>Q1 - Primer Trimestre</option>
            <option value={2}>Q2 - Segundo Trimestre</option>
            <option value={3}>Q3 - Tercer Trimestre</option>
            <option value={4}>Q4 - Cuarto Trimestre</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Año</label>
          <select
            className="form-select"
            value={selectedAño}
            onChange={(e) => setSelectedAño(Number(e.target.value))}
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingGasto(null);
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={20} />
          Nuevo Gasto
        </button>
      </div>

      {/* Resumen */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Gastos</div>
          <div className="stat-value negative">{formatCurrency(totalGastos)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">IVA Soportado</div>
          <div className="stat-value">{formatCurrency(totalIVA)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Número de Gastos</div>
          <div className="stat-value">{gastos.length}</div>
        </div>
      </div>

      {/* Tabla de gastos */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Descripción</th>
                <th>Importe</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Factura</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center">Cargando...</td>
                </tr>
              ) : gastos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">No hay gastos registrados</td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                  <tr key={gasto.id}>
                    <td>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</td>
                    <td>{gasto.proveedor}</td>
                    <td>{gasto.descripcion}</td>
                    <td className="text-right">{formatCurrency(gasto.importe)}</td>
                    <td className="text-right">
                      {gasto.iva_porcentaje}% ({formatCurrency(gasto.iva_importe || 0)})
                    </td>
                    <td className="text-right negative">{formatCurrency(gasto.total || 0)}</td>
                    <td>
                      {gasto.factura_url ? (
                        <a
                          href={gasto.factura_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        <span className="text-muted">Sin factura</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(gasto)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(gasto.id!)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Importe (sin IVA)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.importe}
                  onChange={(e) => setFormData({ ...formData, importe: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">IVA %</label>
                <select
                  className="form-select"
                  value={formData.iva_porcentaje}
                  onChange={(e) => setFormData({ ...formData, iva_porcentaje: parseInt(e.target.value) })}
                >
                  <option value={0}>0% (Exento)</option>
                  <option value={21}>21%</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Factura (PDF)</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="file-input"
                  />
                  {selectedFile && (
                    <p className="file-name">
                      <FileText size={16} />
                      {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGasto ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gastos;