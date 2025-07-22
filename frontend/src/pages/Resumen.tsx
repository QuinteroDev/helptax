// src/pages/Resumen.tsx

import React, { useState, useEffect } from 'react';
import { Calculator, FileText, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { resumenService } from '../services/api';
import { ResumenTrimestral, Trimestre } from '../types';

function Resumen() {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<ResumenTrimestral | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as Trimestre;
  const [selectedTrimestre, setSelectedTrimestre] = useState<Trimestre>(currentQuarter);
  const [selectedAño, setSelectedAño] = useState(currentYear);

  useEffect(() => {
    fetchResumen();
  }, [selectedTrimestre, selectedAño]);

  const fetchResumen = async () => {
    try {
      setLoading(true);
      const data = await resumenService.calcular(selectedTrimestre, selectedAño);
      setResumen(data);
    } catch (error) {
      console.error('Error fetching resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleVerDetalle = (tipo: 'ingresos' | 'gastos') => {
    // Guardar filtros en localStorage para que las páginas de ingresos/gastos los usen
    localStorage.setItem('filtro_trimestre', selectedTrimestre.toString());
    localStorage.setItem('filtro_año', selectedAño.toString());
    navigate(`/${tipo}`);
  };

  if (loading) return <div className="loading">Cargando resumen...</div>;
  if (!resumen) return <div>No hay datos disponibles para este período</div>;

  // Datos para el gráfico de pie
  const pieData = [
    { name: 'Gastos', value: Number(resumen.gastos_totales), color: '#ef4444' },
    { name: 'Beneficio', value: Math.max(0, Number(resumen.beneficio_neto)), color: '#10b981' },
  ];

  // Cálculos adicionales
  const porcentajeGastos = Number(resumen.ingresos_totales) > 0 
    ? (Number(resumen.gastos_totales) / Number(resumen.ingresos_totales) * 100).toFixed(1)
    : '0';

  return (
    <div className="resumen-page">
      <div className="page-header">
        <h1 className="page-title">Resumen Trimestral</h1>
        <p className="page-subtitle">
          Análisis completo de Q{selectedTrimestre} {selectedAño}
        </p>
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
      </div>

      {/* Período */}
      <div className="card">
        <div className="period-info">
          <Calculator size={24} />
          <div>
            <h3>Período de liquidación</h3>
            <p>
              Del {format(new Date(resumen.fecha_inicio), "d 'de' MMMM", { locale: es })} 
              {' '}al {format(new Date(resumen.fecha_fin), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen Principal */}
      <div className="summary-grid">
        <div className="summary-card income">
          <div className="summary-header">
            <TrendingUp size={24} />
            <h3>Ingresos</h3>
          </div>
          <div className="summary-value">{formatCurrency(resumen.ingresos_totales)}</div>
          <div className="summary-details">
            <div className="detail-row">
              <span>Base imponible:</span>
              <span>{formatCurrency(resumen.ingresos_totales)}</span>
            </div>
            <div className="detail-row">
              <span>IVA repercutido:</span>
              <span>{formatCurrency(resumen.iva_repercutido)}</span>
            </div>
            <div className="detail-row total">
              <span>Total facturado:</span>
              <span>{formatCurrency(Number(resumen.ingresos_totales) + Number(resumen.iva_repercutido))}</span>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-block"
            onClick={() => handleVerDetalle('ingresos')}
            style={{ marginTop: '1rem' }}
          >
            <Eye size={16} />
            Ver detalle
          </button>
        </div>

        <div className="summary-card expense">
          <div className="summary-header">
            <TrendingDown size={24} />
            <h3>Gastos</h3>
          </div>
          <div className="summary-value">{formatCurrency(resumen.gastos_totales)}</div>
          <div className="summary-details">
            <div className="detail-row">
              <span>Base imponible:</span>
              <span>{formatCurrency(resumen.gastos_totales)}</span>
            </div>
            <div className="detail-row">
              <span>IVA soportado:</span>
              <span>{formatCurrency(resumen.iva_soportado)}</span>
            </div>
            <div className="detail-row total">
              <span>Total gastos:</span>
              <span>{formatCurrency(Number(resumen.gastos_totales) + Number(resumen.iva_soportado))}</span>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-block"
            onClick={() => handleVerDetalle('gastos')}
            style={{ marginTop: '1rem' }}
          >
            <Eye size={16} />
            Ver detalle
          </button>
        </div>
      </div>

      {/* Gráfico y liquidaciones */}
      <div className="analysis-grid">
        <div className="card">
          <h3 className="card-title">Distribución Ingresos vs Gastos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${formatCurrency(Number(entry.value))}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-summary">
            <p>Gastos representan el <strong>{porcentajeGastos}%</strong> de los ingresos</p>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Liquidaciones a realizar</h3>
          <div className="liquidation-details">
            <div className="liquidation-section">
              <h4>Liquidación IVA (Modelo 303)</h4>
              <div className="detail-row">
                <span>IVA repercutido:</span>
                <span className="positive">{formatCurrency(resumen.iva_repercutido)}</span>
              </div>
              <div className="detail-row">
                <span>IVA soportado:</span>
                <span className="negative">-{formatCurrency(resumen.iva_soportado)}</span>
              </div>
              <div className="detail-row total">
                <span>A ingresar:</span>
                <span className={resumen.iva_a_pagar >= 0 ? 'negative' : 'positive'}>
                  {formatCurrency(resumen.iva_a_pagar)}
                </span>
              </div>
            </div>

            <div className="liquidation-section">
              <h4>Pago fraccionado IRPF (Modelo 130)</h4>
              <div className="detail-row">
                <span>Base (Beneficio neto):</span>
                <span>{formatCurrency(resumen.beneficio_neto)}</span>
              </div>
              <div className="detail-row">
                <span>Tipo aplicable:</span>
                <span>20%</span>
              </div>
              <div className="detail-row total">
                <span>A ingresar:</span>
                <span className="negative">{formatCurrency(resumen.irpf_a_ingresar)}</span>
              </div>
            </div>

            <div className="total-liquidation">
              <h4>Total a liquidar este trimestre</h4>
              <div className="total-amount">
                {formatCurrency(Number(resumen.iva_a_pagar) + Number(resumen.irpf_a_ingresar))}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

export default Resumen;