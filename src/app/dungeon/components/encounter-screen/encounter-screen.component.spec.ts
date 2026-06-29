import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { EncounterScreenComponent } from './encounter-screen.component';
import { GameStateService } from '../../../core/services/game-state.service';
import { CombatService } from '../../../core/services/combat.service';
import { Character } from '../../../core/models/character.model';
import { DungeonFloor, DungeonRoom } from '../../../core/models/dungeon.model';
import { Enemy } from '../../../core/models/combat.model';

describe('EncounterScreenComponent', () => {
  let fixture: ComponentFixture<EncounterScreenComponent>;

  const character: Character = {
    id: 'hero',
    name: 'Aventureiro',
    kits: ['guerreiro'],
    race: 'humano',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    poder: { base: 2, current: 2, max: 2 },
    habilidade: { base: 2, current: 2, max: 2 },
    resistencia: { base: 2, current: 2, max: 2 },
    pontosVida: { base: 10, current: 10, max: 10 },
    pontosMana: { base: 6, current: 6, max: 6 },
    vantagens: [],
    desvantagens: [],
    gold: 0,
    inventory: [],
    equipment: {},
    statusEffects: [],
    portraitIcon: 'H',
  };

  const room: DungeonRoom = {
    id: 1,
    type: 'monster',
    name: 'Sala de Teste',
    description: 'Uma sala com inimigo.',
    locked: false,
    connections: [],
    col: 0,
    row: 0,
    isVisible: true,
    isCurrent: true,
    cleared: false,
    entered: true,
  };

  const floor: DungeonFloor = {
    floorNumber: 1,
    theme: {
      id: 'allihanna',
      floorNumber: 1,
      godName: 'Allihanna',
      godDomain: 'Natureza',
      godAlignment: 'neutro',
      name: 'Floresta Subterranea',
      description: '',
      guardianName: '',
      guardianDesc: '',
      specialRule: '',
      icon: 'A',
      palette: 'forest',
      monsterTypes: [],
      trapTypes: [],
      treasureTypes: [],
      challengeType: 'combat',
      flavorTexts: [],
    },
    rooms: [room],
    totalRooms: 1,
    bossRoom: 1,
  };

  const enemy: Enemy = {
    id: 'enemy',
    name: 'Lobo',
    icon: 'L',
    flavorText: '',
    hp: 5,
    maxHp: 5,
    poder: 1,
    habilidade: 1,
    resistencia: 1,
    armadura: 1,
    pp: 5,
    xpReward: 1,
    goldReward: 1,
    isBoss: false,
  };

  beforeEach(async () => {
    const fakeGameState = {
      currentRoom: signal(room),
      character: signal(character),
      party: signal([character]),
      currentFloor: signal(floor),
      floorNumber: signal(1),
      TOTAL_FLOORS: 20,
      campaign: {
        activeCampaign: signal({
          texts: {
            currency: 'PO',
            defeatMessage: 'Derrota.',
          },
        }),
      },
      pendingEnemies: signal<Enemy[] | null>(null),
      addLog: jasmine.createSpy('addLog'),
      resolveEncounter: jasmine.createSpy('resolveEncounter'),
    };

    const fakeCombat = {
      enemies: signal([enemy]),
      phase: signal('player_turn'),
      log: signal([]),
      abilities: computed(() => []),
      hasMagia: computed(() => false),
      availableMagias: computed(() => []),
      lockedMagias: computed(() => []),
      victorySummary: signal(null),
      pendingDefeat: signal(false),
      selectedEnemyId: signal(null),
      playerPA: signal(0),
      initCombat: jasmine.createSpy('initCombat'),
      playerAttackTarget: jasmine.createSpy('playerAttackTarget'),
      playerUseAbilityTarget: jasmine.createSpy('playerUseAbilityTarget'),
      playerFlee: jasmine.createSpy('playerFlee'),
      canUseAbility: jasmine.createSpy('canUseAbility').and.returnValue(false),
      canCastMagia: jasmine.createSpy('canCastMagia').and.returnValue(false),
      castMagiaTarget: jasmine.createSpy('castMagiaTarget'),
      confirmVictory: jasmine.createSpy('confirmVictory'),
      confirmDefeat: jasmine.createSpy('confirmDefeat'),
    };

    await TestBed.configureTestingModule({
      imports: [EncounterScreenComponent],
      providers: [
        { provide: GameStateService, useValue: fakeGameState },
        { provide: CombatService, useValue: fakeCombat },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EncounterScreenComponent);
    fixture.detectChanges();
  });

  it('keeps combat rendering separated from action controls', () => {
    const battleCanvas: HTMLElement = fixture.nativeElement.querySelector('.battle-canvas');
    const actionBar: HTMLElement = fixture.nativeElement.querySelector('.action-bar');

    expect(battleCanvas).toBeTruthy();
    expect(battleCanvas.querySelector('app-game-canvas')).toBeTruthy();
    expect(actionBar).toBeTruthy();
    expect(battleCanvas.contains(actionBar)).toBeFalse();
  });
});
