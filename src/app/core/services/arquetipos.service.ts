import { Injectable } from '@angular/core';
import { ALL_ARQUETIPOS, ARQUETIPO_MAP, Arquetipo } from '../data/arquetipos.data';
import { CharacterRace } from '../models/character.model';

/** Serviço dedicado aos Arquétipos (origem do personagem) do 3DeT Victory. */
@Injectable({ providedIn: 'root' })
export class ArquetiposService {

  get arquetipos(): Arquetipo[] { return ALL_ARQUETIPOS; }

  getArquetipo(id: CharacterRace): Arquetipo | undefined { return ARQUETIPO_MAP.get(id); }

  getByDifficulty(diff: Arquetipo['difficulty']): Arquetipo[] {
    return ALL_ARQUETIPOS.filter(a => a.difficulty === diff);
  }

  names(ids: CharacterRace[]): string[] {
    return ids.map(id => ARQUETIPO_MAP.get(id)?.name ?? id);
  }
}
