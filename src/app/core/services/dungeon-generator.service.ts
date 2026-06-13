import { Injectable } from '@angular/core';
import {
  DungeonFloor, DungeonRoom, DungeonTheme, RoomType,
  VALKARIA_FLOORS
} from '../models/dungeon.model';

type RoomLayout = { id: number; row: number; col: number; type: RoomType; name: string; connections: number[] };
type FloorLayout = { floorNumber: number; rooms: RoomLayout[] };

const FLOOR_LAYOUTS: FloorLayout[] = [
  { floorNumber: 1, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Clareira de Entrada',       connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Toca das Feras',            connections: [4, 5] },
    { id: 2, row: 1, col: 2, type: 'rest',     name: 'Riacho Subterrâneo',        connections: [5] },
    { id: 3, row: 1, col: 3, type: 'trap',     name: 'Raízes Enredantes',         connections: [5, 6] },
    { id: 4, row: 2, col: 0, type: 'treasure', name: 'Ninho Abandonado',          connections: [7] },
    { id: 5, row: 2, col: 2, type: 'monster',  name: 'Território do Urso',        connections: [7] },
    { id: 6, row: 2, col: 4, type: 'monster',  name: 'Covil do Leopardo',         connections: [7] },
    { id: 7, row: 3, col: 2, type: 'boss',     name: 'Santuário do Grande Urso',  connections: [] },
  ]},
  { floorNumber: 2, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portão de Batalha',          connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Horda de Goblins',           connections: [4, 5] },
    { id: 2, row: 1, col: 2, type: 'monster',  name: 'Berserkers Orcs',            connections: [4, 5, 6] },
    { id: 3, row: 1, col: 3, type: 'monster',  name: 'Ogres de Vanguarda',         connections: [5, 6] },
    { id: 4, row: 2, col: 0, type: 'rest',     name: 'Armeiro Abandonado',         connections: [7, 8] },
    { id: 5, row: 2, col: 2, type: 'trap',     name: 'Campo Minado com Estacas',   connections: [7, 8] },
    { id: 6, row: 2, col: 4, type: 'monster',  name: 'Troll da Guerra',            connections: [8] },
    { id: 7, row: 3, col: 1, type: 'treasure', name: 'Tesouro de Batalha',         connections: [9] },
    { id: 8, row: 3, col: 3, type: 'monster',  name: 'Capitão Hobgoblin',          connections: [9] },
    { id: 9, row: 3, col: 2, type: 'boss',     name: 'Forte do Warchief Gromthar', connections: [] },
  ]},
  { floorNumber: 3, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Arco de Mármore Élfico',     connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'empty',    name: 'Corredor de Runas',           connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'monster',  name: 'Arqueiros de Emboscada',      connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara do Grimório Arcano',  connections: [6] },
    { id: 4, row: 2, col: 2, type: 'puzzle',   name: 'Runa Élfica Bloqueante',      connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'trap',     name: 'Rede de Vento Automática',   connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Fonte Sagrada de Glórienn',  connections: [8] },
    { id: 7, row: 3, col: 3, type: 'monster',  name: 'Mago Élfico de Elite',        connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Torre do Arqueiro Arcano',    connections: [] },
  ]},
  { floorNumber: 4, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal do Além',             connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'puzzle',   name: 'Enigma dos Mortos',           connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'empty',    name: 'Corredor Espectral',          connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'trap',     name: 'Toque da Morte Imediata',    connections: [6] },
    { id: 4, row: 2, col: 2, type: 'puzzle',   name: 'Câmara do Destino',           connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'rest',     name: 'Antecâmara do Silêncio',     connections: [7] },
    { id: 6, row: 3, col: 1, type: 'monster',  name: 'Espectros Eternos',           connections: [8] },
    { id: 7, row: 3, col: 3, type: 'puzzle',   name: 'Julgamento de Lena',          connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Trono da Ceifadora',          connections: [] },
  ]},
  { floorNumber: 5, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Corredor de Entrada Seguro', connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'trap',     name: 'Câmara das Lâminas',         connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'trap',     name: 'Chão Falso',                  connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'trap',     name: 'Dardos Envenenados',          connections: [6] },
    { id: 4, row: 2, col: 2, type: 'monster',  name: 'Assassino Sombrio',           connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'treasure', name: 'Cofre Armadilhado',           connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Santuário Oculto',            connections: [8] },
    { id: 7, row: 3, col: 3, type: 'trap',     name: 'Câmara de Gás',               connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Mestre das Ilusões',connections: [] },
  ]},
  { floorNumber: 6, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal das Flores',           connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'social',   name: 'Jardim das Ninfas',            connections: [4] },
    { id: 2, row: 1, col: 2, type: 'social',   name: 'Fonte das Fadas',              connections: [4, 5] },
    { id: 3, row: 1, col: 3, type: 'trap',     name: 'Encantamento de Sono',         connections: [5] },
    { id: 4, row: 2, col: 1, type: 'treasure', name: 'Câmara das Rosas',             connections: [6] },
    { id: 5, row: 2, col: 3, type: 'rest',     name: 'Antecâmara Perfumada',         connections: [6] },
    { id: 6, row: 3, col: 2, type: 'boss',     name: 'Trono de Ninfa Rainha Aelindra',connections: [] },
  ]},
  { floorNumber: 7, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Boca das Trevas',             connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara dos Zumbis',           connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'trap',     name: 'Fossa Oculta',                connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'monster',  name: 'Covil do Licantropo',         connections: [6] },
    { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara do Wight',             connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'treasure', name: 'Cripta Esquecida',             connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Câmara da Chama Sombria',     connections: [8] },
    { id: 7, row: 3, col: 3, type: 'monster',  name: 'Antro do Vampiro Menor',      connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Vampiro Ancião',    connections: [] },
  ]},
  { floorNumber: 8, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal do Sol Ardente',       connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'trap',     name: 'Câmara de Calor Extremo',     connections: [4, 5] },
    { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara da Múmia',             connections: [4, 5] },
    { id: 3, row: 1, col: 3, type: 'puzzle',   name: 'Enigma da Esfinge Menor',     connections: [5, 6] },
    { id: 4, row: 2, col: 1, type: 'trap',     name: 'Areia Movediça',              connections: [7] },
    { id: 5, row: 2, col: 2, type: 'monster',  name: 'Câmara dos Escorpiões',       connections: [7] },
    { id: 6, row: 2, col: 4, type: 'treasure', name: 'Câmara dos Artefatos Solares',connections: [7] },
    { id: 7, row: 3, col: 2, type: 'boss',     name: 'Câmara da Grande Esfinge',    connections: [] },
  ]},
  { floorNumber: 9, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada do Labirinto',        connections: [1, 2, 3] },
    { id: 1, row: 1, col: 0, type: 'empty',    name: 'Corredor Sem Saída',          connections: [4] },
    { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara do Minotauro',         connections: [4, 5] },
    { id: 3, row: 1, col: 4, type: 'trap',     name: 'Paredes Móveis',              connections: [5] },
    { id: 4, row: 2, col: 1, type: 'monster',  name: 'Câmara do Berserker',         connections: [6] },
    { id: 5, row: 2, col: 3, type: 'treasure', name: 'Tesouro do Gladiador',        connections: [6] },
    { id: 6, row: 3, col: 2, type: 'boss',     name: 'Arena do Minotauro Supremo',  connections: [] },
  ]},
  { floorNumber: 10, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada da Biblioteca',       connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'puzzle',   name: 'Câmara do Primeiro Enigma',   connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'puzzle',   name: 'Câmara do Segundo Enigma',    connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'treasure', name: 'Seção de Pergaminhos Raros',  connections: [6] },
    { id: 4, row: 2, col: 2, type: 'puzzle',   name: 'Câmara do Terceiro Enigma',   connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'monster',  name: 'Guardião de Biblioteca',      connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Câmara da Meditação',         connections: [8] },
    { id: 7, row: 3, col: 3, type: 'trap',     name: 'Paradoxo Temporal',           connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Golem do Saber',    connections: [] },
  ]},
  { floorNumber: 11, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portão do Dojo',              connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara dos Monges',           connections: [4, 5] },
    { id: 2, row: 1, col: 2, type: 'rest',     name: 'Jardim de Meditação',          connections: [5] },
    { id: 3, row: 1, col: 3, type: 'monster',  name: 'Câmara dos Samurais',         connections: [5, 6] },
    { id: 4, row: 2, col: 0, type: 'treasure', name: 'Armaria Sagrada',             connections: [7] },
    { id: 5, row: 2, col: 2, type: 'monster',  name: 'Câmara do Mestre Ninja',      connections: [7] },
    { id: 6, row: 2, col: 4, type: 'trap',     name: 'Teste de Agilidade',          connections: [7] },
    { id: 7, row: 3, col: 2, type: 'boss',     name: 'Câmara do Sensei Imortal',    connections: [] },
  ]},
  { floorNumber: 12, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal Feérico',              connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'social',   name: 'Câmara dos Gênios',            connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'trap',     name: 'Ilusão de Caminho',            connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara das Frutas Douradas',   connections: [6] },
    { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara das Fadas Guerreiras',  connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'monster',  name: 'Câmara do Unicórnio',          connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Claro Encantado',              connections: [8] },
    { id: 7, row: 3, col: 3, type: 'trap',     name: 'Dimensão Hostil',              connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Trono da Rainha das Fadas',    connections: [] },
  ]},
  { floorNumber: 13, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Câmara de Mergulho',          connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'trap',     name: 'Corrente Submarina',          connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'monster',  name: 'Câmara dos Sahuagins',        connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara das Pérolas',          connections: [6] },
    { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara dos Polvos',           connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'trap',     name: 'Câmara Pressurizada',         connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Câmara de Ar',                connections: [8] },
    { id: 7, row: 3, col: 3, type: 'monster',  name: 'Câmara dos Tubarões',         connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Abismo do Kraken',            connections: [] },
  ]},
  { floorNumber: 14, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal das Chamas',           connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'trap',     name: 'Jato de Chama',               connections: [4, 5] },
    { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara dos Salamandros',      connections: [4, 5] },
    { id: 3, row: 1, col: 3, type: 'monster',  name: 'Câmara dos Ífreets',          connections: [5, 6] },
    { id: 4, row: 2, col: 1, type: 'treasure', name: 'Câmara dos Rubis de Fogo',    connections: [7] },
    { id: 5, row: 2, col: 2, type: 'trap',     name: 'Chão de Lava',                connections: [7] },
    { id: 6, row: 2, col: 4, type: 'rest',     name: 'Câmara Resistente ao Fogo',   connections: [7] },
    { id: 7, row: 3, col: 2, type: 'boss',     name: 'Núcleo do Elemental Primordial',connections: [] },
  ]},
  { floorNumber: 15, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada do Ninho',            connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara das Cobras Rei',       connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'trap',     name: 'Câmara de Gás Venenoso',      connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara das Escamas de Naga',  connections: [6] },
    { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara das Víboras',          connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'trap',     name: 'Poça de Ácido',               connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Antro Temporariamente Seguro',connections: [8] },
    { id: 7, row: 3, col: 3, type: 'monster',  name: 'Câmara do Basilisco',         connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara da Naga Rainha',       connections: [] },
  ]},
  { floorNumber: 16, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada da Arena de Ferro',   connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara do Golem de Ferro',    connections: [4, 5] },
    { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara do Paladino Renegado', connections: [4, 5, 6] },
    { id: 3, row: 1, col: 3, type: 'trap',     name: 'Prensa de Ferro',             connections: [5, 6] },
    { id: 4, row: 2, col: 0, type: 'rest',     name: 'Câmara de Recuperação',       connections: [7] },
    { id: 5, row: 2, col: 2, type: 'monster',  name: 'Câmara do Campeão',           connections: [7] },
    { id: 6, row: 2, col: 4, type: 'treasure', name: 'Câmara das Armaduras Mágicas',connections: [7] },
    { id: 7, row: 3, col: 2, type: 'boss',     name: 'Arena do Cavaleiro de Ferro', connections: [] },
  ]},
  { floorNumber: 17, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada da Toca Colossal',    connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara do Dragão Ancião',     connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'trap',     name: 'Queda de Teto Colossal',      connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara do Tesouro do Monstro',connections: [6] },
    { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara da Hidra de Doze Cabeças',connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'monster',  name: 'Câmara do Gigante',           connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Gruta Temporariamente Vazia', connections: [8] },
    { id: 7, row: 3, col: 3, type: 'monster',  name: 'Câmara da Rocha Viva',        connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Tiranossauro Colossal',connections: [] },
  ]},
  { floorNumber: 18, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada do Caos',             connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara do Slaad',             connections: [4, 5] },
    { id: 2, row: 1, col: 2, type: 'trap',     name: 'Inversão de Gravidade',       connections: [4, 5, 6] },
    { id: 3, row: 1, col: 3, type: 'monster',  name: 'Câmara do Beholder',          connections: [5, 6] },
    { id: 4, row: 2, col: 0, type: 'treasure', name: 'Câmara do Artefato Caótico',  connections: [7] },
    { id: 5, row: 2, col: 2, type: 'monster',  name: 'Câmara do Mimético',          connections: [7] },
    { id: 6, row: 2, col: 4, type: 'trap',     name: 'Teleporte Aleatório',         connections: [7] },
    { id: 7, row: 3, col: 2, type: 'boss',     name: 'Vórtice do Sem-Nome de Nimb', connections: [] },
  ]},
  { floorNumber: 19, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal da Justiça',           connections: [1, 2] },
    { id: 1, row: 1, col: 1, type: 'puzzle',   name: 'Câmara da Verdade',           connections: [3, 4] },
    { id: 2, row: 1, col: 3, type: 'monster',  name: 'Câmara do Anjo da Justiça',   connections: [4, 5] },
    { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara da Espada da Justiça', connections: [6] },
    { id: 4, row: 2, col: 2, type: 'puzzle',   name: 'Câmara do Julgamento',        connections: [6, 7] },
    { id: 5, row: 2, col: 4, type: 'monster',  name: 'Câmara do Golem de Mármore',  connections: [7] },
    { id: 6, row: 3, col: 1, type: 'rest',     name: 'Câmara da Absolvição',        connections: [8] },
    { id: 7, row: 3, col: 3, type: 'monster',  name: 'Câmara do Juiz Espectral',    connections: [8] },
    { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Paladino Supremo',  connections: [] },
  ]},
  { floorNumber: 20, rooms: [
    { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal Final de Valkaria',    connections: [1, 2, 3] },
    { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara das Réplicas I',       connections: [4, 5] },
    { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara das Réplicas II',      connections: [4, 5, 6] },
    { id: 3, row: 1, col: 3, type: 'trap',     name: 'Reflexo da Maior Fraqueza',   connections: [5, 6] },
    { id: 4, row: 2, col: 0, type: 'monster',  name: 'Câmara das Réplicas III',     connections: [7] },
    { id: 5, row: 2, col: 2, type: 'rest',     name: 'Câmara de Memórias',          connections: [7] },
    { id: 6, row: 2, col: 4, type: 'treasure', name: 'Câmara da Lágrima de Valkaria',connections: [7] },
    { id: 7, row: 3, col: 2, type: 'boss',     name: 'Câmara do Avatar de Valkaria',connections: [] },
  ]},
];

@Injectable({ providedIn: 'root' })
export class DungeonGeneratorService {

  generateFloor(floorNumber: number): DungeonFloor {
    const idx = Math.min(floorNumber - 1, VALKARIA_FLOORS.length - 1);
    const theme = VALKARIA_FLOORS[idx];
    const layout = FLOOR_LAYOUTS.find(f => f.floorNumber === floorNumber);
    const rooms = layout
      ? this.buildFromLayout(layout, theme)
      : this.generateRooms(floorNumber, theme);

    return {
      floorNumber,
      theme,
      rooms,
      totalRooms: rooms.length,
      bossRoom: rooms.find(r => r.type === 'boss')!.id
    };
  }

  private buildFromLayout(layout: FloorLayout, theme: DungeonTheme): DungeonRoom[] {
    const rooms: DungeonRoom[] = layout.rooms.map(r => ({
      id: r.id,
      type: r.type,
      name: r.name,
      description: this.generateRoomDescription(r.type, theme),
      cleared: r.type === 'entrance',
      locked: false,
      connections: [...r.connections],
      col: r.col,
      row: r.row,
      isVisible: r.type === 'entrance',
      isCurrent: r.type === 'entrance',
    }));

    // Reveal rooms connected to entrance at start
    const entrance = rooms.find(r => r.type === 'entrance')!;
    rooms.forEach(r => {
      if (entrance.connections.includes(r.id)) r.isVisible = true;
    });

    return rooms;
  }

  private generateRooms(floor: number, theme: DungeonTheme): DungeonRoom[] {
    const COLS = 5;
    const ROWS = 4;
    const rooms: DungeonRoom[] = [];
    let id = 0;

    for (let row = 0; row < ROWS; row++) {
      const isEntrance = row === 0;
      const isBoss = row === ROWS - 1;
      const colsThisRow = (isEntrance || isBoss) ? 1 : COLS;
      const startCol = (isEntrance || isBoss) ? Math.floor(COLS / 2) : 0;

      for (let col = startCol; col < startCol + colsThisRow; col++) {
        const type = this.pickRoomType(row, ROWS, col, theme);
        const room: DungeonRoom = {
          id: id++,
          type,
          name: this.generateRoomName(type, theme),
          description: this.generateRoomDescription(type, theme),
          cleared: isEntrance,
          locked: false,
          connections: [],
          col,
          row,
          isVisible: isEntrance,
          isCurrent: isEntrance && col === Math.floor(COLS / 2)
        };
        rooms.push(room);
      }
    }

    this.buildConnections(rooms, COLS, ROWS);

    // Reveal rooms connected to entrance at start
    const entrance = rooms.find(r => r.type === 'entrance')!;
    rooms.forEach(r => {
      if (entrance.connections.includes(r.id)) r.isVisible = true;
    });

    return rooms;
  }

  private pickRoomType(row: number, totalRows: number, col: number, theme: DungeonTheme): RoomType {
    if (row === 0) return 'entrance';
    if (row === totalRows - 1) return 'boss';

    // Pesos adaptados ao tipo de desafio do andar
    const weights = this.getWeightsForChallenge(theme.challengeType);
    const roll = Math.random() * 100;
    let acc = 0;
    for (const [type, weight] of weights) {
      acc += weight;
      if (roll < acc) return type as RoomType;
    }
    return 'monster';
  }

  private getWeightsForChallenge(type: string): [string, number][] {
    switch (type) {
      case 'combat':
        return [['monster', 55], ['treasure', 20], ['rest', 15], ['empty', 10]];
      case 'stealth':
        return [['trap', 50], ['monster', 20], ['treasure', 15], ['rest', 10], ['empty', 5]];
      case 'puzzle':
        return [['puzzle', 40], ['monster', 20], ['trap', 15], ['treasure', 15], ['rest', 10]];
      case 'social':
        return [['social', 40], ['monster', 15], ['treasure', 25], ['rest', 15], ['empty', 5]];
      case 'survival':
        return [['monster', 40], ['trap', 30], ['rest', 15], ['treasure', 10], ['empty', 5]];
      case 'darkness':
        return [['monster', 45], ['trap', 25], ['treasure', 15], ['rest', 10], ['empty', 5]];
      default: // mixed
        return [['monster', 35], ['trap', 20], ['puzzle', 15], ['treasure', 15], ['rest', 10], ['empty', 5]];
    }
  }

  private buildConnections(rooms: DungeonRoom[], cols: number, totalRows: number): void {
    const byRow: DungeonRoom[][] = [];
    rooms.forEach(r => {
      if (!byRow[r.row]) byRow[r.row] = [];
      byRow[r.row].push(r);
    });

    for (let row = 0; row < byRow.length - 1; row++) {
      const current = byRow[row];
      const next = byRow[row + 1];

      if (current.length === 1) {
        const src = current[0];
        next.forEach(dest => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
        continue;
      }

      if (next.length === 1) {
        const dest = next[0];
        current.forEach(src => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
        continue;
      }

      current.forEach(src => {
        const candidates = next.filter(r => Math.abs(r.col - src.col) <= 1);
        const chosen = new Set<DungeonRoom>();
        const same = next.find(r => r.col === src.col);
        if (same) chosen.add(same);
        if (candidates.length && chosen.size < 2) {
          chosen.add(candidates[Math.floor(Math.random() * candidates.length)]);
        }
        chosen.forEach(dest => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
      });

      next.forEach(dest => {
        if (!dest.connections.length) {
          const closest = current.reduce((a, b) =>
            Math.abs(a.col - dest.col) <= Math.abs(b.col - dest.col) ? a : b
          );
          closest.connections.push(dest.id);
          dest.connections.push(closest.id);
        }
      });
    }
  }

  private generateRoomName(type: RoomType, theme: DungeonTheme): string {
    const names: Record<string, string[]> = {
      entrance: ['Portal de Entrada', 'Câmara de Chegada', 'Ponto de Partida'],
      monster: [`Covil de ${theme.monsterTypes[0]}`, `Câmara de ${theme.monsterTypes[1] ?? 'Monstros'}`, 'Salão dos Inimigos'],
      trap: ['Corredor Armadilhado', `Zona de ${theme.trapTypes[0]}`, 'Passagem Mortal'],
      treasure: ['Câmara do Tesouro', 'Sala dos Artefatos', 'Cofre Oculto'],
      rest: ['Braseiro Solitário', 'Ponto de Repouso', 'Câmara de Alívio'],
      boss: [`Câmara de ${theme.guardianName}`, 'Salão do Guardião', 'Câmara do Desafio Final'],
      empty: ['Corredor Vazio', 'Passagem Silenciosa', 'Galeria Escura'],
      puzzle: ['Câmara dos Enigmas', 'Sala do Teste', 'Câmara do Saber'],
      social: ['Câmara do Encontro', 'Salão das Vozes', 'Câmara da Diplomacia']
    };
    const list = names[type] ?? ['Câmara Desconhecida'];
    return list[Math.floor(Math.random() * list.length)];
  }

  private generateRoomDescription(type: RoomType, theme: DungeonTheme): string {
    const flavor = theme.flavorTexts[Math.floor(Math.random() * theme.flavorTexts.length)];
    const typeDesc: Record<string, string> = {
      entrance: 'O ponto de partida neste andar sagrado.',
      monster: `Encontros com ${theme.monsterTypes[Math.floor(Math.random() * theme.monsterTypes.length)]}. Prepare-se.`,
      trap: theme.trapTypes[Math.floor(Math.random() * theme.trapTypes.length)] + '. Cuidado ao avançar.',
      treasure: theme.treasureTypes[Math.floor(Math.random() * theme.treasureTypes.length)] + ' pode estar aqui.',
      rest: 'Um raro momento de trégua neste inferno.',
      boss: theme.guardianDesc,
      empty: 'Nada aqui além de silêncio e sombra.',
      puzzle: 'Um teste da mente. Pense antes de agir.',
      social: 'Uma criatura que pode conversar... ou não.'
    };
    return `${typeDesc[type] ?? ''} ${flavor}`;
  }

  revealConnected(rooms: DungeonRoom[], currentId: number): DungeonRoom[] {
    const current = rooms.find(r => r.id === currentId)!;
    return rooms.map(r => ({
      ...r,
      isVisible: r.isVisible || current.connections.includes(r.id)
    }));
  }

  moveToRoom(rooms: DungeonRoom[], targetId: number): DungeonRoom[] {
    return rooms.map(r => ({ ...r, isCurrent: r.id === targetId }));
  }
}
