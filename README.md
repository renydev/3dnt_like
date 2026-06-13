# Valkaria Roguelike

Dungeon crawler baseado no sistema **3D&T** (3ª Edição de Defensores de Tókio), ambientado no módulo *Libertação de Valkaria*. O jogador guia um personagem por 20 andares temáticos — cada um dedicado a um deus do panteão de Arton — enfrentando monstros, armadilhas e desafios sociais até chegar ao confronto final.

---

## Arquitetura de Módulos

O jogo é dividido em três módulos independentes, cada um com responsabilidade bem definida:

### 1. `character-creation` — Criação de Personagem
Tela de criação completa seguindo as regras do 3D&T:

- **Raça**: escolha entre 10 raças (Humano, Elfo, Anão, Halfling, Goblin, Minotauro…), cada uma com modificadores de atributo e habilidades raciais.
- **Classe**: 8 classes disponíveis (Guerreiro, Mago, Clérigo, Ladino, Paladino, Druida, Bardo, Arqueiro), com atributos base e proficiências distintas.
- **Vantagens e Desvantagens**: sistema de pontos — comprar vantagens custa pontos; tomar desvantagens devolve pontos. Exemplos: *Ambidestria*, *Sentidos Aguçados*, *Phobo*, *Inimigo*.
- **Distribuição de pontos**: os pontos restantes são alocados livremente em Força, Habilidade, Resistência, Armadura e PM.
- **Validação em tempo real**: o sistema impede combinações inválidas e mostra o custo acumulado enquanto o jogador escolhe.

### 2. `threat-generator` — Gerador de Ameaças
Módulo que monta dinamicamente o conteúdo de cada câmara com base em dois fatores:

- **Tipo de câmara**: monstro, armadilha, chefe, social, puzzle, descanso ou tesouro.
- **Pontuação dos personagens**: a soma dos atributos relevantes do grupo define a *dificuldade base*, que escala os atributos do inimigo, a severidade da armadilha ou o valor do tesouro.

Cada andar tem um **tema de deus** (Allihanna, Ragnar, Valkaria…) com suas próprias tabelas de monstros, ambientação e regras especiais (escuridão, veneno, combate subaquático, caos, encontros sociais).

### 3. `combat` — Sistema de Combate (Phaser.js)
Combate turn-based renderizado com **Phaser 3**, isolado do restante da aplicação Angular:

- **Iniciativa**: calculada por Habilidade + rolagem de dado.
- **Ações por turno**: Atacar, Usar Habilidade de Classe (custo em PM), Defender, Fugir.
- **Mecânica de dano**: dano físico = Força − Armadura do alvo; dano mágico = Habilidade − ½ Armadura.
- **Animações**: sprites de personagem e inimigo, efeitos de ataque, barra de HP animada, log de combate rolante.
- **Integração**: o resultado do combate (vitória/derrota/fuga) é devolvido ao Angular via callback, sem acoplar o Phaser ao estado global.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Angular 17+ (Signals) |
| Combate | Phaser 3 |
| Estilo | SCSS |
| Dados | TypeScript estático (sem backend) |
| Deploy | Firebase Hosting |

---

## Estrutura de Pastas

```
src/app/
├── core/                         # Modelos, serviços e dados globais
│   ├── data/                     # Arrays estáticos: raças, classes, magias…
│   ├── models/                   # Interfaces TypeScript do domínio
│   └── services/                 # Estado global (GameStateService)
│
├── modules/
│   ├── character-creation/       # Módulo 1 — Criação de personagem
│   │   ├── components/
│   │   │   ├── race-selector/
│   │   │   ├── class-selector/
│   │   │   ├── advantage-picker/
│   │   │   └── point-distributor/
│   │   └── character-creation.service.ts
│   │
│   ├── threat-generator/         # Módulo 2 — Gerador de ameaças
│   │   ├── components/
│   │   │   ├── dungeon-map/
│   │   │   ├── room-detail/
│   │   │   └── floor-progress/
│   │   └── threat-generator.service.ts
│   │
│   └── combat/                   # Módulo 3 — Combate com Phaser
│       ├── phaser/
│       │   ├── scenes/
│       │   │   ├── combat.scene.ts
│       │   │   └── preload.scene.ts
│       │   └── objects/
│       │       ├── character-sprite.ts
│       │       ├── enemy-sprite.ts
│       │       └── combat-hud.ts
│       ├── components/
│       │   └── combat-host/      # Angular wrapper que monta o Phaser
│       └── combat.service.ts
│
├── pages/                        # Telas / rotas principais
│   ├── menu/
│   ├── dungeon/
│   └── game-over/
│
└── shared/                       # Componentes reutilizáveis (HUD, botões…)
```

---

## Fluxo de Jogo

```
Menu
 └─► Criação de Personagem (character-creation)
      └─► Mapa do Andar (threat-generator → dungeon-map)
           ├─► Câmara de monstro → Combate Phaser (combat)
           │     └─► Resultado → volta ao mapa
           ├─► Câmara de armadilha / social / puzzle → resolução inline
           ├─► Câmara de tesouro / descanso → efeito imediato
           └─► Câmara de chefe → Combate Phaser (boss flag)
                └─► Vitória → próximo andar  (20 andares no total)
                     └─► Andar 20 → Tela de Vitória
```

---

## Desenvolvimento

```bash
npm install
ng serve          # Angular em localhost:4200
```

Para instalar o Phaser (ainda não instalado):
```bash
npm install phaser
```

---

## Roadmap

- [x] Modelos de dados (raças, classes, vantagens, masmorras)
- [x] Gerador de andares com layouts fixos
- [x] Serviço de estado global com Signals
- [ ] **Módulo 1**: UI de criação de personagem completa
- [ ] **Módulo 2**: Gerador de ameaças dinâmico com escalonamento
- [ ] **Módulo 3**: Cena de combate Phaser com animações
- [ ] Assets de sprite (personagens e monstros)
- [ ] Integração Firebase (save de highscore)
