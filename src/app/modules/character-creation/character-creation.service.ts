import { Injectable, signal, computed } from '@angular/core';
import { Character } from '../../core/models/character.model';
import { Race, ClassDef, VantagemDef, DesvantagemDef } from '../../core/models/character-creation.model';

export interface CreationState {
  race: Race | null;
  classDef: ClassDef | null;
  vantagens: VantagemDef[];
  desvantagens: DesvantagemDef[];
  pontosGastos: number;
  atributos: {
    forca: number;
    habilidade: number;
    resistencia: number;
    armadura: number;
    pm: number;
  };
}

@Injectable({ providedIn: 'root' })
export class CharacterCreationService {
  private readonly PONTOS_INICIAIS = 5;

  readonly state = signal<CreationState>({
    race: null,
    classDef: null,
    vantagens: [],
    desvantagens: [],
    pontosGastos: 0,
    atributos: { forca: 1, habilidade: 1, resistencia: 1, armadura: 0, pm: 0 },
  });

  readonly pontosDisponiveis = computed(() => {
    const s = this.state();
    const custoVantagens = s.vantagens.reduce((acc, v) => acc + v.custo, 0);
    const bonusDesvantagens = s.desvantagens.reduce((acc, d) => acc + d.penalidade, 0);
    return this.PONTOS_INICIAIS - custoVantagens + bonusDesvantagens - s.pontosGastos;
  });

  readonly isValid = computed(() => {
    const s = this.state();
    return s.race !== null && s.classDef !== null && this.pontosDisponiveis() >= 0;
  });

  selectRace(race: Race): void {
    this.state.update(s => ({ ...s, race }));
  }

  selectClass(classDef: ClassDef): void {
    this.state.update(s => ({ ...s, classDef }));
  }

  toggleVantagem(vantagem: VantagemDef): void {
    this.state.update(s => {
      const exists = s.vantagens.find(v => v.nome === vantagem.nome);
      return {
        ...s,
        vantagens: exists
          ? s.vantagens.filter(v => v.nome !== vantagem.nome)
          : [...s.vantagens, vantagem],
      };
    });
  }

  toggleDesvantagem(desvantagem: DesvantagemDef): void {
    this.state.update(s => {
      const exists = s.desvantagens.find(d => d.nome === desvantagem.nome);
      return {
        ...s,
        desvantagens: exists
          ? s.desvantagens.filter(d => d.nome !== desvantagem.nome)
          : [...s.desvantagens, desvantagem],
      };
    });
  }

  adjustAtributo(attr: keyof CreationState['atributos'], delta: number): void {
    this.state.update(s => {
      const current = s.atributos[attr];
      const next = Math.max(0, current + delta);
      const diff = next - current;
      if (diff > 0 && this.pontosDisponiveis() < diff) return s;
      return {
        ...s,
        atributos: { ...s.atributos, [attr]: next },
        pontosGastos: s.pontosGastos + diff,
      };
    });
  }

  buildCharacter(): Character | null {
    if (!this.isValid()) return null;
    const { race, classDef, vantagens, desvantagens, atributos } = this.state();
    return {
      nome: `${race!.nome} ${classDef!.nome}`,
      raca: race!.nome,
      classe: classDef!.nome as Character['classe'],
      forca: atributos.forca + (race!.modificadores.forca ?? 0),
      habilidade: atributos.habilidade + (race!.modificadores.habilidade ?? 0),
      resistencia: atributos.resistencia + (race!.modificadores.resistencia ?? 0),
      armadura: atributos.armadura,
      pm: atributos.pm + (race!.modificadores.pm ?? 0),
      pmAtual: atributos.pm + (race!.modificadores.pm ?? 0),
      hp: (atributos.resistencia + (race!.modificadores.resistencia ?? 0)) * 3,
      hpAtual: (atributos.resistencia + (race!.modificadores.resistencia ?? 0)) * 3,
      xp: 0,
      ouro: 10,
      vantagens: vantagens.map(v => v.nome),
      desvantagens: desvantagens.map(d => d.nome),
      icon: classDef!.icon ?? '⚔️',
      color: classDef!.color ?? '#888',
    } as unknown as Character;
  }

  reset(): void {
    this.state.set({
      race: null,
      classDef: null,
      vantagens: [],
      desvantagens: [],
      pontosGastos: 0,
      atributos: { forca: 1, habilidade: 1, resistencia: 1, armadura: 0, pm: 0 },
    });
  }
}
