// Execução correta: abdômen, funcionais e cardio.

export const CORE: Record<string, string[]> = {
  'abdominal-supra': [
    'Deitado, joelhos dobrados, mãos atrás da cabeça **sem puxar o pescoço**.',
    'Enrole o tronco aproximando as costelas do quadril; a lombar fica no chão.',
    'Suba só até as escápulas saírem do chão, segure 1 s e desça devagar.',
  ],
  'abdominal-infra': [
    'Deitado, mãos ao lado do corpo ou embaixo do quadril.',
    'Suba as pernas e, no fim, **tire o quadril do chão** enrolando a pelve.',
    'Desça devagar sem deixar a lombar arquear.',
  ],
  'abdominal-polia': [
    'Ajoelhado de frente para a polia alta, corda atrás da cabeça.',
    'Enrole o tronco levando os cotovelos em direção às coxas; o quadril **não se mexe**.',
    'Volte até alongar o abdômen. Dá para progredir carga como em qualquer exercício.',
  ],
  prancha: [
    'Antebraços no chão, cotovelos embaixo dos ombros.',
    'Corpo em **linha reta**: aperte glúteos e abdômen, sem deixar o quadril cair ou subir.',
    'Respire normalmente. Melhor 3 séries de 30–45 s firmes que 2 min tremendo errado.',
  ],
  'roda-abdominal': [
    'Ajoelhado, mãos na roda embaixo dos ombros.',
    'Role à frente **sem arquear a lombar**, até onde controlar.',
    'Volte puxando com o abdômen. Comece com amplitude curta.',
  ],
  'abdominal-maquina': [
    'Ajuste o assento e segure as pegadas.',
    'Enrole o tronco à frente contraindo o abdômen.',
    'Volte devagar. Progrida a carga aos poucos.',
  ],
  'abdominal-declinado': [
    'Pés presos no banco declinado.',
    'Enrole o tronco subindo até uns 45° e desça devagar.',
    'Sem puxar o pescoço com as mãos.',
  ],
  'abdominal-bicicleta': [
    'Deitado, mãos atrás da cabeça, pernas no ar.',
    'Leve o cotovelo em direção ao joelho oposto enquanto estica a outra perna.',
    'Alterne devagar, girando o tronco e não só o pescoço.',
  ],
  'abdominal-remador': [
    'Sentado, tronco inclinado para trás, mãos apoiadas.',
    'Traga os joelhos ao peito e estique as pernas sem tocar os pés no chão.',
  ],
  'abdominal-obliquo': [
    'Deitado, joelhos dobrados e caídos para um lado.',
    'Suba o tronco contraindo a lateral do abdômen.',
    'Faça os dois lados.',
  ],
  'elevacao-pernas-barra': [
    'Pendurado na barra, sem balançar.',
    'Suba as pernas (retas ou dobradas) **enrolando a pelve** no final.',
    'Desça devagar. Dobrar os joelhos deixa mais fácil.',
  ],
  'elevacao-joelhos-paralela': [
    'Costas no encosto, antebraços nos apoios.',
    'Suba os joelhos em direção ao peito, enrolando a pelve.',
    'Desça devagar sem balançar.',
  ],
  'prancha-lateral': [
    'De lado, antebraço no chão embaixo do ombro, pés empilhados.',
    'Quadril alto, corpo em linha reta.',
    'Segure o tempo e troque de lado.',
  ],
  'pallof-press': [
    'De lado para a polia na altura do peito, pegada junto ao peito.',
    'Empurre os braços à frente **sem deixar o tronco girar**.',
    'Segure 2 s e volte. É exercício de resistir à rotação.',
  ],
  'rotacao-polia': [
    'De lado para a polia alta (ou baixa), braços estendidos.',
    'Gire o tronco puxando em diagonal; o movimento vem do tronco, não dos braços.',
    'Volte devagar e faça os dois lados.',
  ],
  'russian-twist': [
    'Sentado, tronco inclinado para trás, pés no chão ou elevados.',
    'Gire o tronco levando o peso de um lado ao outro.',
    'Coluna neutra; não arredonde as costas.',
  ],
  'abdominal-anilha': [
    'Anilha junto ao peito ou estendida acima.',
    'Enrole o tronco como no abdominal supra e desça devagar.',
  ],
  'dead-bug': [
    'Deitado, braços para cima e joelhos a 90°.',
    'Estenda braço e perna opostos **mantendo a lombar colada no chão**.',
    'Volte e troque. Devagar e controlado.',
  ],
  vacuo: [
    'Em pé ou de quatro apoios, solte todo o ar.',
    'Puxe o umbigo para dentro e para cima, como se encostasse na coluna.',
    'Segure 10–20 s respirando curto. Trabalha o transverso do abdômen.',
  ],
  'mountain-climber': [
    'Posição de flexão, mãos embaixo dos ombros.',
    'Traga os joelhos alternadamente em direção ao peito, rápido.',
    'Quadril baixo, sem subir o bumbum.',
  ],
  'abdominal-trx': [
    'Pés nas fitas, posição de flexão.',
    'Traga os joelhos ao peito (ou o quadril para cima em canivete) e volte.',
    'Corpo firme, sem deixar o quadril cair.',
  ],
  // Funcionais
  thruster: [
    'Barra ou halteres na frente dos ombros.',
    'Agache e, ao subir, use o impulso para **empurrar o peso acima da cabeça**.',
    'Movimento contínuo; desça o peso aos ombros ao agachar de novo.',
  ],
  clean: [
    'Barra no chão, posição de levantamento terra.',
    'Puxe explosivo estendendo o quadril e encolhendo os ombros.',
    'Gire os cotovelos para frente e receba a barra nos ombros em meio agachamento.',
    'Técnico: aprenda com carga leve, de preferência com um treinador.',
  ],
  'snatch-halter': [
    'Halter entre os pés, posição de agachamento com uma mão.',
    'Estenda o quadril explosivo e leve o halter direto **acima da cabeça** num só movimento.',
    'Braço estendido em cima; desça controlado.',
  ],
  'turkish-getup': [
    'Deitado, kettlebell com o braço estendido para cima.',
    'Levante-se passo a passo (cotovelo, mão, ponte, joelho, em pé) **sem tirar os olhos do peso**.',
    'Desça na ordem inversa. Bem devagar e com carga leve.',
  ],
  burpee: [
    'Agache, apoie as mãos e jogue os pés para trás (posição de flexão).',
    'Volte os pés para perto das mãos e salte com os braços para cima.',
    'Ritmo constante; aterrisse suave.',
  ],
  'wall-ball': [
    'Bola na frente do peito, de frente para a parede.',
    'Agache e, ao subir, **lance a bola** no alvo acima.',
    'Pegue a bola já descendo para o próximo agachamento.',
  ],
  'sled-push': [
    'Mãos no trenó, corpo inclinado à frente, braços estendidos.',
    'Empurre com passos curtos e fortes, pela distância combinada.',
  ],
  'battle-rope': [
    'Pés na largura dos ombros, meio agachamento, uma ponta em cada mão.',
    'Faça ondas alternadas ou juntas, rápidas, pelo tempo combinado.',
    'Abdômen firme, movimento vindo dos ombros.',
  ],
  // Cardio
  esteira: [
    'Postura ereta, olhando à frente, sem segurar nas barras.',
    'Passadas naturais; inclinação leve (1–2%) simula o chão de rua.',
    'Anote distância e tempo para acompanhar a evolução.',
  ],
  bicicleta: [
    'Banco na altura do quadril: o joelho fica **levemente dobrado** com o pedal embaixo.',
    'Pedale com cadência constante.',
    'Anote distância e tempo.',
  ],
  eliptico: [
    'Postura ereta, pés inteiros nos pedais.',
    'Use os braços junto com as pernas para trabalhar o corpo inteiro.',
  ],
  escada: [
    'Postura ereta, sem se apoiar com força nos braços.',
    'Passos completos, pé inteiro no degrau.',
  ],
  corda: [
    'Cotovelos perto do corpo, gire a corda com os punhos.',
    'Saltos baixos na ponta dos pés.',
  ],
  'remo-ergometro': [
    'Ordem na puxada: **pernas, depois tronco, depois braços**.',
    'Na volta, ao contrário: braços, tronco, pernas.',
    'Coluna neutra; a força vem das pernas.',
  ],
  'bike-air': [
    'Banco na altura do quadril, empurre e puxe as alavancas junto com as pernas.',
    'Quanto mais forte, mais resistência. Ótima para tiros curtos.',
  ],
  spinning: [
    'Banco na altura do quadril, guidão um pouco acima ou na altura do banco.',
    'Ajuste a carga para manter a cadência que o treino pede.',
  ],
  transport: [
    'Postura ereta, use os braços junto com as pernas.',
    'Mantenha um ritmo constante.',
  ],
  caminhada: [
    'Passos naturais, braços balançando, postura ereta.',
    'Para aquecer ou recuperar, ritmo em que dá para conversar.',
    'Anote distância e tempo.',
  ],
  corrida: [
    'Passadas curtas e frequentes, pisando embaixo do corpo.',
    'Ombros soltos, olhar à frente.',
    'Anote distância e tempo para acompanhar o ritmo.',
  ],
  natacao: [
    'Aqueça com braçadas leves.',
    'Respire de forma ritmada, soltando o ar dentro da água.',
    'Anote distância e tempo.',
  ],
  'hiit-esteira': [
    'Aqueça 5 min caminhando.',
    'Alterne tiros fortes (20–30 s) com recuperação caminhando (60–90 s).',
    'Segure nas barras só para subir e descer da esteira entre os tiros.',
  ],
};
