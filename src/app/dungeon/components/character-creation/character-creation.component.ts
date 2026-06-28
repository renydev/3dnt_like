import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../../core/services/game-state.service';
import { ArquetiposService } from '../../../core/services/arquetipos.service';
import { Character } from '../../../core/models/character.model';
import { Arquetipo, ALL_ARQUETIPOS, ARQUETIPO_MAP } from '../../../core/data/arquetipos.data';
import { KitDef, ALL_KITS, KIT_MAP, kitsCost } from '../../../core/data/kits.data';
import { VALKARIA_FLOORS, DungeonTheme } from '../../../core/models/dungeon.model';
import { ALL_VANTAGENS, VANTAGEM_CATEGORIES, VantagemDef, VantagemCategory } from '../../../core/data/vantagens.data';
import { ALL_DESVANTAGENS, DesvantagemDef } from '../../../core/data/desvantagens.data';
import { parseCostValue } from '../../../core/utils/pp-calculator';
import { PericiaService } from '../../../core/services/pericias.service';
import { PericiaDef } from '../../../core/data/pericias.data';
import { powerScaleSymbol } from '../../../core/utils/power-scale';

const VANTAGEM_CATEGORY_ICONS: Record<VantagemCategory, string> = {
  combate: '⚔️', defesa: '🛡️', atributo: '💪', mental: '🧠',
  social: '💬', movimento: '🏃', recursos: '💰', especial: '✨',
};

// ── Tier de origem ────────────────────────────────────────────────────────────

export interface StartingTier {
  id: 'iniciante' | 'heroi' | 'veterano';
  label: string;
  subtitle: string;
  description: string;
  basePoints: number;
  maxCharacteristic: number;
  icon: string;
  color: string;
  extras: string[];
}

// As 3 faixas de poder oficiais do 3DeT Victory (cap. Recompensas, "Iniciantes, Heróis e Veteranos").
// O limite de atributo 5 na criação vale para as três faixas — o que muda é o total de pontos.
export const STARTING_TIERS: StartingTier[] = [
  {
    id: 'veterano',
    label: 'Veterano',
    subtitle: '★ Modo Fácil',
    description: 'Um campeão consagrado, destinado a vencer torneios mundiais ou proteger o planeta. 35 pontos de personagem.',
    basePoints: 35,
    maxCharacteristic: 5,
    icon: '👑',
    color: '#d4aa14',
    extras: ['35 pontos de personagem', 'Atributos máximos na criação: 5', 'Recomendado para conhecer o jogo'],
  },
  {
    id: 'heroi',
    label: 'Herói',
    subtitle: '⚔ Modo Médio',
    description: 'Você tem boa experiência em sua área e começa a ser reconhecido ao redor do mundo. 20 pontos de personagem.',
    basePoints: 20,
    maxCharacteristic: 5,
    icon: '🏆',
    color: '#2980b9',
    extras: ['20 pontos de personagem', 'Atributos máximos na criação: 5', 'Desafiador, mas equilibrado'],
  },
  {
    id: 'iniciante',
    label: 'Iniciante',
    subtitle: '🔥 Modo Difícil',
    description: 'Um personagem recém-criado, dando os primeiros passos como aventureiro. 10 pontos de personagem — o padrão do livro.',
    basePoints: 10,
    maxCharacteristic: 5,
    icon: '🌱',
    color: '#27ae60',
    extras: ['10 pontos de personagem', 'Atributos máximos na criação: 5', 'Padrão oficial do 3DeT Victory'],
  },
];

// ── Personagens pré-criados ───────────────────────────────────────────────────

export interface PresetCharacter {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tag: string;
  tierId: 'iniciante' | 'heroi' | 'veterano';
  raceId: string;
  kitIds: string[];
  attrs: { poder: number; habilidade: number; resistencia: number };
  vantagenIds: string[];
  desvIds: string[];
  highlights: string[];
}

