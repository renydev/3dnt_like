import { Injectable } from '@angular/core';
import {
  ALL_VANTAGENS,
  VANTAGEM_MAP,
  VANTAGEM_CATEGORIES,
  VantagemDef,
  VantagemCategory,
} from '../data/vantagens.data';

@Injectable({ providedIn: 'root' })
export class VantagensService {

  get vantagens(): VantagemDef[] { return ALL_VANTAGENS; }
  get categories() { return VANTAGEM_CATEGORIES; }

  getVantagem(id: string): VantagemDef | undefined { return VANTAGEM_MAP.get(id); }

  vantagensByCategory(category: VantagemCategory): VantagemDef[] {
    return ALL_VANTAGENS.filter(v => v.category === category);
  }

  /** Retorna os nomes das vantagens selecionadas. */
  names(vantagemIds: string[]): string[] {
    return vantagemIds.map(id => VANTAGEM_MAP.get(id)?.name ?? id);
  }
}
