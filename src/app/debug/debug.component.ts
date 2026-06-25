import { Component, signal, computed, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DUNGEON_REGISTRY } from '../core/data/dungeons/dungeon-registry';
import { BESTIARIO } from '../core/data/bestiario.data';
import { ITEM_CATALOG } from '../core/models/item.model';
import {
  analyzeFloorBalance, analyzeAllFloors, defaultExpectedPartyPP, formatReportAsMarkdown,
  FloorBalanceReport,
} from '../core/utils/balance-analysis';

interface RoomState {
  roomId: number;
  name: string;
  type: string;
  row: number;
  col: number;
  connections: number[];
  /** Dados de cenário para salas social (RolePlay) */
  scenarioHint?: string;
  /** Sala de monstro: ID do monstro (BESTIARIO) e quantos aparecem. */
  monsterId?: string;
  monsterCount?: number;
  /** Sala de tesouro: IDs de itens do ITEM_CATALOG que podem aparecer aqui. */
  treasureIds?: string[];
}

type RoomType = 'entrance' | 'monster' | 'treasure' | 'rest' | 'trap' | 'boss' | 'empty' | 'puzzle' | 'social';

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

const ROOM_NAMES: Record<RoomType, string[]> = {
  entrance: ['Entrada Principal', 'Portal de Entrada', 'Câmara de Chegada'],
  monster:  ['Câmara dos Guardas', 'Covil dos Monstros', 'Salão das Bestas', 'Câmara Infestada', 'Passagem Perigosa'],
  treasure: ['Câmara do Tesouro', 'Cofre Antigo', 'Sala dos Espólios', 'Câmara do Ouro'],
  rest:     ['Câmara de Descanso', 'Fogueira Sagrada', 'Refúgio do Aventureiro', 'Santuário Menor'],
  trap:     ['Corredor Armado', 'Câmara Maldita', 'Sala das Armadilhas'],
  boss:     ['Câmara do Guardião', 'Sala do Chefe', 'Câmara do Terror', 'Antro do Senhor'],
  empty:    ['Corredor Vazio', 'Câmara Abandonada', 'Passagem Escura'],
  puzzle:   ['Sala do Enigma', 'Câmara dos Mistérios', 'Antecâmara do Saber'],
  social:   ['Cruzamento dos Viajantes', 'Refúgio do Comerciante', 'Câmara dos Encontros', 'O Ponto de Parada', 'Bazar Itinerante'],
};

/** Templates de cenários de RolePlay para geração automática */
const ROLEPLAY_SCENARIOS = [
  {
    name: 'O Comerciante Misterioso',
    hint: `Um comerciante encapuzado oferece negócios suspeitos.
Escolhas:
• Comprar Mapa Secreto (50 ouro) → revela sala de tesouro próxima
• Comprar Poção de Força (30 ouro) → +1 F por 1 andar
• Comprar Informação (20 ouro) → dica sobre o guardião do andar
• Atacar o comerciante → Encontro de Monstro (ele era um ladrão disfarçado)
• Ignorar e seguir → nada acontece`,
  },
  {
    name: 'O Prisioneiro da Masmorra',
    hint: `Um aventureiro acorrentado pede ajuda.
Escolhas:
• Libertar sem questionar → ganha Companheiro Temporário (1 combate)
• Libertar após teste H → ganha Vantagem: Contato Subterrâneo
• Pedir informação antes de libertar → revela sala secreta (rol Investigação)
• Pedir ouro por liberação (30 ouro do prisioneiro) → ganho de ouro + Desvantagem: Mal Falado
• Ignorar → prisioneiro torna-se inimigo mais tarde (Encontro de Monstro)`,
  },
  {
    name: 'O Altar Abandonado',
    hint: `Um altar a uma divindade desconhecida. Oferendas intactas.
Escolhas:
• Rezar e oferecer 10 ouro → cura total do grupo
• Rezar e oferecer 25 ouro → ganho de Vantagem: Bênção Divina Menor
• Rezar e oferecer 50 ouro → ganho de Perícia: Conhecimento Religioso
• Saquear o altar (40 ouro) → Desvantagem: Amaldiçoado (−1 R por 2 andares)
• Rezar sem oferta → 50%: bênção menor / 50%: nada`,
  },
  {
    name: 'A Guilda das Sombras',
    hint: `Dois membros de uma guilda criminosa bloqueiam o caminho.
Escolhas:
• Pagar pedágio (30 ouro) → passagem livre + informação sobre armadilhas à frente
• Negociar com Lábia (H vs 3) → passagem + desconto de 50%
• Oferecer serviço (missão de recuperar item) → passagem grátis + Vantagem: Membro Honorário
• Atacar → Encontro de Monstro (reforços chegam)
• Fugir → desvio obrigatório pelo caminho mais longo (sala extra de monstro)`,
  },
  {
    name: 'O Espírito da Masmorra',
    hint: `Um espírito antigo propõe um desafio de sabedoria.
Escolhas:
• Aceitar desafio (teste H) → sucesso: Perícia de sua escolha / falha: Desvantagem: Confundido
• Oferecer 40 ouro → espírito compartilha segredo (localização do chefe + fraqueza)
• Recusar com respeito → espírito presenteia Amuleto de Proteção (+1 A por 1 combate)
• Atacar o espírito → inatacável; invoca 2 espectros (Encontro de Monstro)
• Ignorar → espírito bloqueia mentalmente (−1 H no próximo combate)`,
  },
  {
    name: 'O Mercador de Perícias',
    hint: `Um ancião oferece ensinamentos em troca de ouro ou itens.
Escolhas:
• Pagar 60 ouro → aprende Perícia: Furtividade
• Pagar 60 ouro → aprende Perícia: Primeiros Socorros
• Pagar 60 ouro → aprende Perícia: Negociação
• Entregar item equipado (arma/armadura comum) → aprende Perícia aleatória
• Recusar → ancião desaparece; 30% de chance de encontrá-lo novamente adiante`,
  },
  {
    name: 'A Encruzilhada Mágica',
    hint: `Três portais mágicos com destinos incertos.
Escolhas:
• Portal Dourado (50 ouro de tributo) → Sala de Tesouro garantida
• Portal Vermelho (teste F) → sucesso: Vantagem: Ímpeto Guerreiro / falha: Monstro
• Portal Azul (teste H) → sucesso: Sala de Descanso segura / falha: Armadilha
• Ignorar portais e avançar → caminho normal sem bônus
• Investigar portais (Investigação H−2) → descobre qual é seguro sem risco`,
  },
  {
    name: 'Os Sobreviventes',
    hint: `Um grupo de aventureiros feridos pede ajuda.
Escolhas:
• Curar com recursos próprios (2 Poções) → ganham Aliados Temporários (próximo combate)
• Pagar clérigo do grupo (20 ouro) → ganham lealdade: informação exclusiva sobre chefão
• Dividir mantimentos → ganham Vantagem: Moral Elevado (+1 em próximo teste)
• Ignorar → karma neutro; eles surgem hostis em sala futura
• Roubar seus pertences (50 ouro) → Desvantagem: Mal Falado + Perseguidos pela guilda`,
  },
];