export const PRESET_CHARACTERS: PresetCharacter[] = [
  // ── Thordak, o Guerreiro ──────────────────────────────────────────────────
  {
    id: 'guerreiro-preset-iniciante',
    name: 'Thordak, o Guerreiro',
    description: 'Humano resistente especializado em combate corpo a corpo. Usa sua força bruta para destruir inimigos à curta distância.',
    icon: '⚔️', color: '#e74c3c', tag: 'Guerreiro',
    tierId: 'iniciante', raceId: 'humano', kitIds: ['guerreiro'],
    attrs: { poder: 5, habilidade: 2, resistencia: 3 },
    vantagenIds: [], desvIds: [],
    highlights: ['Poder máximo de um Lutador', 'Combate corpo a corpo', 'Simples de jogar'],
  },
  {
    id: 'guerreiro-preset-heroi',
    name: 'Thordak, o Guerreiro',
    description: 'Veterano de incontáveis batalhas, mais forte e resistente, com golpes ainda mais brutais.',
    icon: '⚔️', color: '#e74c3c', tag: 'Guerreiro',
    tierId: 'heroi', raceId: 'humano', kitIds: ['guerreiro'],
    attrs: { poder: 4, habilidade: 2, resistencia: 2 },
    vantagenIds: ['forte', 'vigoroso'], desvIds: [],
    highlights: ['Poder e Vigor elevados', 'Vantagens Forte e Vigoroso', 'Combate corpo a corpo dominante'],
  },
  {
    id: 'guerreiro-preset-veterano',
    name: 'Thordak, o Guerreiro',
    description: 'Campeão consagrado em torneios mundiais, capaz de despedaçar quase qualquer inimigo em poucos golpes.',
    icon: '⚔️', color: '#e74c3c', tag: 'Guerreiro',
    tierId: 'veterano', raceId: 'humano', kitIds: ['guerreiro'],
    attrs: { poder: 5, habilidade: 3, resistencia: 3 },
    vantagenIds: ['forte', 'vigoroso', 'brutal'], desvIds: [],
    highlights: ['Poder máximo (5)', 'Forte, Vigoroso e Brutal', 'Devastador em combate corpo a corpo'],
  },

  // ── Aerindel, a Maga ──────────────────────────────────────────────────────
  {
    id: 'mago-preset-iniciante',
    name: 'Aerindel, a Maga',
    description: 'Elfa com imenso talento arcano. Destrói grupos de inimigos com magias poderosas, mas é frágil se cercada.',
    icon: '🔮', color: '#8e44ad', tag: 'Mago',
    tierId: 'iniciante', raceId: 'elfo', kitIds: ['mago'],
    attrs: { poder: 3, habilidade: 3, resistencia: 1 },
    vantagenIds: ['magia'], desvIds: [],
    highlights: ['Poder elevado com bônus élfico', 'Conjura magias Comuns e Incomuns', 'Requer posicionamento'],
  },
  {
    id: 'mago-preset-heroi',
    name: 'Aerindel, a Maga',
    description: 'Arcanista reconhecida que já domina feitiços avançados e mantém um grimório de fórmulas próprias.',
    icon: '🔮', color: '#8e44ad', tag: 'Mago',
    tierId: 'heroi', raceId: 'elfo', kitIds: ['mago'],
    attrs: { poder: 2, habilidade: 2, resistencia: 1 },
    vantagenIds: ['genio', 'magia'], desvIds: [],
    highlights: ['Gênio e vantagem Magia', 'Repertório arcano maior', 'Ainda frágil em combate direto'],
  },
  {
    id: 'mago-preset-veterano',
    name: 'Aerindel, a Maga',
    description: 'Arquimaga lendária, capaz de moldar a realidade com feitiços que decidem batalhas inteiras.',
    icon: '🔮', color: '#8e44ad', tag: 'Mago',
    tierId: 'veterano', raceId: 'elfo', kitIds: ['mago'],
    attrs: { poder: 3, habilidade: 3, resistencia: 2 },
    vantagenIds: ['genio', 'magia', 'grimorio'], desvIds: [],
    highlights: ['Gênio, Magia e Grimório', 'Poder mágico de elite', 'Versatilidade arcana total'],
  },

  // ── Silas, o Arqueiro ─────────────────────────────────────────────────────
  {
    id: 'arqueiro-preset-iniciante',
    name: 'Silas, o Arqueiro',
    description: 'Kemono ágil e preciso. Ataca à distância com alta habilidade antes que os inimigos cheguem perto.',
    icon: '🏹', color: '#27ae60', tag: 'Patrulheiro',
    tierId: 'iniciante', raceId: 'kemono', kitIds: ['patrulheiro'],
    attrs: { poder: 2, habilidade: 5, resistencia: 2 },
    vantagenIds: [], desvIds: [],
    highlights: ['Habilidade máxima (5) para ataques certeiros', 'Mobilidade e alcance', 'Estilo de jogo versátil'],
  },
  {
    id: 'arqueiro-preset-heroi',
    name: 'Silas, o Arqueiro',
    description: 'Patrulheiro experiente, mais ágil e com alcance estendido para suas flechadas.',
    icon: '🏹', color: '#27ae60', tag: 'Patrulheiro',
    tierId: 'heroi', raceId: 'kemono', kitIds: ['patrulheiro'],
    attrs: { poder: 1, habilidade: 3, resistencia: 2 },
    vantagenIds: ['agil', 'alcance'], desvIds: [],
    highlights: ['Ágil e Alcance estendido', 'Habilidade muito alta', 'Ataques certeiros à distância'],
  },
  {
    id: 'arqueiro-preset-veterano',
    name: 'Silas, o Arqueiro',
    description: 'Mestre patrulheiro cujos sentidos aguçados e precisão tornam quase impossível escapar de sua mira.',
    icon: '🏹', color: '#27ae60', tag: 'Patrulheiro',
    tierId: 'veterano', raceId: 'kemono', kitIds: ['patrulheiro'],
    attrs: { poder: 2, habilidade: 4, resistencia: 2 },
    vantagenIds: ['agil', 'alcance', 'sentido'], desvIds: [],
    highlights: ['Habilidade quase máxima', 'Ágil, Alcance e Sentido', 'Precisão letal a distância'],
  },

  // ── Kazuki Tendoh, Piloto Mecha ───────────────────────────────────────────
  {
    id: 'piloto-mecha-preset-iniciante',
    name: 'Kazuki Tendoh, Piloto Mecha',
    description: 'Humano que pilota um robô gigante como extensão do próprio corpo, enfrentando kaijus e ameaças colossais de dentro de sua máquina.',
    icon: '🤖', color: '#34495e', tag: 'Piloto Mecha',
    tierId: 'iniciante', raceId: 'humano', kitIds: ['piloto-mecha'],
    attrs: { poder: 4, habilidade: 3, resistencia: 3 },
    vantagenIds: [], desvIds: [],
    highlights: ['Combate dentro de um mecha', 'Equilíbrio entre poder e precisão', 'Tema tokusatsu/mecha clássico'],
  },
  {
    id: 'piloto-mecha-preset-heroi',
    name: 'Kazuki Tendoh, Piloto Mecha',
    description: 'Piloto condecorado cujo mecha já recebeu upgrades de combate e é tratado quase como um aliado de batalha.',
    icon: '🤖', color: '#34495e', tag: 'Piloto Mecha',
    tierId: 'heroi', raceId: 'humano', kitIds: ['piloto-mecha'],
    attrs: { poder: 3, habilidade: 2, resistencia: 2 },
    vantagenIds: ['ajudante'], desvIds: [],
    highlights: ['Mecha como Ajudante', 'Mais poder e resistência', 'Pronto para inimigos maiores'],
  },
  {
    id: 'piloto-mecha-preset-veterano',
    name: 'Kazuki Tendoh, Piloto Mecha',
    description: 'Ás dos céus que pilota um mecha de última geração, com maestria reconhecida em manobras de combate.',
    icon: '🤖', color: '#34495e', tag: 'Piloto Mecha',
    tierId: 'veterano', raceId: 'humano', kitIds: ['piloto-mecha'],
    attrs: { poder: 4, habilidade: 3, resistencia: 3 },
    vantagenIds: ['ajudante', 'maestria'], desvIds: [],
    highlights: ['Mecha avançado e Maestria', 'Atributos quase no limite', 'Enfrenta kaijus de frente'],
  },

  // ── Hikari, Guerreira Mágica ──────────────────────────────────────────────
  {
    id: 'guerreira-magica-preset-iniciante',
    name: 'Hikari, Guerreira Mágica',
    description: 'Heroína que se transforma em seu traje de combate para enfrentar a escuridão com feitiços, amizade e coragem.',
    icon: '✨', color: '#ff6fa5', tag: 'Guerreira Mágica',
    tierId: 'iniciante', raceId: 'fada', kitIds: ['guerreira-magica'],
    attrs: { poder: 3, habilidade: 3, resistencia: 1 },
    vantagenIds: ['magia'], desvIds: [],
    highlights: ['Conjura magias Comuns e Incomuns', 'Magia versátil em combate', 'Tema mahou shoujo'],
  },
  {
    id: 'guerreira-magica-preset-heroi',
    name: 'Hikari, Guerreira Mágica',
    description: 'Já enfrentou ameaças cada vez maiores à escuridão, ganhando feitiços mais fortes em sua transformação.',
    icon: '✨', color: '#ff6fa5', tag: 'Guerreira Mágica',
    tierId: 'heroi', raceId: 'fada', kitIds: ['guerreira-magica'],
    attrs: { poder: 2, habilidade: 3, resistencia: 1 },
    vantagenIds: ['transformacao', 'magia'], desvIds: [],
    highlights: ['Transformação e Magia', 'Habilidade elevada', 'Combate mágico mais versátil'],
  },
  {
    id: 'guerreira-magica-preset-veterano',
    name: 'Hikari, Guerreira Mágica',
    description: 'Líder de seu esquadrão mágico, capaz de voar e desferir feitiços poderosos contra a escuridão mais ameaçadora.',
    icon: '✨', color: '#ff6fa5', tag: 'Guerreira Mágica',
    tierId: 'veterano', raceId: 'fada', kitIds: ['guerreira-magica'],
    attrs: { poder: 3, habilidade: 4, resistencia: 2 },
    vantagenIds: ['transformacao', 'magia', 'voo'], desvIds: [],
    highlights: ['Transformação, Magia e Voo', 'Habilidade quase máxima', 'Heroína de elite contra a escuridão'],
  },

  // ── Itsuki Kurogane, Samurai ──────────────────────────────────────────────
  {
    id: 'samurai-preset-iniciante',
    name: 'Itsuki Kurogane, Samurai',
    description: 'Guerreiro de honra disciplinada, fiel a um código e a um senhor, com a espada como extensão de sua alma.',
    icon: '⚔️', color: '#c0392b', tag: 'Samurai',
    tierId: 'iniciante', raceId: 'humano', kitIds: ['samurai'],
    attrs: { poder: 4, habilidade: 4, resistencia: 2 },
    vantagenIds: [], desvIds: [],
    highlights: ['Código de honra', 'Golpes precisos com espada', 'Tema samurai/jidaigeki'],
  },
  {
    id: 'samurai-preset-heroi',
    name: 'Itsuki Kurogane, Samurai',
    description: 'Samurai de renome cuja determinação inabalável o torna ainda mais perigoso em duelos de espada.',
    icon: '⚔️', color: '#c0392b', tag: 'Samurai',
    tierId: 'heroi', raceId: 'humano', kitIds: ['samurai'],
    attrs: { poder: 3, habilidade: 3, resistencia: 1 },
    vantagenIds: ['resoluto'], desvIds: [],
    highlights: ['Vantagem Resoluto', 'Poder e Habilidade elevados', 'Duelista cada vez mais letal'],
  },
  {
    id: 'samurai-preset-veterano',
    name: 'Itsuki Kurogane, Samurai',
    description: 'Mestre da espada cuja lâmina já decidiu o destino de senhores e exércitos.',
    icon: '⚔️', color: '#c0392b', tag: 'Samurai',
    tierId: 'veterano', raceId: 'humano', kitIds: ['samurai'],
    attrs: { poder: 4, habilidade: 4, resistencia: 2 },
    vantagenIds: ['resoluto', 'brutal'], desvIds: [],
    highlights: ['Resoluto e Brutal', 'Poder e Habilidade quase máximos', 'Lâmina lendária'],
  },

  // ── Ryo Mizushima, CARD Gamer ─────────────────────────────────────────────
  {
    id: 'card-gamer-preset-iniciante',
    name: 'Ryo Mizushima, CARD Gamer',
    description: 'Duelista que manifesta efeitos e criaturas de cartas mágicas (CARDs) no mundo real, como um jogo com poder de verdade.',
    icon: '🃏', color: '#16a085', tag: 'CARD Gamer',
    tierId: 'iniciante', raceId: 'humano', kitIds: ['card-gamer'],
    attrs: { poder: 3, habilidade: 3, resistencia: 4 },
    vantagenIds: [], desvIds: [],
    highlights: ['Invocação de criaturas em cartas', 'Versatilidade tática', 'Tema duelo de cartas'],
  },
  {
    id: 'card-gamer-preset-heroi',
    name: 'Ryo Mizushima, CARD Gamer',
    description: 'Duelista de torneio cujo baralho conta com criaturas mais poderosas para invocar em combate.',
    icon: '🃏', color: '#16a085', tag: 'CARD Gamer',
    tierId: 'heroi', raceId: 'humano', kitIds: ['card-gamer'],
    attrs: { poder: 2, habilidade: 2, resistencia: 2 },
    vantagenIds: ['ajudante', 'genio'], desvIds: [],
    highlights: ['Criatura invocada como Ajudante', 'Gênio para combos táticos', 'Atributos mais equilibrados'],
  },
  {
    id: 'card-gamer-preset-veterano',
    name: 'Ryo Mizushima, CARD Gamer',
    description: 'Campeão de duelos cujo baralho lendário já decidiu batalhas que pareciam perdidas.',
    icon: '🃏', color: '#16a085', tag: 'CARD Gamer',
    tierId: 'veterano', raceId: 'humano', kitIds: ['card-gamer'],
    attrs: { poder: 3, habilidade: 3, resistencia: 3 },
    vantagenIds: ['ajudante', 'genio', 'maestria'], desvIds: [],
    highlights: ['Ajudante, Gênio e Maestria', 'Atributos altos e equilibrados', 'Duelista de elite'],
  },

  // ── Suzu Hayate, Ninja ────────────────────────────────────────────────────
  {
    id: 'ninja-preset-iniciante',
    name: 'Suzu Hayate, Ninja',
    description: 'Kemono treinado em artes da sombra, infiltração e assassinato silencioso, fiel a uma tradição secreta.',
    icon: '🥷', color: '#2c3e50', tag: 'Ninja',
    tierId: 'iniciante', raceId: 'kemono', kitIds: ['ninja'],
    attrs: { poder: 2, habilidade: 5, resistencia: 2 },
    vantagenIds: [], desvIds: [],
    highlights: ['Furtividade e velocidade', 'Golpes certeiros pelas sombras', 'Tema ninja clássico'],
  },
  {
    id: 'ninja-preset-heroi',
    name: 'Suzu Hayate, Ninja',
    description: 'Já domina técnicas de invisibilidade que a tornam quase impossível de detectar antes do golpe final.',
    icon: '🥷', color: '#2c3e50', tag: 'Ninja',
    tierId: 'heroi', raceId: 'kemono', kitIds: ['ninja'],
    attrs: { poder: 2, habilidade: 4, resistencia: 1 },
    vantagenIds: ['agil', 'invisivel'], desvIds: [],
    highlights: ['Ágil e Invisível', 'Habilidade muito alta', 'Assassina das sombras'],
  },
  {
    id: 'ninja-preset-veterano',
    name: 'Suzu Hayate, Ninja',
    description: 'Líder de uma tradição secreta de assassinos, com sentidos e reflexos quase sobre-humanos.',
    icon: '🥷', color: '#2c3e50', tag: 'Ninja',
    tierId: 'veterano', raceId: 'kemono', kitIds: ['ninja'],
    attrs: { poder: 2, habilidade: 5, resistencia: 2 },
    vantagenIds: ['agil', 'invisivel', 'sentido'], desvIds: [],
    highlights: ['Habilidade máxima (5)', 'Ágil, Invisível e Sentido', 'Mestra suprema das sombras'],
  },

  // ── Vance Holt, Cosmonauta da ORDEM ───────────────────────────────────────
  {
    id: 'cosmonauta-ordem-preset-iniciante',
    name: 'Vance Holt, Cosmonauta da ORDEM',
    description: 'Soldado-cientista da frota espacial ORDEM, treinado para enfrentar ameaças alienígenas com armamento futurista.',
    icon: '🚀', color: '#2980b9', tag: 'Cosmonauta da ORDEM',
    tierId: 'iniciante', raceId: 'ciborgue', kitIds: ['cosmonauta-da-ordem'],
    attrs: { poder: 3, habilidade: 3, resistencia: 2 },
    vantagenIds: [], desvIds: [],
    highlights: ['Tecnologia espacial avançada', 'Combate contra ameaças alienígenas', 'Tema ficção científica'],
  },
  {
    id: 'cosmonauta-ordem-preset-heroi',
    name: 'Vance Holt, Cosmonauta da ORDEM',
    description: 'Oficial da frota ORDEM com o apoio direto de seu comando para missões de alto risco.',
    icon: '🚀', color: '#2980b9', tag: 'Cosmonauta da ORDEM',
    tierId: 'heroi', raceId: 'ciborgue', kitIds: ['cosmonauta-da-ordem'],
    attrs: { poder: 3, habilidade: 2, resistencia: 2 },
    vantagenIds: ['patrono'], desvIds: [],
    highlights: ['Patrono: a frota ORDEM', 'Atributos mais altos e equilibrados', 'Pronto para invasões maiores'],
  },
  {
    id: 'cosmonauta-ordem-preset-veterano',
    name: 'Vance Holt, Cosmonauta da ORDEM',
    description: 'Comandante de elite da ORDEM, veterano de incontáveis confrontos contra ameaças de outros mundos.',
    icon: '🚀', color: '#2980b9', tag: 'Cosmonauta da ORDEM',
    tierId: 'veterano', raceId: 'ciborgue', kitIds: ['cosmonauta-da-ordem'],
    attrs: { poder: 4, habilidade: 3, resistencia: 3 },
    vantagenIds: ['patrono', 'maestria'], desvIds: [],
    highlights: ['Patrono e Maestria', 'Atributos altos em todas as frentes', 'Comandante veterano da frota'],
  },

  // ── Touma Hiroshi, Gigante da Luz ─────────────────────────────────────────
  {
    id: 'gigante-da-luz-preset-iniciante',
    name: 'Touma Hiroshi, Gigante da Luz',
    description: 'Hospedeiro escolhido por um herói alienígena gigantesco, capaz de se transformar em um colosso de luz para enfrentar kaijus.',
    icon: '🌟', color: '#f1c40f', tag: 'Gigante da Luz',
    tierId: 'iniciante', raceId: 'humano', kitIds: ['gigante-da-luz'],
    attrs: { poder: 4, habilidade: 2, resistencia: 4 },
    vantagenIds: [], desvIds: [],
    highlights: ['Transformação em colosso', 'Combate contra kaijus', 'Tema tokusatsu (estilo Ultraman)'],
  },
  {
    id: 'gigante-da-luz-preset-heroi',
    name: 'Touma Hiroshi, Gigante da Luz',
    description: 'Seu colosso de luz já é reconhecido pela cidade que protege, brilhando mais forte a cada batalha.',
    icon: '🌟', color: '#f1c40f', tag: 'Gigante da Luz',
    tierId: 'heroi', raceId: 'humano', kitIds: ['gigante-da-luz'],
    attrs: { poder: 4, habilidade: 1, resistencia: 3 },
    vantagenIds: ['transformacao'], desvIds: [],
    highlights: ['Transformação aprimorada', 'Poder e Resistência elevados', 'Guardião da cidade'],
  },
  {
    id: 'gigante-da-luz-preset-veterano',
    name: 'Touma Hiroshi, Gigante da Luz',
    description: 'Herói cósmico cujo colosso de luz já derrotou kaijus que ameaçavam continentes inteiros.',
    icon: '🌟', color: '#f1c40f', tag: 'Gigante da Luz',
    tierId: 'veterano', raceId: 'humano', kitIds: ['gigante-da-luz'],
    attrs: { poder: 5, habilidade: 2, resistencia: 4 },
    vantagenIds: ['transformacao', 'imune'], desvIds: [],
    highlights: ['Poder máximo (5)', 'Transformação e Imune', 'Colosso de luz quase imbatível'],
  },

  // ── Morgrath, o Necromante ────────────────────────────────────────────────
  {
    id: 'necromante-preset-iniciante',
    name: 'Morgrath, o Necromante',
    description: 'Osteon que manipula as forças da morte e dos mortos-vivos, caminhando à parte sombria da magia arcana.',
    icon: '💀', color: '#8b0000', tag: 'Necromante',
    tierId: 'iniciante', raceId: 'osteon', kitIds: ['necromante'],
    attrs: { poder: 2, habilidade: 3, resistencia: 1 },
    vantagenIds: ['magia'], desvIds: [],
    highlights: ['Conjura magias Comuns e Incomuns', 'Tema gótico/horror', 'Versátil em ataque e controle'],
  },
  {
    id: 'necromante-preset-heroi',
    name: 'Morgrath, o Necromante',
    description: 'Já reuniu um pequeno exército de mortos-vivos e cuja própria essência resiste à morte verdadeira.',
    icon: '💀', color: '#8b0000', tag: 'Necromante',
    tierId: 'heroi', raceId: 'osteon', kitIds: ['necromante'],
    attrs: { poder: 2, habilidade: 2, resistencia: 2 },
    vantagenIds: ['magia', 'imortal'], desvIds: [],
    highlights: ['Magia e Imortal', 'Atributos equilibrados e mais altos', 'Controle ampliado dos mortos-vivos'],
  },
  {
    id: 'necromante-preset-veterano',
    name: 'Morgrath, o Necromante',
    description: 'Senhor da morte temido em terras distantes, cujo grimório guarda segredos que nenhum vivo deveria conhecer.',
    icon: '💀', color: '#8b0000', tag: 'Necromante',
    tierId: 'veterano', raceId: 'osteon', kitIds: ['necromante'],
    attrs: { poder: 3, habilidade: 3, resistencia: 2 },
    vantagenIds: ['magia', 'imortal', 'grimorio'], desvIds: [],
    highlights: ['Magia, Imortal e Grimório', 'Poder arcano sombrio de elite', 'Senhor da morte temido'],
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  'Iniciante': '#27ae60',
  'Intermediário': '#e67e22',
  'Avançado': '#8e44ad',
};

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-creation.component.html',
  styleUrl: './character-creation.component.scss',
})
export class CharacterCreationComponent {
  gameState     = inject(GameStateService);
  arquetiposSvc = inject(ArquetiposService);
  periciasSvc   = inject(PericiaService);

