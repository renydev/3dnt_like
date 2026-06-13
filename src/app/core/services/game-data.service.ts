import { Injectable } from '@angular/core';
import { CharacterClass, CharacterRace } from '../models/character.model';
import { Race, ALL_RACES, RACE_MAP } from '../data/races.data';
import { ClassDef, ALL_CLASSES, CLASS_MAP } from '../data/classes.data';

@Injectable({ providedIn: 'root' })
export class GameDataService {

  // ── Raças ──────────────────────────────────────────────────────────────────

  get races(): Race[] { return ALL_RACES; }

  getRace(id: CharacterRace): Race | undefined { return RACE_MAP.get(id); }

  getRacesByDifficulty(diff: Race['difficulty']): Race[] {
    return ALL_RACES.filter(r => r.difficulty === diff);
  }

  // ── Classes ────────────────────────────────────────────────────────────────

  get classes(): ClassDef[] { return ALL_CLASSES; }

  getClass(id: CharacterClass): ClassDef | undefined { return CLASS_MAP.get(id); }

  getClassesByDifficulty(diff: ClassDef['difficulty']): ClassDef[] {
    return ALL_CLASSES.filter(c => c.difficulty === diff);
  }

  // ── Cálculo de personagem ──────────────────────────────────────────────────

  calculateFinalStats(raceId: CharacterRace, classId: CharacterClass): {
    forca: number; habilidade: number; resistencia: number;
    armadura: number; pontosMagia: number; pontosVida: number;
    bonusPoints: number;
  } {
    const race = this.getRace(raceId);
    const cls = this.getClass(classId);
    if (!race || !cls) throw new Error(`Race ${raceId} or class ${classId} not found`);

    const forca      = cls.baseStats.forca      + (race.modifiers.forca      ?? 0);
    const habilidade = cls.baseStats.habilidade + (race.modifiers.habilidade ?? 0);
    const resistencia= cls.baseStats.resistencia+ (race.modifiers.resistencia?? 0);
    const armadura   = cls.baseStats.armadura   + (race.modifiers.armadura   ?? 0);
    const pontosMagia= cls.baseStats.pontosMagia+ (race.modifiers.pontosMagia?? 0);
    const pontosVida = cls.pvBase + (race.modifiers.pontosVida ?? 0);

    return {
      forca:       Math.max(1, forca),
      habilidade:  Math.max(1, habilidade),
      resistencia: Math.max(1, resistencia),
      armadura:    Math.max(0, armadura),
      pontosMagia: Math.max(0, pontosMagia),
      pontosVida:  Math.max(5, pontosVida),
      bonusPoints: race.bonusPoints,
    };
  }

  /** Pontos de personagem disponíveis para vantagens (base 5 + bônus racial) */
  availablePoints(raceId: CharacterRace): number {
    return 5 + (this.getRace(raceId)?.bonusPoints ?? 0);
  }
}
