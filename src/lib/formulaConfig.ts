// Cambia esta constante para modificar cómo se combinan peso y tiempo en la distribución.
// 'tiempo_x_peso' = multiplicativo (industria estándar en costeo por tiempos)
// 'tiempo'        = solo el tiempo importa, ignora el peso
// 'peso'          = comportamiento anterior, ignora el tiempo

export type FormulaMode = 'tiempo_x_peso' | 'tiempo' | 'peso';

export const FORMULA_MODE: FormulaMode = 'tiempo_x_peso';

export function effectiveWeight(peso: number, tiempo: number): number {
  switch (FORMULA_MODE) {
    case 'tiempo_x_peso': return peso * tiempo;
    case 'tiempo':        return tiempo;
    case 'peso':          return peso;
  }
}