  readonly ATTR_META = [
    { key: 'poder'       as const, label: 'Poder',           icon: '⚔️',  color: '#e74c3c' },
    { key: 'habilidade'  as const, label: 'Habilidade',      icon: '🎯',  color: '#3498db' },
    { key: 'resistencia' as const, label: 'Resistência',     icon: '🛡️', color: '#27ae60' },
  ];

  tiers             = STARTING_TIERS;
  presets           = PRESET_CHARACTERS;
  visiblePresets    = computed(() => this.presets.filter(p => p.tierId === this.selectedTier()?.id));
  vantagens         = ALL_VANTAGENS;
  desvantagens      = ALL_DESVANTAGENS;
  categories        = VANTAGEM_CATEGORIES.map(c => ({ ...c, icon: VANTAGEM_CATEGORY_ICONS[c.id] }));
  periciaCategories = this.periciasSvc.categories;
  kits              = ALL_KITS;
  arquetipos        = ALL_ARQUETIPOS;
  steps             = [
    { n: 1, label: 'Origem'       },
    { n: 2, label: 'Início Rápido'},
    { n: 3, label: 'Raça'         },
    { n: 4, label: 'Profissão'    },
    { n: 5, label: 'Atributos'    },
    { n: 6, label: 'Vantagens'    },
    { n: 7, label: 'Perícias'     },
    { n: 8, label: 'Devoção'      },
  ];

