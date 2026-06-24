import { Injectable } from '@angular/core';
import { ALL_KITS, KIT_MAP, KitDef, kitsCost } from '../data/kits.data';

@Injectable({ providedIn: 'root' })
export class KitsService {

  get kits(): KitDef[] { return ALL_KITS; }

  getKit(id: string): KitDef | undefined { return KIT_MAP.get(id); }

  names(kitIds: string[]): string[] {
    return kitIds.map(id => KIT_MAP.get(id)?.name ?? id);
  }

  /** Custo total para uma quantidade de kits (1pt o primeiro, +1pt cada adicional). */
  totalCost(kitIds: string[]): number {
    return kitsCost(kitIds.length);
  }

  /** Custo do PRÓXIMO kit, dado quantos já foram escolhidos. */
  nextCost(currentCount: number): number {
    return kitsCost(currentCount + 1) - kitsCost(currentCount);
  }
}
