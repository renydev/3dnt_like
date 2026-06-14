import { Injectable } from '@angular/core';
import {
  ALL_PERICIAS,
  PERICIA_MAP,
  PERICIA_CATEGORIES,
  PericiaDef,
  EspecializacaoDef,
} from '../data/pericias.data';

@Injectable({ providedIn: 'root' })
export class PericiaService {

  get pericias(): PericiaDef[] { return ALL_PERICIAS; }
  get categories() { return PERICIA_CATEGORIES; }

  getPericia(id: string): PericiaDef | undefined { return PERICIA_MAP.get(id); }

  periciasByCategory(categoryId: string): PericiaDef[] {
    return ALL_PERICIAS.filter(p => p.category === categoryId);
  }

  /** Custo total de uma seleção de perícias (cada uma custa 3 pontos). */
  totalCost(periciaIds: string[]): number {
    return periciaIds.reduce((sum, id) => {
      return sum + (PERICIA_MAP.get(id)?.cost ?? 0);
    }, 0);
  }

  /** Retorna os nomes das perícias selecionadas. */
  names(periciaIds: string[]): string[] {
    return periciaIds.map(id => PERICIA_MAP.get(id)?.name ?? id);
  }

  /** Todas as especializações de uma perícia. */
  especializacoes(periciaId: string): EspecializacaoDef[] {
    return PERICIA_MAP.get(periciaId)?.especializacoes ?? [];
  }
}