  gods = VALKARIA_FLOORS;

  step                 = signal(1);
  charName             = 'Aventureiro';
  selectedTier         = signal<StartingTier | null>(null);
  selectedRace         = signal<Arquetipo | null>(null);
  selectedKits             = signal<string[]>([]);
  selectedVantagens        = signal<string[]>([]);
  selectedDesvantagens     = signal<string[]>([]);
  selectedPericias         = signal<string[]>([]);
  selectedEspecializacoes  = signal<string[]>([]);
  selectedGod              = signal<DungeonTheme | null>(null);
  raceDiffFilter       = signal('Todas');

  distributedAttrs = signal({
    poder: 0, habilidade: 0, resistencia: 0,
  });

  // ── Helpers de custo ────────────────────────────────────────────────────────

  /** Custo incremental (3D&T Victory): 1pt até o 5º, 2pts por ponto acima de 5. */
  nextCost(currentVal: number): number { return currentVal < 5 ? 1 : 2; }

  /** Custo total para ter um atributo no nível N: linear, N pontos (até 5; 2/ponto acima). */
  totalCost(n: number): number { return n <= 5 ? Math.max(0, n) : 5 + (n - 5) * 2; }

  // ── Computed ────────────────────────────────────────────────────────────────

  filteredRaces = computed(() => {
    const f = this.raceDiffFilter();
    return f === 'Todas' ? this.arquetipos : this.arquetipos.filter(r => r.difficulty === f);
  });

