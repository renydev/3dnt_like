import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Tauron — convertido de "A Libertação de Valkaria" (pág. 65-68).

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme tauron.config.ts layout:
//  2 = Câmara do Minotauro (monster)
//  4 = Câmara do Berserker (monster) — feras de arena
//  6 = Arena do Minotauro Supremo (boss) — Potentius, o gladiador
export const TAURON_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  2: (scale) => {
    const count = d(6) + 1;
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('guerreiro_minotauro', scale));
  },
  4: (scale) => [spawnMonster('minotauro_selvagem', scale)],
  6: (scale) => [spawnMonster('potentius', scale, true)],
};

// ── Encontros aleatórios — prisioneiros de Tauron (tabela 4d do livro) ──
// Roll 4-24: 4-8=minotauros guerreiros, 9-13=minotauros bárbaros, 14-15=bárbaros humanos,
//            16-17=guerreiros humanos, 18-19=bárbaros anões, 20-21=guerreiros anões, 22-24=NPC genérico
export function rollTauronEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 13) {
    const count = d(6) + 4;
    return Array.from({ length: Math.min(count, 5) }, () => spawnMonster('guerreiro_minotauro', scale));
  }
  // 14-24: prisioneiros de outras raças (humanos, anões), todos com stats equivalentes
  const count = d(6) + 2;
  return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('guerreiro_tauron', scale));
}

// ── Feras de arena (tabela 3d, salas de "Desafios da Força") ──
// Roll 3-18: 3-4=minotauros selvagens, 5-6=leões gigantes, 7-8=mantícoras, 9-10=quimeras,
//            11-12=gigantes do fogo, 13-14=golens de pedra, 15-16=verme púrpura, 17-18=wyverns
export function rollTauronArenaBeast(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6);

  if (roll <= 4) return Array.from({ length: d(6) + 2 }, () => spawnMonster('minotauro_selvagem', scale));
  if (roll <= 6) return Array.from({ length: d(6) + 4 }, () => spawnMonster('leao_gigante', scale));
  if (roll <= 8) return Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('manticora', scale));
  if (roll <= 10) return Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('quimera', scale));
  if (roll <= 12) return Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('gigante_fogo', scale));
  if (roll <= 14) return [spawnMonster('golem_pedra_tauron', scale)];
  if (roll <= 16) return [spawnMonster('verme_purpura', scale)];
  return Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('wyvern', scale));
}
