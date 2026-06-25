import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Sszzaas — convertido de "A Libertação de Valkaria" (pág. 90-93).
//
// O Guardião real ("O Guardião Traidor") é uma cópia mágica exata do personagem
// mais forte do grupo — mesmos atributos, PV e itens — e só pode ser ferido
// enquanto o "espelhamento" afeta esse mesmo personagem. Isso não é modelável
// como um template estático do bestiário (exigiria clonar dinamicamente um
// Character em Enemy); por isso a sala 8 (boss) fica sem spawn fixo aqui.

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme sszzaas.config.ts layout:
//  1 = Câmara das Cobras Rei (monster) — hidra negra
//  4 = Câmara das Víboras    (monster) — cultistas de Sszzaaz
//  7 = Câmara do Basilisco   (monster) — medusa
export const SSZZAAS_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('hidra_negra', scale)],
  4: (scale) => Array.from({ length: d(6) + 2 }, () => spawnMonster('cultista_sszzaas', scale)),
  7: (scale) => [spawnMonster('medusa_sszzaas', scale)],
};

// ── Encontros aleatórios — serpentes e cultistas de Sszzaaz (tabela 4d do livro) ──
// Roll 4-24: 4-6=hidra negra, 7-9=nagas espirituais, 10-14=cultistas, 15-16=medusas,
//            17-20=nagas negras, 21-24=dragão negro disfarçado
export function rollSszzaasEncounter(scale: number): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 6) return [spawnMonster('hidra_negra', scale)];
  if (roll <= 9) return Array.from({ length: d(6) * 2 }, () => spawnMonster('naga_sszzaas', scale));
  if (roll <= 14) {
    const count = d(6) + 3;
    return Array.from({ length: Math.min(count, 6) }, () => spawnMonster('cultista_sszzaas', scale));
  }
  if (roll <= 16) {
    const count = Math.max(1, d(6) - 2);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('medusa_sszzaas', scale));
  }
  if (roll <= 20) return Array.from({ length: d(6) * 2 }, () => spawnMonster('naga_sszzaas', scale));
  // 21-24: dragão negro adulto disfarçado
  return [spawnMonster('dragao_negro_adulto', scale)];
}
