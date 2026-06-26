import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Tanna-Toh — convertido de "A Libertação de Valkaria" (pág. 69-72).
// A masmorra é "quase desabitada" no livro — sem tabela de encontros aleatórios,
// só os NPCs/encontros únicos abaixo.

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

// IDs de sala conforme tanna-toh.config.ts layout:
//  5 = Guardião de Biblioteca (monster) — Thwor Ironfist, fugido de um livro por instantes
//  8 = Câmara do Golem do Saber (boss) — Sathane
export const TANNA_TOH_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  5: (scale) => [spawnMonster('thwor_ironfist', scale)],
  8: (scale) => [spawnMonster('sathane', scale, true)],
};
