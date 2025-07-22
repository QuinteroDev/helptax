// src/types/index.ts

export interface Ingreso {
    id?: number;
    fecha: string;
    descripcion: string;
    cliente: string;
    importe: number;
    iva_porcentaje: number;
    iva_importe?: number;
    irpf_porcentaje: number;
    irpf_importe?: number;
    total?: number;
    trimestre: number;
    año: number;
  }
  
  export interface Gasto {
    id?: number;
    fecha: string;
    descripcion: string;
    proveedor: string;
    importe: number;
    iva_porcentaje: number;
    iva_importe?: number;
    total?: number;
    factura?: File | string;
    factura_url?: string;
    trimestre: number;
    año: number;
  }
  
  export interface ResumenTrimestral {
    trimestre: number;
    año: number;
    fecha_inicio: string;
    fecha_fin: string;
    ingresos_totales: number;
    gastos_totales: number;
    beneficio_neto: number;
    iva_repercutido: number;
    iva_soportado: number;
    iva_a_pagar: number;
    irpf_a_ingresar: number;
    ingresos_detalle?: Ingreso[];
    gastos_detalle?: Gasto[];
  }
  
  export type Trimestre = 1 | 2 | 3 | 4;
  
  export interface FiltrosTrimestre {
    trimestre: Trimestre;
    año: number;
  }