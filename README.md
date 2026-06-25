# Valkaria Roguelike — Game Design Document

Dungeon crawler roguelike baseado no sistema **3D&T Victory** (Jambô Editora), ambientado nas *Masmorras de Valkaria*. O jogador cria um aventureiro e desce por **20 andares temáticos** — cada um dedicado a um deus do panteão de Arton — enfrentando monstros, armadilhas, encontros sociais e mercadores, até o confronto final.

> Este documento descreve o estado **atual** da implementação, não um roadmap aspiracional. Seções com lacunas conhecidas estão marcadas explicitamente.

---

## 1. Pilares de design

1. **Fidelidade ao 3D&T Victory.** As regras (atributos, PA, Ganho/Perda, vantagens, criação por PP) seguem o manual oficial sempre que o sistema permite — desvios são corrigidos quando encontrados, mesmo que isso signifique remover conteúdo legado incompatível.
2. **UI em Angular, jogo em Phaser.** Telas de formulário (criação de personagem, ficha, mochila, diálogos) são Angular puro. Mapa da masmorra e combate são canvas Phaser, sincronizados com o estado Angular via Signals.
3. **Sem backend.** Todo o conteúdo (masmorras, monstros, itens, vantagens) é dado estático em TypeScript. Sem persistência entre sessões além do estado em memória.

---

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Angular 17 (standalone components, Signals) |
| Mapa & Combate | Phaser 3 (canvas isolado por tela, ver §6) |
| Estilo | SCSS por componente |
| Dados | TypeScript estático (`core/data/`) |
| Estado global | `GameStateService` (Signals) |

```bash
npm install
npm start          # ng serve — http://localhost:4200
npm run build      # build de produção
```

Requer Node ≥ 18 (o Angular CLI 17 não roda em Node 16).

---

## 3. Estrutura de pastas

```
src/app/
├── core/
│   ├── data/                     # Conteúdo estático do jogo
│   │   ├── arquetipos.data.ts    # 25 Arquétipos (origem do personagem)
│   │   ├── kits.data.ts          # 58 Kits (profissão narrativa)
│   │   ├── vantagens.data.ts     # 62 Vantagens oficiais
│   │   ├── desvantagens.data.ts  # 31 Desvantagens oficiais
│   │   ├── pericias.data.ts      # 11 perícias
│   │   ├── enemies.data.ts       # geração de inimigos por andar/tier
│   │   └── dungeons/             # 20 pastas, uma por andar/deus
│   ├── models/                   # Interfaces de domínio (Character, Item, Combat, Dungeon)
│   ├── services/                 # Estado e regras (ver §4-6)
│   └── utils/                    # dice.ts (d6/Ganho/Perda), pp-calculator.ts
├── debug/                        # Editor/inspetor de layouts de andar (rota /debug)
└── dungeon/
    ├── components/                # Todas as telas de jogo (Angular)
    │   ├── game-layout/           # Container principal — roteia por GameScreen
    │   ├── character-creation/    # Fluxo de criação (8 passos)
    │   ├── dungeon-map/           # HUD do mapa (hospeda o canvas Phaser)
    │   ├── encounter-screen/      # HUD de combate/armadilha/tesouro (hospeda o canvas Phaser)
    │   ├── merchant-screen/, party-bar/, character-dialog/, backpack/,
    │   │   companion-select/, chamber-dialog/, floor-transition/, debug-dialog/, floor-progress/
    │   └── game-canvas/           # Host genérico de um Phaser.Game (1 cena por instância)
    └── phaser/scenes/             # MapScene e CombatScene
```

---

## 4. Personagem

### 4.1 Atributos
Três atributos primários, cada um `{ base, current, max }`:

| Atributo | Sigla | Função |
|---|---|---|
| Poder | P | Esforço físico, social e mágico — base da Força de Ataque (FA) |
| Habilidade | H | Agilidade e raciocínio — define **PM** e a iniciativa |
| Resistência | R | Vigor e força de vontade — define **PV** |