function pickName(type: RoomType, id: number): string {
  const pool = ROOM_NAMES[type] ?? [`Sala ${id}`];
  return pool[id % pool.length];
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function addBidir(rooms: RoomState[], a: number, b: number): void {
  const ra = rooms.find(r => r.roomId === a);
  const rb = rooms.find(r => r.roomId === b);
  if (!ra || !rb) return;
  if (!ra.connections.includes(b)) ra.connections.push(b);
  if (!rb.connections.includes(a)) rb.connections.push(a);
}

@Component({
  selector: 'app-debug',
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
          {{ hotspots().length }} salas · Profund: {{ maxDepth() }} · Lanes: {{ maxLane() + 1 }}
        </span>

        <div class="header-actions">
          <button class="btn-gen" (click)="genPanel.set(!genPanel())">🎲 Gerar</button>
          <button class="btn-add" (click)="addRoom()">＋ Sala</button>
          <button class="btn-copy" (click)="copyConfig()">📋 Copiar</button>
          <button class="btn-balance" (click)="toggleBalancePanel()">📊 Balanceamento</button>
          <a class="btn-game" href="/">🎮 Jogo</a>
        </div>
      </header>

      <!-- Painel do gerador -->
      @if (genPanel()) {
        <div class="gen-panel">
          <div class="gen-title">⚙️ Gerador Automático de Layout</div>

          <div class="gen-groups">
            <!-- Grupo: Combate -->
            <div class="gen-group">
              <div class="gen-group-label">⚔️ Combate</div>
              <label class="gen-field">
                <span>Encontros</span>
                <input type="number" [(ngModel)]="genMonsters" min="0" max="16" class="gen-input" />
              </label>
              <label class="gen-field">
                <span>Armadilhas</span>
                <input type="number" [(ngModel)]="genTraps" min="0" max="6" class="gen-input" />
              </label>
              <label class="gen-field">
                <span title="Chefes posicionados no final do mapa">Chefes Finais</span>
                <input type="number" [(ngModel)]="genBosses" min="1" max="4" class="gen-input" />
              </label>
              <label class="gen-field">
                <span title="Chefes que guardam passagens antes da área final. Criam rotas alternativas obrigatórias.">Saídas c/ Chefe</span>
                <input type="number" [(ngModel)]="genGuardedExits" min="0" max="3" class="gen-input" />
              </label>
            </div>

            <!-- Grupo: Exploração -->
            <div class="gen-group">
              <div class="gen-group-label">🗝️ Exploração</div>
              <label class="gen-field">
                <span>Tesouros</span>
                <input type="number" [(ngModel)]="genTreasures" min="0" max="8" class="gen-input" />
              </label>
              <label class="gen-field">
                <span>Descansos</span>
                <input type="number" [(ngModel)]="genRests" min="0" max="4" class="gen-input" />
              </label>
              <label class="gen-field">
                <span>Enigmas</span>
                <input type="number" [(ngModel)]="genPuzzles" min="0" max="4" class="gen-input" />
              </label>
            </div>

            <!-- Grupo: RolePlay -->
            <div class="gen-group gen-group-rp">
              <div class="gen-group-label">🎭 RolePlay</div>
              <label class="gen-field">
                <span title="Encontros com escolhas: comprar vantagens, ganhar perícias, pagar ouro, arriscar, etc.">Encontros RP</span>
                <input type="number" [(ngModel)]="genRoleplay" min="0" max="6" class="gen-input" />
              </label>
              @if (genRoleplay > 0) {
                <div class="rp-hint">
                  Cada sala RP gera um cenário com múltiplas escolhas:<br>
                  pagar ouro, ganhar vantagem/perícia, arriscar encontros, arriscar desvantagens, etc.
                </div>
              }
            </div>
          </div>

          <div class="gen-summary">
            <span class="gen-sum-total">Total: {{ genTotal() }} salas</span>
            <span class="gen-sum-items">
              1 entrada ·
              {{ genMonsters }} encontros ·
              {{ genTreasures }} tesouros ·
              {{ genRests }} descansos ·
              {{ genTraps }} armadilhas ·
              {{ genPuzzles }} enigmas ·
              {{ genRoleplay }} RolePlay ·
              {{ genGuardedExits }} saídas c/ chefe ·
              {{ genBosses }} chefe(s)
            </span>
          </div>

          <div class="gen-actions">
            <button class="btn-gen-run" (click)="generateLayout()">🎲 Gerar Layout</button>
            <button class="btn-gen-cancel" (click)="genPanel.set(false)">✕ Cancelar</button>
          </div>
        </div>
      }

      <!-- Painel de balanceamento -->
      @if (balancePanel()) {
        <div class="balance-panel">
          <div class="balance-title">📊 Análise de Balanceamento — sem combate real, só estatística (FA/FD esperados com 1d6=3.5)</div>

          <div class="balance-controls">
            <label class="balance-field">
              <span>PP da Party (andar {{ selectedFloor() }})</span>
              <input type="number" [(ngModel)]="balancePartyPP" min="3" class="gen-input" style="width:64px" />
            </label>
            <label class="balance-field">
              <span>Tamanho do grupo</span>
              <input type="number" [(ngModel)]="balancePartySize" min="1" max="6" class="gen-input" style="width:52px" />
            </label>
            <label class="balance-field">
              <span>Armadura média</span>
              <input type="number" [(ngModel)]="balanceArmadura" min="0" max="10" class="gen-input" style="width:52px" />
            </label>
            <button class="btn-balance-run" (click)="runBalanceForFloor()">Analisar este andar</button>
            <button class="btn-balance-all" (click)="runBalanceAllFloors()">Analisar os 20 andares</button>
            @if (balanceReports().length > 0) {
              <button class="btn-balance-copy" (click)="copyBalanceReport()">📋 Copiar relatório (Markdown)</button>
            }
          </div>

          @if (balanceCopied()) {
            <div class="toast" style="margin: 4px 0;">✅ Relatório copiado!</div>
          }

          @for (report of balanceReports(); track report.floor) {
            <div class="balance-report">
              <div class="balance-report-head">
                Andar {{ report.floor }} — PP {{ report.partyPP }} · escala {{ report.scale.toFixed(2) }}
              </div>
              <table class="balance-table">
                <thead>
                  <tr>
                    <th>Monstro</th><th>P</th><th>H</th><th>R</th><th>PV</th>
                    <th>Dano→Monstro</th><th>Dano→Grupo</th><th>Risco</th><th>Veredito</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of report.monsters; track m.id) {
                    <tr [class]="'verdict-' + m.verdict">
                      <td>{{ m.name }}</td>
                      <td>{{ m.poder }}</td><td>{{ m.habilidade }}</td><td>{{ m.resistencia }}</td><td>{{ m.hp }}</td>
                      <td>{{ m.expectedDmgPartyToMonster.toFixed(1) }}</td>
                      <td>{{ m.expectedDmgMonsterToParty.toFixed(1) }}</td>
                      <td>{{ m.riskRatio === Infinity ? '∞' : m.riskRatio.toFixed(2) }}</td>
                      <td>{{ m.verdict }}</td>
                    </tr>
                  }
                  @if (report.monsters.length === 0) {
                    <tr><td colspan="9" class="conn-empty">Nenhum monstro cadastrado para este andar no bestiário.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

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

              <!-- Colunas de profundidade -->
              @for (col of depthColumns(); track col.x) {
                <line [attr.x1]="col.x" [attr.y1]="20"
                      [attr.x2]="col.x" [attr.y2]="svgH() - 20"
                      stroke="#ffffff08" stroke-width="1" stroke-dasharray="3 5" />
                <text [attr.x]="col.x" y="13"
                  text-anchor="middle" font-size="8" fill="#ffffff20" font-family="monospace">d{{ col.depth }}</text>
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
                <line [attr.x1]="conn.x1" [attr.y1]="conn.y1"
                      [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                      stroke="#000" stroke-width="4" stroke-linecap="round" opacity="0.5" />
                <line [attr.x1]="conn.x1" [attr.y1]="conn.y1"
                      [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                      [attr.stroke]="conn.color" stroke-width="1.8"
                      stroke-dasharray="5 4" stroke-linecap="round" opacity="0.7" />
                @if (conn.forward) {
                  <polygon [attr.points]="conn.arrowPoints" [attr.fill]="conn.color" opacity="0.7" />
                }
              }

              <!-- Nós das salas -->
              @for (hs of hotspots(); track hs.roomId) {
                <g class="node-group" [class.node-selected]="selected() === hs.roomId"
                  (click)="selectRoom($event, hs.roomId)" style="cursor:pointer">

                  <!-- Sombra -->
                  <circle [attr.cx]="nodeX(hs) + 2" [attr.cy]="nodeY(hs) + 2" r="22" fill="#00000066" />

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

                  <!-- Badge RP para salas social -->
                  @if (hs.type === 'social') {
                    <circle [attr.cx]="nodeX(hs) - 20" [attr.cy]="nodeY(hs) - 20"
                      r="7" fill="#1abc9c" stroke="#000" stroke-width="1" />
                    <text [attr.x]="nodeX(hs) - 20" [attr.y]="nodeY(hs) - 19"
                      text-anchor="middle" dominant-baseline="middle"
                      font-size="8" style="pointer-events:none">RP</text>
                  }

                  <!-- Ícone do tipo -->
                  <text [attr.x]="nodeX(hs)" [attr.y]="nodeY(hs) + 1"
                    text-anchor="middle" dominant-baseline="middle"
                    font-size="13" style="pointer-events:none">{{ typeIcon(hs.type) }}</text>

                  <!-- ID -->
                  <text [attr.x]="nodeX(hs) + 20" [attr.y]="nodeY(hs) - 18"
                    text-anchor="middle" font-size="9" fill="#000"
                    stroke="#fff" stroke-width="2.5" paint-order="stroke"
                    font-weight="bold" style="pointer-events:none">{{ hs.roomId }}</text>

                  <!-- Label abaixo -->
                  <text [attr.x]="nodeX(hs)" [attr.y]="nodeY(hs) + 36"
                    text-anchor="middle" font-size="8"
                    [attr.fill]="nodeColor(hs)" opacity="0.85"
                    font-family="monospace" style="pointer-events:none">{{ hs.type.slice(0,4) }}</text>

                  <!-- Handle de drag -->
                  <g class="drag-handle" (mousedown)="startDrag($event, hs.roomId)">
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
            <div class="panel-title">DISTRIBUIÇÃO</div>
            <div class="dist-stats">
              @for (stat of roomStats(); track stat.type) {
                <div class="stat-row">
                  <span class="stat-icon">{{ typeIcon(stat.type) }}</span>
                  <span class="stat-label">{{ stat.type }}</span>
                  <span class="stat-bar-wrap">
                    <span class="stat-bar" [style.width.%]="stat.pct" [style.background]="ROOM_COLORS[stat.type]"></span>
                  </span>
                  <span class="stat-count">{{ stat.count }}</span>
                </div>
              }
            </div>
          </div>

          <div class="panel-section">
            <div class="panel-title">SALAS ({{ hotspots().length }})</div>
            <div class="hs-list">
              @for (hs of hotspots(); track hs.roomId) {
                <div class="hs-item" [class.hs-selected]="selected() === hs.roomId"
                  (click)="selected.set(hs.roomId)">

                  <div class="hs-head">
                    <span class="hs-id" [style.background]="nodeColor(hs)">{{ hs.roomId }}</span>
                    <span class="hs-type-icon">{{ typeIcon(hs.type) }}</span>
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

                  <!-- Cenário RP (se social) -->
                  @if (hs.type === 'social' && hs.scenarioHint) {
                    <details class="rp-detail">
                      <summary class="rp-summary">🎭 Cenário RP</summary>
                      <pre class="rp-text">{{ hs.scenarioHint }}</pre>
                    </details>
                  }

                  <!-- Sala de monstro/chefe: qual monstro e quantos -->
                  @if (hs.type === 'monster' || hs.type === 'boss') {
                    <div class="section-label">Monstro (disponíveis nesta masmorra)</div>
                    <div class="hs-fields-row">
                      <select class="inp-type" [(ngModel)]="hs.monsterId" (ngModelChange)="refresh()">
                        <option [ngValue]="undefined">— escolher monstro —</option>
                        @for (m of availableMonsters(); track m.id) {
                          <option [ngValue]="m.id">{{ m.icon }} {{ m.name }}</option>
                        }
                      </select>
                      <label>qtd
                        <input type="number" min="1" max="12" class="inp-num"
                          [(ngModel)]="hs.monsterCount" (ngModelChange)="refresh()" placeholder="1" />
                      </label>
                    </div>
                    @if (availableMonsters().length === 0) {
                      <span class="conn-empty">Nenhum monstro cadastrado para esta masmorra no bestiário.</span>
                    }
                  }

                  <!-- Sala de tesouro: quais itens podem aparecer -->
                  @if (hs.type === 'treasure') {
                    <div class="section-label">Tesouros possíveis ({{ (hs.treasureIds ?? []).length }} selecionados)</div>
                    <div class="treasure-grid">
                      @for (it of availableTreasures(); track it.id) {
                        <label class="treasure-chip" [class.treasure-chip--on]="isTreasureSelected(hs, it.id)">
                          <input type="checkbox" [checked]="isTreasureSelected(hs, it.id)"
                            (change)="toggleTreasure(hs, it.id)" />
                          {{ it.icon }} {{ it.name }}
                        </label>
                      }
                    </div>
                  }

                  <div class="section-label">Conexões</div>
                  <div class="conn-tags">
                    @for (cid of hs.connections; track cid) {
                      <span class="conn-tag" [class.conn-back]="isBackConn(hs, cid)">
                        {{ cid }}{{ isBackConn(hs, cid) ? '↩' : '' }}
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
    .btn-game   { background: #166534; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; text-decoration: none; }
    .btn-add    { background: #7c3aed; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }
    .btn-copy   { background: #1e40af; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }
    .btn-gen    { background: #b45309; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }
    .btn-balance { background: #0e7490; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }

    /* Balance panel */
    .balance-panel {
      background: #0c0c1a; border-bottom: 2px solid #0e7490;
      padding: 10px 16px 12px; flex-shrink: 0; max-height: 50vh; overflow-y: auto;
    }
    .balance-title { font-size: 10px; color: #67e8f9; margin-bottom: 8px; }
    .balance-controls { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 8px; }
    .balance-field { display: flex; flex-direction: column; gap: 3px; font-size: 10px; color: #aaa; }
    .btn-balance-run, .btn-balance-all, .btn-balance-copy {
      background: #0e7490; color: #fff; border: none; padding: 5px 10px; border-radius: 4px;
      cursor: pointer; font-size: 11px;
    }
    .btn-balance-all  { background: #155e75; }
    .btn-balance-copy { background: #1e40af; }
    .balance-report { margin-bottom: 14px; }
    .balance-report-head { font-size: 11px; color: #facc15; margin-bottom: 4px; font-weight: bold; }
    .balance-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .balance-table th, .balance-table td { padding: 3px 6px; border-bottom: 1px solid #2a2a42; text-align: left; }
    .balance-table th { color: #888; font-weight: normal; text-transform: uppercase; font-size: 9px; }
    .verdict-trivial     td:last-child { color: #6b7280; }
    .verdict-equilibrado td:last-child { color: #4ade80; font-weight: bold; }
    .verdict-arriscado   td:last-child { color: #facc15; font-weight: bold; }
    .verdict-mortal       td:last-child { color: #f87171; font-weight: bold; }

    .treasure-grid {
      display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;
    }
    .treasure-chip {
      display: flex; align-items: center; gap: 3px;
      background: #0a0a14; border: 1px solid #2a2a3e; color: #999;
      padding: 2px 6px; border-radius: 10px; font-size: 9px; cursor: pointer;
      input { display: none; }
    }
    .treasure-chip--on {
      background: #422006; border-color: #d4aa14; color: #facc15;
    }

    /* Gen panel */
    .gen-panel {
      background: #0c0c1a; border-bottom: 2px solid #b45309;
      padding: 10px 16px 12px; flex-shrink: 0;
    }
    .gen-title { font-size: 11px; color: #facc15; font-weight: bold; margin-bottom: 10px; }
    .gen-groups { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 10px; }
    .gen-group {
      background: #12121e; border: 1px solid #2a2a42; border-radius: 6px;
      padding: 8px 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start;
    }
    .gen-group-rp { border-color: #1abc9c44; flex-direction: column; }
    .gen-group-label {
      width: 100%; font-size: 9px; color: #888; text-transform: uppercase;
      letter-spacing: .08em; margin-bottom: 2px;
    }
    .gen-field { display: flex; flex-direction: column; gap: 3px; font-size: 10px; color: #aaa; cursor: help; }
    .gen-field span[title] { text-decoration: underline dotted #555; }
    .gen-input {
      background: #0a0a14; border: 1px solid #3a3a52; color: #eee;
      padding: 3px 6px; width: 52px; border-radius: 4px; font-family: monospace; font-size: 12px;
      text-align: center;
    }
    .rp-hint {
      font-size: 9px; color: #1abc9c; line-height: 1.5;
      background: #0a1a16; border: 1px solid #1abc9c33; border-radius: 4px;
      padding: 5px 7px; max-width: 260px;
    }
    .gen-summary {
      font-size: 10px; color: #555; margin-bottom: 8px;
      display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    }
    .gen-sum-total { color: #facc15; font-weight: bold; font-size: 11px; }
    .gen-sum-items { color: #444; }
    .gen-actions { display: flex; gap: 6px; }
    .btn-gen-run    { background: #15803d; color: #fff; border: none; padding: 5px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; }
    .btn-gen-run:hover { background: #16a34a; }
    .btn-gen-cancel { background: transparent; border: 1px solid #3a3a52; color: #666; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }

    /* Body */
    .debug-body { display: flex; flex: 1; overflow: hidden; }
    .map-wrap {
      flex: 1; overflow: auto; background: #07070f;
      display: flex; align-items: flex-start; justify-content: flex-start;
      padding: 20px;
    }
    .map-canvas { flex-shrink: 0; }
    .map-svg { display: block; overflow: visible; }

    .node-group { transition: opacity 0.15s; }
    .node-group:hover { opacity: 0.85; }
    .node-selected circle:first-of-type { filter: drop-shadow(0 0 8px #facc15); }
    .drag-handle { cursor: grab; }
    .drag-handle:active { cursor: grabbing; }

    /* Painel lateral */
    .debug-panel {
      width: 295px; flex-shrink: 0; overflow-y: auto;
      background: #0f0f1e; border-left: 1px solid #2a2a42; padding: 10px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .panel-title { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }

    .dist-stats { display: flex; flex-direction: column; gap: 4px; }
    .stat-row { display: flex; align-items: center; gap: 5px; font-size: 10px; }
    .stat-icon { width: 14px; text-align: center; }
    .stat-label { width: 60px; color: #9ca3af; }
    .stat-bar-wrap { flex: 1; height: 5px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .stat-bar { display: block; height: 100%; border-radius: 3px; }
    .stat-count { width: 16px; text-align: right; color: #6b7280; font-size: 9px; }

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
    .hs-type-icon { font-size: 12px; flex-shrink: 0; }
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

    /* RolePlay detail */
    .rp-detail { margin: 5px 0; }
    .rp-summary {
      font-size: 9px; color: #1abc9c; cursor: pointer;
      padding: 2px 4px; border-radius: 3px; user-select: none;
    }
    .rp-summary:hover { background: #0a2a22; }
    .rp-text {
      font-size: 8.5px; color: #888; white-space: pre-wrap; line-height: 1.5;
      background: #0a1a16; border: 1px solid #1abc9c22; border-radius: 3px;
      padding: 6px 8px; margin: 4px 0 0; max-height: 140px; overflow-y: auto;
    }

    .section-label { font-size: 9px; color: #444; text-transform: uppercase; letter-spacing: .05em; margin: 5px 0 3px; }
    .conn-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 4px; min-height: 18px; align-items: center; }
    .conn-tag {
      display: flex; align-items: center; gap: 2px;
      background: #1e2a4a; border: 1px solid #2563eb; border-radius: 3px;
      padding: 1px 5px; font-size: 9px; color: #93c5fd;
    }
    .conn-back { border-color: #dc2626 !important; color: #fca5a5 !important; background: #3b1212 !important; }
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
export class DebugComponent {
  readonly ROOM_COLORS = ROOM_COLORS;

  /** Monstros do bestiário cadastrados para a masmorra/andar selecionado. */
  availableMonsters = computed(() => {
    const floor = this.selectedFloor();
    return Object.entries(BESTIARIO)
      .filter(([, m]) => m.floor === floor)
      .map(([id, m]) => ({ id, name: m.name, icon: m.icon }));
  });

  /** Itens cujo floorRange cobre o andar selecionado — evita misturar tesouro fraco
   *  de início de masmorra com tesouro forte do fim (ver Item.floorRange). */
  availableTreasures = computed(() => {
    const floor = this.selectedFloor();
    return Object.entries(ITEM_CATALOG)
      .filter(([, it]) => !it.floorRange || (floor >= it.floorRange[0] && floor <= it.floorRange[1]))
      .map(([id, it]) => ({ id, name: it.name, icon: it.icon }));
  });

  isTreasureSelected(hs: RoomState, itemId: string): boolean {
    return (hs.treasureIds ?? []).includes(itemId);
  }

  toggleTreasure(hs: RoomState, itemId: string): void {
    const current = hs.treasureIds ?? [];
    hs.treasureIds = current.includes(itemId)
      ? current.filter(id => id !== itemId)
      : [...current, itemId];
    this.refresh();
  }

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
  genPanel = signal(false);

  // Painel de balanceamento
  readonly Infinity = Infinity;
  balancePanel    = signal(false);
  balanceReports  = signal<FloorBalanceReport[]>([]);
  balanceCopied   = signal(false);
  balancePartyPP    = defaultExpectedPartyPP(1);
  balancePartySize  = 4;
  balanceArmadura   = 0;

  // Gerador: configurações
  genMonsters     = 4;
  genTreasures    = 2;
  genRests        = 1;
  genTraps        = 1;
  genPuzzles      = 0;
  genBosses       = 1;  // chefes finais
  genGuardedExits = 0;  // saídas protegidas por chefes intermediários
  genRoleplay     = 1;  // encontros de roleplay

  genTotal = computed(() =>
    1 + this.genMonsters + this.genTreasures + this.genRests +
    this.genTraps + this.genPuzzles + this.genRoleplay +
    this.genGuardedExits + Math.max(1, this.genBosses)
  );

  private nextId  = 0;
  private dragSvg: SVGSVGElement | null = null;
  private zone = inject(NgZone);

  readonly PAD_X  = 56;
  readonly PAD_Y  = 44;
  readonly NODE_W = 120;
  readonly NODE_H = 80;
  readonly R      = 22;

  private entranceRow = computed(() =>
    this.hotspots().find(h => h.type === 'entrance')?.row ?? 0
  );

  depth(hs: RoomState): number { return Math.abs(hs.row - this.entranceRow()); }

  maxDepth = computed(() => Math.max(...this.hotspots().map(h => this.depth(h)), 0));
  maxLane  = computed(() => Math.max(...this.hotspots().map(h => h.col), 0));

  svgW = computed(() => this.PAD_X * 2 + this.maxDepth() * this.NODE_W);
  svgH = computed(() => this.PAD_Y * 2 + (this.maxLane() + 1) * this.NODE_H);
  svgViewBox = computed(() => `0 0 ${this.svgW()} ${this.svgH()}`);

  bossThresholdX = computed(() =>
    this.PAD_X + this.maxDepth() * this.NODE_W - this.NODE_W * 0.55
  );

  laneLines = computed(() => {
    const lines = [];
    for (let i = 0; i <= this.maxLane() + 1; i++) lines.push(this.PAD_Y + i * this.NODE_H);
    return lines;
  });

  depthColumns = computed(() => {
    const cols = [];
    for (let d = 0; d <= this.maxDepth(); d++) cols.push({ depth: d, x: this.PAD_X + d * this.NODE_W });
    return cols;
  });

  nodeX(hs: RoomState): number { return this.PAD_X + this.depth(hs) * this.NODE_W; }
  nodeY(hs: RoomState): number { return this.PAD_Y + hs.col * this.NODE_H + this.NODE_H / 2; }

  nodeColor(hs: RoomState): string { return ROOM_COLORS[hs.type] ?? '#555'; }
  nodeFill(hs: RoomState): string  { return (ROOM_COLORS[hs.type] ?? '#555') + '22'; }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      entrance: '🚪', monster: '⚔️', treasure: '💰', rest: '🔥',
      trap: '⚡', boss: '💀', empty: '·', puzzle: '🧩', social: '🎭',
    };
    return icons[type] ?? '?';
  }

  roomStats = computed(() => {
    const rooms = this.hotspots();
    const counts: Partial<Record<string, number>> = {};
    for (const r of rooms) counts[r.type] = (counts[r.type] ?? 0) + 1;
    return Object.entries(counts).map(([type, count]) => ({
      type, count: count!, pct: Math.round(count! / rooms.length * 100),
    }));
  });

  isBackConn(hs: RoomState, targetId: number): boolean {
    const target = this.hotspots().find(h => h.roomId === targetId);
    if (!target) return false;
    return this.depth(target) < this.depth(hs);
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
        const x1 = this.nodeX(hs), y1 = this.nodeY(hs);
        const x2 = this.nodeX(b),  y2 = this.nodeY(b);
        const color = this.nodeColor(hs);
        const forward = this.depth(b) > this.depth(hs);
        let arrowPoints = '';
        if (forward) {
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len, uy = dy / len;
          const px = -uy * 4, py = ux * 4;
          arrowPoints = `${mx + ux * 6},${my + uy * 6} ${mx + px},${my + py} ${mx - px},${my - py}`;
        }
        result.push({ key, x1, y1, x2, y2, color, forward, arrowPoints });
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
    this.balancePartyPP = defaultExpectedPartyPP(n);
  }

  // ── Análise de balanceamento ────────────────────────────────────────────

  toggleBalancePanel(): void {
    this.balancePanel.update(v => !v);
  }

  runBalanceForFloor(): void {
    const report = analyzeFloorBalance(this.selectedFloor(), {
      partyPP: this.balancePartyPP, size: this.balancePartySize, armadura: this.balanceArmadura,
    });
    this.balanceReports.set([report]);
  }

  runBalanceAllFloors(): void {
    const size = this.balancePartySize;
    const armadura = this.balanceArmadura;
    const reports = analyzeAllFloors(floor => ({ partyPP: defaultExpectedPartyPP(floor), size, armadura }));
    this.balanceReports.set(reports);
  }

  copyBalanceReport(): void {
    const text = formatReportAsMarkdown(this.balanceReports());
    navigator.clipboard.writeText(text);
    this.balanceCopied.set(true);
    setTimeout(() => this.balanceCopied.set(false), 2500);
  }

  private loadFloor(floor: number) {
    const config = DUNGEON_REGISTRY[floor];
    if (!config) return;
    const list: RoomState[] = config.layout.rooms.map(r => ({
      roomId: r.id,
      name: r.name,
      type: Array.isArray(r.type) ? r.type.join('/') : r.type,
      row: r.row,
      col: r.col,
      connections: [...r.connections],
    }));
    this.hotspots.set(list);
    this.nextId = Math.max(...list.map(h => h.roomId), -1) + 1;
  }

  // ── Gerador automático ────────────────────────────────────────────────────

  /**
   * Gera o layout no estilo Slay the Spire:
   * - 4 a 5 lanes (trilhas verticais) por onde os caminhos passam.
   * - Cada sala (da 2ª coluna até a última) conecta a 1 sala da próxima
   *   coluna em 70% dos casos, ou a 2 salas em 30% dos casos.
   * - Da 2ª à antepenúltima coluna, garante ao menos uma sala "funil"
   *   conectada a uma única sala da próxima coluna (caminho único).
   * - Nenhuma sala fica desconectada (toda sala tem ao menos 1 entrada).
   */
  generateLayout(): void {
    const M  = Math.max(0, this.genMonsters);
    const T  = Math.max(0, this.genTreasures);
    const R  = Math.max(0, this.genRests);
    const Tr = Math.max(0, this.genTraps);
    const Pz = Math.max(0, this.genPuzzles);
    const RP = Math.max(0, this.genRoleplay);
    const GE = Math.max(0, this.genGuardedExits);
    const B  = Math.max(1, this.genBosses);

    // Salas intermediárias: tipos embaralhados
    const middle: RoomType[] = [
      ...Array(M).fill('monster' as RoomType),
      ...Array(T).fill('treasure' as RoomType),
      ...Array(R).fill('rest' as RoomType),
      ...Array(Tr).fill('trap' as RoomType),
      ...Array(Pz).fill('puzzle' as RoomType),
      ...Array(RP).fill('social' as RoomType),
    ];
    shuffle(middle);

    // ── Grade de lanes (estilo Slay the Spire): 4 ou 5 trilhas verticais ──
    const numLanes = 4 + Math.round(Math.random()); // 4 ou 5

    // Distribui as salas em colunas de profundidade, cada coluna ocupando
    // entre 1 e numLanes lanes escolhidas aleatoriamente. Cada slot é um par
    // {lane, type} para nunca perder a correspondência entre os dois ao
    // reordenar/realocar colunas depois.
    interface Slot { lane: number; type: RoomType; }
    let columns: Slot[][] = [];
    {
      let idx = 0;
      while (idx < middle.length) {
        const remaining = middle.length - idx;
        const roomsInCol = Math.min(remaining, 1 + Math.floor(Math.random() * numLanes));
        const lanes = shuffle([...Array(numLanes).keys()]).slice(0, roomsInCol);
        const types = middle.slice(idx, idx + roomsInCol);
        columns.push(lanes.map((lane, li) => ({ lane, type: types[li] })));
        idx += roomsInCol;
      }
      // Garante ao menos 4 colunas intermediárias para que a regra do
      // "funil" (2ª à antepenúltima) tenha espaço — divide a última coluna
      // se necessário (caso raro com poucos itens configurados).
      while (columns.length < 4 && columns[columns.length - 1]?.length > 1) {
        const last = columns[columns.length - 1];
        const moved = last.pop()!;
        columns.push([moved]);
      }
      // Nenhuma coluna entre a 2ª e a antepenúltima pode ter só 1 sala: com
      // apenas 1 sala, ela é obrigada a cobrir sozinha todas as salas da
      // próxima coluna (sem deixar órfãs), tornando impossível garantir uma
      // sala com caminho único. Puxa uma sala do vizinho maior para cobrir.
      // Repete em várias passagens — corrigir uma coluna pode reduzir o
      // doador a 1 sala, exigindo outra rodada de ajustes em cascata.
      for (let pass = 0; pass < columns.length; pass++) {
        let fixedAny = false;
        for (let ci = 1; ci <= columns.length - 3; ci++) {
          if (columns[ci].length !== 1) continue;
          const prevLen = columns[ci - 1]?.length ?? 0;
          const nextLen = columns[ci + 1]?.length ?? 0;
          // Prefere o vizinho que, após doar, ainda fica com 2+ salas
          // (evita propagar o problema para o vizinho).
          let donorIdx = -1;
          if (prevLen > 2 || nextLen > 2) {
            donorIdx = prevLen >= nextLen ? ci - 1 : ci + 1;
          } else if (prevLen > 1 || nextLen > 1) {
            donorIdx = prevLen >= nextLen ? ci - 1 : ci + 1;
          }
          const donor = donorIdx >= 0 ? columns[donorIdx] : undefined;
          if (!donor || donor.length <= 1) continue;
          const usedLanes = new Set(columns[ci].map(s => s.lane));
          const pickIdx = donor.findIndex(s => !usedLanes.has(s.lane));
          const moved = donor.splice(pickIdx === -1 ? 0 : pickIdx, 1)[0];
          columns[ci] = [...columns[ci], moved];
          fixedAny = true;
        }
        if (!fixedAny) break;
      }
      // Ordena cada coluna por lane (mantendo o par lane/type correto)
      columns = columns.map(col => [...col].sort((a, b) => a.lane - b.lane));
    }
    const columnLanes: number[][] = columns.map(col => col.map(s => s.lane));
    const columnTypes: RoomType[][] = columns.map(col => col.map(s => s.type));

    const rooms: RoomState[] = [];
    const columnRoomIds: number[][] = [];
    const roomLane = new Map<number, number>();
    let idCounter = 0;

    // depth 0: entrada (lane central)
    const entranceLane = Math.floor((numLanes - 1) / 2);
    rooms.push({ roomId: idCounter, name: 'Entrada Principal', type: 'entrance', row: 0, col: entranceLane, connections: [] });
    roomLane.set(idCounter, entranceLane);
    columnRoomIds.push([idCounter]);
    idCounter++;

    // depths 1..n: grade de salas intermediárias
    columnLanes.forEach((lanes, gi) => {
      const depth = gi + 1;
      const types = columnTypes[gi];
      const ids: number[] = [];
      lanes.forEach((lane, li) => {
        const type = types[li];
        const id = idCounter++;
        const room: RoomState = { roomId: id, name: pickName(type, id), type, row: depth, col: lane, connections: [] };
        // Para salas social: atribui um cenário RP aleatório
        if (type === 'social') {
          const scenario = ROLEPLAY_SCENARIOS[id % ROLEPLAY_SCENARIOS.length];
          room.name = scenario.name;
          room.scenarioHint = scenario.hint;
        }
        rooms.push(room);
        roomLane.set(id, lane);
        ids.push(id);
      });
      columnRoomIds.push(ids);
    });

    const numMiddleCols = columnLanes.length;
    const finalDepth = numMiddleCols + 1;

    // Saídas protegidas por chefes: posicionadas antes da coluna final
    // Cada uma forma um "gargalo" que leva aos chefes finais
    if (GE > 0) {
      const guardedDepth = finalDepth;
      const gIds: number[] = [];
      for (let g = 0; g < GE; g++) {
        const id = idCounter++;
        rooms.push({
          roomId: id,
          name: `Passagem do Guardião ${g + 1}`,
          type: 'boss',
          row: guardedDepth,
          col: g,
          connections: [],
          scenarioHint: 'Saída Protegida — chefe guarda esta passagem para o próximo segmento.',
        } as RoomState);
        gIds.push(id);
      }
      columnRoomIds.push(gIds);

      // Chefes finais ficam um passo além
      const bossDepth = finalDepth + 1;
      const bIds: number[] = [];
      for (let b = 0; b < B; b++) {
        const id = idCounter++;
        rooms.push({ roomId: id, name: `Câmara do Chefe ${b > 0 ? b + 1 : ''}`.trim(), type: 'boss', row: bossDepth, col: b, connections: [] });
        bIds.push(id);
      }
      columnRoomIds.push(bIds);
    } else {
      // Sem saídas protegidas: chefes finais na última coluna
      const bIds: number[] = [];
      for (let b = 0; b < B; b++) {
        const id = idCounter++;
        rooms.push({ roomId: id, name: B > 1 ? `Câmara do Chefe ${b + 1}` : 'Câmara do Guardião Final', type: 'boss', row: finalDepth, col: b, connections: [] });
        bIds.push(id);
      }
      columnRoomIds.push(bIds);
    }

    // ── Conexões estilo Slay the Spire entre a entrada e a grade de lanes ──
    if (columnRoomIds.length > 1) {
      for (const id of columnRoomIds[1]) addBidir(rooms, columnRoomIds[0][0], id);
    }

    for (let d = 1; d < numMiddleCols; d++) {
      const currIds = columnRoomIds[d];
      const nextIds = columnRoomIds[d + 1];
      const funnelEligible = d >= 2 && d <= numMiddleCols - 2; // "do segundo à antepenúltima"
      let hasSinglePath = false;

      for (const curId of currIds) {
        const curLane = roomLane.get(curId)!;
        // Candidatos: salas da próxima coluna com lane a até 1 de distância
        // (evita cruzamentos longos, como no mapa original)
        let candidates = nextIds.filter(nid => Math.abs(roomLane.get(nid)! - curLane) <= 1);
        if (candidates.length === 0) candidates = [...nextIds];
        shuffle(candidates);

        // 70% conecta a 1 sala da próxima coluna, 30% conecta a 2
        const wantsTwo = candidates.length >= 2 && Math.random() < 0.3;
        const picks = wantsTwo ? candidates.slice(0, 2) : candidates.slice(0, 1);
        picks.forEach(nid => addBidir(rooms, curId, nid));
      }

      // Garante que toda sala da próxima coluna tenha ao menos uma entrada
      for (const nid of nextIds) {
        const room = rooms.find(r => r.roomId === nid)!;
        if (room.connections.length === 0) {
          const nLane = roomLane.get(nid)!;
          const sorted = [...currIds].sort((a, b) =>
            Math.abs(roomLane.get(a)! - nLane) - Math.abs(roomLane.get(b)! - nLane));
          addBidir(rooms, nid, sorted[0]);
        }
      }

      // Recalcula com o estado final (após o ajuste de órfãos, que pode ter
      // transformado uma sala "funil" de 1 conexão em uma de 2).
      hasSinglePath = currIds.some(id =>
        rooms.find(r => r.roomId === id)!.connections.filter(c => nextIds.includes(c)).length === 1);

      // Regra do "funil": garante ao menos uma sala com caminho único à
      // frente entre a 2ª e a antepenúltima coluna intermediária.
      if (funnelEligible && !hasSinglePath) {
        const withTwo = currIds.filter(id =>
          rooms.find(r => r.roomId === id)!.connections.filter(c => nextIds.includes(c)).length === 2);
        if (withTwo.length > 0) {
          const pickId = withTwo[Math.floor(Math.random() * withTwo.length)];
          const room = rooms.find(r => r.roomId === pickId)!;
          const forwardConns = room.connections.filter(c => nextIds.includes(c));
          const cid = forwardConns[Math.floor(Math.random() * forwardConns.length)];
          const target = rooms.find(r => r.roomId === cid)!;
          const incomingCount = currIds.filter(id2 =>
            rooms.find(r => r.roomId === id2)!.connections.includes(cid)).length;

          if (incomingCount > 1) {
            // Seguro: o alvo continua com outra entrada após a remoção
            room.connections = room.connections.filter(c => c !== cid);
            target.connections = target.connections.filter(c => c !== pickId);
          } else {
            // Removeria a única entrada do alvo — realoca para outra sala
            // desta mesma coluna antes de remover, mantendo a conectividade.
            const altParent = currIds.find(id2 => id2 !== pickId);
            if (altParent) {
              addBidir(rooms, altParent, cid);
              room.connections = room.connections.filter(c => c !== cid);
              target.connections = target.connections.filter(c => c !== pickId);
            }
          }
        }
      }
    }

    // ── Conecta a grade intermediária às saídas guardadas/chefes finais ──
    for (let d = numMiddleCols; d < columnRoomIds.length - 1; d++) {
      const prevIds = columnRoomIds[d];
      const currIds = columnRoomIds[d + 1];
      for (const currId of currIds) {
        for (const prevId of prevIds) addBidir(rooms, currId, prevId);
      }
    }

    this.hotspots.set(rooms);
    this.nextId = rooms.length;
    this.selected.set(null);
    this.genPanel.set(false);
  }

  // ── Edição manual ─────────────────────────────────────────────────────────

  otherRooms(hs: RoomState): RoomState[] {
    return this.hotspots().filter(h => h.roomId !== hs.roomId && !hs.connections.includes(h.roomId));
  }

  selectRoom(e: MouseEvent, id: number) {
    e.stopPropagation();
    if (this.dragging() === null) this.selected.set(id);
  }

  addRoom() {
    const id = this.nextId++;
    this.hotspots.update(list => [...list, { roomId: id, name: `Nova Sala ${id}`, type: 'empty', row: 0, col: 0, connections: [] }]);
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

  startDrag(e: MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    this.dragSvg = (e.target as SVGElement).closest('svg') as SVGSVGElement;
    this.dragging.set(id);
    this.selected.set(id);

    const onMove = (mv: MouseEvent) => {
      if (!this.dragSvg) return;
      const pt = this.svgPoint(this.dragSvg, mv.clientX, mv.clientY);
      const depth = Math.max(0, Math.round((pt.x - this.PAD_X) / this.NODE_W));
      const col   = Math.max(0, Math.round((pt.y - this.PAD_Y - this.NODE_H / 2) / this.NODE_H));
      this.zone.run(() => {
        this.hotspots.update(list => list.map(h => h.roomId !== id ? h : { ...h, row: depth, col }));
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
