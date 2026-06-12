import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../core/services/game-state.service';

// ── Tipos locais (subset de DungeonRoom para o JSON de assets) ────────────────
type RoomType = 'entrance' | 'monster' | 'trap' | 'treasure' | 'rest' | 'boss' | 'empty' | 'puzzle' | 'social';

interface MapRoom {
  id: number;
  row: number;
  col: number;
  type: RoomType;
  name: string;
  connections: number[];
}

interface FloorMap {
  floorNumber: number;
  themeId: string;
  rooms: MapRoom[];
}

// ── Paleta por tipo de sala ───────────────────────────────────────────────────
const ROOM_COLORS: Record<RoomType, string> = {
  entrance: '#22c55e',
  monster:  '#ef4444',
  trap:     '#f97316',
  treasure: '#eab308',
  rest:     '#3b82f6',
  boss:     '#9333ea',
  empty:    '#6b7280',
  puzzle:   '#06b6d4',
  social:   '#ec4899',
};

const ROOM_ICONS: Record<RoomType, string> = {
  entrance: '🚪', monster: '👹', trap: '⚠️', treasure: '💰',
  rest: '🔥', boss: '💀', empty: '▫️', puzzle: '🔍', social: '💬',
};

const ROOM_LABELS: Record<RoomType, string> = {
  entrance: 'Entrada',  monster: 'Monstro',   trap: 'Armadilha',
  treasure: 'Tesouro',  rest: 'Descanso',      boss: 'Guardião',
  empty: 'Corredor',    puzzle: 'Enigma',       social: 'Encontro',
};

// ── SVG layout ────────────────────────────────────────────────────────────────
const COL_W    = 96;   // px entre colunas
const ROW_H    = 100;  // px entre linhas
const R        = 28;   // raio do círculo da sala
const PAD_X    = 50;   // padding esquerdo
const PAD_Y    = 50;   // padding superior

function roomX(col: number): number { return PAD_X + col * COL_W; }
function roomY(row: number, maxRow: number): number { return PAD_Y + (maxRow - row) * ROW_H; }