  /** Valor final de cada atributo = distribuído (arquétipos não dão modificador numérico, só vantagens/desvantagens nomeadas). */
  finalStats = computed(() => {
    const d    = this.distributedAttrs();
    const poder       = d.poder;
    const habilidade  = d.habilidade;
    const resistencia = d.resistencia;
    const pontosVida = resistencia === 0 ? 1 : resistencia * 5;
    const pontosMana = habilidade === 0 ? 1 : habilidade * 5;
    return { poder, habilidade, resistencia, pontosVida, pontosMana };
  });

  statRows = computed(() => {
    const s = this.finalStats();
    const d = this.distributedAttrs();
    return this.ATTR_META.map(m => ({
      ...m,
      distributed: d[m.key],
      final: (s as any)[m.key],
    }));
  });

  totalPoints = computed(() => {
    const tier      = this.selectedTier()?.basePoints ?? 5;
    const raceCost  = this.selectedRace()?.cost ?? 0;
    const desvRef   = this.selectedDesvantagens()
      .reduce((s, id) => s + Math.abs(parseCostValue(ALL_DESVANTAGENS.find(d => d.id === id)?.refund ?? '0')), 0);
    return tier - raceCost + desvRef;
  });

  attrSpent = computed(() => {
    const d = this.distributedAttrs();
    return this.totalCost(d.poder) + this.totalCost(d.habilidade)
         + this.totalCost(d.resistencia);
  });