- **PV** (Pontos de Vida) = Resistência × 5
- **PM** (Pontos de Mana) = Habilidade × 5
- **Armadura** não é atributo do personagem — é 100% bônus de equipamento.

### 4.2 Criação de personagem (8 passos)
`character-creation.component.ts` — fluxo: **Origem → Início Rápido → Arquétipo → Kits → Atributos → Vantagens → Perícias → Devoção**.

- **3 tiers de origem** (`STARTING_TIERS`), todos com atributo máximo 5 na criação:
  - Iniciante — 10 PP (padrão oficial do 3D&T Victory)
  - Herói — 20 PP
  - Veterano — 35 PP
- **Arquétipo** (raça): 25 opções (`arquetipos.data.ts`), cada um com `cost` em PP e exatamente 3 poderes (vantagens/desvantagens nomeadas concedidas automaticamente).
- **Kits** (profissão): 58 opções (`kits.data.ts`), puramente narrativas — **não concedem bônus mecânico**. Custo cumulativo: 1º kit = 1pt, 2º = +1 (3 total), 3º = +1 (6 total).
- **Vantagens/Desvantagens**: listas oficiais completas — 62 vantagens / 31 desvantagens (`vantagens.data.ts` / `desvantagens.data.ts`), com custo em PP extraído do texto do manual (ex.: "1-2pt" → usa o menor valor). Máximo de 2 desvantagens selecionáveis.
- **Perícias**: 11 perícias amplas, 1 PP cada.
- Personagem final: PV/PM derivados de R/H, vantagens = poderes do arquétipo + vantagens escolhidas, ouro inicial = 20 + tier×2.

### 4.3 Progressão (XP → PP)
`pp-calculator.ts` + `game-state.service.ts`:

- Combate comum vencido → 1 XP/personagem; combate de chefe → 5 XP/personagem.
- Inimigos com PP somado ≤ metade do PP da party → 0 XP (desafio trivial).
- Bônus de XP se os inimigos forem mais fortes (+1 XP a cada 10 de diferença de PP, máx. +5).
- **10 XP = 1 PP.** PP acumulado é gasto manualmente (`spendLevelUpPoint`) para subir 1 ponto de atributo — custo 1PP se o atributo atual < 5, senão 2PP. Subir Resistência dá +5 PV; subir Habilidade dá +5 PM.
- Completar o chefe de um andar dá +1 PP de bônus a todo o grupo, independente do combate.

### 4.4 Escalas de Poder
`core/utils/power-scale.ts` — notação visual (ainda sem efeito nas contas de combate) para quando um atributo passa de uma ordem de grandeza:

| Escala | Faixa | Símbolo |
|---|---|---|
| Ningen ("humano") | 0–9 | — |
| Sugoi ("incrível") | 10–99 | ⭐ |
| Kiodai ("gigante") | 100–999 | ☁️ |
| Kami ("deus") | 1000+ | 👑 |

O símbolo aparece na ficha do personagem (`character-dialog`) e na criação, e no nome do inimigo em combate quando algum de seus atributos atinge Sugoi+. Acima de 9, o valor é mostrado em notação de ábaco (letra por ordem de grandeza completa + círculos para o resto, ex.: 11 = `A●○○○○○○○○`) em vez de pontinhos individuais. Hoje só é cosmético: nenhuma regra de combate trata diferença de escala entre atacante e defensor.

---

## 5. Exploração (Mapa)

