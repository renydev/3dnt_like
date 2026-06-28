import { DUNGEON_REGISTRY } from './app/core/data/dungeons/dungeon-registry';
import { BESTIARIO } from './app/core/data/bestiario.data';
import { analyzeFloorBalance, defaultExpectedPartyPP } from './app/core/utils/balance-analysis';

const neutralScale = { overall: 1, poder: 1, resistencia: 1, habilidade: 1 };

for (let floor = 2; floor <= 20; floor++) {
  const config = DUNGEON_REGISTRY[floor];
  if (!config) { console.log(`floor ${floor}: NO CONFIG`); continue; }

  const report = analyzeFloorBalance(floor, { partyPP: defaultExpectedPartyPP(floor), size: 4, armadura: 0 });
  const byVerdict: Record<string, string[]> = {};
  for (const m of report.monsters) (byVerdict[m.verdict] ??= []).push(m.id);

  // boss
  const bossRoom = config.layout.rooms.find(r => r.type === 'boss');
  let bossIds: string[] = [];
  if (bossRoom && config.roomEnemies?.[bossRoom.id]) {
    const enemies = config.roomEnemies[bossRoom.id](neutralScale as any);
    const nameToId = new Map(Object.entries(BESTIARIO).filter(([,t])=>t.floor===floor).map(([id,t])=>[t.name,id]));
    bossIds = enemies.map(e => nameToId.get(e.name) ?? `???(${e.name})`);
  }

  console.log(`\n=== Floor ${floor} (${config.theme.id} / ${config.theme.godName}) ===`);
  console.log('trivial:', byVerdict['trivial']?.length ?? 0, byVerdict['trivial']);
  console.log('equilibrado:', byVerdict['equilibrado']?.length ?? 0, byVerdict['equilibrado']);
  console.log('arriscado:', byVerdict['arriscado']?.length ?? 0, byVerdict['arriscado']);
  console.log('mortal:', byVerdict['mortal']?.length ?? 0, byVerdict['mortal']);
  console.log('boss:', bossIds);
}