  /** Custo dos kits: 1pt o primeiro, +1pt cada adicional (2pt o segundo, 3pt o terceiro...). */
  kitsSpent = computed(() => kitsCost(this.selectedKits().length));

  vantagensSpent = computed(() =>
    this.selectedVantagens()
      .reduce((s, id) => s + parseCostValue(ALL_VANTAGENS.find(v => v.id === id)?.cost ?? '0'), 0)
  );

  periciasSpent = computed(() =>
    this.periciasSvc.totalCost(this.selectedPericias()) + this.selectedEspecializacoes().length
  );

  pointsLeft = computed(() =>
    this.totalPoints() - this.attrSpent() - this.kitsSpent() - this.vantagensSpent() - this.periciasSpent()
  );

  /** Poderes do arquétipo que são vantagens (todo poder cuja descrição não se anuncia como "Desvantagem"). */
  allFreeVantagens = computed(() => {
    return (this.selectedRace()?.poderes ?? [])
      .filter(p => !/desvantagem/i.test(p.description))
      .map(p => p.name);
  });

  /** Poderes do arquétipo que são desvantagens — a própria descrição do arquétipo os rotula
   *  como tal (ex.: "Lento" do Anão, "Frágil" do Elfo). Sem isso, eles eram somados a
   *  allFreeVantagens e apareciam como vantagem no personagem final, o que é errado. */
  raceDesvantagens = computed(() => {
    return (this.selectedRace()?.poderes ?? [])
      .filter(p => /desvantagem/i.test(p.description))
      .map(p => p.name);
  });