- Renderizado em **`MapScene`** (Phaser), hospedado por `<app-game-canvas>` dentro de `dungeon-map.component.ts`. Trilha vertical estilo Slay the Spire/Pokelike (entrada embaixo, progride para cima), escalada automaticamente para caber no canvas.
- Tipos de sala (`RoomType`): `entrance`, `monster`, `trap`, `treasure`, `rest`, `boss`, `empty`, `puzzle`, `social`, `merchant`.
- Salas só revelam o tipo real depois de visitadas ou conectadas à sala atual; clique numa sala alcançável move o personagem ou abre o encontro.
- **20 andares**, cada um com tema de um deus de Arton (Allihanna, Ragnar, Trebuck, Lena, Hyninn, Marah, Tenebra, Azgher, Tanna-Toh, Lin-Wu, Wynna, O Oceano, Thyatis, Sszzaas, Megalokk, Nimb, Khalmyr, Valkaria, entre outros) com layout próprio em `core/data/dungeons/<andar>/`.
- Descanso rápido (50% PV/PM) e descanso profundo (PV/PM total) disponíveis em salas já limpas.

### 5.1 Bestiário e escala de monstros
`core/data/bestiario.data.ts` é a fonte única dos templates de monstro (atributos-base, lore, arquétipo). Cada andar (`<andar>.monsters.ts`) só decide **quais** monstros do bestiário aparecem em cada sala e em que quantidade — não redefine estatísticas.

A força real do monstro em combate **não depende do número do andar** — depende do **PP da party no confronto** (`growthScale(partyPP)` em `pp-calculator.ts`), interpolado entre âncoras (10PP→1.0×, 20PP→1.5×, 35PP→2.2×) com um pequeno reforço de +2%/andar por cima (`applyFloorBonus`) só para dar sensação de progressão — tudo saturado num teto fixo (2.6×): **monstros nunca crescem indefinidamente**. Acima de 1.3× de escala o monstro pode manifestar 1-2 vantagens "fora da curva" sorteadas do seu `archetype` (`monster-vantagens.data.ts`); chefes sempre manifestam ao menos 1.

Hoje só **Allihanna (andar 1) e Ragnar (andar 2)** usam esse sistema; os demais 18 andares ainda geram inimigos pelo sistema genérico antigo (`enemies.data.ts`, escala por número do andar) até serem migrados para o bestiário.

---

## 6. Combate

Renderizado em **`CombatScene`** (Phaser) — inimigos com token PNG real (`assets/monsters_token/`, fallback emoji), barras de HP animadas, seleção de alvo por clique. As regras vivem inteiramente em `CombatService` (Angular, sem dependência de Phaser).

### 6.1 Iniciativa e surpresa
No início do combate, **cada combatente** (jogador, cada companheiro, cada inimigo) rola 1d6+Habilidade individualmente — Ágil soma +2, Lento rola em Perda. Se o melhor resultado do grupo superar o melhor dos inimigos, o grupo age primeiro; senão, os inimigos atacam de surpresa antes do jogador agir.

### 6.2 Resolução de ataque
- **FA** (Força de Ataque) = Poder + 1d6 (+ dados extra de PA/habilidades/perícia Luta).
- **FD** (Força de Defesa) = Resistência + Armadura + 1d6 (+1d6 se o defensor tiver perícia Luta).
- **Resistir com Armadura**: se Armadura efetiva do defensor > Poder do atacante, o ataque é resistido (1 dano fixo) e a armadura "desgasta" (reduzida pelo Poder do atacante) para o resto do turno.
- **Dano = FA − FD, mínimo 0** — uma defesa forte pode anular o ataque por completo (corrigido para bater com a regra oficial; anteriormente havia um piso artificial de 1 dano).
- Não há teste de acerto/esquiva separado — a defesa já está embutida na FD.

### 6.3 Ganho e Perda
`core/utils/dice.ts` implementa a mecânica central de testes do Victory: **Ganho** = 2d6, usa o maior; **Perda** = 2d6, usa o menor. Hoje aplicada em:
- Iniciativa (Ágil = +2, Lento = Perda).
- Vantagem "enfraquecer": o inimigo afetado rola seu dado de ataque em Perda por 2 turnos (em vez de um redutor fixo de Poder).

### 6.4 Pontos de Ação (PA)
Pool inicial = Poder do personagem; cada PA gasto = +1d6 extra na FA/FD. Ao rolar 6 num dado de combate, o personagem ganha +1 PA até um teto por combate (⌈(Poder+Resistência)/2⌉); depois do teto, o 6 "explode" (rola +1d6 e soma, podendo encadear). PA persiste entre combates, só é realimentado ao fim de cada luta.

