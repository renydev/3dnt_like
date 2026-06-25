import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Convertido de "A Libertação de Valkaria" (pág. 109-112) — Khalmyr é o Deus da
// Justiça: a masmorra não tem tabela de Encontros Aleatórios, pois "nada aqui
// é obra do acaso" — são cinco testes estruturados (bondade, percepção,
// expulsão do mal, coragem, destruição do mal) mapeados nas salas de combate.

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme khalmyr.config.ts layout:
//  2 = Câmara do Anjo da Justiça   (monster) — Teste da Percepção do Mal
//  5 = Câmara do Golem de Mármore  (monster) — Teste da Expulsão do Mal
//  7 = Câmara do Juiz Espectral    (monster) — Testes da Coragem + Destruição do Mal
//  8 = Câmara do Paladino Supremo  (boss)    — Thomar Steelwill e Karlya
// (Teste da Bondade, sala 1, é não-hostil — clérigos feridos pedindo cura — e
// não foi mapeado como combate.)
export const KHALMYR_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  2: (scale) => {
    const total = d(6) + 6;
    return Array.from({ length: total }, (_, i) =>
      spawnMonster(i % 2 === 0 ? 'guerreiro_anao_khalmyr' : 'paladino_anao_khalmyr', scale));
  },
  5: (scale) => Array.from({ length: d(4) + 4 }, () => spawnMonster('zumbi_grande_khalmyr', scale)),
  7: (scale) => [
    ...Array.from({ length: d(2) }, () => spawnMonster('gelugon', scale)),
    ...Array.from({ length: d(4) + 4 }, () => spawnMonster('esqueleto_grande_khalmyr', scale)),
  ],
  8: (scale) => [spawnMonster('thomar_steelwill', scale, true), spawnMonster('karlya', scale)],
};

// Khalmyr não possui tabela de Encontros Aleatórios — "nada aqui é obra do acaso".
export function rollKhalmyrEncounter(_scale: number): Enemy[] {
  return [];
}
