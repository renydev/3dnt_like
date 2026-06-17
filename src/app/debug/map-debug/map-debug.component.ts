import { Component, signal, computed, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DUNGEON_REGISTRY } from '../../core/data/dungeons/dungeon-registry';

interface RoomState {
  roomId: number;
  name: string;
  type: string;
  row: number;
  col: number;
  connections: number[];
}

const FLOOR_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(DUNGEON_REGISTRY).map(([k, v]) => [+k, v.theme.godName])
);

const ROOM_COLORS: Record<string, string> = {
  entrance: '#27ae60',
  monster:  '#e74c3c',
  treasure: '#d4aa14',
  rest:     '#e67e22',
  trap:     '#9b59b6',
  boss:     '#c0392b',
  empty:    '#555',
  puzzle:   '#3498db',
  social:   '#1abc9c',
};

@Component({
  selector: 'app-map-debug',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="debug-root">
      <header class="debug-header">
        <h1>🗺️ Debug — Mapa</h1>

        <select class="floor-select" [(ngModel)]="selectedFloorStr" (ngModelChange)="onFloorChange($event)">
          @for (entry of floorEntries; track entry.floor) {
            <option [value]="entry.floor">{{ entry.floor }}. {{ entry.name }}</option>
          }
        </select>

        <span class="hint">
          Andares: {{ hotspots().length }} salas ·
          Profundidade máx: {{ maxDepth() }} ·
          Lanes: {{ maxLane() + 1 }}
        </span>

        <div class="header-actions">
          <button class="btn-add" (click)="addRoom()">＋ Sala</button>
          <button class="btn-copy" (click)="copyConfig()">📋 Copiar layout</button>
          <a class="btn-game" href="/">🎮 Jogo</a>
        </div>
      </header>

      <div class="debug-body">
        <!-- Mapa horizontal -->
        <div class="map-wrap" #mapWrap>
          <div class="map-canvas" [style.width.px]="svgW()" [style.height.px]="svgH()">
            <svg [attr.viewBox]="svgViewBox()" [attr.width]="svgW()" [attr.height]="svgH()"
              xmlns="http://www.w3.org/2000/svg" class="map-svg">

              <!-- Fundo -->
              <rect x="0" y="0" [attr.width]="svgW()" [attr.height]="svgH()" fill="#0a0a12" rx="6" />

              <!-- Linhas de grade (lanes) -->
              @for (lane of laneLines(); track lane) {
                <line [attr.x1]="PAD_X / 2" [attr.y1]="lane"
                      [attr.x2]="svgW() - PAD_X / 2" [attr.y2]="lane"
                      stroke="#ffffff05" stroke-width="1" />
              }

              <!-- Limiar do chefe -->
              <line [attr.x1]="bossThresholdX()" y1="4"
                    [attr.x2]="bossThresholdX()" [attr.y2]="svgH() - 4"
                    stroke="#c0392b" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6" />
              <text [attr.x]="bossThresholdX() + 5" y="16"
                fill="#c0392b" font-size="9" font-family="monospace" opacity="0.8"
                letter-spacing="0.1em">CHEFE ▶</text>
              <text [attr.x]="bossThresholdX() - 5" y="16"
                fill="#555" font-size="9" font-family="monospace" opacity="0.8"
                letter-spacing="0.05em" text-anchor="end">◀ MASMORRA</text>

              <!-- Conexões -->
              @for (conn of connections(); track conn.key) {
                <!-- Sombra da linha -->
                <line [attr.x1]="conn.x1" [attr.y1]="conn.y1"
                      [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                      stroke="#000" stroke-width="4" stroke-linecap="round" opacity="0.5" />
                <!-- Linha principal -->
                <line [attr.x1]="conn.x1" [attr.y1]="conn.y1"
                      [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                      [attr.stroke]="conn.color" stroke-width="1.8"
                      stroke-dasharray="5 4" stroke-linecap="round" opacity="0.7" />
              }

              <!-- Nós das salas -->
              @for (hs of hotspots(); track hs.roomId) {
                <g class="node-group" [class.node-selected]="selected() === hs.roomId"
                  (click)="selectRoom($event, hs.roomId)" style="cursor:pointer">

                  <!-- Sombra -->
                  <circle [attr.cx]="nodeX(hs) + 2" [attr.cy]="nodeY(hs) + 2"
                    r="22" fill="#00000066" />

                  <!-- Halo selecionado -->
                  @if (selected() === hs.roomId) {
                    <circle [attr.cx]="nodeX(hs)" [attr.cy]="nodeY(hs)"
                      r="30" fill="none" stroke="#facc15" stroke-width="2"
                      stroke-dasharray="4 3" opacity="0.8">
                      <animateTransform attributeName="transform" type="rotate"
                        [attr.from]="'0 ' + nodeX(hs) + ' ' + nodeY(hs)"
                        [attr.to]="'360 ' + nodeX(hs) + ' ' + nodeY(hs)"
                        dur="4s" repeatCount="indefinite" />
                    </circle>
                  }

                  <!-- Círculo do nó -->
                  <circle [attr.cx]="nodeX(hs)" [attr.cy]="nodeY(hs)"
                    r="22"
                    [attr.fill]="nodeFill(hs)"
                    [attr.stroke]="nodeColor(hs)"
                    stroke-width="2" />

                  <!-- Ícone do tipo -->
                  <text [attr.x]="nodeX(hs)" [attr.y]="nodeY(hs) + 1"
                    text-anchor="middle" dominant-baseline="middle"
                    font-size="13" style="pointer-events:none">{{ typeIcon(hs.type) }}</text>

                  <!-- ID -->
                  <text [attr.x]="nodeX(hs) + 20" [attr.y]="nodeY(hs) - 18"
                    text-anchor="middle" font-size="9" fill="#000"
                    stroke="#fff" stroke-width="2.5" paint-order="stroke"
                    font-weight="bold" style="pointer-events:none">{{ hs.roomId }}</text>

                  <!-- Label (tipo) abaixo -->
                  <text [attr.x]="nodeX(hs)" [attr.y]="nodeY(hs) + 36"
                    text-anchor="middle" font-size="8"
                    [attr.fill]="nodeColor(hs)" opacity="0.85"
                    font-family="monospace" style="pointer-events:none">{{ hs.type.slice(0,4) }}</text>

                  <!-- Handle de drag (row/col) -->
                  <g class="drag-handle" (mousedown)="startDrag($event, hs.roomId)" title="Arrastar para reposicionar">
                    <circle [attr.cx]="nodeX(hs)" [attr.cy]="nodeY(hs) - 34"
                      r="9" fill="#facc15" stroke="#000" stroke-width="1.5" opacity="0.9" />
                    <text [attr.x]="nodeX(hs)" [attr.y]="nodeY(hs) - 33"
                      text-anchor="middle" dominant-baseline="middle"
                      font-size="9" fill="#000" style="pointer-events:none">⠿</text>
                  </g>
                </g>
              }
            </svg>
          </div>
        </div>

        <!-- Painel lateral -->
        <aside class="debug-panel">
          <div class="panel-section">
            <div class="panel-title">SALAS ({{ hotspots().length }})</div>
            <div class="hs-list">
              @for (hs of hotspots(); track hs.roomId) {
                <div class="hs-item" [class.hs-selected]="selected() === hs.roomId"
                  (click)="selected.set(hs.roomId)">

                  <div class="hs-head">
                    <span class="hs-id" [style.background]="nodeColor(hs)">{{ hs.roomId }}</span>
                    <input class="inp-name" [(ngModel)]="hs.name" (ngModelChange)="refresh()" placeholder="Nome" />
                    <button class="btn-del" (click)="removeRoom($event, hs.roomId)">✕</button>
                  </div>

                  <div class="hs-fields-row">
                    <label>Tipo
                      <select [(ngModel)]="hs.type" (ngModelChange)="refresh()" class="inp-type">
                        <option value="entrance">entrance</option>
                        <option value="monster">monster</option>
                        <option value="empty">empty</option>
                        <option value="treasure">treasure</option>
                        <option value="trap">trap</option>
                        <option value="boss">boss</option>
                        <option value="rest">rest</option>
                        <option value="puzzle">puzzle</option>
                        <option value="social">social</option>
                      </select>
                    </label>
                    <label>row <input type="number" [(ngModel)]="hs.row" (ngModelChange)="refresh()" class="inp-num" /></label>
                    <label>col <input type="number" [(ngModel)]="hs.col" (ngModelChange)="refresh()" class="inp-num" /></label>
                  </div>

                  <div class="section-label">Conexões</div>
                  <div class="conn-tags">
                    @for (cid of hs.connections; track cid) {
                      <span class="conn-tag">
                        {{ cid }}
                        <button (click)="removeConn($event, hs, cid)">✕</button>
                      </span>
                    }
                    @if (hs.connections.length === 0) {
                      <span class="conn-empty">nenhuma</span>
                    }
                  </div>
                  <select class="conn-add" (change)="addConn(hs, $event)">
                    <option value="">+ conectar a...</option>
                    @for (other of otherRooms(hs); track other.roomId) {
                      <option [value]="other.roomId">{{ other.roomId }} — {{ other.name }}</option>
                    }
                  </select>
                </div>
              }
            </div>
          </div>

          @if (copied()) {
            <div class="toast">✅ Layout copiado!</div>
          }
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; background: #0d0d18; color: #eee; font-family: monospace; }
    .debug-root { display: flex; flex-direction: column; height: 100vh; }

    /* Header */
    .debug-header {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 14px; background: #12121e; border-bottom: 1px solid #2a2a42;
      flex-shrink: 0; flex-wrap: wrap;
    }
    .debug-header h1 { margin: 0; font-size: 13px; white-space: nowrap; }
    .floor-select {
      background: #0d0d1a; border: 1px solid #3a3a52; color: #eee;
      padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 11px;
      cursor: pointer; max-width: 240px;
    }
    .hint { font-size: 10px; color: #555; flex: 1; }
    .header-actions { display: flex; gap: 6px; }
    .btn-game  { background: #166534; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; text-decoration: none; }
    .btn-add   { background: #7c3aed; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }
    .btn-copy  { background: #1e40af; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }

    /* Body */
    .debug-body { display: flex; flex: 1; overflow: hidden; }
    .map-wrap {
      flex: 1; overflow: auto; background: #07070f;
      display: flex; align-items: flex-start; justify-content: flex-start;
      padding: 20px;
    }
    .map-canvas { flex-shrink: 0; }
    .map-svg { display: block; overflow: visible; }

    /* Nós */
    .node-group { transition: opacity 0.15s; }
    .node-group:hover { opacity: 0.85; }
    .node-selected circle:first-of-type { filter: drop-shadow(0 0 8px #facc15); }
    .drag-handle { cursor: grab; }
    .drag-handle:active { cursor: grabbing; }

    /* Painel */
    .debug-panel {
      width: 290px; flex-shrink: 0; overflow-y: auto;
      background: #0f0f1e; border-left: 1px solid #2a2a42; padding: 10px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .panel-section {}
    .panel-title { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }

    .hs-list { display: flex; flex-direction: column; gap: 6px; }
    .hs-item {
      background: #14142a; border: 1px solid #2a2a3e; border-radius: 5px;
      padding: 7px 8px; cursor: pointer; transition: border-color 0.15s;
    }
    .hs-item:hover { border-color: #3a3a5e; }
    .hs-selected { border-color: #facc15 !important; background: #1a1a30 !important; }

    .hs-head { display: flex; gap: 5px; align-items: center; margin-bottom: 6px; }
    .hs-id {
      color: #000; border-radius: 3px; padding: 1px 5px; font-size: 9px;
      min-width: 18px; text-align: center; flex-shrink: 0; font-weight: bold;
    }
    .inp-name {
      flex: 1; background: #0a0a14; border: 1px solid #2a2a3e; color: #eee;
      padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 10px; min-width: 0;
    }
    .btn-del { background: none; border: none; color: #f87171; cursor: pointer; font-size: 10px; padding: 0 2px; }
    .btn-del:hover { color: #ef4444; }

    .hs-fields-row { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 5px; }
    .hs-fields-row label { font-size: 9px; color: #666; display: flex; flex-direction: column; gap: 2px; }
    .inp-num {
      background: #0a0a14; border: 1px solid #2a2a3e; color: #eee;
      padding: 2px 4px; width: 44px; border-radius: 3px; font-family: monospace; font-size: 11px;
    }
    .inp-type {
      background: #0a0a14; border: 1px solid #2a2a3e; color: #eee;
      padding: 2px 3px; border-radius: 3px; font-family: monospace; font-size: 9px; width: 72px;
    }

    .section-label { font-size: 9px; color: #444; text-transform: uppercase; letter-spacing: .05em; margin: 5px 0 3px; }
    .conn-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 4px; min-height: 18px; align-items: center; }
    .conn-tag {
      display: flex; align-items: center; gap: 2px;
      background: #1e2a4a; border: 1px solid #2563eb; border-radius: 3px;
      padding: 1px 5px; font-size: 9px; color: #93c5fd;
    }
    .conn-tag button { background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 8px; padding: 0; }
    .conn-tag button:hover { color: #f87171; }
    .conn-empty { font-size: 9px; color: #333; font-style: italic; }
    .conn-add {
      width: 100%; background: #0a0a14; border: 1px solid #2a2a3e; color: #888;
      padding: 3px 5px; border-radius: 3px; font-family: monospace; font-size: 9px; cursor: pointer;
    }

    .toast {
      background: #14532d; color: #86efac; padding: 8px 12px;
      border-radius: 4px; font-size: 11px; text-align: center; margin-top: 6px;
    }
  `]
})
export class MapDebugComponent {
  readonly floorEntries = Object.entries(DUNGEON_REGISTRY).map(([k, v]) => ({
    floor: +k,
    name: v.theme.godName,
  })).sort((a, b) => a.floor - b.floor);

  selectedFloor    = signal(1);
  selectedFloorStr = '1';

  hotspots = signal<RoomState[]>([]);
  selected = signal<number | null>(null);
  copied   = signal(false);
  dragging = signal<number | null>(null);
  private nextId  = 0;
  private dragSvg: SVGSVGElement | null = null;

  private zone = inject(NgZone);

  // ── Layout (mesmo sistema do dungeon-map) ─────────────────────────────────
  readonly PAD_X  = 56;
  readonly PAD_Y  = 44;
  readonly NODE_W = 120;
  readonly NODE_H = 80;
  readonly R      = 22;

  private entranceRow = computed(() =>
    this.hotspots().find(h => h.type === 'entrance')?.row ?? 0
  );

  depth(hs: RoomState): number {
    return Math.abs(hs.row - this.entranceRow());
  }

  maxDepth = computed(() => Math.max(...this.hotspots().map(h => this.depth(h)), 0));
  maxLane  = computed(() => Math.max(...this.hotspots().map(h => h.col), 0));

  svgW = computed(() => this.PAD_X * 2 + this.maxDepth() * this.NODE_W);
  svgH = computed(() => this.PAD_Y * 2 + this.maxLane() * this.NODE_H);
  svgViewBox = computed(() => `0 0 ${this.svgW()} ${this.svgH()}`);

  bossThresholdX = computed(() =>
    this.PAD_X + this.maxDepth() * this.NODE_W - this.NODE_W * 0.55
  );

  laneLines = computed(() => {
    const lines = [];
    for (let i = 0; i <= this.maxLane(); i++) {
      lines.push(this.PAD_Y + i * this.NODE_H);
    }
    return lines;
  });

  nodeX(hs: RoomState): number { return this.PAD_X + this.depth(hs) * this.NODE_W; }
  nodeY(hs: RoomState): number { return this.PAD_Y + hs.col * this.NODE_H; }

  nodeColor(hs: RoomState): string { return ROOM_COLORS[hs.type] ?? '#555'; }
  nodeFill(hs: RoomState): string {
    const c = ROOM_COLORS[hs.type] ?? '#555';
    return c + '22';
  }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      entrance: '🚪', monster: '⚔️', treasure: '💰', rest: '🔥',
      trap: '⚡', boss: '💀', empty: '·', puzzle: '🧩', social: '💬',
    };
    return icons[type] ?? '?';
  }

  connections = computed(() => {
    const seen = new Set<string>();
    const result: any[] = [];
    const hsMap = new Map(this.hotspots().map(h => [h.roomId, h]));
    this.hotspots().forEach(hs => {
      hs.connections.forEach(cid => {
        const key = [Math.min(hs.roomId, cid), Math.max(hs.roomId, cid)].join('-');
        if (seen.has(key)) return;
        seen.add(key);
        const b = hsMap.get(cid);
        if (!b) return;
        const color = this.nodeColor(hs);
        result.push({ key, x1: this.nodeX(hs), y1: this.nodeY(hs), x2: this.nodeX(b), y2: this.nodeY(b), color });
      });
    });
    return result;
  });

  constructor() { this.loadFloor(1); }

  onFloorChange(val: string) {
    const n = +val;
    this.selectedFloor.set(n);
    this.loadFloor(n);
    this.selected.set(null);
  }

  private loadFloor(floor: number) {
    const config = DUNGEON_REGISTRY[floor];
    if (!config) return;
    const list: RoomState[] = config.layout.rooms.map(r => ({
      roomId: r.id,
      name: r.name,
      type: r.type,
      row: r.row,
      col: r.col,
      connections: [...r.connections],
    }));
    this.hotspots.set(list);
    this.nextId = Math.max(...list.map(h => h.roomId), -1) + 1;
  }

  otherRooms(hs: RoomState): RoomState[] {
    return this.hotspots().filter(h => h.roomId !== hs.roomId && !hs.connections.includes(h.roomId));
  }

  selectRoom(e: MouseEvent, id: number) {
    e.stopPropagation();
    if (this.dragging() === null) this.selected.set(id);
  }

  addRoom() {
    const id = this.nextId++;
    this.hotspots.update(list => [...list, {
      roomId: id, name: `Nova Sala ${id}`,
      type: 'empty', row: 0, col: 0, connections: [],
    }]);
    this.selected.set(id);
  }

  removeRoom(e: MouseEvent, id: number) {
    e.stopPropagation();
    this.hotspots.update(list =>
      list.filter(h => h.roomId !== id)
          .map(h => ({ ...h, connections: h.connections.filter(c => c !== id) }))
    );
    if (this.selected() === id) this.selected.set(null);
  }

  addConn(hs: RoomState, e: Event) {
    const val = +(e.target as HTMLSelectElement).value;
    if (!val && val !== 0) return;
    (e.target as HTMLSelectElement).value = '';
    if (hs.connections.includes(val)) return;
    hs.connections.push(val);
    const other = this.hotspots().find(h => h.roomId === val);
    if (other && !other.connections.includes(hs.roomId)) other.connections.push(hs.roomId);
    this.refresh();
  }

  removeConn(e: MouseEvent, hs: RoomState, cid: number) {
    e.stopPropagation();
    hs.connections = hs.connections.filter(c => c !== cid);
    const other = this.hotspots().find(h => h.roomId === cid);
    if (other) other.connections = other.connections.filter(c => c !== hs.roomId);
    this.refresh();
  }

  /** Drag altera row/col do nó arrastando no SVG */
  startDrag(e: MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    this.dragSvg = (e.target as SVGElement).closest('svg') as SVGSVGElement;
    this.dragging.set(id);
    this.selected.set(id);

    const onMove = (mv: MouseEvent) => {
      if (!this.dragSvg) return;
      const pt = this.svgPoint(this.dragSvg, mv.clientX, mv.clientY);
      const entrRow = this.entranceRow();
      // Converte posição SVG de volta para row/col
      const rawDepth = Math.round((pt.x - this.PAD_X) / this.NODE_W);
      const rawCol   = Math.round((pt.y - this.PAD_Y) / this.NODE_H);
      const depth    = Math.max(0, rawDepth);
      const col      = Math.max(0, rawCol);

      this.zone.run(() => {
        this.hotspots.update(list =>
          list.map(h => {
            if (h.roomId !== id) return h;
            // row = entranceRow - depth (boss side) ou entranceRow + depth
            // Detecta direção original do nó
            const isBossDir = h.type === 'boss' || (h.row <= entrRow && entrRow > 0) || (h.row >= entrRow && entrRow === 0);
            const newRow = entrRow > 0 ? entrRow - depth : entrRow + depth;
            return { ...h, row: Math.max(0, newRow), col };
          })
        );
      });
    };

    const onUp = () => {
      this.zone.run(() => this.dragging.set(null));
      this.dragSvg = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    this.zone.runOutsideAngular(() => {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  private svgPoint(svg: SVGSVGElement, x: number, y: number) {
    const pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }

  refresh() { this.hotspots.update(list => [...list]); }

  copyConfig() {
    const hs = this.hotspots();
    const lines = hs.map(h => {
      const conns = `[${h.connections.join(', ')}]`;
      return `      { id: ${String(h.roomId).padStart(2)}, row: ${h.row}, col: ${h.col}, type: '${h.type}', name: '${h.name}', connections: ${conns} },`;
    });
    const text = `    rooms: [\n${lines.join('\n')}\n    ],`;
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2500);
  }
}