@Component({
  selector: 'app-debug-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-root">

      <!-- Header -->
      <div class="debug-header">
        <span class="debug-badge">🗺️ DEBUG</span>
        <h2 class="debug-title">Mapas dos Andares — Masmorras de Valkaria</h2>
        <button class="debug-close" (click)="gameState.screen.set('menu')">✕ Fechar</button>
      </div>

      @if (loading()) {
        <div class="debug-loading">⏳ Carregando mapas…</div>
      } @else if (error()) {
        <div class="debug-error">❌ Erro ao carregar floors.json: {{ error() }}</div>
      } @else {

        <!-- Seletor de andares -->
        <div class="floor-tabs">
          @for (f of floors(); track f.floorNumber) {
            <button
              class="floor-tab"
              [class.active]="selectedFloor() === f.floorNumber"
              (click)="selectedFloor.set(f.floorNumber)">
              {{ f.floorNumber }}
            </button>
          }
        </div>

        @if (currentMap(); as map) {
          <div class="map-container">

            <!-- Painel esquerdo: SVG do mapa -->
            <div class="svg-panel">
              <div class="floor-label">
                Andar {{ map.floorNumber }} — {{ themeLabel(map.themeId) }}
                <span class="room-count">{{ map.rooms.length }} salas</span>
              </div>

              <svg [attr.width]="svgWidth(map)" [attr.height]="svgHeight(map)" class="map-svg">

                <!-- Linhas de conexão -->
                @for (room of map.rooms; track room.id) {
                  @for (targetId of room.connections; track targetId) {
                    @if (roomById(map, targetId); as target) {
                      <line
                        [attr.x1]="roomX(room.col)"
                        [attr.y1]="roomY(room.row, maxRow(map))"
                        [attr.x2]="roomX(target.col)"
                        [attr.y2]="roomY(target.row, maxRow(map))"
                        class="conn-line"
                        [class.conn-to-boss]="target.type === 'boss'"
                      />
                    }
                  }
                }

                <!-- Nós das salas -->
                @for (room of map.rooms; track room.id) {
                  <g
                    class="room-node"
                    [class.selected]="selectedRoom()?.id === room.id"
                    (click)="selectedRoom.set(room)">

                    <!-- Sombra -->
                    <circle
                      [attr.cx]="roomX(room.col) + 2"
                      [attr.cy]="roomY(room.row, maxRow(map)) + 2"
                      [attr.r]="R"
                      class="room-shadow"
                    />

                    <!-- Círculo principal -->
                    <circle
                      [attr.cx]="roomX(room.col)"
                      [attr.cy]="roomY(room.row, maxRow(map))"
                      [attr.r]="R"
                      [attr.fill]="roomColor(room.type)"
                      [attr.stroke]="selectedRoom()?.id === room.id ? '#fff' : roomColor(room.type)"
                      [attr.stroke-width]="selectedRoom()?.id === room.id ? 3 : 1.5"
                      class="room-circle"
                    />

                    <!-- Ícone -->
                    <text
                      [attr.x]="roomX(room.col)"
                      [attr.y]="roomY(room.row, maxRow(map)) + 6"
                      text-anchor="middle"
                      class="room-icon-text">
                      {{ roomIcon(room.type) }}
                    </text>

                    <!-- ID da sala (pequeno) -->
                    <text
                      [attr.x]="roomX(room.col) + R - 2"
                      [attr.y]="roomY(room.row, maxRow(map)) - R + 10"
                      class="room-id-text">
                      {{ room.id }}
                    </text>
                  </g>
                }

              </svg>
            </div>

            <!-- Painel direito: detalhes -->
            <div class="detail-panel">

              <!-- Info do andar -->
              <div class="detail-section">
                <div class="detail-section-title">📋 Andar {{ map.floorNumber }}</div>
                <div class="detail-row"><span class="dkey">Tema:</span><span class="dval">{{ themeLabel(map.themeId) }}</span></div>
                <div class="detail-row"><span class="dkey">Salas:</span><span class="dval">{{ map.rooms.length }}</span></div>
                <div class="detail-row"><span class="dkey">Boss:</span><span class="dval">{{ bossRoom(map)?.name }}</span></div>
              </div>

              <!-- Contagem por tipo -->
              <div class="detail-section">
                <div class="detail-section-title">📊 Distribuição</div>
                @for (stat of roomStats(map); track stat.type) {
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

              <!-- Sala selecionada -->
              @if (selectedRoom(); as room) {
                <div class="detail-section room-detail">
                  <div class="detail-section-title" [style.color]="roomColor(room.type)">
                    {{ roomIcon(room.type) }} Sala #{{ room.id }}
                  </div>
                  <div class="room-detail-name">{{ room.name }}</div>
                  <div class="detail-row">
                    <span class="dkey">Tipo:</span>
                    <span class="type-chip" [style.background]="roomColor(room.type)">{{ roomLabel(room.type) }}</span>
                  </div>
                  <div class="detail-row"><span class="dkey">Posição:</span><span class="dval">Col {{ room.col }}, Linha {{ room.row }}</span></div>
                  <div class="detail-row"><span class="dkey">Conexões:</span><span class="dval">→ {{ room.connections.join(', ') || 'nenhuma' }}</span></div>
                  @if (incomingConnections(map, room.id).length > 0) {
                    <div class="detail-row"><span class="dkey">Chega de:</span><span class="dval">{{ incomingConnections(map, room.id).join(', ') }}</span></div>
                  }
                </div>
              } @else {
                <div class="detail-section hint-panel">
                  <p>👆 Clique em uma sala para ver detalhes</p>
                </div>
              }

              <!-- Legenda -->
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
        }
      }
    </div>
  `,
  styles: [`
    .debug-root {
      background: #0a0a0f;
      min-height: 100vh;
      color: #e2e8f0;
      font-family: 'Segoe UI', monospace;
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .debug-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: #12121a;
      border-bottom: 1px solid #9333ea44;
    }
    .debug-badge {
      background: #9333ea;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    .debug-title { flex: 1; font-size: 15px; font-weight: 600; margin: 0; color: #c4b5fd; }
    .debug-close {
      background: transparent;
      border: 1px solid #4b5563;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 13px;
      transition: all .15s;
    }
    .debug-close:hover { background: #1f2937; color: #fff; }

    /* ── Floor tabs ── */
    .floor-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 10px 20px;
      background: #0f0f17;
      border-bottom: 1px solid #1f2937;
    }
    .floor-tab {
      width: 36px;
      height: 32px;
      border: 1px solid #374151;
      background: #1a1a2e;
      color: #9ca3af;
      cursor: pointer;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      transition: all .15s;
    }
    .floor-tab:hover  { border-color: #9333ea; color: #c4b5fd; background: #1e1b40; }
    .floor-tab.active { background: #9333ea; border-color: #9333ea; color: #fff; }

    /* ── Map container ── */
    .map-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── SVG panel ── */
    .svg-panel {
      flex: 1;
      padding: 16px 20px;
      overflow: auto;
      background: #0a0a0f;
    }
    .floor-label {
      font-size: 13px;
      color: #a78bfa;
      margin-bottom: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .room-count {
      background: #1f1b40;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      color: #6b7280;
    }
    .map-svg { overflow: visible; }

    /* SVG internals */
    .conn-line {
      stroke: #374151;
      stroke-width: 1.5;
      stroke-dasharray: 4 3;
    }
    .conn-line.conn-to-boss {
      stroke: #9333ea66;
      stroke-dasharray: none;
      stroke-width: 2;
    }
    .room-shadow { fill: #00000055; }
    .room-circle { cursor: pointer; transition: r .1s; }
    .room-node:hover .room-circle { filter: brightness(1.25); }
    .room-icon-text { font-size: 16px; dominant-baseline: middle; cursor: pointer; }
    .room-id-text {
      font-size: 9px;
      fill: #ffffffaa;
      font-family: monospace;
      cursor: pointer;
    }
    .room-node.selected .room-circle { filter: drop-shadow(0 0 6px #ffffffaa); }

    /* ── Detail panel ── */
    .detail-panel {
      width: 260px;
      flex-shrink: 0;
      background: #0f0f17;
      border-left: 1px solid #1f2937;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .detail-section {
      background: #12121e;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .detail-section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .5px;
      color: #a78bfa;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .detail-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 12px;
    }
    .dkey { color: #6b7280; min-width: 52px; }
    .dval { color: #e2e8f0; }

    /* Stats */
    .stat-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .stat-icon { width: 16px; text-align: center; }
    .stat-label { width: 64px; color: #9ca3af; }
    .stat-bar-wrap {
      flex: 1;
      height: 6px;
      background: #1f2937;
      border-radius: 3px;
      overflow: hidden;
    }
    .stat-bar { display: block; height: 100%; border-radius: 3px; transition: width .3s; }
    .stat-count { width: 16px; text-align: right; color: #6b7280; font-size: 10px; }

    /* Room detail */
    .room-detail { border-color: #4b2d80; }
    .room-detail-name {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .type-chip {
      font-size: 10px;
      padding: 1px 7px;
      border-radius: 8px;
      color: #fff;
      font-weight: 600;
    }

    /* Hint */
    .hint-panel p { color: #4b5563; font-size: 12px; text-align: center; padding: 4px 0; }

    /* Legend */
    .legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #9ca3af; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    /* Loading / error */
    .debug-loading, .debug-error {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #6b7280;
    }
    .debug-error { color: #ef4444; }
  `]
})
export class DebugMapComponent implements OnInit {
  gameState = inject(GameStateService);

  floors   = signal<FloorMap[]>([]);
  loading  = signal(true);
  error    = signal('');
  selectedFloor = signal(1);
  selectedRoom  = signal<MapRoom | null>(null);

  currentMap = computed(() =>
    this.floors().find(f => f.floorNumber === this.selectedFloor()) ?? null
  );

  readonly R = R;

  readonly allTypes: RoomType[] = [
    'entrance', 'monster', 'trap', 'treasure', 'rest', 'boss', 'empty', 'puzzle', 'social'
  ];

  private readonly THEME_LABELS: Record<string, string> = {
    'allihanna': 'Allihanna — Floresta Subterrânea',
    'ragnar':    'Ragnar — Fortaleza Bárbara',
    'glorienn':  'Glórienn — Labirinto Élfigo',
    'lena':      'Lena — Câmaras do Além',
    'hyninn':    'Hyninn — Covil das Armadilhas',
    'marah':     'Marah — Jardins Encantados',
    'tenebra':   'Tenebra — Abismo Eterno',
    'azgher':    'Azgher — Câmaras Ardentes',
    'tauron':    'Tauron — Labirinto dos Minotauros',
    'tanna-toh': 'Tanna-Toh — Biblioteca Proibida',
    'lin-wu':    'Lin-Wu — Dojo Sagrado',
    'wynna':     'Wynna — Reino Feérico',
    'oceano':    'O Oceano — Caverna Submarina',
    'thyatis':   'Thyatis — Câmaras em Chamas',
    'sszzaas':   'Sszzaas — Ninho das Serpentes',
    'keenn':     'Keenn — Arena de Ferro',
    'megalokk':  'Megalokk — Toca dos Colossais',
    'nimb':      'Nimb — Labirinto do Caos',
    'khalmyr':   'Khalmyr — Tribunal Eterno',
    'valkaria':  'Valkaria — Câmara Final',
  };

  ngOnInit(): void {
    fetch('assets/maps/floors.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<FloorMap[]>;
      })
      .then(data => {
        this.floors.set(data);
        this.loading.set(false);
      })
      .catch(err => {
        this.error.set(String(err));
        this.loading.set(false);
      });
  }

  // ── Template helpers ──────────────────────────────────────────────────────
  roomX(col: number): number { return roomX(col); }
  roomY(row: number, maxRow: number): number { return roomY(row, maxRow); }

  svgWidth(map: FloorMap): number {
    const maxCol = Math.max(...map.rooms.map(r => r.col));
    return PAD_X * 2 + maxCol * COL_W;
  }

  svgHeight(map: FloorMap): number {
    return PAD_Y * 2 + this.maxRow(map) * ROW_H;
  }

  maxRow(map: FloorMap): number {
    return Math.max(...map.rooms.map(r => r.row));
  }

  roomById(map: FloorMap, id: number): MapRoom | undefined {
    return map.rooms.find(r => r.id === id);
  }

  bossRoom(map: FloorMap): MapRoom | undefined {
    return map.rooms.find(r => r.type === 'boss');
  }

  incomingConnections(map: FloorMap, id: number): number[] {
    return map.rooms.filter(r => r.connections.includes(id)).map(r => r.id);
  }

  roomStats(map: FloorMap): { type: RoomType; count: number; pct: number }[] {
    const counts: Partial<Record<RoomType, number>> = {};
    for (const room of map.rooms) {
      counts[room.type] = (counts[room.type] ?? 0) + 1;
    }
    return this.allTypes
      .filter(t => (counts[t] ?? 0) > 0)
      .map(t => ({ type: t, count: counts[t]!, pct: Math.round(counts[t]! / map.rooms.length * 100) }));
  }

  roomColor(type: RoomType): string  { return ROOM_COLORS[type] ?? '#6b7280'; }
  roomIcon(type: RoomType): string   { return ROOM_ICONS[type]  ?? '?'; }
  roomLabel(type: RoomType): string  { return ROOM_LABELS[type] ?? type; }
  themeLabel(id: string): string     { return this.THEME_LABELS[id] ?? id; }

}