### 6.5 Habilidades de combate
**Não vêm de classe ou kit** — vêm das **Vantagens** compradas na criação (`VANTAGEM_ABILITIES` em `combat.service.ts`). Hoje implementadas:

| Vantagem | Efeito |
|---|---|
| Cura | 2PM → cura 1d6+Habilidade de PV |
| Confusão | Ataque vence a defesa → alvo ataca outro inimigo ao acaso (fogo amigo) até sofrer dano ou resistir (R+1d6 vs 9+Poder do conjurador) |
| Paralisia | Ataque vence a defesa → alvo perde o turno até sofrer dano ou resistir (R+1d6 vs 6+Poder do conjurador) |

As outras 59 vantagens oficiais ainda não têm gancho mecânico (ver §8).

### 6.6 Fuga
Teste de 1d6 + Habilidade efetiva vs dificuldade fixa 6. Impossível fugir de combates com chefe.

### 6.7 Recompensas
Vitória distribui XP (ver §4.3), ouro e um drop de item (50% de chance por inimigo com `itemsReward`).

---

## 7. Itens e equipamento

`core/models/item.model.ts` — 8 slots (`weapon`, `offhand`, `armor`, `head`, `gloves`, `boots`, `ring_left`, `ring_right`). Bônus de item (`StatBonus`) somam-se em Poder/Habilidade/Resistência/Armadura/PV/PM via `getEffectiveStats()`. Regras de exclusão: arma de duas mãos remove a mão secundária; luvas e anéis são mutuamente exclusivos. ~45 itens no catálogo, com loot ponderado por profundidade do andar (mais raros em andares avançados). Mercador (`merchant-screen.component.ts`) permite comprar/vender com ouro.

---

## 8. Lacunas conhecidas (fiéis ao 3D&T Victory, mas não implementadas)

Documentadas para não serem confundidas com bugs:

- **Perícias sem rolagem.** `PericiaService` só expõe dados estáticos; não há teste genérico de perícia (1d6+atributo vs dificuldade, com Ganho/Perda). Armadilhas usam um teste fixo de Habilidade em vez de escolher a perícia certa.
- **Sem acerto crítico.** Vantagens como Ágil/Foco/Maestria preveem "crítico automático em 5-6" — não implementado (distinto da explosão de PA em 6, que é mecânica separada).
- **59 das 62 vantagens oficiais sem efeito mecânico** — só decorativas na ficha, fora as 3 listadas em §6.5.
- **Anulação, Golpe Final, Punição e Acumulador** não implementados de propósito:
  - *Anulação* não tem alvo (inimigos não usam vantagens).
  - *Golpe Final* depende de uma tabela de "escala" de dano que este sistema simplificado não modela.
  - *Punição* exigiria escolher uma desvantagem específica por uso (precisa de UI nova).
  - *Acumulador* é um buff opcional pós-acerto que exigiria um prompt de UI por ataque.
- **Desvantagens/vantagens de "teste específico"** (Forte, Carismático, Gênio, Resoluto, Vigoroso, Fracote, Frágil, Tapado) não têm categoria de teste correspondente no jogo (testes sociais, de raciocínio, de esforço físico não existem como mecânica) — não foram aplicadas para não inflar Força de Ataque/Defesa incorretamente.

---

## 9. Fluxo de telas

`GameStateService.screen` (Signal) controla a tela ativa — não há roteamento Angular tradicional, exceto a rota `/debug`:

```
menu → character_create → companion_select → dungeon ⇄ encounter ⇄ merchant ⇄ floor_transition
                                                  └─► game_over / victory
```

`game-layout.component.ts` é o container que troca de tela via `@switch`. `debug.component.ts` (rota `/debug`) é um editor/inspetor de layouts de andar, independente do fluxo de jogo.
