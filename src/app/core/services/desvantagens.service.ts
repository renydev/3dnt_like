import { Injectable } from '@angular/core';
import {
  ALL_DESVANTAGENS,
  DESVANTAGEM_MAP,
  DESVANTAGEM_CATEGORIES,
  DesvantagemDef,
  DesvantagemCategory,
} from '../data/desvantagens.data';

@Injectable({ providedIn: 'root' })
export class DesvantagensService {

  get desvantagens(): DesvantagemDef[] { return ALL_DESVANTAGENS; }
  get categories() { return DESVANTAGEM_CATEGORIES; }

  getDesvantagem(id: string): DesvantagemDef | undefined { return DESVANTAGEM_MAP.get(id); }

  desvantagensByCategory(category: DesvantagemCategory): DesvantagemDef[] {
    return ALL_DESVANTAGENS.filter(d => d.category === category);
  }

  /** Retorna os nomes das desvantagens selecionadas. */
  names(desvantagemIds: string[]): string[] {
    return desvantagemIds.map(id => DESVANTAGEM_MAP.get(id)?.name ?? id);
  }
}
