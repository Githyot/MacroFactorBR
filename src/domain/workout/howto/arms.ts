// Execução correta: bíceps, tríceps e antebraço.

export const ARMS: Record<string, string[]> = {
  // Bíceps
  'rosca-direta': [
    'Em pé, barra com pegada na largura dos ombros, palmas para frente.',
    '**Cotovelos colados no corpo** e parados durante todo o movimento.',
    'Suba até o bíceps contrair por completo e desça até **estender totalmente** o braço.',
    'Erro comum: balançar o tronco ou levar os cotovelos para frente para subir.',
  ],
  'rosca-alternada': [
    'Em pé ou sentado, halteres ao lado do corpo com palmas viradas para o corpo.',
    'Ao subir, **gire a palma para cima** (supinação).',
    'Cotovelo parado; desça até estender por completo antes de trocar de braço.',
  ],
  'rosca-martelo': [
    'Palmas viradas **uma para a outra** o tempo todo.',
    'Cotovelos colados no corpo, suba até a altura do ombro.',
    'Desça até estender. Trabalha bíceps, braquial e antebraço.',
  ],
  'rosca-scott': [
    'Ajuste o banco para a **axila encostar no topo do apoio**.',
    'Braços inteiros apoiados no banco.',
    'Desça até quase estender (sem soltar o peso embaixo) e suba contraindo.',
    'Ótimo alongamento: comece com carga moderada.',
  ],
  'rosca-concentrada': [
    'Sentado, cotovelo apoiado na **parte interna da coxa**.',
    'Suba o halter em direção ao ombro, sem mexer o braço.',
    'Aperte 1 s em cima e desça até estender.',
  ],
  'rosca-polia': [
    'Polia baixa com barra, um passo para trás.',
    'Cotovelos colados no corpo.',
    'Suba contraindo e desça até estender; a polia mantém tensão o tempo todo.',
  ],
  'rosca-inclinada': [
    'Banco a **45–60°**, braços pendurados atrás da linha do tronco.',
    'Suba sem levar os cotovelos para frente.',
    'Desça até estender bem: o bíceps trabalha **alongado**, ótimo para hipertrofia.',
  ],
  'rosca-barra-w': [
    'Pegada nas curvas da barra W, mais confortável para o punho.',
    'Cotovelos colados no corpo, suba contraindo.',
    'Desça até estender por completo.',
  ],
  'rosca-scott-barra-w': [
    'Axila no topo do apoio, braços apoiados.',
    'Desça até quase estender e suba contraindo.',
    'Controle a descida; é onde o bíceps mais alonga.',
  ],
  'rosca-scott-halter': [
    'Um braço de cada vez no banco Scott.',
    'Desça até quase estender, suba girando a palma para cima.',
    'Bom para corrigir diferença entre os lados.',
  ],
  'rosca-scott-maquina': [
    'Ajuste o assento para a axila encostar no apoio e o cotovelo alinhar com o eixo.',
    'Suba contraindo e desça até quase estender.',
  ],
  'rosca-maquina': [
    'Cotovelo **alinhado com o eixo** da máquina.',
    'Suba até contrair e volte devagar até estender.',
    'Segure 1 s em cima.',
  ],
  'rosca-simultanea': [
    'Os dois halteres sobem juntos, palmas para frente.',
    'Cotovelos colados, sem balançar o tronco.',
    'Desça até estender por completo.',
  ],
  'rosca-martelo-corda': [
    'Corda na polia baixa, palmas viradas uma para a outra.',
    'Cotovelos colados, suba até perto dos ombros.',
    'Desça até estender.',
  ],
  'rosca-martelo-cruzada': [
    'Pegada neutra, suba o halter **cruzando na frente do corpo** em direção ao ombro oposto.',
    'Cotovelo parado. Desça até estender.',
  ],
  'rosca-inversa': [
    'Barra com **palmas para baixo** (pronada).',
    'Cotovelos colados, suba até a altura do peito.',
    'Desça devagar. Trabalha antebraço e braquial; carga menor que na rosca direta.',
  ],
  'rosca-polia-unilateral': [
    'Alça na polia baixa, um braço por vez.',
    'Cotovelo colado no corpo, suba girando a palma para cima.',
    'Desça até estender.',
  ],
  'rosca-polia-alta': [
    'Entre as polias altas, braços abertos na altura dos ombros.',
    'Dobre os cotovelos trazendo as mãos em direção às orelhas.',
    'Cotovelos parados na altura dos ombros. Segure 1 s contraindo.',
  ],
  'rosca-bayesian': [
    'De costas para a polia baixa, braço estendido **atrás da linha do corpo**.',
    'Suba sem levar o cotovelo para frente.',
    'Excelente alongamento do bíceps; volte devagar até estender.',
  ],
  'rosca-spider': [
    'Deite de bruços no banco inclinado, braços pendurados na vertical.',
    'Suba contraindo bem, sem mexer o ombro.',
    'Desça até estender. Ótima contração no topo.',
  ],
  'rosca-21': [
    '7 repetições da **metade de baixo** (de estendido até 90°).',
    '7 repetições da **metade de cima** (de 90° até em cima).',
    '7 repetições completas, tudo sem descanso. Use carga bem menor que na rosca normal.',
  ],
  'rosca-zottman': [
    'Suba com as **palmas para cima** como na rosca alternada.',
    'Em cima, gire as palmas para baixo e desça devagar assim.',
    'Trabalha bíceps na subida e antebraço na descida.',
  ],
  'rosca-elastico': [
    'Pise no elástico e segure as pontas, palmas para frente.',
    'Cotovelos colados; suba e segure 1 s em cima, onde o elástico é mais pesado.',
    'Desça devagar.',
  ],
  'rosca-kettlebell': [
    'Segure pela alça com o peso pendurado embaixo da mão.',
    'Cotovelos colados, suba e desça controlado.',
  ],
  // Tríceps
  'triceps-polia': [
    'Polia alta com barra, cotovelos **colados ao lado do corpo**.',
    'Empurre a barra para baixo até **estender por completo** os braços.',
    'Suba até o antebraço passar da linha de 90°, sem tirar os cotovelos do lugar.',
    'Erro comum: inclinar o tronco sobre a barra e empurrar com o corpo.',
  ],
  'triceps-corda': [
    'Corda na polia alta, cotovelos colados no corpo.',
    'Empurre para baixo e **abra as pontas da corda** no fim, estendendo tudo.',
    'Volte devagar até 90° ou um pouco mais.',
  ],
  'triceps-testa': [
    'Deitado, barra (ou W) acima da testa, braços levemente inclinados para trás.',
    'Dobre só os cotovelos levando a barra em direção à **testa ou atrás da cabeça**.',
    'Estenda sem abrir os cotovelos para os lados.',
    'Carga moderada: protege o cotovelo.',
  ],
  'triceps-frances': [
    'Sentado ou em pé, segure um halter com as duas mãos acima da cabeça.',
    'Desça o halter atrás da cabeça até sentir o tríceps **bem alongado**.',
    'Suba estendendo, cotovelos apontando para cima e perto da cabeça.',
  ],
  'triceps-banco': [
    'Mãos na borda do banco atrás de você, pernas à frente.',
    'Desça dobrando os cotovelos até uns 90°, ombros longe das orelhas.',
    'Suba estendendo. Pés mais longe deixam mais difícil.',
  ],
  'supino-fechado': [
    'Pegada na **largura dos ombros** (não precisa encostar as mãos).',
    'Cotovelos perto do corpo ao descer.',
    'Desça até a parte baixa do peito e empurre. Trabalha tríceps com carga alta.',
  ],
  'triceps-polia-v': [
    'Barra V na polia alta, cotovelos colados.',
    'Empurre até estender por completo e volte até 90°.',
  ],
  'triceps-polia-inverso': [
    'Barra reta com **palmas para cima**.',
    'Cotovelos colados, empurre até estender.',
    'Carga menor que na pegada normal.',
  ],
  'triceps-unilateral-polia': [
    'Alça na polia alta, um braço por vez.',
    'Cotovelo colado no corpo, estenda até o fim.',
    'Bom para corrigir diferença entre os lados.',
  ],
  'triceps-frances-polia': [
    'De costas para a polia, corda passando por cima da cabeça.',
    'Tronco inclinado à frente, cotovelos apontando para frente/cima.',
    'Estenda os braços à frente e volte até o tríceps **alongar bem** atrás da cabeça.',
  ],
  'triceps-frances-barra-w': [
    'Sentado, barra W acima da cabeça.',
    'Desça atrás da cabeça até alongar e estenda, cotovelos para cima.',
  ],
  'triceps-testa-barra-w': [
    'Deitado, barra W acima da testa.',
    'Dobre só os cotovelos levando a barra até a testa ou atrás da cabeça.',
    'Estenda sem abrir os cotovelos.',
  ],
  'triceps-testa-halter': [
    'Deitado, um halter em cada mão com palmas viradas uma para a outra.',
    'Dobre os cotovelos levando os halteres ao lado da cabeça.',
    'Estenda sem mexer os ombros.',
  ],
  'triceps-coice': [
    'Tronco inclinado, apoiado no banco, **braço colado ao corpo e paralelo ao chão**.',
    'Estenda o cotovelo levando o halter para trás.',
    'Segure 1 s estendido. Carga leve, sem balanço.',
  ],
  'triceps-coice-polia': [
    'Polia baixa, tronco inclinado, braço paralelo ao chão.',
    'Estenda o cotovelo para trás e segure 1 s.',
    'A polia mantém tensão no movimento todo.',
  ],
  'triceps-maquina': [
    'Ajuste o assento para o cotovelo ficar **alinhado com o eixo** da máquina.',
    'Estenda até o fim e volte devagar.',
  ],
  'triceps-paralela-maquina': [
    'Sentado, pegadas ao lado do corpo.',
    'Empurre para baixo até estender, tronco reto.',
    'Volte até uns 90° nos cotovelos.',
  ],
  'paralelas-triceps': [
    '**Tronco reto** (vertical) e cotovelos apontando para trás: foca o tríceps.',
    'Desça até os cotovelos ficarem em uns 90°.',
    'Suba estendendo os braços.',
  ],
  'supino-fechado-smith': [
    'Pegada na largura dos ombros, cotovelos perto do corpo.',
    'Desça até a parte baixa do peito e empurre.',
  ],
  'triceps-elastico': [
    'Elástico preso no alto, cotovelos colados.',
    'Estenda até o fim e segure 1 s.',
  ],
  'triceps-trx': [
    'De costas para o ponto de apoio, mãos nas fitas acima da cabeça.',
    'Dobre os cotovelos inclinando o corpo à frente e estenda empurrando.',
    'Corpo em linha reta.',
  ],
  // Antebraço
  'rosca-punho': [
    'Sentado, antebraços nas coxas, **palmas para cima**, punhos para fora dos joelhos.',
    'Deixe a barra descer até os dedos e suba fechando o punho.',
    'Amplitude toda, sem mexer os antebraços.',
  ],
  'rosca-punho-inversa': [
    'Antebraços nas coxas, **palmas para baixo**.',
    'Suba o punho o máximo que der e desça devagar.',
    'Carga bem menor que na rosca de punho comum.',
  ],
  'rosca-punho-halter': [
    'Um braço por vez, antebraço apoiado no banco, palma para cima.',
    'Desça até os dedos e suba fechando o punho.',
  ],
  'farmer-walk': [
    'Halteres ou pegadas pesadas ao lado do corpo.',
    'Ombros para trás, peito aberto, abdômen firme.',
    'Ande com passos curtos e firmes pela distância ou tempo combinado.',
  ],
  'suspensao-barra': [
    'Pendure-se na barra com pegada firme, braços estendidos.',
    'Ombros ativos (levemente para baixo), sem balançar.',
    'Aguente o máximo de tempo. Ótimo para pegada e para os ombros.',
  ],
};
