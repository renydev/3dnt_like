import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { DungeonRoom, ROOM_ICONS, ROOM_LABELS, RoomType } from '../../core/models/dungeon.model';

@Component({
  selector: 'app-dungeon-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dungeon-map">
      <div class="floor-header">
        <span class="floor-theme-icon">{{ floor()?.theme?.icon }}</span>
        <div class="floor-info">
          <h2 class="floor-title">Andar {{ floor()?.floorNumber }}</h2>
          <p class="floor-theme">{{ floor()?.theme?.name }}</p>
        </div>
        <div class="floor-progress">
          <span class="progress-label">Salas limpas</span>
          <span class="progress-value">{{ clearedCount() }}/{{ floor()?.totalRooms }}</span>
        </div>
      </div>

      <div class="map-container">
        <svg class="connections-layer" [attr.viewBox]="svgViewBox()" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          @for (conn of connections(); track conn.key) {
            <line
              [attr.x1]="conn.x1" [attr.y1]="conn.y1"
              [attr.x2]="conn.x2" [attr.y2]="conn.y2"
              [class]="'conn-line ' + conn.state"
            />
          }
        </svg>

        <div class="rooms-layer">
          @for (room of floor()?.rooms; track room.id) {
            <div
              class="room-node"
              [class.visible]="room.isVisible"
              [class.current]="room.isCurrent"
              [class.cleared]="room.cleared"
              [class.reachable]="isReachable(room)"
              [class]="'room-node room-' + room.type + (room.isVisible ? ' visible' : '') + (room.isCurrent ? ' current' : '') + (room.cleared ? ' cleared' : '') + (isReachable(room) ? ' reachable' : '')"
              [style.left.px]="getRoomX(room)"
              [style.top.px]="getRoomY(room)"
              (click)="onRoomClick(room)"
              [title]="room.isVisible ? room.name : '???'"
            >
              @if (room.isVisible) {
                <div class="room-inner">
                  <span class="room-icon">{{ getRoomIcon(room) }}</span>
                  @if (room.cleared) {
                    <span class="cleared-mark">✓</span>
                  }
                  @if (room.isCurrent) {
                    <span class="current-pulse"></span>
                  }
                </div>
                <span class="room-label">{{ getRoomLabel(room) }}</span>
              } @else {
                <div class="room-inner hidden-room">
                  <span class="room-icon">?</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Info da sala atual -->
      @if (currentRoom()) {
        <div class="current-room-info">
          <div class="info-header">
            <span class="info-icon">{{ getRoomIcon(currentRoom()!) }}</span>
            <div>
              <h3>{{ currentRoom()!.name }}</h3>
              <span class="room-type-badge room-badge-{{ currentRoom()!.type }}">
                {{ getRoomLabel(currentRoom()!) }}
              </span>
            </div>
          </div>
          <p class="info-desc">{{ currentRoom()!.description }}</p>
          @if (!currentRoom()!.cleared && currentRoom()!.type !== 'entrance' && currentRoom()!.type !== 'empty') {
            <button class="btn-encounter" (click)="enterRoom()">
              ⚔️ Entrar na Sala
            </button>
          }
          @if (currentRoom()!.cleared && currentRoom()!.type === 'boss') {
            <button class="btn-next-floor" (click)="nextFloor()">
              🔽 Descer para o Próximo Andar
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./dungeon-map.component.scss']
})
export class DungeonMapComponent {
  private gameState = inject(GameStateService);

  floor = this.gameState.currentFloor;
  currentRoom = this.gameState.currentRoom;

  CELL_W = 90;
  CELL_H = 110;
  COLS = 5;

  clearedCount = computed(() =>
    this.floor()?.rooms.filter(r => r.cleared).length ?? 0
  );

  svgViewBox = computed(() => {
    const rows = this.maxRow() + 1;
    return `0 0 ${this.COLS * this.CELL_W + 20} ${rows * this.CELL_H + 20}`;
  });

  maxRow = computed(() =>
    Math.max(...(this.floor()?.rooms.map(r => r.row) ?? [0]))
  );

  connections = computed(() => {
    const rooms = this.floor()?.rooms ?? [];
    const result: any[] = [];
    const seen = new Set<string>();

    rooms.forEach(room => {
      room.connections.forEach(connId => {
        const key = [Math.min(room.id, connId), Math.max(room.id, connId)].join('-');
        if (seen.has(key)) return;
        seen.add(key);

        const dest = rooms.find(r => r.id === connId);
        if (!dest) return;

        const x1 = this.getRoomX(room) + 32;
        const y1 = this.getRoomY(room) + 32;
        const x2 = this.getRoomX(dest) + 32;
        const y2 = this.getRoomY(dest) + 32;

        let state = 'hidden';
        if (room.isVisible && dest.isVisible) state = 'visible';
        else if (room.isVisible || dest.isVisible) state = 'partial';

        result.push({ key, x1, y1, x2, y2, state });
      });
    });
    return result;
  });

  getRoomX(room: DungeonRoom): number {
    const maxRow = this.maxRow();
    if (room.row === 0 || room.row === maxRow) {
      return Math.floor(this.COLS / 2) * this.CELL_W + 10;
    }
    return room.col * this.CELL_W + 10;
  }

  getRoomY(room: DungeonRoom): number {
    return room.row * this.CELL_H + 10;
  }

  getRoomIcon(room: DungeonRoom): string {
    return ROOM_ICONS[room.type];
  }

  getRoomLabel(room: DungeonRoom): string {
    return ROOM_LABELS[room.type];
  }

  isReachable(room: DungeonRoom): boolean {
    const current = this.currentRoom();
    if (!current || room.isCurrent || !room.isVisible) return false;
    return current.connections.includes(room.id);
  }

  onRoomClick(room: DungeonRoom): void {
    if (!room.isVisible) return;
    if (this.isReachable(room)) {
      this.gameState.moveToRoom(room.id);
    }
  }

  enterRoom(): void {
    this.gameState.screen.set('encounter');
  }

  nextFloor(): void {
    this.gameState.nextFloor();
  }
}