  selectedVantagensNames = computed(() =>
    this.selectedVantagens().map(id => ALL_VANTAGENS.find(v => v.id === id)?.name ?? id)
  );

  selectedKitsNames = computed(() => this.selectedKits().map(id => KIT_MAP.get(id)?.name ?? id));

  // ── Helpers de exibição ─────────────────────────────────────────────────────

  vantagensByCategory(cat: string): VantagemDef[] {
    return ALL_VANTAGENS.filter(v => v.category === cat);
  }

  vantagemCost(v: VantagemDef): number { return parseCostValue(v.cost); }
  desvRefund(d: DesvantagemDef): number { return Math.abs(parseCostValue(d.refund)); }

  periciasByCategory(cat: string): PericiaDef[] {
    return this.periciasSvc.periciasByCategory(cat);
  }

  isPericiaSelected(id: string): boolean { return this.selectedPericias().includes(id); }

  canSelectPericia(p: PericiaDef): boolean {
    if (this.isPericiaSelected(p.id)) return true;
    return this.pointsLeft() >= p.cost;
  }

  togglePericia(p: PericiaDef) {
    if (this.isPericiaSelected(p.id)) {
      this.selectedPericias.update(l => l.filter(x => x !== p.id));
    } else if (this.canSelectPericia(p)) {
      this.selectedPericias.update(l => [...l, p.id]);
    }
  }

  // ── Kits (Arcanautas) ──────────────────────────────────────────────────────

  isKitSelected(id: string): boolean { return this.selectedKits().includes(id); }

  kitById(id: string): KitDef | undefined { return KIT_MAP.get(id); }

  /** Custo do PRÓXIMO kit, dado quantos já estão selecionados. */
  nextKitCost(): number { return kitsCost(this.selectedKits().length + 1) - this.kitsSpent(); }

  canSelectKit(k: KitDef): boolean {
    if (this.isKitSelected(k.id)) return true;
    return this.pointsLeft() >= this.nextKitCost();
  }

  toggleKit(k: KitDef) {
    if (this.isKitSelected(k.id)) {
      this.selectedKits.update(l => l.filter(x => x !== k.id));
    } else if (this.canSelectKit(k)) {
      this.selectedKits.update(l => [...l, k.id]);
    }
  }

  // ── Especializações individuais (1 PP cada) ──────────────────────────────────

  isEspecializacaoSelected(espId: string): boolean {
    return this.selectedEspecializacoes().includes(espId);
  }

  /** Retorna true se a especializacao já está coberta pela perícia completa selecionada */
  isEspecializacaoCoveredByPericia(periciaId: string): boolean {
    return this.isPericiaSelected(periciaId);
  }

  canSelectEspecializacao(periciaId: string, espId: string): boolean {
    if (this.isEspecializacaoCoveredByPericia(periciaId)) return true;
    if (this.isEspecializacaoSelected(espId)) return true;
    return this.pointsLeft() >= 1;
  }

  toggleEspecializacao(periciaId: string, espId: string) {
    if (this.isEspecializacaoCoveredByPericia(periciaId)) return;
    if (this.isEspecializacaoSelected(espId)) {
      this.selectedEspecializacoes.update(l => l.filter(x => x !== espId));
    } else if (this.pointsLeft() >= 1) {
      this.selectedEspecializacoes.update(l => [...l, espId]);
    }
  }

  diffColor(d: string): string { return DIFFICULTY_COLORS[d] ?? '#888'; }

  isVantagemSelected(id: string) { return this.selectedVantagens().includes(id); }
  isDesvSelected(id: string)     { return this.selectedDesvantagens().includes(id); }
  getDesv(id: string)            { return ALL_DESVANTAGENS.find(d => d.id === id); }

  pip(val: number, max: number): boolean[] {
    return Array.from({ length: max }, (_, i) => i < val);
  }

  /** Valor final do atributo (distribuído + racial). */
  finalAttr(key: 'poder'|'habilidade'|'resistencia'): number {
    const s = this.finalStats();
    return (s as any)[key];
  }

  /** Símbolo de Escala de Poder (3D&T) — vazio em Ningen (0–9), cobre criações futuras com tetos maiores. */
  attrScaleSymbol(key: 'poder'|'habilidade'|'resistencia'): string {
    return powerScaleSymbol(this.finalAttr(key));
  }

  canIncrement(key: 'poder'|'habilidade'|'resistencia'): boolean {
    const maxAttr = this.selectedTier()?.maxCharacteristic ?? 5;
    const finalVal = this.finalAttr(key);
    if (finalVal >= maxAttr) return false;
    const cost = this.nextCost(this.distributedAttrs()[key]);
    return this.pointsLeft() >= cost;
  }

  canDecrement(key: 'poder'|'habilidade'|'resistencia'): boolean {
    return this.distributedAttrs()[key] > 0;
  }

  // ── Seleções ────────────────────────────────────────────────────────────────

