import { ErrorDeNegocio } from '@/lib/reglas/errores';

export interface RangoCalendario {
  anioGravable: number;
  digitoDesde: number;
  digitoHasta: number;
  fechaLimite: string;
}

export function dosUltimosDigitos(cc: string): number {
  return Number(cc.slice(-2));
}

export function buscarFechaEnCalendario(cc: string, rangos: RangoCalendario[]): string | null {
  if (rangos.length === 0) return null;
  const anioVigente = Math.max(...rangos.map((rango) => rango.anioGravable));
  const digitos = dosUltimosDigitos(cc);
  return rangos.find((rango) =>
    rango.anioGravable === anioVigente
    && digitos >= rango.digitoDesde
    && digitos <= rango.digitoHasta)?.fechaLimite ?? null;
}

export function rangosSeSolapan(a: RangoCalendario, b: RangoCalendario): boolean {
  return a.anioGravable === b.anioGravable
    && a.digitoDesde <= b.digitoHasta
    && b.digitoDesde <= a.digitoHasta;
}

export function validarNuevoRango(nuevo: RangoCalendario, existentes: RangoCalendario[]): void {
  if (nuevo.digitoDesde < 0 || nuevo.digitoHasta > 99 || nuevo.digitoDesde > nuevo.digitoHasta) {
    throw new ErrorDeNegocio('RANGO_INVALIDO');
  }
  if (existentes.some((existente) => rangosSeSolapan(nuevo, existente))) {
    throw new ErrorDeNegocio('RANGO_SOLAPADO');
  }
}
