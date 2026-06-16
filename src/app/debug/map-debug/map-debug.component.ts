import { Component, signal, computed, NgZone, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DUNGEON_REGISTRY } from '../../core/data/dungeons/dungeon-registry';

type ShapeType = 'circle' | 'rect';

interface HotspotState {
  roomId: number;
  label: string;
  cx: number;
  cy: number;
  r: number;
  w: number;
  h: number;
  shape: ShapeType;
  name: string;
  connections: number[];
  row: number;
  col: number;
  type: string;
}

const FLOOR_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(DUNGEON_REGISTRY).map(([k, v]) => [+k, v.theme.godName])
);

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
            <option [value]="entry.floor">Andar {{ entry.floor }} — {{ entry.name }}{{ entry.hasMap ? ' 🖼️' : '' }}</option>
          }
        </select>
        <span class="hint">{{ hasImageMap() ? 'Arraste hotspot · Clique no mapa para coordenadas' : 'Sem mapa de imagem neste andar' }}</span>
        <a class="btn-game" href="/">🎮 Jogo</a>
        @if (hasImageMap()) {
          <button class="btn-add" (click)="addRoom()">＋ Sala</button>
          <button class="btn-copy" (click)="copyConfig()">📋 Copiar config</button>
        }
      </header>

      <div class="debug-body">
        <!-- Mapa -->
        <div class="map-wrap">
          @if (hasImageMap()) {
            <div class="image-map-wrapper" (click)="onMapClick($event)">
              <img [src]="mapUrl()" class="dungeon-image" alt="Mapa" />
              <svg class="hotspot-layer" [attr.viewBox]="viewBox()" xmlns="http://www.w3.org/2000/svg">

                <!-- Conexões -->
                @for (conn of connections(); track conn.key) {
                  <line [attr.x1]="conn.x1" [attr.y1]="conn.y1" [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                    stroke="#000" stroke-width="3" />
                  <line [attr.x1]="conn.x1" [attr.y1]="conn.y1" [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                    stroke="#facc15" stroke-width="1.5" stroke-dasharray="6 5" />
                }

                <!-- Hotspots -->
                @for (hs of hotspots(); track hs.roomId) {
                  <g class="hs-group" [class.hs-selected]="selected() === hs.roomId"
                    (click)="selectHotspot($event, hs.roomId)">

                    @if (hs.shape === 'circle') {
                      <circle [attr.cx]="hs.cx" [attr.cy]="hs.cy" [attr.r]="hs.r + 5"
                        fill="none" stroke="#000" stroke-width="3" opacity="0.6" />
                      <circle [attr.cx]="hs.cx" [attr.cy]="hs.cy" [attr.r]="hs.r"
                        fill="rgba(0,0,0,0.5)" stroke="#fff" stroke-width="2" class="hs-shape" />
                    } @else {
                      <rect [attr.x]="hs.cx - hs.w/2 - 5" [attr.y]="hs.cy - hs.h/2 - 5"
                        [attr.width]="hs.w + 10" [attr.height]="hs.h + 10"
                        rx="4" fill="none" stroke="#000" stroke-width="3" opacity="0.6" />
                      <rect [attr.x]="hs.cx - hs.w/2" [attr.y]="hs.cy - hs.h/2"
                        [attr.width]="hs.w" [attr.height]="hs.h"
                        rx="4" fill="rgba(0,0,0,0.5)" stroke="#fff" stroke-width="2" class="hs-shape" />
                    }

                    <text [attr.x]="hs.cx" [attr.y]="hs.cy + 1"
                      text-anchor="middle" dominant-baseline="middle"
                      font-size="13" fill="#fff" font-weight="bold" style="pointer-events:none">{{ hs.label }}</text>
                    <text [attr.x]="hs.cx" [attr.y]="labelY(hs)"
                      text-anchor="middle" font-size="10" fill="#000" stroke="#fff" stroke-width="2.5" paint-order="stroke"
                      font-weight="bold" style="pointer-events:none">{{ hs.roomId }}</text>

                    <!-- Drag handle -->
                    <g class="drag-handle" (mousedown)="startDrag($event, hs.roomId)">
                      <circle [attr.cx]="hs.cx" [attr.cy]="handleY(hs)" r="9"
                        fill="#facc15" stroke="#000" stroke-width="1.5" />
                      <text [attr.x]="hs.cx" [attr.y]="handleY(hs) + 1"
                        text-anchor="middle" dominant-baseline="middle"
                        font-size="10" fill="#000">⠿</text>
                    </g>
                  </g>
                }

              </svg>
            </div>
          } @else {
            <!-- Grade SVG para andares sem imageMap -->
            <div class="no-image-notice">
              <svg [attr.viewBox]="gridViewBox()" class="grid-svg" xmlns="http://www.w3.org/2000/svg">
                @for (conn of connections(); track conn.key) {
                  <line [attr.x1]="conn.x1" [attr.y1]="conn.y1" [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                    stroke="#555" stroke-width="2" />
                }
                @for (hs of hotspots(); track hs.roomId) {
                  <g (click)="selected.set(hs.roomId)" style="cursor:pointer"
                     [class.hs-selected]="selected() === hs.roomId">
                    <circle [attr.cx]="gridX(hs)" [attr.cy]="gridY(hs)" r="28"
                      [attr.fill]="selected() === hs.roomId ? '#312e81' : '#1e1e30'"
                      stroke="#818cf8" stroke-width="2" />
                    <text [attr.x]="gridX(hs)" [attr.y]="gridY(hs) + 5"
                      text-anchor="middle" font-size="11" fill="#fff" font-weight="bold">{{ hs.type.slice(0,3) }}</text>
                    <text [attr.x]="gridX(hs)" [attr.y]="gridY(hs) + 44"
                      text-anchor="middle" font-size="9" fill="#aaa">{{ hs.roomId }}</text>
                  </g>
                }
              </svg>
              <p class="no-image-text">Sem imagem de mapa · Edite as salas no painel lateral</p>
            </div>
          }
        </div>

        <!-- Painel lateral -->
        <aside class="debug-panel">
          @if (lastClick()) {
            <div class="last-click">📍 {{ lastClick()!.x | number:'1.0-0' }}, {{ lastClick()!.y | number:'1.0-0' }}</div>
          }

          <h3>SALAS ({{ hotspots().length }})</h3>
          <div class="hs-list">
            @for (hs of hotspots(); track hs.roomId) {
              <div class="hs-item" [class.hs-item-selected]="selected() === hs.roomId"
                (click)="selected.set(hs.roomId)">

                <!-- Cabeçalho -->
                <div class="hs-item-head">
                  <span class="hs-id">{{ hs.roomId }}</span>
                  <input class="inp-name" [(ngModel)]="hs.name" (ngModelChange)="refresh()" placeholder="Nome da sala" />
                  <button class="btn-del" (click)="removeRoom($event, hs.roomId)" title="Remover sala">✕</button>
                </div>

                <!-- Tipo/posição grade -->
                <div class="hs-section-label">Grade (row/col)</div>
                <div class="hs-fields">
                  <label>row <input type="number" [(ngModel)]="hs.row" (ngModelChange)="refresh()" /></label>
                  <label>col <input type="number" [(ngModel)]="hs.col" (ngModelChange)="refresh()" /></label>
                  <label>type
                    <select [(ngModel)]="hs.type" (ngModelChange)="refresh()" class="inp-type">
                      <option value="entrance">entrance</option>
                      <option value="monster">monster</option>
                      <option value="empty">empty</option>
                      <option value="treasure">treasure</option>
                      <option value="trap">trap</option>
                      <option value="boss">boss</option>
                      <option value="rest">rest</option>
                    </select>
                  </label>
                </div>

                @if (hasImageMap()) {
                  <!-- Posição no mapa -->
                  <div class="hs-section-label">Posição</div>
                  <div class="hs-fields">
                    <label>cx <input type="number" [(ngModel)]="hs.cx" (ngModelChange)="refresh()" /></label>
                    <label>cy <input type="number" [(ngModel)]="hs.cy" (ngModelChange)="refresh()" /></label>
                    <label>lbl <input type="text" [(ngModel)]="hs.label" (ngModelChange)="refresh()" class="inp-sm" /></label>
                  </div>

                  <!-- Formato -->
                  <div class="hs-section-label">Formato</div>
                  <div class="shape-row">
                    <button [class.active]="hs.shape === 'circle'" (click)="setShape(hs, 'circle')">⬤ Círculo</button>
                    <button [class.active]="hs.shape === 'rect'"   (click)="setShape(hs, 'rect')">▬ Retângulo</button>
                  </div>
                  @if (hs.shape === 'circle') {
                    <div class="hs-fields">
                      <label>r <input type="number" [(ngModel)]="hs.r" (ngModelChange)="refresh()" /></label>
                    </div>
                  } @else {
                    <div class="hs-fields">
                      <label>w <input type="number" [(ngModel)]="hs.w" (ngModelChange)="refresh()" /></label>
                      <label>h <input type="number" [(ngModel)]="hs.h" (ngModelChange)="refresh()" /></label>
                    </div>
                  }
                }

                <!-- Conexões -->
                <div class="hs-section-label">Conexões</div>
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
                <div class="conn-add-row">
                  <select class="conn-select" (change)="addConn(hs, $event)">
                    <option value="">+ conectar a...</option>
                    @for (other of otherRooms(hs); track other.roomId) {
                      <option [value]="other.roomId">{{ other.roomId }} — {{ other.name }}</option>
                    }
                  </select>
                </div>

              </div>
            }
          </div>

          @if (copied()) {
            <div class="toast">✅ Copiado!</div>
          }
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; background: #111; color: #eee; font-family: monospace; }
    .debug-root { display: flex; flex-direction: column; height: 100vh; }

    .debug-header { display: flex; align-items: center; gap: 10px; padding: 7px 14px; background: #1a1a2e; border-bottom: 1px solid #333; flex-shrink: 0; flex-wrap: wrap; }
    .debug-header h1 { margin: 0; font-size: 14px; white-space: nowrap; }
    .floor-select { background: #0d0d1a; border: 1px solid #444; color: #eee; padding: 3px 7px; border-radius: 4px; font-family: monospace; font-size: 11px; cursor: pointer; max-width: 280px; }
    .hint { font-size: 10px; color: #555; flex: 1; }
    .btn-game { background: #15803d; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; text-decoration: none; }
    .btn-add  { background: #7c3aed; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }
    .btn-copy { background: #2563eb; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }

    .debug-body { display: flex; flex: 1; overflow: hidden; }

    .map-wrap { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; background: #0a0a0a; padding: 16px; }
    .image-map-wrapper { position: relative; display: inline-block; user-select: none; }
    .dungeon-image { display: block; max-width: 712px; width: 100%; }
    .hotspot-layer { position: absolute; inset: 0; width: 100%; height: 100%; }

    .no-image-notice { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .grid-svg { width: 100%; max-width: 700px; background: #0d0d1a; border-radius: 8px; }
    .no-image-text { color: #555; font-size: 12px; }

    .hs-group:hover .hs-shape { stroke: #0ff !important; }
    .hs-selected .hs-shape { stroke: #facc15 !important; stroke-width: 2.5 !important; }
    .drag-handle { cursor: grab; }
    .drag-handle:active { cursor: grabbing; }

    .debug-panel { width: 300px; flex-shrink: 0; overflow-y: auto; padding: 10px; background: #161622; border-left: 1px solid #333; }
    .debug-panel h3 { margin: 0 0 8px; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: .06em; }

    .last-click { font-size: 11px; color: #0ff; margin-bottom: 8px; }

    .hs-list { display: flex; flex-direction: column; gap: 8px; }
    .hs-item { background: #1e1e30; border: 1px solid #2a2a42; border-radius: 5px; padding: 7px 8px; cursor: pointer; }
    .hs-item:hover { border-color: #444; }
    .hs-item-selected { border-color: #facc15 !important; }

    .hs-item-head { display: flex; gap: 5px; align-items: center; margin-bottom: 6px; }
    .hs-id { background: #2563eb; color: #fff; border-radius: 3px; padding: 1px 5px; font-size: 10px; min-width: 18px; text-align: center; flex-shrink: 0; }
    .inp-name { flex: 1; background: #0d0d1a; border: 1px solid #444; color: #eee; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 10px; min-width: 0; }
    .btn-del { background: none; border: none; color: #f87171; cursor: pointer; font-size: 11px; padding: 0 2px; flex-shrink: 0; }
    .btn-del:hover { color: #ef4444; }

    .hs-section-label { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: .05em; margin: 5px 0 3px; }

    .hs-fields { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 2px; }
    .hs-fields label { font-size: 10px; color: #777; display: flex; flex-direction: column; gap: 1px; }
    .hs-fields input { background: #0d0d1a; border: 1px solid #3a3a52; color: #eee; padding: 2px 4px; width: 54px; border-radius: 3px; font-family: monospace; font-size: 11px; }
    .inp-sm { width: 36px !important; }
    .inp-type { background: #0d0d1a; border: 1px solid #3a3a52; color: #eee; padding: 2px 3px; border-radius: 3px; font-family: monospace; font-size: 10px; width: 80px; }

    .shape-row { display: flex; gap: 4px; margin-bottom: 4px; }
    .shape-row button { flex: 1; background: #1e1e30; border: 1px solid #3a3a52; color: #888; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 10px; font-family: monospace; }
    .shape-row button.active { background: #312e81; border-color: #818cf8; color: #e0e7ff; }

    .conn-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 5px; min-height: 22px; align-items: center; }
    .conn-tag { display: flex; align-items: center; gap: 2px; background: #1e3a5f; border: 1px solid #2563eb; border-radius: 3px; padding: 1px 5px; font-size: 10px; color: #93c5fd; }
    .conn-tag button { background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 9px; padding: 0; line-height: 1; }
    .conn-tag button:hover { color: #f87171; }
    .conn-empty { font-size: 10px; color: #444; font-style: italic; }

    .conn-add-row select { width: 100%; background: #0d0d1a; border: 1px solid #3a3a52; color: #aaa; padding: 3px 5px; border-radius: 3px; font-family: monospace; font-size: 10px; cursor: pointer; }

    .toast { background: #166534; color: #86efac; padding: 8px 12px; border-radius: 4px; margin-top: 10px; font-size: 12px; text-align: center; }
  `]
})
export class MapDebugComponent {
  readonly floorEntries = Object.entries(DUNGEON_REGISTRY).map(([k, v]) => ({
    floor: +k,
    name: v.theme.godName,
    hasMap: !!v.imageMap,
  })).sort((a, b) => a.floor - b.floor);

  selectedFloor = signal(1);
  selectedFloorStr = '1';

  private zone = inject(NgZone);

  hotspots  = signal<HotspotState[]>([]);
  selected  = signal<number | null>(null);
  dragging  = signal<number | null>(null);
  lastClick = signal<{ x: number; y: number } | null>(null);
  copied    = signal(false);
  private nextId = 0;
  private dragSvg: SVGSVGElement | null = null;

  hasImageMap = computed(() => !!DUNGEON_REGISTRY[this.selectedFloor()]?.imageMap);
  mapUrl      = computed(() => DUNGEON_REGISTRY[this.selectedFloor()]?.imageMap?.url ?? '');
  viewBox     = computed(() => DUNGEON_REGISTRY[this.selectedFloor()]?.imageMap?.viewBox ?? '0 0 712 615');

  // Grid SVG dimensions for floors without imageMap
  private maxRow = computed(() => Math.max(...this.hotspots().map(h => h.row), 0));
  private maxCol = computed(() => Math.max(...this.hotspots().map(h => h.col), 0));
  readonly PAD = 60; readonly COL_W = 96; readonly ROW_H = 100;
  gridViewBox = computed(() => {
    const w = this.PAD * 2 + this.maxCol() * this.COL_W;
    const h = this.PAD * 2 + this.maxRow() * this.ROW_H;
    return `0 0 ${w} ${h}`;
  });
  gridX(hs: HotspotState) { return this.PAD + hs.col * this.COL_W; }
  gridY(hs: HotspotState) { return this.PAD + (this.maxRow() - hs.row) * this.ROW_H; }

  constructor() {
    this.loadFloor(1);
  }

  onFloorChange(val: string) {
    const n = +val;
    this.selectedFloor.set(n);
    this.loadFloor(n);
    this.selected.set(null);
    this.lastClick.set(null);
  }

  private loadFloor(floor: number) {
    const config = DUNGEON_REGISTRY[floor];
    if (!config) return;
    const roomConns = new Map(config.layout.rooms.map(r => [r.id, r.connections]));
    const roomNames = new Map(config.layout.rooms.map(r => [r.id, r.name]));
    const roomMeta  = new Map(config.layout.rooms.map(r => [r.id, r]));

    let list: HotspotState[];

    if (config.imageMap) {
      list = config.imageMap.hotspots.map(hs => {
        const r = hs.r ?? 30;
        const shape: ShapeType = (hs.w != null) ? 'rect' : 'circle';
        const meta = roomMeta.get(hs.roomId);
        return {
          ...hs,
          r,
          w: hs.w ?? r * 2,
          h: hs.h ?? r * 2,
          shape,
          name: roomNames.get(hs.roomId) ?? `Sala ${hs.roomId}`,
          connections: [...(roomConns.get(hs.roomId) ?? [])],
          row: meta?.row ?? 0,
          col: meta?.col ?? 0,
          type: meta?.type ?? 'empty',
        };
      });
    } else {
      // Floors without imageMap: create entries from rooms only
      list = config.layout.rooms.map(r => ({
        roomId: r.id,
        label: String(r.id),
        cx: 0, cy: 0,
        r: 28, w: 56, h: 56,
        shape: 'circle' as ShapeType,
        name: r.name,
        connections: [...r.connections],
        row: r.row,
        col: r.col,
        type: r.type,
      }));
    }

    this.hotspots.set(list);
    this.nextId = Math.max(...list.map(h => h.roomId), -1) + 1;
  }

  connections = computed(() => {
    const isImage = this.hasImageMap();
    const hsMap = new Map(this.hotspots().map(h => [h.roomId, h]));
    const seen = new Set<string>();
    const result: { key: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    this.hotspots().forEach(hs => {
      const ax = isImage ? hs.cx : this.gridX(hs);
      const ay = isImage ? hs.cy : this.gridY(hs);
      hs.connections.forEach(connId => {
        const key = [Math.min(hs.roomId, connId), Math.max(hs.roomId, connId)].join('-');
        if (seen.has(key)) return;
        seen.add(key);
        const b = hsMap.get(connId);
        if (!b) return;
        const bx = isImage ? b.cx : this.gridX(b);
        const by = isImage ? b.cy : this.gridY(b);
        result.push({ key, x1: ax, y1: ay, x2: bx, y2: by });
      });
    });
    return result;
  });

  otherRooms(hs: HotspotState): HotspotState[] {
    return this.hotspots().filter(h => h.roomId !== hs.roomId && !hs.connections.includes(h.roomId));
  }

  labelY(hs: HotspotState): number {
    return hs.shape === 'circle' ? hs.cy - hs.r - 6 : hs.cy - hs.h / 2 - 6;
  }

  handleY(hs: HotspotState): number {
    return hs.shape === 'circle' ? hs.cy - hs.r - 32 : hs.cy - hs.h / 2 - 32;
  }

  setShape(hs: HotspotState, shape: ShapeType) {
    hs.shape = shape;
    this.refresh();
  }

  addConn(hs: HotspotState, e: Event) {
    const val = +(e.target as HTMLSelectElement).value;
    if (!val && val !== 0) return;
    (e.target as HTMLSelectElement).value = '';
    if (hs.connections.includes(val)) return;
    hs.connections.push(val);
    const other = this.hotspots().find(h => h.roomId === val);
    if (other && !other.connections.includes(hs.roomId)) other.connections.push(hs.roomId);
    this.refresh();
  }

  removeConn(e: MouseEvent, hs: HotspotState, cid: number) {
    e.stopPropagation();
    hs.connections = hs.connections.filter(c => c !== cid);
    const other = this.hotspots().find(h => h.roomId === cid);
    if (other) other.connections = other.connections.filter(c => c !== hs.roomId);
    this.refresh();
  }

  addRoom() {
    const id = this.nextId++;
    const cx = this.hasImageMap() ? 356 : 0;
    const cy = this.hasImageMap() ? 307 : 0;
    this.hotspots.update(list => [...list, {
      roomId: id, label: String(id), cx, cy,
      r: 30, w: 60, h: 60,
      shape: 'circle', name: `Nova Sala ${id}`,
      connections: [], row: 0, col: 0, type: 'empty',
    }]);
    this.selected.set(id);
  }

  removeRoom(e: MouseEvent, id: number) {
    e.stopPropagation();
    this.hotspots.update(list =>
      list
        .filter(h => h.roomId !== id)
        .map(h => ({ ...h, connections: h.connections.filter(c => c !== id) }))
    );
    if (this.selected() === id) this.selected.set(null);
  }

  selectHotspot(e: MouseEvent, id: number) {
    e.stopPropagation();
    if (this.dragging() === null) this.selected.set(id);
  }

  startDrag(e: MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    this.dragSvg = (e.target as SVGElement).closest('svg') as SVGSVGElement;
    this.dragging.set(id);
    this.selected.set(id);

    const onMove = (mv: MouseEvent) => {
      if (!this.dragSvg) return;
      const pt = this.svgPoint(this.dragSvg, mv.clientX, mv.clientY);
      const coords = { x: Math.round(pt.x), y: Math.round(pt.y) };
      this.zone.run(() => {
        this.hotspots.update(list =>
          list.map(h => h.roomId === id ? { ...h, cx: coords.x, cy: coords.y } : h)
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

  onMapClick(e: MouseEvent) {
    if ((e.target as SVGElement).closest('.hs-group')) return;
    const svg = (e.currentTarget as HTMLElement).querySelector('svg') as SVGSVGElement | null;
    if (!svg) return;
    const pt = this.svgPoint(svg, e.clientX, e.clientY);
    this.lastClick.set({ x: Math.round(pt.x), y: Math.round(pt.y) });
  }

  private svgPoint(svg: SVGSVGElement, x: number, y: number) {
    const pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }

  refresh() { this.hotspots.update(list => [...list]); }

  copyConfig() {
    const hs = this.hotspots();
    const config = DUNGEON_REGISTRY[this.selectedFloor()];
    const imgMap = config?.imageMap;
    const floorN = this.selectedFloor();

    const roomLines = hs.map(h => {
      const conns = `[${h.connections.join(', ')}]`;
      return `      { id: ${String(h.roomId).padStart(2)}, row: ${h.row}, col: ${h.col}, type: '${h.type}', name: '${h.name}', connections: ${conns} },`;
    });

    let text = `    rooms: [\n${roomLines.join('\n')}\n    ],\n  },`;

    if (imgMap) {
      const hsLines = hs.map(h => {
        const shape = h.shape === 'rect'
          ? `cx: ${String(h.cx).padStart(3)}, cy: ${String(h.cy).padStart(3)}, w: ${h.w}, h: ${h.h}`
          : `cx: ${String(h.cx).padStart(3)}, cy: ${String(h.cy).padStart(3)}, r: ${h.r}`;
        return `      { roomId: ${String(h.roomId).padStart(2)}, label: '${h.label.trimEnd()}', ${shape} }, // ${h.name}`;
      });
      text +=
        `\n  imageMap: {\n` +
        `    url: '${imgMap.url}',\n` +
        `    viewBox: '${imgMap.viewBox}',\n` +
        `    hotspots: [\n${hsLines.join('\n')}\n    ],\n` +
        `  },`;
    }

    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2500);
  }
}
