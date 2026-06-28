// Eventos de roleplay para vantagens sem efeito mecânico implementado (ver `implemented:
// false` em vantagens.data.ts). Cada evento descreve uma situação fora de combate
// resolvida narrativamente por QUALQUER uma de várias perícias/vantagens possíveis —
// dá um motivo real pra ter comprado a vantagem, mesmo sem gancho de código ainda.
//
// Não são salas dedicadas: a ideia é que `pickRoleplayEvent()` seja chamado por uma
// sala 'social'/'puzzle'/'empty' pra sortear uma situação e checar se algum membro da
// party tem uma das soluções listadas — se sim, ganha uma saída favorável extra.

export type RoleplaySolutionType = 'pericia' | 'vantagem';

export interface RoleplaySolution {
  type: RoleplaySolutionType;
  /** ID da perícia (pericias.data.ts) ou vantagem (vantagens.data.ts). */
  id: string;
}

export interface RoleplayEvent {
  id: string;
  /** Descrição da situação apresentada ao jogador. */
  description: string;
  /** Qualquer uma destas perícias/vantagens (de qualquer membro da party) resolve o evento. */
  resolvedBy: RoleplaySolution[];
  /** Texto exibido se alguém na party tiver uma das soluções. */
  successText: string;
  /** Texto exibido se ninguém tiver nenhuma das soluções. */
  failText: string;
}

const V = (id: string): RoleplaySolution => ({ type: 'vantagem', id });
const P = (id: string): RoleplaySolution => ({ type: 'pericia', id });

