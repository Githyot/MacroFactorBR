// Execução correta: peito, costas, trapézio e ombros.
// Cada linha vira um item da lista; **texto** aparece em negrito.

export const UPPER: Record<string, string[]> = {
  // Peito
  'supino-reto-barra': [
    'Deite com os olhos na linha da barra, **escápulas juntas e para baixo** e pés firmes no chão.',
    'Pegada um pouco mais aberta que os ombros, punhos retos em cima dos antebraços.',
    'Desça controlado até **tocar a parte baixa do peito**, cotovelos a uns 45–60° do tronco (nem colados, nem abertos em T).',
    'Empurre para cima e levemente para trás, sem tirar o bumbum do banco.',
    'Erro comum: quicar a barra no peito ou soltar as escápulas no fim da repetição.',
  ],
  'supino-reto-halter': [
    'Sente com os halteres nas coxas e deite levando-os junto ao peito; **escápulas juntas** no banco.',
    'Halteres na linha do meio do peito, antebraços na vertical.',
    'Desça até sentir o **peito bem alongado** (halteres na altura do peito ou um pouco abaixo).',
    'Suba aproximando os halteres em arco, sem bater um no outro em cima.',
  ],
  'supino-inclinado-barra': [
    'Banco a **30–45°**; mais que isso vira exercício de ombro.',
    'Escápulas juntas, peito aberto, pés firmes.',
    'Desça a barra até a **parte alta do peito**, logo abaixo da clavícula.',
    'Cotovelos levemente para dentro (45–60°); empurre até quase estender.',
  ],
  'supino-inclinado-halter': [
    'Banco a **30–45°**, escápulas juntas e para baixo.',
    'Desça os halteres ao lado da parte alta do peito até sentir **bom alongamento**.',
    'Suba em arco, antebraços sempre na vertical.',
    'Erro comum: banco muito inclinado, que tira o trabalho do peito e passa para o ombro.',
  ],
  'supino-declinado': [
    'Prenda bem as pernas no apoio antes de pegar a barra; peça ajuda para tirar do suporte.',
    'Desça a barra até a **parte baixa do peito**.',
    'Cotovelos a 45–60°, sem abrir em T.',
    'Suba controlado; não deixe a barra ir em direção ao rosto.',
  ],
  'supino-maquina': [
    'Ajuste o banco para as **pegadas ficarem na linha do meio do peito**.',
    'Costas e escápulas coladas no encosto, peito aberto.',
    'Empurre sem travar os cotovelos e volte devagar até sentir o peito alongado.',
    'Máquina guiada: dá para ir perto da falha com segurança.',
  ],
  'supino-smith': [
    'Posicione o banco para a barra descer na **parte baixa/meio do peito**.',
    'Destrave girando a barra; escápulas juntas.',
    'Desça controlado até tocar o peito, cotovelos a 45–60°.',
    'Trave a barra nos ganchos ao terminar, nunca solte no meio do trilho.',
  ],
  'crucifixo-halter': [
    'Deitado, halteres em cima do peito com **palmas viradas uma para a outra**.',
    'Cotovelos levemente flexionados e **fixos** durante todo o movimento.',
    'Abra os braços em arco até sentir o peito bem alongado (halteres na altura do peito).',
    'Feche como se abraçasse uma árvore; carga moderada, aqui o que conta é o alongamento.',
  ],
  'crucifixo-maquina': [
    'Ajuste o banco para as **pegadas ficarem na altura do peito** e os braços paralelos ao chão.',
    'Costas coladas no encosto, peito aberto.',
    'Feche os braços em arco e **aperte 1 s** no meio.',
    'Volte devagar até sentir o peito alongado, sem deixar o peso bater.',
  ],
  crossover: [
    'Polias no alto, dê um passo à frente e incline levemente o tronco.',
    'Cotovelos levemente flexionados e fixos.',
    'Traga as mãos para baixo e à frente, **cruzando um pouco** na altura do umbigo.',
    'Volte devagar até sentir o peito alongado, sem deixar os ombros irem para frente.',
  ],
  flexao: [
    'Mãos um pouco mais abertas que os ombros, corpo em **linha reta** da cabeça aos pés.',
    'Contraia abdômen e glúteos para o quadril não cair.',
    'Desça até o peito quase tocar o chão, cotovelos a 45° do tronco.',
    'Empurre o chão até estender. Fácil demais? Eleve os pés ou use colete.',
  ],
  'paralelas-peito': [
    'Incline o tronco **para frente** (uns 30°) e afaste um pouco os cotovelos: isso foca o peito.',
    'Desça até os ombros ficarem um pouco abaixo dos cotovelos, sem dor no ombro.',
    'Suba empurrando as barras sem travar.',
    'Ombros longe das orelhas durante todo o movimento.',
  ],
  'supino-articulado': [
    'Ajuste o banco para as pegadas ficarem na **linha do meio do peito**.',
    'Escápulas juntas e coladas no encosto.',
    'Empurre sem travar e volte até o peito alongar bem.',
    'Pode fazer um braço de cada vez para corrigir diferença entre os lados.',
  ],
  'supino-inclinado-articulado': [
    'Banco com as pegadas na altura da **parte alta do peito**.',
    'Escápulas juntas, peito aberto.',
    'Empurre para cima e à frente; volte devagar até alongar.',
  ],
  'supino-declinado-articulado': [
    'Pegadas na linha da **parte baixa do peito**.',
    'Escápulas juntas, quadril no banco.',
    'Empurre sem travar os cotovelos e volte controlado.',
  ],
  'supino-inclinado-maquina': [
    'Ajuste o assento para as pegadas ficarem na **parte alta do peito**.',
    'Costas coladas no encosto.',
    'Empurre sem travar e desça devagar até sentir o peito alongado.',
  ],
  'supino-inclinado-smith': [
    'Banco a **30–45°**, posicionado para a barra descer na parte alta do peito.',
    'Escápulas juntas, pés firmes.',
    'Desça até tocar o peito e suba sem travar.',
  ],
  'supino-declinado-halter': [
    'Prenda as pernas no apoio; deite com os halteres junto ao peito.',
    'Desça até a **parte baixa do peito**, antebraços na vertical.',
    'Suba em arco sem bater os halteres.',
  ],
  'supino-pegada-neutra-halter': [
    '**Palmas viradas uma para a outra** e cotovelos perto do tronco.',
    'Escápulas juntas; desça até os halteres encostarem na lateral do peito.',
    'Suba reto. Variação mais amigável para quem sente o ombro no supino comum.',
  ],
  'supino-sentado-maquina': [
    'Ajuste o assento para as pegadas ficarem no **meio do peito**.',
    'Costas no encosto, escápulas juntas.',
    'Empurre sem travar e volte devagar até alongar.',
  ],
  'crucifixo-inclinado-halter': [
    'Banco a **30°**, halteres em cima do peito com palmas viradas uma para a outra.',
    'Cotovelos levemente dobrados e fixos.',
    'Abra em arco até sentir a parte alta do peito alongada; feche apertando.',
  ],
  'crucifixo-declinado-halter': [
    'Banco levemente declinado, pernas presas.',
    'Cotovelos levemente dobrados e fixos.',
    'Abra até alongar a parte baixa do peito e feche em arco.',
  ],
  'crossover-alto': [
    'Polias no alto, passo à frente, tronco levemente inclinado.',
    'Traga as mãos **de cima para baixo**, até a linha do quadril.',
    'Aperte 1 s embaixo e volte devagar. Foca a parte baixa do peito.',
  ],
  'crossover-baixo': [
    'Polias embaixo, passo à frente.',
    'Traga as mãos **de baixo para cima**, até a altura do queixo.',
    'Cotovelos levemente dobrados e fixos. Foca a parte alta do peito.',
  ],
  'crossover-medio': [
    'Polias na **altura do peito**, um passo à frente.',
    'Feche os braços na linha do peito, cruzando um pouco as mãos.',
    'Volte devagar até sentir o peito alongado.',
  ],
  'crucifixo-polia-banco': [
    'Banco reto entre as polias baixas.',
    'Mesmo movimento do crucifixo com halteres, mas a polia mantém **tensão também em cima**.',
    'Cotovelos levemente dobrados, abra até alongar e feche apertando.',
  ],
  'supino-polia-unilateral': [
    'De costas para a polia na altura do peito, base de passada.',
    'Empurre a pegada à frente até estender, sem girar o tronco.',
    'Volte devagar. Faça o mesmo número de repetições nos dois lados.',
  ],
  'pullover-halter': [
    'Deitado no banco, segure um halter com as duas mãos acima do peito.',
    'Cotovelos levemente dobrados e **fixos**.',
    'Leve o halter para trás da cabeça até sentir alongar peito e dorsal; volte até a linha dos olhos.',
    'Não arqueie a lombar para descer mais.',
  ],
  'flexao-inclinada': [
    'Mãos no banco ou na barra do Smith; quanto mais alto, mais fácil.',
    'Corpo em linha reta, abdômen firme.',
    'Desça até o peito encostar no apoio e empurre.',
  ],
  'flexao-declinada': [
    'Pés no banco, mãos no chão um pouco mais abertas que os ombros.',
    'Corpo reto, sem deixar o quadril cair.',
    'Desça até o peito quase tocar o chão. Trabalha mais a parte alta do peito.',
  ],
  'flexao-diamante': [
    'Mãos juntas embaixo do peito formando um losango com indicadores e polegares.',
    'Cotovelos **perto do corpo**.',
    'Desça até o peito tocar as mãos. Foca tríceps.',
  ],
  'paralelas-maquina': [
    'Escolha um contrapeso que deixe fazer a faixa de repetições com boa técnica.',
    'Tronco levemente inclinado à frente para focar o peito.',
    'Desça até os ombros ficarem na linha dos cotovelos e suba sem travar.',
  ],
  'supino-elastico': [
    'Prenda o elástico atrás das costas ou num ponto fixo atrás de você.',
    'Empurre à frente até estender, cotovelos a 45°.',
    'Segure 1 s na frente, onde o elástico é mais pesado, e volte devagar.',
  ],
  'flexao-trx': [
    'Fitas na altura do peito; quanto mais deitado, mais difícil.',
    'Corpo reto, abdômen firme.',
    'Desça abrindo os braços até alongar o peito; não deixe as fitas encostarem nos braços.',
  ],
  // Costas
  'barra-fixa': [
    'Pegada pronada um pouco mais aberta que os ombros, braços estendidos.',
    'Comece **puxando as escápulas para baixo**, depois os cotovelos em direção às costelas.',
    'Suba até o queixo passar a barra, sem balançar.',
    'Desça até estender os braços por completo.',
  ],
  'barra-fixa-supinada': [
    'Palmas viradas para você, mãos na largura dos ombros.',
    'Puxe os cotovelos para baixo e para trás até o queixo passar a barra.',
    'Desça controlado até estender. Trabalha mais bíceps que a pronada.',
  ],
  'puxada-frente': [
    'Ajuste o apoio das coxas para **travar bem as pernas**.',
    'Pegada um pouco mais aberta que os ombros; tronco levemente inclinado para trás.',
    'Puxe a barra até a **parte alta do peito**, levando os cotovelos para baixo e para trás.',
    'Volte devagar até os braços estenderem e a dorsal alongar.',
    'Erro comum: jogar o tronco para trás para roubar.',
  ],
  'puxada-triangulo': [
    'Triângulo na barra, pernas travadas no apoio.',
    'Puxe até o triângulo chegar perto do peito, **cotovelos rentes ao corpo**.',
    'Volte até estender os braços por completo.',
  ],
  'remada-curvada': [
    'Joelhos levemente dobrados, **quadril para trás** e tronco inclinado uns 45°.',
    'Coluna neutra e abdômen firme durante toda a série.',
    'Puxe a barra até o umbigo, levando os cotovelos para trás.',
    'Desça até estender os braços sem arredondar as costas.',
  ],
  'remada-unilateral': [
    'Joelho e mão do mesmo lado no banco; costas retas, paralelas ao chão.',
    'Puxe o halter em direção ao **quadril**, não ao ombro.',
    'Desça até o braço estender e a dorsal alongar.',
    'Não gire o tronco para subir mais.',
  ],
  'remada-baixa': [
    'Pés no apoio, joelhos levemente dobrados, tronco reto.',
    'Puxe o triângulo até o **umbigo**, juntando as escápulas.',
    'Volte deixando os braços estenderem e as escápulas se afastarem, sem curvar a lombar.',
  ],
  'remada-cavalinho': [
    'Pés dos lados da barra, joelhos levemente dobrados, tronco inclinado e coluna neutra.',
    'Puxe a pegada até o peito/abdômen, cotovelos para trás.',
    'Desça até estender os braços mantendo a lombar firme.',
  ],
  'remada-maquina': [
    'Ajuste o assento para as pegadas ficarem na **linha do peito**.',
    'Peito encostado no apoio.',
    'Puxe levando os cotovelos para trás, aperte 1 s e volte até alongar.',
  ],
  pulldown: [
    'Polia alta, barra ou corda, um passo para trás e tronco levemente inclinado.',
    'Braços **quase estendidos e fixos**.',
    'Leve a barra em arco até as coxas usando a dorsal.',
    'Volte até os braços ficarem acima da cabeça.',
  ],
  'levantamento-terra': [
    'Barra sobre o meio do pé, pegada logo fora das pernas.',
    'Quadril entre joelhos e ombros, **coluna neutra**, peito aberto.',
    'Empurre o chão com as pernas mantendo a barra **raspando nas canelas e coxas**.',
    'Termine em pé com glúteo contraído, sem jogar o tronco para trás.',
    'Abaixe o quadril para trás primeiro e depois dobre os joelhos. Pare a série se a lombar arredondar.',
  ],
  hiperextensao: [
    'Ajuste o apoio na altura do **quadril**, logo abaixo da cintura.',
    'Desça com a coluna neutra dobrando no quadril.',
    'Suba até o corpo ficar em linha reta, **sem hiperestender** a lombar.',
  ],
  'puxada-articulada': [
    'Ajuste o assento para as pegadas ficarem logo acima da cabeça.',
    'Puxe os cotovelos para baixo e para trás até a altura do peito.',
    'Volte até alongar bem a dorsal.',
  ],
  'puxada-articulada-unilateral': [
    'Um braço de cada vez, o outro apoiado.',
    'Puxe o cotovelo em direção ao **quadril**, sem girar o tronco.',
    'Volte até alongar. Bom para corrigir diferença entre os lados.',
  ],
  'puxada-pegada-aberta': [
    'Pegada bem aberta, pernas travadas.',
    'Puxe até a parte alta do peito, cotovelos para baixo.',
    'Volte devagar até estender. Foca a parte alta das costas e a largura.',
  ],
  'puxada-supinada': [
    'Palmas viradas para você, mãos na largura dos ombros.',
    'Puxe até o peito, cotovelos rentes ao corpo.',
    'Volte até estender. Trabalha bastante a dorsal e o bíceps.',
  ],
  'puxada-neutra': [
    'Barra romana (palmas viradas uma para a outra), pernas travadas.',
    'Puxe até o peito, cotovelos para baixo e para trás.',
    'Volte até estender por completo.',
  ],
  'puxada-unilateral-polia': [
    'Ajoelhado ou sentado, uma alça na polia alta.',
    'Puxe o cotovelo em direção ao **quadril**.',
    'Volte até o braço estender por cima da cabeça e a dorsal alongar.',
  ],
  'puxada-nuca': [
    'Só faça se tiver boa mobilidade de ombro e **sem dor**.',
    'Puxe a barra até a nuca, sem empurrar a cabeça para frente.',
    'Carga moderada; a puxada pela frente rende o mesmo com menos risco.',
  ],
  'barra-fixa-neutra': [
    'Palmas viradas uma para a outra nas alças paralelas.',
    'Puxe até o queixo passar as alças, cotovelos junto ao corpo.',
    'Desça até estender.',
  ],
  'barra-fixa-assistida': [
    'Escolha o contrapeso que permita fazer a faixa de repetições.',
    'Mesmo movimento da barra fixa: escápulas para baixo, depois os cotovelos.',
    'Diminua o contrapeso aos poucos conforme ficar mais forte.',
  ],
  'barra-fixa-lastro': [
    'Use cinto com anilha ou halter entre os pés.',
    'Suba até o queixo passar a barra, sem balanço.',
    'Desça até estender. Só adicione lastro quando fizer 10+ repetições limpas sem ele.',
  ],
  'remada-articulada': [
    'Peito no apoio, pegadas na linha do peito.',
    'Puxe os cotovelos para trás, aperte as escápulas 1 s.',
    'Volte até alongar.',
  ],
  'remada-articulada-unilateral': [
    'Um braço por vez, peito apoiado.',
    'Puxe em direção ao quadril sem girar o tronco.',
    'Volte até alongar.',
  ],
  'remada-baixa-aberta': [
    'Barra reta com pegada aberta, tronco reto.',
    'Puxe até a parte baixa do peito com **cotovelos abertos**: foca a parte alta das costas e o deltoide posterior.',
    'Volte até estender.',
  ],
  'remada-baixa-unilateral': [
    'Uma alça na polia baixa, tronco reto.',
    'Puxe até o quadril, cotovelo junto ao corpo.',
    'Deixe o ombro ir à frente na volta para alongar mais.',
  ],
  'remada-curvada-supinada': [
    'Pegada com palmas para cima, tronco a uns 45°.',
    'Puxe a barra até o umbigo, cotovelos rentes ao corpo.',
    'Coluna neutra o tempo todo.',
  ],
  'remada-pendlay': [
    'Tronco **paralelo ao chão**, barra no chão no início de cada repetição.',
    'Puxe explosivo até o peito/abdômen.',
    'Devolva a barra ao chão e reorganize a postura antes da próxima.',
  ],
  'remada-smith': [
    'Mesmo movimento da remada curvada, com a barra guiada.',
    'Quadril para trás, coluna neutra.',
    'Puxe até o umbigo e desça até estender.',
  ],
  'remada-halter-banco': [
    'Deite de bruços no banco inclinado (30–45°), um halter em cada mão.',
    'Puxe os cotovelos para trás e aperte as escápulas.',
    'Desça até estender. O apoio tira a lombar da jogada.',
  ],
  'remada-cavalinho-maquina': [
    'Peito colado no apoio, pernas firmes.',
    'Puxe a pegada até o peito, cotovelos para trás.',
    'Volte até alongar sem tirar o peito do apoio.',
  ],
  'remada-landmine': [
    'De lado para a barra presa no canto, mão do lado de fora na ponta da barra.',
    'Quadril para trás, tronco inclinado, coluna neutra.',
    'Puxe até o quadril e desça até alongar bem.',
  ],
  'remada-invertida': [
    'Deite embaixo de uma barra baixa (Smith ou suporte), corpo em linha reta.',
    'Puxe até o peito encostar na barra.',
    'Desça até estender. Pés mais à frente deixam mais difícil.',
  ],
  'remada-trx': [
    'Segure as fitas e incline o corpo para trás, corpo em linha reta.',
    'Puxe até as mãos ficarem ao lado do peito.',
    'Volte devagar. Quanto mais deitado, mais difícil.',
  ],
  'remada-elastico': [
    'Elástico preso na frente, na altura do peito.',
    'Puxe até o peito, juntando as escápulas.',
    'Segure 1 s atrás e volte devagar.',
  ],
  'pulldown-corda': [
    'Corda na polia alta, tronco levemente inclinado.',
    'Braços quase estendidos, leve a corda até as coxas abrindo um pouco as pontas no fim.',
    'Volte até os braços subirem e a dorsal alongar.',
  ],
  'pullover-maquina': [
    'Ajuste o assento para o ombro ficar alinhado com o eixo da máquina.',
    'Leve os braços em arco de cima para baixo usando a dorsal.',
    'Volte até sentir bom alongamento.',
  ],
  'levantamento-terra-sumo': [
    'Pés bem afastados e pontas para fora, mãos por dentro das pernas.',
    'Joelhos apontando na direção dos pés, peito aberto, coluna neutra.',
    'Empurre o chão afastando os joelhos e suba com a barra perto do corpo.',
  ],
  'levantamento-terra-trap': [
    'Fique no centro da barra hexagonal, pegadas altas ou baixas.',
    'Quadril para baixo e para trás, coluna neutra.',
    'Empurre o chão até ficar em pé; mais fácil para a lombar que o terra comum.',
  ],
  'rack-pull': [
    'Barra no suporte na altura dos joelhos ou logo abaixo.',
    'Mesma postura do terra: coluna neutra, barra perto do corpo.',
    'Suba até ficar em pé contraindo glúteo; desça controlado até o pino.',
  ],
  'good-morning': [
    'Barra nas costas como no agachamento, joelhos levemente dobrados.',
    'Leve o **quadril para trás** inclinando o tronco com a coluna neutra.',
    'Desça até sentir o posterior alongado e volte apertando o glúteo. Carga leve.',
  ],
  'banco-lombar-anilha': [
    'Segure a anilha junto ao peito.',
    'Desça dobrando no quadril e suba até o corpo ficar reto, sem hiperestender.',
    'Aumente a anilha só com a técnica firme.',
  ],
  'lombar-maquina': [
    'Ajuste o encosto na altura das costas e trave as pernas.',
    'Estenda o tronco para trás até ficar reto, sem passar disso.',
    'Volte devagar. Carga moderada.',
  ],
  // Trapézio
  'encolhimento-halter': [
    'Em pé, halteres ao lado do corpo, braços estendidos.',
    'Suba os ombros **em direção às orelhas**, reto para cima.',
    'Segure 1 s em cima e desça até alongar. Não gire os ombros.',
  ],
  'encolhimento-barra': [
    'Barra na frente das coxas, pegada na largura dos ombros.',
    'Suba os ombros reto para cima, segure 1 s.',
    'Desça até alongar o trapézio. Não dobre os cotovelos.',
  ],
  'encolhimento-smith': [
    'Barra guiada atrás ou na frente do corpo.',
    'Suba os ombros reto, segure 1 s e desça até alongar.',
  ],
  'encolhimento-maquina': [
    'Ajuste para as pegadas ficarem ao lado do quadril.',
    'Suba os ombros reto, segure 1 s em cima, desça devagar.',
  ],
  'encolhimento-polia': [
    'Polias baixas ou barra na polia, braços estendidos.',
    'Suba os ombros e segure 1 s; a polia mantém tensão embaixo.',
  ],
  // Ombros
  'desenvolvimento-barra': [
    'Em pé, barra apoiada na frente dos ombros, pegada um pouco mais aberta que os ombros.',
    'Glúteo e abdômen contraídos para não arquear a lombar.',
    'Empurre a barra para cima **tirando a cabeça do caminho** e termine com a barra acima da nuca.',
    'Desça até a altura do queixo/clavícula.',
  ],
  'desenvolvimento-halter': [
    'Sentado com encosto quase reto, halteres na altura das orelhas.',
    'Cotovelos levemente à frente do corpo, não abertos em T.',
    'Empurre até quase estender e desça até os halteres ficarem na altura das orelhas.',
  ],
  'desenvolvimento-maquina': [
    'Ajuste o assento para as pegadas ficarem na **altura dos ombros**.',
    'Costas no encosto, sem arquear.',
    'Empurre sem travar e desça até as mãos chegarem na altura das orelhas.',
  ],
  'elevacao-lateral': [
    'Em pé, halteres ao lado do corpo, tronco levemente inclinado à frente.',
    'Suba os braços **para os lados** até a altura dos ombros, cotovelos levemente dobrados.',
    'Pense em levar os halteres para longe, não para cima. Mão não passa do cotovelo.',
    'Desça devagar. Carga leve e sem balanço.',
  ],
  'elevacao-lateral-polia': [
    'De lado para a polia baixa, cabo passando na frente do corpo.',
    'Suba o braço para o lado até a altura do ombro.',
    'A polia mantém tensão embaixo, onde o halter não trabalha. Volte devagar.',
  ],
  'elevacao-frontal': [
    'Halteres na frente das coxas.',
    'Suba os braços à frente até a altura dos olhos, cotovelos levemente dobrados.',
    'Desça devagar, sem balançar o tronco.',
  ],
  'crucifixo-inverso': [
    'Sentado com o tronco inclinado à frente (ou em pé curvado), halteres embaixo do peito.',
    'Abra os braços para os lados com os cotovelos levemente dobrados.',
    'Suba até os braços ficarem na linha do tronco; foca o **deltoide posterior**.',
  ],
  'face-pull': [
    'Corda na polia na **altura do rosto**.',
    'Puxe em direção à testa abrindo as pontas da corda e levando os cotovelos para trás e para cima.',
    'Termine com as mãos ao lado das orelhas (como mostrando o bíceps). Segure 1 s.',
  ],
  'remada-alta': [
    'Barra na frente das coxas, pegada na largura dos ombros ou mais aberta.',
    'Suba a barra junto ao corpo até a **altura do peito**, cotovelos acima das mãos.',
    'Não passe muito disso se sentir o ombro. Desça devagar.',
  ],
  'desenvolvimento-articulado': [
    'Ajuste o assento para as pegadas ficarem na altura dos ombros.',
    'Empurre para cima sem travar e desça até as orelhas.',
    'Pode alternar os braços.',
  ],
  'desenvolvimento-smith': [
    'Banco quase reto embaixo da barra, que desce na frente do rosto.',
    'Empurre até quase estender e desça até a altura do queixo.',
  ],
  'desenvolvimento-arnold': [
    'Comece com os halteres na frente do rosto, **palmas para você**.',
    'Ao subir, gire as palmas para frente e abra os cotovelos.',
    'Desça girando de volta. Movimento contínuo e controlado.',
  ],
  'desenvolvimento-sentado-barra': [
    'Sentado com encosto, barra na frente.',
    'Desça a barra até a altura do queixo e empurre até quase estender.',
    'Lombar colada no encosto.',
  ],
  'desenvolvimento-nuca': [
    'Só faça com **boa mobilidade de ombro e sem dor**.',
    'Desça a barra só até a altura das orelhas atrás da cabeça.',
    'Carga moderada; o desenvolvimento pela frente rende o mesmo com menos risco.',
  ],
  'desenvolvimento-landmine': [
    'Ponta da barra presa no canto, segure a outra ponta na altura do ombro.',
    'Empurre para cima e à frente, sem arquear a lombar.',
    'Ótimo para quem sente o ombro no desenvolvimento comum.',
  ],
  'desenvolvimento-kettlebell': [
    'Kettlebell apoiado no antebraço, na altura do ombro.',
    'Empurre para cima girando levemente a palma para frente.',
    'Glúteo e abdômen firmes, sem arquear.',
  ],
  'elevacao-lateral-maquina': [
    'Ajuste o assento para o ombro ficar **alinhado com o eixo** da máquina.',
    'Empurre os apoios para os lados até a altura dos ombros.',
    'Segure 1 s em cima e desça devagar.',
  ],
  'elevacao-lateral-sentado': [
    'Sentado na ponta do banco, halteres ao lado do corpo.',
    'Suba os braços para os lados até a altura dos ombros.',
    'Sentado é mais difícil roubar com o corpo.',
  ],
  'elevacao-lateral-inclinado': [
    'Deitado de lado num banco inclinado, braço de cima com o halter.',
    'Suba o braço até a vertical.',
    'Começa difícil embaixo, onde a elevação em pé é fácil. Carga bem leve.',
  ],
  'elevacao-lateral-unilateral-polia': [
    'Polia baixa, cabo passando **por trás** do corpo.',
    'Suba o braço para o lado até a altura do ombro.',
    'Ótimo alongamento embaixo. Volte devagar.',
  ],
  'elevacao-lateral-elastico': [
    'Pise no elástico e segure as pontas.',
    'Suba os braços para os lados até a altura dos ombros.',
    'Segure em cima, onde o elástico fica mais pesado.',
  ],
  'elevacao-frontal-polia': [
    'De costas para a polia baixa, cabo entre as pernas.',
    'Suba o braço à frente até a altura dos olhos.',
    'Volte devagar sem balançar.',
  ],
  'elevacao-frontal-anilha': [
    'Segure a anilha pelas laterais na frente das coxas.',
    'Suba até a altura dos olhos com cotovelos levemente dobrados.',
    'Desça devagar.',
  ],
  'elevacao-frontal-barra': [
    'Barra na frente das coxas, pegada na largura dos ombros.',
    'Suba até a altura dos olhos e desça devagar, sem balançar o tronco.',
  ],
  'crucifixo-inverso-maquina': [
    'Sente **de frente para o encosto** do voador, pegadas na altura dos ombros.',
    'Abra os braços para trás até ficarem na linha do tronco.',
    'Segure 1 s e volte devagar. Foca o deltoide posterior.',
  ],
  'crucifixo-inverso-polia': [
    'Polias na altura dos ombros, cabos cruzados (mão direita no cabo da esquerda).',
    'Abra os braços para trás na linha dos ombros.',
    'Cotovelos levemente dobrados e fixos.',
  ],
  'crucifixo-inverso-banco': [
    'Deitado de bruços num banco inclinado, halteres pendurados.',
    'Abra os braços para os lados até a linha do tronco.',
    'O apoio impede de roubar com o corpo.',
  ],
  'remada-alta-polia': [
    'Barra ou corda na polia baixa.',
    'Suba até a altura do peito, cotovelos acima das mãos.',
    'Desça devagar.',
  ],
  'remada-alta-halter': [
    'Halteres na frente das coxas.',
    'Suba até a altura do peito levando os cotovelos para os lados e para cima.',
    'Mais confortável para o ombro que com barra.',
  ],
  'face-pull-elastico': [
    'Elástico preso na altura do rosto ou segurado pelas pontas na frente do peito.',
    'Puxe abrindo os braços e levando as mãos para os lados do rosto.',
    'Ótimo como aquecimento de ombro.',
  ],
  'rotacao-externa-polia': [
    'Polia na altura do cotovelo, cotovelo colado no corpo e dobrado a 90°.',
    'Gire o antebraço **para fora**, sem afastar o cotovelo do corpo.',
    'Carga bem leve, movimento lento. Bom para a saúde do ombro.',
  ],
  'rotacao-externa-halter': [
    'Deitado de lado, cotovelo apoiado no corpo e dobrado a 90°.',
    'Gire o antebraço para cima sem tirar o cotovelo do lugar.',
    'Carga bem leve e lenta.',
  ],
};