  /**
   * Por ora só o tier Iniciante (10pt, padrão oficial do livro) está liberado pra criação —
   * Herói (20pt) e Veterano (35pt) ficam visíveis mas travados. Os personagens prontos de
   * "Início Rápido" desses dois tiers também ficam ocultos (visiblePresets filtra por
   * selectedTier(), que nunca aponta pra eles agora).
   */
  isTierLocked(t: StartingTier): boolean {
    return t.id !== 'iniciante';
  }

  selectTier(t: StartingTier) {
    if (this.isTierLocked(t)) return;
    this.selectedTier.set(t);
    this.selectedVantagens.set([]);
    this.selectedDesvantagens.set([]);
    this.selectedPericias.set([]);
    this.selectedEspecializacoes.set([]);
    this.selectedGod.set(null);
    this.distributedAttrs.set({ poder: 0, habilidade: 0, resistencia: 0 });
    this.nextStep();
  }

  selectRace(r: Arquetipo) { this.selectedRace.set(r); this.step.set(4); }
  goToStep(n: number) { this.step.set(n); }

  incrementAttr(key: 'poder'|'habilidade'|'resistencia') {
    if (!this.canIncrement(key)) return;
    this.distributedAttrs.update(d => ({ ...d, [key]: d[key] + 1 }));
  }

  decrementAttr(key: 'poder'|'habilidade'|'resistencia') {
    if (!this.canDecrement(key)) return;
    this.distributedAttrs.update(d => ({ ...d, [key]: d[key] - 1 }));
  }

  toggleVantagem(v: VantagemDef) {
    if (this.isVantagemSelected(v.id)) {
      this.selectedVantagens.update(l => l.filter(x => x !== v.id));
    } else if (this.canSelectVantagem(v)) {
      this.selectedVantagens.update(l => [...l, v.id]);
    }
  }

  toggleDesv(d: DesvantagemDef) {
    if (this.isDesvSelected(d.id)) {
      this.selectedDesvantagens.update(l => l.filter(x => x !== d.id));
    } else if (this.canSelectDesv(d)) {
      this.selectedDesvantagens.update(l => [...l, d.id]);
    }
  }

  // ── Validação ───────────────────────────────────────────────────────────────

  canSelectVantagem(v: VantagemDef): boolean {
    if (this.isVantagemSelected(v.id)) return true;
    return this.pointsLeft() >= this.vantagemCost(v);
  }

  canSelectDesv(d: DesvantagemDef): boolean {
    return this.isDesvSelected(d.id) || this.selectedDesvantagens().length < 2;
  }

  canAdvance(): boolean {
    if (this.step() === 1) return !!this.selectedTier();
    if (this.step() === 2) return true;
    if (this.step() === 3) return !!this.selectedRace();
    if (this.step() === 4) return this.selectedKits().length > 0;
    if (this.step() === 5) return this.pointsLeft() >= 0;
    return true;
  }

  canConfirm(): boolean {
    return !!this.selectedTier() && !!this.selectedRace() && this.selectedKits().length > 0
      && this.pointsLeft() >= 0 && this.charName.trim().length > 0;
  }

  nextStep() { if (this.canAdvance()) this.step.update(s => s + 1); }
  prevStep() { this.step.update(s => s - 1); }

  applyPreset(preset: PresetCharacter) {
    const tier = STARTING_TIERS.find(t => t.id === preset.tierId)!;
    const race = ARQUETIPO_MAP.get(preset.raceId as any)!;

    this.selectedTier.set(tier);
    this.selectedRace.set(race);
    this.selectedKits.set([...preset.kitIds]);
    this.distributedAttrs.set({ ...preset.attrs });
    this.selectedVantagens.set([...preset.vantagenIds]);
    this.selectedDesvantagens.set([...preset.desvIds]);
    this.selectedPericias.set([]);
    this.selectedEspecializacoes.set([]);
    this.charName = preset.name;
    this.confirm();
  }

  skipPreset() { this.step.set(3); }

  // ── Confirmar ───────────────────────────────────────────────────────────────

  confirm() {
    if (!this.canConfirm()) return;
    const stats = this.finalStats();
    const firstKit = KIT_MAP.get(this.selectedKits()[0]);

    const character: Character = ({
      id: crypto.randomUUID(),
      name: this.charName.trim() || 'Aventureiro',
      kits: this.selectedKits(),
      race:  this.selectedRace()!.id,
      level: 1, xp: 0, xpToNextLevel: 100,
      poder:       { base: stats.poder,       current: stats.poder,       max: stats.poder },
      habilidade:  { base: stats.habilidade,  current: stats.habilidade,  max: stats.habilidade },
      resistencia: { base: stats.resistencia, current: stats.resistencia, max: stats.resistencia },
      pontosVida: { base: stats.pontosVida, current: stats.pontosVida, max: stats.pontosVida },
      pontosMana: { base: stats.pontosMana, current: stats.pontosMana, max: stats.pontosMana },
      vantagens:    [...this.allFreeVantagens(), ...this.selectedVantagensNames()],
      desvantagens: [...this.raceDesvantagens(), ...this.selectedDesvantagens().map(id => this.getDesv(id)!.name)],
      pericias:     [...this.selectedPericias(), ...this.selectedEspecializacoes()],
      gold: 20 + (this.selectedTier()?.basePoints ?? 5) * 2,
      inventory: [],
      equipment: {},
      statusEffects: [],
      levelUpPoints: 0,
      portraitIcon: firstKit?.icon ?? this.selectedRace()?.icon ?? '⚔️',
      patronGod: this.selectedGod()?.id ?? undefined,
    });

    this.gameState.startCustomGame(character);
  }
}
