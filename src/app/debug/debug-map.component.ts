import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../core/services/game-state.service';
import { DUNGEON_REGISTRY } from '../core/data/dungeons/dungeon-registry';

type RoomType = 'entrance' | 'monster' | 'trap' | 'treasure' | 'rest' | 'boss' | 'empty' | 'puzzle' | 'social';

interface MapRoom { id: number; row: number; col: number; type: RoomType; name: string; connections: number[]; }

const ROOM_COLORS: Record<RoomType, string> = {
  entrance: '#22c55e', monster: '#ef4444', trap: '#f97316', treasure: '#eab308',
  rest: '#3b82f6', boss: '#9333ea', empty: '#6b7280', puzzle: '#06b6d4', social: '#ec4899',
};
const ROOM_ICONS: Record<RoomType, string> = {
  entrance: '🚪', monster: '👹', trap: '⚠️', treasure: '💰',
  rest: '🔥', boss: '💀', empty: '▫️', puzzle: '🔍', social: '💬',
};
const ROOM_LABELS: Record<RoomType, string> = {
  entrance: 'Entrada', monster: 'Monstro', trap: 'Armadilha', treasure: 'Tesouro',
  rest: 'Descanso', boss: 'Guardião', empty: 'Corredor', puzzle: 'Enigma', social: 'Encontro',
};

// ── Layout horizontal (mesmos valores do dungeon-map e map-debug) ───────────
const NODE_W = 120;
const NODE_H = 80;
const PAD_X  = 56;
const PAD_Y  = 44;
const R      = 24;

