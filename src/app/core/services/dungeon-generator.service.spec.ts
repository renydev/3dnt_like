import { CAMPAIGN_REGISTRY } from '../data/campaigns/campaign-registry';
import type { CampaignConfig } from '../models/campaign.model';
import type { DungeonFloor, DungeonRoom } from '../models/dungeon.model';
import { DungeonGeneratorService } from './dungeon-generator.service';

function connectionCounts(room: DungeonRoom, floor: DungeonFloor): { previous: number; next: number; same: number } {
  const byId = new Map(floor.rooms.map(r => [r.id, r]));
  return room.connections.reduce(
    (counts, id) => {
      const other = byId.get(id);
      if (!other) return counts;
      if (other.row < room.row) counts.previous += 1;
      if (other.row > room.row) counts.next += 1;
      if (other.row === room.row) counts.same += 1;
      return counts;
    },
    { previous: 0, next: 0, same: 0 },
  );
}

describe('DungeonGeneratorService', () => {
  for (const campaign of Object.values(CAMPAIGN_REGISTRY)) {
    it(`normalizes layered room connections for ${campaign.id}`, () => {
      const adventure = campaign.adventures[campaign.defaultAdventureId];
      const service = new DungeonGeneratorService({
        getDungeonConfig: (floorNumber: number) => adventure.dungeons[floorNumber] ?? null,
        getTheme: (floorNumber: number) => adventure.floors[Math.min(floorNumber - 1, adventure.floors.length - 1)],
      } as any);

      for (let floorNumber = 1; floorNumber <= adventure.totalFloors; floorNumber++) {
        const floor = service.generateFloor(floorNumber);
        const maxRow = Math.max(...floor.rooms.map(r => r.row));

        for (const room of floor.rooms) {
          const counts = connectionCounts(room, floor);
          expect(counts.same).withContext(`${campaign.id} floor ${floorNumber} room ${room.id} has lateral links`).toBe(0);

          if (room.row === 0) {
            expect(counts.previous).withContext(`${campaign.id} floor ${floorNumber} entrance has previous links`).toBe(0);
            expect(counts.next).withContext(`${campaign.id} floor ${floorNumber} entrance next links`).toBeGreaterThanOrEqual(1);
            expect(counts.next).withContext(`${campaign.id} floor ${floorNumber} entrance next links`).toBeLessThanOrEqual(2);
            continue;
          }

          if (room.row === maxRow) {
            expect(counts.next).withContext(`${campaign.id} floor ${floorNumber} boss has next links`).toBe(0);
            expect(counts.previous).withContext(`${campaign.id} floor ${floorNumber} boss previous links`).toBeGreaterThanOrEqual(1);
            expect(counts.previous).withContext(`${campaign.id} floor ${floorNumber} boss previous links`).toBeLessThanOrEqual(2);
            continue;
          }

          expect(counts.previous).withContext(`${campaign.id} floor ${floorNumber} room ${room.id} previous links`).toBeGreaterThanOrEqual(1);
          expect(counts.previous).withContext(`${campaign.id} floor ${floorNumber} room ${room.id} previous links`).toBeLessThanOrEqual(2);
          expect(counts.next).withContext(`${campaign.id} floor ${floorNumber} room ${room.id} next links`).toBeGreaterThanOrEqual(1);
          expect(counts.next).withContext(`${campaign.id} floor ${floorNumber} room ${room.id} next links`).toBeLessThanOrEqual(2);
        }
      }
    });
  }
});
