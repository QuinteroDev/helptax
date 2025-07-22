// src/pages/Ingresos.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ingresosService } from '../services/api';
import { Ingreso, Trimestre } from '../types';

function Ingresos() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState<Ingreso | null>(null);
  
  // Filtros
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as Trimestre;
  const [selectedTrimestre, setSelectedTrimestre] = useState<Trimestre>(currentQuarter);
  const [selectedAño, setSelectedAño] = useState(currentYear);

  // Form state
  const [formData, setFormData] = useState<Partial<Ingreso>>({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    descripcion: '',
    cliente: '',
    importe: 0,
    iva_porcentaje: 21,
    irpf_porcentaje: 7,
    trimestre: selectedTrimestre,
    año: selectedAño,
  });

  useEffect(() => {
    fetchIngresos();
  }, [selectedTrimestre, selectedAño]);

  const fetchIngresos = async () => {
    try {
      setLoading(true);
      const data = await ingresosService.getAll(selectedTrimestre, selectedAño);
      setIngresos(data);
    } catch (error) {
      console.error('Error fetching ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIngreso) {
        await ingresosService.update(editingIngreso.id!, formData);
      } else {
        await ingresosService.create(formData as Omit<Ingreso, 'id'>);
      }
      setShowForm(false);
      setEditingIngreso(null);
      resetForm();
      fetchIngresos();
    } catch (error) {
      console.error('Error saving ingreso:', error);
    }
  };

  const handleEdit = (ingreso: Ingreso) => {
    setEditingIngreso(ingreso);
    setFormData({
      fecha: ingreso.fecha,
      descripcion: ingreso.descripcion,
      cliente: ingreso.cliente,
      importe: ingreso.importe,
      iva_porcentaje: ingreso.iva_porcentaje,
      irpf_porcentaje: ingreso.irpf_porcentaje,
      trimestre: ingreso.trimestre,
      año: ingreso.año,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este ingreso?')) {
      try {
        await ingresosService.delete(id);
        fetchIngresos();
      } catch (error) {
        console.error('Error deleting ingreso:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      descripcion: '',
      cliente: '',
      importe: 0,
      iva_porcentaje: 21,
      irpf_porcentaje: 7,
      trimestre: selectedTrimestre,
      año: selectedAño,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const totalIngresos = ingresos.reduce((sum, ing) => sum + Number(ing.importe), 0);
  const totalIVA = ingresos.reduce((sum, ing) => sum + Number(ing.iva_importe || 0), 0);
  const totalIRPF = ingresos.reduce((sum, ing) => sum + Number(ing.irpf_importe || 0), 0);

  return (
    <div className="ingresos-page">
      <div className="page-header">
        <h1 className="page-title">Gestión de Ingresos</h1>
        <p className="page-subtitle">Registra y gestiona tus facturas emitidas</p>
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
            setEditingIngreso(null);
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={20} />
          Nuevo Ingreso
        </button>
      </div>

      {/* Resumen */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Ingresos</div>
          <div className="stat-value positive">{formatCurrency(totalIngresos)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">IVA Repercutido</div>
          <div className="stat-value">{formatCurrency(totalIVA)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">IRPF Retenido</div>
          <div className="stat-value">{formatCurrency(totalIRPF)}</div>
        </div>
      </div>

      {/* Tabla de ingresos */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Descripción</th>
                <th>Importe</th>
                <th>IVA</th>
                <th>IRPF</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center">Cargando...</td>
                </tr>
              ) : ingresos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">No hay ingresos registrados</td>
                </tr>
              ) : (
                ingresos.map((ingreso) => (
                  <tr key={ingreso.id}>
                    <td>{format(new Date(ingreso.fecha), 'dd/MM/yyyy')}</td>
                    <td>{ingreso.cliente}</td>
                    <td>{ingreso.descripcion}</td>
                    <td className="text-right">{formatCurrency(ingreso.importe)}</td>
                    <td className="text-right">
                      {ingreso.iva_porcentaje}% ({formatCurrency(ingreso.iva_importe || 0)})
                    </td>
                    <td className="text-right">
                      {ingreso.irpf_porcentaje}% ({formatCurrency(ingreso.irpf_importe || 0)})
                    </td>
                    <td className="text-right positive">{formatCurrency(ingreso.total || 0)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(ingreso)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(ingreso.id!)}
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
                {editingIngreso ? 'Editar Ingreso' : 'Nuevo Ingreso'}
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
                <label className="form-label">Cliente</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
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
                <label className="form-label">IRPF %</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="form-input"
                  value={formData.irpf_porcentaje}
                  onChange={(e) => setFormData({ ...formData, irpf_porcentaje: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingIngreso ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ingresos;