export const ROLEPLAY_EVENTS: RoleplayEvent[] = [
  {
    id: 'negociacao_social',
    description: 'Um grupo de viajantes bloqueia a única trilha disponível, exigindo "pedágio" — ou uma boa conversa pra deixar passar.',
    resolvedBy: [V('carismatico'), V('famoso'), V('devoto'), V('patrono'), V('torcida'), V('inofensivo'), P('influencia')],
    successText: 'Sua reputação (ou seu jeito) fala por você — eles abrem caminho sem briga.',
    failText: 'Sem ninguém pra convencê-los, o grupo precisa procurar outra rota ou pagar o pedágio.',
  },
  {
    id: 'leitura_de_intencoes',
    description: 'Um estranho oferece ajuda — mas algo no tom dele soa errado demais pra ser sincero.',
    resolvedBy: [V('telepata'), V('sentido'), V('irresistivel'), V('anulacao'), P('percepcao'), P('influencia')],
    successText: 'A farsa fica óbvia antes que qualquer estrago aconteça — vocês percebem a intenção real.',
    failText: 'Sem ninguém pra perceber, vocês confiam... e só descobrem o engano depois.',
  },
  {
    id: 'obstaculo_fisico',
    description: 'Um desfiladeiro corta a trilha — escalar é arriscado, e não há ponte por perto.',
    resolvedBy: [V('forte'), V('vigoroso'), V('voo'), V('teleporte'), V('aceleracao'), P('esporte')],
    successText: 'Um salto, um voo ou pura força bruta — o grupo atravessa sem perder tempo.',
    failText: 'Sem ninguém capaz de cruzar com facilidade, o grupo precisa de muito mais tempo (ou de outra rota).',
  },
  {
    id: 'fera_selvagem',
    description: 'Uma criatura selvagem barra o caminho, mais curiosa que hostil — mas pronta para atacar se provocada.',
    resolvedBy: [V('ajudante'), V('inofensivo'), V('telepata'), V('imitar'), P('animais'), P('sobrevivencia')],
    successText: 'Calma e instinto bastam — a fera perde o interesse e libera a passagem.',
    failText: 'Sem ninguém que entenda de bichos, é melhor recuar ou se preparar pra briga.',
  },
  {
    id: 'enigma_arcano',
    description: 'Runas antigas guardam uma passagem selada — só quem entende de magia consegue decifrá-las.',
    resolvedBy: [V('genio'), V('grimorio'), V('ilusao'), V('improviso'), V('mentor'), V('maestria'), P('mistica'), P('saber')],
    successText: 'O conhecimento certo desvenda o enigma — as runas se apagam e a passagem se abre.',
    failText: 'Sem ninguém versado nesse tipo de saber, as runas continuam um mistério fechado.',
  },
  {
    id: 'emboscada_evitavel',
    description: 'Algo nos arbustos sugere uma emboscada — talvez dê pra evitar o confronto inteiramente.',
    resolvedBy: [V('clone'), V('incorporeo'), V('invisivel'), V('invisivel_potente'), V('teleporte'), V('aceleracao')],
    successText: 'Vocês desviam da emboscada sem que ninguém perceba — o caminho continua livre.',
    failText: 'Sem como escapar do alcance dos emboscadores, o confronto se torna inevitável.',
  },
  {
    id: 'porta_trancada',
    description: 'Uma porta reforçada esconde o que parece ser um pequeno tesouro — mas está bem trancada.',
    resolvedBy: [V('forte'), V('artefato'), V('ataque_especial'), V('improviso'), V('imitar'), P('manha')],
    successText: 'Força, talento ou um truque na hora certa — a porta cede e o tesouro é seu.',
    failText: 'Sem ninguém capaz de arrombar ou contornar a fechadura, o tesouro fica trancado pra sempre.',
  },
  {
    id: 'rastros_antigos',
    description: 'Pistas antigas no chão podem indicar um caminho mais curto — ou uma armadilha esquecida.',
    resolvedBy: [V('sentido'), V('arena'), V('inimigo'), V('inimigo_potente'), P('percepcao'), P('sobrevivencia')],
    successText: 'Os rastros contam a história certa — um atalho seguro se revela.',
    failText: 'Sem ninguém pra interpretar os sinais, é melhor seguir pelo caminho longo e seguro.',
  },
  {
    id: 'crise_de_recursos',
    description: 'Provisões estão acabando e a próxima vila cobra caro por suprimentos básicos.',
    resolvedBy: [V('riqueza'), V('patrono'), V('inventario'), V('base'), V('artefato'), V('mais_vida'), V('mais_mana')],
    successText: 'Recursos de sobra (ou conexões certas) resolvem o problema sem dor no bolso.',
    failText: 'Sem reservas extras, o grupo segue a aventura com o estoque mais apertado.',
  },
  {
    id: 'duelo_de_honra',
    description: 'Um guerreiro local desafia o grupo para um duelo amistoso — recusar pode custar respeito.',
    resolvedBy: [V('acumulador'), V('brutal'), V('golpe_final'), V('desgaste'), V('punicao'), V('punicao_potente'), V('alcance'), V('alcance_potente'), V('mais_acao')],
    successText: 'Uma demonstração técnica impressiona os presentes — o respeito da vila está conquistado.',
    failText: 'Sem nada de especial pra mostrar, o duelo termina sem impressionar ninguém.',
  },
  {
    id: 'vinculo_do_grupo',
    description: 'A trilha se divide em dois caminhos perigosos — explorar os dois ao mesmo tempo seria mais seguro, se o grupo conseguisse se coordenar a distância.',
    resolvedBy: [V('elo_mental'), V('estender'), V('mais_membros'), V('instrutor'), V('mentor'), V('ajudante')],
    successText: 'Coordenação perfeita — o grupo cobre as duas trilhas sem perder contato.',
    failText: 'Sem um jeito de se manter conectados, o grupo escolhe seguir só por um caminho.',
  },
  {
    id: 'mascara_e_disfarce',
    description: 'Para entrar no próximo local sem alarde, alguém vai precisar se passar por outra pessoa.',
    resolvedBy: [V('transformacao'), V('transformacao_potente'), V('imitar'), V('famoso'), V('inofensivo'), V('imune')],
    successText: 'O disfarce funciona perfeitamente — ninguém suspeita de nada.',
    failText: 'Sem como disfarçar ninguém de forma convincente, o grupo precisa entrar de outro jeito.',
  },
  {
    id: 'resistencia_extrema',
    description: 'Uma exposição prolongada a um ambiente hostil (frio extremo, ar tóxico, terreno amaldiçoado) testa os limites do grupo.',
    resolvedBy: [V('imortal'), V('regeneracao'), V('regeneracao_potente'), V('obstinado'), V('resoluto'), V('vigoroso'), V('imune'), V('foco')],
    successText: 'O grupo resiste sem maiores sequelas — a força de vontade (ou o corpo) aguenta.',
    failText: 'Sem ninguém particularmente resistente, a exposição cobra um preço alto antes de seguir.',
  },
  {
    id: 'defesa_da_caravana',
    description: 'Uma pequena caravana pede ajuda pra atravessar um trecho perigoso — proteger todo mundo ao mesmo tempo não vai ser fácil.',
    resolvedBy: [V('defesa_especial'), V('clone'), V('incorporeo'), V('mais_membros'), V('ajudante'), V('torcida')],
    successText: 'A caravana atravessa inteira e sã — a proteção extra fez toda a diferença.',
    failText: 'Sem reforço extra de defesa, alguns membros da caravana não chegam ao fim do trecho.',
  },
];

/** Sorteia um evento de roleplay qualquer do conjunto. */
export function rollRoleplayEvent(): RoleplayEvent {
  return ROLEPLAY_EVENTS[Math.floor(Math.random() * ROLEPLAY_EVENTS.length)];
}

/** Sorteia, entre os eventos que aceitam a vantagem dada como solução, um exemplo concreto de uso. */
export function eventsForVantagem(vantagemId: string): RoleplayEvent[] {
  return ROLEPLAY_EVENTS.filter(e => e.resolvedBy.some(s => s.type === 'vantagem' && s.id === vantagemId));
}

/**
 * Verifica se algum membro da party (lista de nomes de vantagens/perícias já concedidas)
 * resolve o evento. `partyVantagens`/`partyPericias` devem ser a UNIÃO de todos os membros.
 */
export function resolveRoleplayEvent(
  event: RoleplayEvent,
  partyVantagemIds: Set<string>,
  partyPericiaIds: Set<string>,
): boolean {
  return event.resolvedBy.some(s =>
    s.type === 'vantagem' ? partyVantagemIds.has(s.id) : partyPericiaIds.has(s.id)
  );
}