@Component({
  selector: 'app-debug-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-root">
      <div class="debug-header">
        <span class="debug-badge">🗺️ DEBUG</span>
        <h2 class="debug-title">Mapas dos Andares — Masmorras de Valkaria</h2>
        <button class="debug-close" (click)="gameState.screen.set('menu')">✕ Fechar</button>
      </div>

      <div class="floor-tabs">
        @for (entry of floorEntries; track entry.floor) {
          <button class="floor-tab" [class.active]="selectedFloor() === entry.floor"
            (click)="selectedFloor.set(entry.floor); selectedRoom.set(null)">
            {{ entry.floor }}
          </button>
        }
      </div>

      <div class="map-container">
        <!-- Mapa horizontal scrollável -->
        <div class="svg-panel">
          <div class="floor-label">
            Andar {{ selectedFloor() }} — {{ currentFloorName() }}
            <span class="room-count">{{ currentRooms().length }} salas</span>
            <span class="depth-info">Profundidade: {{ currentMaxDepth() }}</span>
          </div>

          <div class="map-scroll">
            <svg [attr.width]="svgW()" [attr.height]="svgH()"
              [attr.viewBox]="'0 0 ' + svgW() + ' ' + svgH()"
              class="map-svg" xmlns="http://www.w3.org/2000/svg">

              <!-- Fundo -->
              <rect x="0" y="0" [attr.width]="svgW()" [attr.height]="svgH()" fill="#07070f" rx="4" />

              <!-- Linhas de lane -->
              @for (ly of laneLines(); track ly) {
                <line [attr.x1]="PAD_X / 2" [attr.y1]="ly"
                      [attr.x2]="svgW() - PAD_X / 2" [attr.y2]="ly"
                      stroke="#ffffff04" stroke-width="1" />
              }

              <!-- Limiar do chefe -->
              <line [attr.x1]="bossThresholdX()" y1="4"
                    [attr.x2]="bossThresholdX()" [attr.y2]="svgH() - 4"
                    stroke="#9333ea" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.5" />
              <text [attr.x]="bossThresholdX() + 5" y="16"
                fill="#9333ea" font-size="9" font-family="monospace" opacity="0.75"
                letter-spacing="0.1em">CHEFE ▶</text>
              <text [attr.x]="bossThresholdX() - 5" y="16"
                fill="#555" font-size="9" font-family="monospace" opacity="0.7"
                letter-spacing="0.05em" text-anchor="end">◀ MASMORRA</text>

              <!-- Conexões -->
              @for (room of currentRooms(); track room.id) {
                @for (targetId of room.connections; track targetId) {
                  @if (roomById(targetId); as target) {
                    <!-- Sombra -->
                    <line [attr.x1]="nodeX(room)" [attr.y1]="nodeY(room)"
                          [attr.x2]="nodeX(target)" [attr.y2]="nodeY(target)"
                          stroke="#000" stroke-width="4" stroke-linecap="round" opacity="0.4" />
                    <!-- Linha -->
                    <line [attr.x1]="nodeX(room)" [attr.y1]="nodeY(room)"
                          [attr.x2]="nodeX(target)" [attr.y2]="nodeY(target)"
                          [attr.stroke]="roomColor(room.type)" stroke-width="1.8"
                          stroke-dasharray="5 4" stroke-linecap="round" opacity="0.6" />
                  }
                }
              }

              <!-- Nós -->
              @for (room of currentRooms(); track room.id) {
                <g class="room-node" [class.selected]="selectedRoom()?.id === room.id"
                  (click)="selectedRoom.set(room)" style="cursor:pointer">

                  <!-- Sombra -->
                  <circle [attr.cx]="nodeX(room) + 2" [attr.cy]="nodeY(room) + 2"
                    [attr.r]="R" fill="#00000066" />

                  <!-- Halo selecionado -->
                  @if (selectedRoom()?.id === room.id) {
                    <circle [attr.cx]="nodeX(room)" [attr.cy]="nodeY(room)"
                      [attr.r]="R + 8" fill="none" stroke="#fff" stroke-width="1.5"
                      stroke-dasharray="4 3" opacity="0.6" />
                  }

                  <!-- Círculo -->
                  <circle [attr.cx]="nodeX(room)" [attr.cy]="nodeY(room)"
                    [attr.r]="R"
                    [attr.fill]="roomColor(room.type) + '22'"
                    [attr.stroke]="roomColor(room.type)"
                    stroke-width="2" />

                  <!-- Ícone -->
                  <text [attr.x]="nodeX(room)" [attr.y]="nodeY(room) + 1"
                    text-anchor="middle" dominant-baseline="middle"
                    font-size="14" style="pointer-events:none">{{ roomIcon(room.type) }}</text>

                  <!-- ID -->
                  <text [attr.x]="nodeX(room) + R - 2" [attr.y]="nodeY(room) - R + 10"
                    font-size="9" fill="#ffffffaa" font-family="monospace"
                    style="pointer-events:none">{{ room.id }}</text>

                  <!-- Tipo abaixo -->
                  <text [attr.x]="nodeX(room)" [attr.y]="nodeY(room) + R + 14"
                    text-anchor="middle" font-size="8"
                    [attr.fill]="roomColor(room.type)" opacity="0.8"
                    font-family="monospace" style="pointer-events:none">{{ roomLabel(room.type) }}</text>
                </g>
              }
            </svg>
          </div>
        </div>

        <!-- Painel de detalhes -->
        <div class="detail-panel">
          <div class="detail-section">
            <div class="detail-section-title">📋 Andar {{ selectedFloor() }}</div>
            <div class="detail-row"><span class="dkey">Tema:</span><span class="dval">{{ currentFloorName() }}</span></div>
            <div class="detail-row"><span class="dkey">Salas:</span><span class="dval">{{ currentRooms().length }}</span></div>
            <div class="detail-row"><span class="dkey">Profund.:</span><span class="dval">{{ currentMaxDepth() }}</span></div>
            <div class="detail-row"><span class="dkey">Boss:</span><span class="dval">{{ bossRoomName() }}</span></div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">📊 Distribuição</div>
            @for (stat of roomStats(); track stat.type) {
              <div class="stat-row">
                <span class="stat-icon">{{ roomIcon(stat.type) }}</span>
                <span class="stat-label">{{ roomLabel(stat.type) }}</span>
                <span class="stat-bar-wrap">
                  <span class="stat-bar" [style.width.%]="stat.pct" [style.background]="roomColor(stat.type)"></span>
                </span>
                <span class="stat-count">{{ stat.count }}</span>
              </div>
            }
          </div>

          @if (selectedRoom(); as room) {
            <div class="detail-section room-detail" [style.border-color]="roomColor(room.type) + '66'">
              <div class="detail-section-title" [style.color]="roomColor(room.type)">
                {{ roomIcon(room.type) }} Sala #{{ room.id }}
              </div>
              <div class="room-detail-name">{{ room.name }}</div>
              <div class="detail-row"><span class="dkey">Tipo:</span>
                <span class="type-chip" [style.background]="roomColor(room.type)">{{ roomLabel(room.type) }}</span></div>
              <div class="detail-row"><span class="dkey">row/col:</span>
                <span class="dval">{{ room.row }} / {{ room.col }}</span></div>
              <div class="detail-row"><span class="dkey">Profund.:</span>
                <span class="dval">{{ depthOf(room) }}</span></div>
              <div class="detail-row"><span class="dkey">→ Salas:</span>
                <span class="dval">{{ room.connections.join(', ') || '—' }}</span></div>
            </div>
          } @else {
            <div class="detail-section hint-panel">
              <p>👆 Clique em um nó para ver detalhes</p>
            </div>
          }

          <div class="detail-section">
            <div class="detail-section-title">🗝️ Legenda</div>
            <div class="legend-grid">
              @for (type of allTypes; track type) {
                <div class="legend-item">
                  <span class="legend-dot" [style.background]="roomColor(type)"></span>
                  <span>{{ roomIcon(type) }} {{ roomLabel(type) }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .debug-root { background: #0a0a0f; min-height: 100vh; color: #e2e8f0; font-family: 'Segoe UI', monospace; display: flex; flex-direction: column; }

    .debug-header { display: flex; align-items: center; gap: 12px; padding: 10px 20px; background: #12121a; border-bottom: 1px solid #9333ea44; }
    .debug-badge { background: #9333ea; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; }
    .debug-title { flex: 1; font-size: 14px; font-weight: 600; margin: 0; color: #c4b5fd; }
    .debug-close { background: transparent; border: 1px solid #4b5563; color: #9ca3af; cursor: pointer; padding: 4px 12px; border-radius: 6px; font-size: 12px; }
    .debug-close:hover { background: #1f2937; color: #fff; }

    .floor-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 20px; background: #0f0f17; border-bottom: 1px solid #1f2937; }
    .floor-tab { width: 34px; height: 30px; border: 1px solid #374151; background: #1a1a2e; color: #9ca3af; cursor: pointer; border-radius: 5px; font-size: 11px; font-weight: 600; transition: all .15s; }
    .floor-tab:hover { border-color: #9333ea; color: #c4b5fd; }
    .floor-tab.active { background: #9333ea; border-color: #9333ea; color: #fff; }

    .map-container { display: flex; flex: 1; overflow: hidden; }

    .svg-panel { flex: 1; padding: 12px 16px; overflow: hidden; display: flex; flex-direction: column; }
    .floor-label { font-size: 12px; color: #a78bfa; margin-bottom: 10px; font-weight: 600; display: flex; align-items: center; gap: 12px; }
    .room-count { background: #1f1b40; padding: 2px 8px; border-radius: 10px; font-size: 10px; color: #6b7280; }
    .depth-info { font-size: 10px; color: #555; }

    .map-scroll { flex: 1; overflow-x: auto; overflow-y: auto; }
    .map-svg { display: block; overflow: visible; }
    .room-node:hover circle:nth-child(3) { filter: brightness(1.3); }
    .room-node.selected circle:nth-child(3) { filter: drop-shadow(0 0 6px #ffffffaa); }

    .detail-panel { width: 240px; flex-shrink: 0; background: #0f0f17; border-left: 1px solid #1f2937; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .detail-section { background: #12121e; border: 1px solid #1f2937; border-radius: 6px; padding: 9px 11px; }
    .detail-section-title { font-size: 10px; font-weight: 700; letter-spacing: .5px; color: #a78bfa; text-transform: uppercase; margin-bottom: 7px; }
    .detail-row { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font-size: 11px; }
    .dkey { color: #6b7280; min-width: 52px; }
    .dval { color: #e2e8f0; }

    .stat-row { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; font-size: 10px; }
    .stat-icon { width: 14px; text-align: center; }
    .stat-label { width: 60px; color: #9ca3af; }
    .stat-bar-wrap { flex: 1; height: 5px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .stat-bar { display: block; height: 100%; border-radius: 3px; }
    .stat-count { width: 14px; text-align: right; color: #6b7280; font-size: 9px; }

    .room-detail { }
    .room-detail-name { font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 7px; line-height: 1.3; }
    .type-chip { font-size: 10px; padding: 1px 7px; border-radius: 8px; color: #fff; font-weight: 600; }
    .hint-panel p { color: #4b5563; font-size: 11px; text-align: center; padding: 4px 0; }

    .legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #9ca3af; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  `]
})
export class DebugMapComponent {
  gameState = inject(GameStateService);

  selectedFloor = signal(1);
  selectedRoom  = signal<MapRoom | null>(null);

  readonly PAD_X  = PAD_X;
  readonly NODE_W = NODE_W;
  readonly NODE_H = NODE_H;
  readonly R      = R;

  readonly allTypes: RoomType[] = [
    'entrance', 'monster', 'trap', 'treasure', 'rest', 'boss', 'empty', 'puzzle', 'social'
  ];

  readonly floorEntries = Object.entries(DUNGEON_REGISTRY)
    .map(([k, v]) => ({ floor: +k, name: v.theme.godName }))
    .sort((a, b) => a.floor - b.floor);

  currentFloorName = computed(() =>
    DUNGEON_REGISTRY[this.selectedFloor()]?.theme?.godName ?? ''
  );

  currentRooms = computed((): MapRoom[] => {
    const config = DUNGEON_REGISTRY[this.selectedFloor()];
    if (!config) return [];
    return config.layout.rooms.map(r => ({
      id: r.id, row: r.row, col: r.col,
      type: r.type as RoomType,
      name: r.name,
      connections: [...r.connections],
    }));
  });

  private entranceRow = computed(() =>
    this.currentRooms().find(r => r.type === 'entrance')?.row ?? 0
  );

  depthOf(room: MapRoom): number {
    return Math.abs(room.row - this.entranceRow());
  }

  currentMaxDepth = computed(() =>
    Math.max(...this.currentRooms().map(r => this.depthOf(r)), 0)
  );

  private maxLane = computed(() =>
    Math.max(...this.currentRooms().map(r => r.col), 0)
  );

  svgW = computed(() => PAD_X * 2 + this.currentMaxDepth() * NODE_W);
  svgH = computed(() => PAD_Y * 2 + this.maxLane() * NODE_H);

  bossThresholdX = computed(() =>
    PAD_X + this.currentMaxDepth() * NODE_W - NODE_W * 0.55
  );

  laneLines = computed(() => {
    const lines = [];
    for (let i = 0; i <= this.maxLane(); i++) lines.push(PAD_Y + i * NODE_H);
    return lines;
  });

  nodeX(room: MapRoom): number { return PAD_X + this.depthOf(room) * NODE_W; }
  nodeY(room: MapRoom): number { return PAD_Y + room.col * NODE_H; }

  roomById(id: number): MapRoom | undefined {
    return this.currentRooms().find(r => r.id === id);
  }

  bossRoomName = computed(() =>
    this.currentRooms().find(r => r.type === 'boss')?.name ?? '—'
  );

  roomStats = computed(() => {
    const rooms = this.currentRooms();
    const counts: Partial<Record<RoomType, number>> = {};
    for (const r of rooms) counts[r.type] = (counts[r.type] ?? 0) + 1;
    return this.allTypes
      .filter(t => (counts[t] ?? 0) > 0)
      .map(t => ({ type: t, count: counts[t]!, pct: Math.round(counts[t]! / rooms.length * 100) }));
  });

  roomColor(type: RoomType): string { return ROOM_COLORS[type] ?? '#6b7280'; }
  roomIcon(type: RoomType): string  { return ROOM_ICONS[type]  ?? '?'; }
  roomLabel(type: RoomType): string { return ROOM_LABELS[type] ?? type; }
}
