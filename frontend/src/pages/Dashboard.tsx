// src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calculator, Euro, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { resumenService } from '../services/api';
import { ResumenTrimestral, Trimestre } from '../types';

function Dashboard() {
  const [resumen, setResumen] = useState<ResumenTrimestral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener trimestre actual
  const getCurrentQuarter = (): Trimestre => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 1;
    if (month <= 6) return 2;
    if (month <= 9) return 3;
    return 4;
  };
  
  const currentYear = 2025; // new Date().getFullYear();
  const currentQuarter = 3 as Trimestre; // getCurrentQuarter();

  useEffect(() => {
    fetchResumen();
  }, []);

  const fetchResumen = async () => {
    try {
      setLoading(true);
      const data = await resumenService.calcular(currentQuarter, currentYear);
      setResumen(data);
    } catch (err) {
      setError('Error al cargar el resumen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!resumen) return <div>No hay datos disponibles</div>;

  // Preparar datos para el gráfico circular
  const pieData = [
    { 
      name: 'Gastos', 
      value: Math.abs(Number(resumen.gastos_totales) || 0), 
      color: '#ef4444' 
    },
    { 
      name: 'Beneficio', 
      value: Math.max(0, Number(resumen.beneficio_neto) || 0), 
      color: '#22c55e' 
    },
  ];

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0,00 €';
    
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(numValue);
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard Q{currentQuarter} {currentYear}</h1>
        <p className="page-subtitle">
          Resumen del {format(new Date(resumen.fecha_inicio), 'd MMMM', { locale: es })} 
          {' '}al {format(new Date(resumen.fecha_fin), 'd MMMM yyyy', { locale: es })}
        </p>
      </div>

      {/* Stats Grid - Ahora con 5 indicadores */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <TrendingUp size={20} /> Ingresos Totales
          </div>
          <div className="stat-value positive">
            {formatCurrency(resumen.ingresos_totales)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <TrendingDown size={20} /> Gastos Totales
          </div>
          <div className="stat-value negative">
            {formatCurrency(resumen.gastos_totales)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Euro size={20} /> Beneficio Neto
          </div>
          <div className={`stat-value ${Number(resumen.beneficio_neto) >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(resumen.beneficio_neto)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Receipt size={20} /> IVA a Liquidar
          </div>
          <div className={`stat-value ${Number(resumen.iva_a_pagar) >= 0 ? 'negative' : 'positive'}`}>
            {formatCurrency(resumen.iva_a_pagar)}
          </div>
          <div className="stat-subtitle">
            {Number(resumen.iva_a_pagar) >= 0 ? 'A pagar' : 'A compensar'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Calculator size={20} /> IRPF a Ingresar
          </div>
          <div className="stat-value negative">
            {formatCurrency(resumen.irpf_a_ingresar)}
          </div>
          <div className="stat-subtitle">
            20% del beneficio
          </div>
        </div>
      </div>

      {/* Gráfico circular mejorado */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Distribución Ingresos vs Gastos</h2>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: string, entry: any) => {
                  const formattedValue = formatCurrency(entry.payload?.value || 0);
                  return `${value}: ${formattedValue}`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-summary">
            <p>Margen de beneficio: <strong>{
              Number(resumen.ingresos_totales) > 0 
                ? ((Number(resumen.beneficio_neto) / Number(resumen.ingresos_totales)) * 100).toFixed(1) 
                : '0'
            }%</strong></p>
            <p>Total a liquidar este trimestre: <strong>{
              formatCurrency((Number(resumen.iva_a_pagar) || 0) + (Number(resumen.irpf_a_ingresar) || 0))
            }</strong></p>
          </div>
        </div>
      </div>

      {/* Últimos movimientos */}
      <div className="recent-movements">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Últimos Ingresos</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Descripción</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {resumen.ingresos_detalle?.slice(0, 5).map((ingreso) => (
                  <tr key={ingreso.id}>
                    <td>{format(new Date(ingreso.fecha), 'dd/MM/yyyy')}</td>
                    <td>{ingreso.cliente}</td>
                    <td>{ingreso.descripcion}</td>
                    <td className="text-right positive">{formatCurrency(ingreso.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Últimos Gastos</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Descripción</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {resumen.gastos_detalle?.slice(0, 5).map((gasto) => (
                  <tr key={gasto.id}>
                    <td>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</td>
                    <td>{gasto.proveedor}</td>
                    <td>{gasto.descripcion}</td>
                    <td className="text-right negative">{formatCurrency(gasto.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;