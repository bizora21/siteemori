// Dicionário PT-PT. Mesmo shape que PT-BR (ver Dictionary em ./pt-br).
// Vocabulário PT: "utilizador", "telemóvel", "gratuito".

import type { Dictionary } from './pt-br';

const ptPT: Dictionary = {
  meta: {
    siteName: 'Emori',
    tagline: 'A Emori: o teu diário emocional com IA que se lembra de ti',
  },

  nav: {
    home: 'Início',
    produto: 'Produto',
    pro: 'Emori Pro',
    blog: 'Blog',
    sobre: 'Sobre',
    privacidade: 'Privacidade',
    termos: 'Termos',
  },

  cta: {
    download: 'Descarregar gratuito na Play Store',
    downloadShort: 'Descarregar gratuito',
    tryEmori: 'Experimentar a Emori',
    openApp: 'Começar agora',
  },

  common: {
    tldrLabel: 'Em resumo',
    faqTitle: 'Perguntas frequentes',
    onThisPage: 'Nesta página',
    readMore: 'Ler mais',
    freeBadge: 'Gratuito para começar',
    androidNote: 'Disponível para Android. iPhone em breve.',
    betaNote: 'A Emori está a chegar ao Android. Entra na lista e avisamos assim que estiver disponível para ti.',
  },

  waitlist: {
    badge: 'Em breve no iPhone',
    buttonLabel: 'Avisa-me no lançamento iOS',
    triggerIos: 'Tens iPhone? Avisamos quando a Emori chegar ao iOS.',
    dialogTitle: 'A Emori está a chegar ao iPhone',
    dialogIntro:
      'A Emori já está disponível para Android. A versão para iPhone está a caminho — deixa o teu e-mail e avisamos assim que sair no iOS.',
    emailLabel: 'O teu melhor e-mail',
    emailPlaceholder: 'tu@exemplo.com',
    submit: 'Quero ser avisado',
    submitting: 'A enviar…',
    successTitle: 'Pronto! Avisamos-te.',
    successBody:
      'Assim que a Emori chegar ao iPhone, recebes o aviso por e-mail. Obrigada!',
    errorTitle: 'Não resultou agora',
    errorBody: 'Tenta novamente dentro de momentos ou escreve para',
    close: 'Fechar',
    privacyNote: 'Usamos o teu e-mail apenas para avisar do lançamento no iOS. Sem spam.',
  },

  footer: {
    description:
      'A Emori é um diário emocional com inteligência artificial que conversa contigo, se lembra do que importa e ajuda-te a compreender o que sentes.',
    product: 'Produto',
    company: 'A Emori',
    legal: 'Legal',
    rights: 'Todos os direitos reservados.',
    madeWith: 'Feito com cuidado para quem sente muito.',
    langLabel: 'Idioma',
  },

  home: {
    // Keyword primeiro, marca no fim — os primeiros caracteres decidem o clique.
    metaTitle: 'Diário emocional com IA que se lembra de ti | Emori',
    metaDescription:
      'Escreve o que sentes e a Emori responde. Lembra-se do teu contexto, ajuda-te a compreender as emoções e mostra os teus padrões ao longo do tempo. Gratuito no Android, privado e sem julgamento.',
    h1: 'A aplicação de diário emocional que realmente se lembra de ti',
    tldr:
      'A Emori é uma aplicação de diário com inteligência artificial que conversa contigo, guarda na memória o contexto do que viveste e ajuda-te a compreender as tuas emoções ao longo do tempo. É gratuito para começar e funciona no teu telemóvel Android.',
    eyebrow: 'Diário emocional com IA',
    cartaLabel: 'A tua carta da Emori',
    cartaBody:
      'Este mês, notei que passaste por altos e baixos — mais calma nos fins de semana, e a ansiedade a crescer nas vésperas de dias exigentes. Reparei em como foste cuidando de ti, mesmo nos dias difíceis.',
    primaryCtaNote: 'Sem cartão. Começa a escrever em menos de um minuto.',
    valueTitle: 'Porque é que a Emori é diferente',
    values: [
      {
        title: 'Ela lembra-se do teu contexto',
        body:
          'Ao contrário de uma aplicação de notas, a Emori guarda memória do que já lhe contaste. Quando voltas, ela sabe quem são as pessoas, o que te preocupa e o que mudou desde a última vez. É o que a torna verdadeiramente tua.',
      },
      {
        title: 'Conversa, não formulário',
        body:
          'A Emori faz perguntas gentis que te ajudam a chegar ao que estás realmente a sentir, em vez de te deixar uma página em branco a olhar para ti.',
      },
      {
        title: 'Mostra os teus padrões',
        body:
          'Ao longo das semanas, a Emori liga o que escreves e ajuda-te a reconhecer o que se repete — o que te tira do eixo e o que te devolve a paz.',
      },
      {
        title: 'Privado por definição',
        body:
          'O teu diário é teu. A Emori foi feita para ser um espaço seguro e íntimo — lê a nossa política de privacidade para perceberes exatamente como cuidamos dos teus dados.',
      },
    ],
    howTitle: 'Como funciona',
    howSteps: [
      {
        title: 'Abre e desabafa',
        body: 'Escreve a contar como foi o teu dia — do jeito que sair, sem te preocupares com a forma.',
      },
      {
        title: 'A Emori responde',
        body: 'Ela reflete contigo, faz uma pergunta e guarda o que importa na memória.',
      },
      {
        title: 'Compreendes-te melhor',
        body: 'Com o tempo, os padrões aparecem e passas a reconhecer o que te afeta.',
      },
    ],
    therapyTitle: 'Uma aliada da tua terapia',
    therapyBody:
      'A Emori não substitui o acompanhamento profissional — potencia-o. Ao registares o que sentes no dia a dia, chegas às sessões com clareza e padrões concretos, em vez de tentares lembrar "como foi a semana". O teu psicólogo passa a trabalhar com o que realmente aconteceu, e o intervalo entre as consultas deixa de ser um vazio.',
    therapyNote: 'Se quiseres, podes partilhar esse retrato com o teu terapeuta.',
    faq: [
      {
        q: 'O que é a Emori?',
        a: 'A Emori é uma aplicação de diário emocional com inteligência artificial. Escreves sobre o teu dia e ela conversa contigo, lembrando-se do contexto para te ajudar a compreender o que sentes ao longo do tempo.',
      },
      {
        q: 'A Emori é gratuita?',
        a: 'Sim. A Emori é gratuita para começar e usar todos os dias. Existe um plano opcional, a Emori Pro, com memória alargada e funcionalidades avançadas para quem quer ir mais fundo.',
      },
      {
        q: 'Preciso de saber escrever bem para usar?',
        a: 'Não. Escreves do jeito que sair — frases soltas, desabafos, o que vier. A Emori faz perguntas simples para te ajudar quando não sabes por onde começar.',
      },
      {
        q: 'Em que aparelhos é que a Emori funciona?',
        a: 'A Emori está disponível para telemóveis Android na Google Play. A versão para iPhone está em desenvolvimento.',
      },
      {
        q: 'A Emori ajuda no acompanhamento com um psicólogo ou terapeuta?',
        a: 'Sim. Muita gente usa a Emori entre as sessões para registar o que sente e chegar à terapia com clareza e padrões concretos para discutir. Não substitui o acompanhamento profissional — complementa, ajudando-te (e, se quiseres, o teu terapeuta) a ver melhor a tua semana.',
      },
      {
        q: 'A Emori substitui terapia?',
        a: 'Não. A Emori é uma ferramenta de autoconhecimento e escrita emocional, não um serviço de saúde. Pode ser um bom complemento, mas não substitui acompanhamento psicológico profissional.',
      },
    ],
  },

  produto: {
    metaTitle: 'Aplicação de diário emocional com IA e memória: como a Emori funciona',
    metaDescription:
      'Percebe como a Emori funciona: diário por texto, memória que guarda o teu contexto e uma IA que conversa contigo e reconhece padrões para te ajudar a compreender as tuas emoções.',
    h1: 'O que é a Emori e como funciona',
    tldr:
      'A Emori é um diário emocional com IA onde escreves sobre o teu dia. O diferencial é a memória: ela guarda o contexto do que contas e usa isso para conversar contigo de forma cada vez mais pessoal, ajudando a reconhecer padrões emocionais.',
    sections: [
      {
        h2: 'Um diário que conversa contigo',
        body:
          'A maioria dos diários é uma página em branco. A Emori é diferente: ela responde. Depois de escreveres, a Emori reflete contigo e faz uma pergunta gentil que ajuda a chegar ao que estás realmente a sentir. Não é um formulário nem um teste — é uma conversa ao teu ritmo.',
      },
      {
        h2: 'A memória: o que torna a Emori única',
        body:
          'A Emori lembra-se. Ela guarda o contexto do que é importante para ti — as pessoas da tua vida, o que te preocupa, o que te faz bem — e traz isso de volta quando faz sentido. Não precisas de te explicar do zero de cada vez. Com o tempo, essa memória torna-se um retrato honesto da tua vida emocional.',
      },
      {
        h2: 'Perguntas gentis que destravam',
        body:
          'Escrever sozinho é difícil precisamente porque és tu a perguntar e a responder. A Emori faz a pergunta certa na hora certa — simples, sem julgamento — para chegares mais fundo do que chegarias a olhar para uma página vazia. Como se lembra do teu contexto, a pergunta seguinte já vem mais afiada.',
      },
      {
        h2: 'Padrões que passas a ver',
        body:
          'Escrever um dia isolado ajuda. Mas o valor real aparece ao longo das semanas: começas a ver o que se repete, o que te tira do eixo e o que te devolve a paz. A Emori ajuda-te a notar esses padrões em vez de os deixares passar.',
      },
      {
        h2: 'Feita para o teu telemóvel',
        body:
          'A Emori foi pensada para o telemóvel, para caber nos momentos reais do teu dia — na fila, antes de dormir, na pausa. É rápida de abrir e não exige nada além de estares presente durante alguns minutos.',
      },
      {
        h2: 'Uma aliada da tua terapia',
        body:
          'A Emori não substitui o acompanhamento profissional — potencia-o. Quem faz terapia perde muitas vezes metade da sessão a tentar lembrar como foi a semana. Ao registares o que sentes no dia a dia, chegas com clareza e padrões concretos para discutir, e o teu psicólogo trabalha com o que realmente aconteceu, não só com a memória do último dia. Se quiseres, podes partilhar esse retrato com o teu terapeuta. O intervalo entre as consultas deixa de ser um vazio.',
      },
    ],
    featuresTitle: 'Principais funcionalidades',
    features: [
      'Memória que guarda o teu contexto',
      'IA que conversa e faz perguntas',
      'Reconhecimento de padrões emocionais',
      'Aliada do acompanhamento terapêutico',
      'Diário por escrito, ao teu ritmo',
      'Espaço privado e íntimo',
      'Gratuito para começar',
    ],
    faq: [
      {
        q: 'A Emori lembra-se mesmo do que escrevi antes?',
        a: 'Sim. A memória é a funcionalidade central da Emori. Ela guarda o contexto do que importa e usa isso para conversar contigo de forma mais pessoal a cada dia.',
      },
      {
        q: 'A Emori reconhece padrões no que eu sinto?',
        a: 'Sim. Ao longo do tempo, liga os teus registos e ajuda-te a notar o que se repete — gatilhos, ciclos e o que te faz bem — em vez de deixar esses padrões passarem despercebidos.',
      },
      {
        q: 'A Emori dá conselhos?',
        a: 'A Emori reflete contigo e faz perguntas para te ajudar a compreenderes-te. Não é uma terapeuta nem dá diagnósticos — o foco é o autoconhecimento.',
      },
      {
        q: 'Dá para usar a Emori a par da terapia?',
        a: 'Sim, e combinam muito bem. A Emori guarda o que viveste entre as sessões, para chegares à terapia com clareza e padrões concretos em vez de dependeres da memória. Complementa o acompanhamento profissional — nunca o substitui — e o retrato que ela te devolve pode ser partilhado com o teu terapeuta, se quiseres.',
      },
      {
        q: 'Quanto tempo por dia preciso de usar?',
        a: 'O que tiveres. Alguns minutos já chegam. A Emori adapta-se ao teu ritmo, sem cobranças nem metas.',
      },
    ],
  },

  pro: {
    metaTitle: 'Emori Pro — memória alargada e funcionalidades avançadas',
    metaDescription:
      'A Emori Pro alarga a memória, aprofunda as reflexões e os padrões, e apoia o desenvolvimento da Emori. Continua a usar o essencial gratuitamente ou vai mais fundo com o Pro.',
    h1: 'Emori Pro: para ir mais fundo',
    tldr:
      'A Emori Pro é o plano opcional para quem quer mais: memória alargada, reflexões mais profundas e uma leitura mais rica dos teus padrões emocionais. O essencial da Emori continua gratuito — o Pro é para quem quer aprofundar a prática e apoiar o projeto.',
    intro:
      'A Emori é gratuita porque acreditamos que toda a gente merece um espaço para se compreender. A Emori Pro existe para quem faz do diário um hábito e quer ir além — e para ajudar a manter a Emori de pé.',
    benefitsTitle: 'O que ganhas com o Pro',
    benefits: [
      {
        title: 'Memória alargada',
        body:
          'A Emori lembra-se de mais coisas, durante mais tempo, com mais profundidade — para conversas cada vez mais tuas.',
      },
      {
        title: 'Reflexões mais profundas',
        body:
          'Perguntas e devolutivas mais elaboradas, que ligam o que viveste ao longo das semanas.',
      },
      {
        title: 'Padrões mais profundos',
        body:
          'Uma leitura mais rica do que se repete nas tuas emoções ao longo do tempo, para veres ciclos e gatilhos com mais clareza.',
      },
      {
        title: 'Apoia a Emori',
        body:
          'Assinar o Pro sustenta o desenvolvimento contínuo e mantém a Emori independente e centrada em ti, não em anúncios.',
      },
    ],
    valueTitle: 'Porque vale a pena',
    valueBody:
      'A terapia é essencial e insubstituível — mas cara e nem sempre acessível todos os dias. Uma aplicação de notas é barata, mas esquece-se de ti. A Emori Pro fica no meio: um espaço diário, que se lembra de ti, por menos do que um café por semana. Não substitui terapia; complementa o cuidado contigo, no intervalo entre as sessões.',
    faq: [
      {
        q: 'Preciso de pagar para usar a Emori?',
        a: 'Não. A Emori é gratuita para começar e usar no dia a dia. A Emori Pro é opcional, para quem quer memória alargada e funcionalidades avançadas.',
      },
      {
        q: 'O que acontece se cancelar o Pro?',
        a: 'Voltas ao plano gratuito e continuas com o essencial da Emori. Os teus registos continuam a ser teus.',
      },
      {
        q: 'A Emori Pro substitui terapia?',
        a: 'Não. A Emori é uma ferramenta de escrita e autoconhecimento, não um serviço de saúde. Complementa, mas não substitui, acompanhamento profissional.',
      },
    ],
  },

  sobre: {
    metaTitle: 'Sobre a Emori — a missão por trás da app de diário emocional',
    metaDescription:
      'A Emori nasceu de uma ideia simples: toda a gente merece um espaço privado para se compreender, que se lembra de ti. Conhece a missão, os valores e o compromisso da Emori com a tua privacidade.',
    h1: 'Sobre a Emori',
    tldr:
      'A Emori é uma app de diário emocional com IA criada para ser um espaço íntimo que se lembra de ti. Existe porque compreender as próprias emoções não devia ser caro, nem solitário, nem começar do zero de cada vez.',
    sections: [
      {
        h2: 'Porque é que a Emori existe',
        body:
          'A maioria das apps de diário trata-te como um estranho: cada dia começa do zero. A terapia, essencial e insubstituível, é cara e nem sempre acessível todos os dias. A Emori nasceu no meio desse vão — um espaço diário, privado, que se lembra do que importa e conversa contigo para te ajudar a compreender o que sentes. Não para substituir o cuidado humano, mas para caminhar ao teu lado nos dias comuns.',
      },
      {
        h2: 'A memória no centro de tudo',
        body:
          'Construímos a Emori em torno de uma decisão: ela lembra-se. Guardar o teu contexto e trazê-lo de volta quando faz sentido é o que transforma notas soltas num retrato honesto da tua vida emocional. É o que nos diferencia de uma app de notas — e o que orienta cada decisão que tomamos.',
      },
      {
        h2: 'A Emori é sempre ela',
        body:
          'A Emori é uma presença, não uma funcionalidade. Referimo-nos a ela sempre no feminino — "a Emori", "ela" — porque queremos que a relação seja calorosa e humana, e não fria e técnica. Ela conhece-te, e isso importa.',
      },
    ],
    valuesTitle: 'No que acreditamos',
    values: [
      {
        title: 'Privacidade primeiro',
        body:
          'O teu diário é teu. Não vendemos os teus dados e tratamos a tua intimidade como o bem mais valioso que nos confias.',
      },
      {
        title: 'Sem julgamento',
        body:
          'Um espaço para dizer o que talvez não dirias a ninguém, ao teu ritmo, sem cobranças nem metas.',
      },
      {
        title: 'Complemento, não substituto',
        body:
          'A Emori é autoconhecimento, não saúde. Caminha ao lado da terapia e do cuidado profissional, nunca no lugar deles.',
      },
      {
        title: 'Acessível a todos',
        body:
          'O essencial da Emori é gratuito, porque compreender-se não devia ser um privilégio.',
      },
    ],
    founderTitle: 'Quem está por trás',
    founderBefore: 'A Emori foi criada por',
    founderAfter:
      ', psicólogo — alguém que conhece de perto o valor, e os limites, do acompanhamento emocional. É por isso que a Emori foi pensada para caminhar ao lado da terapia, nunca no lugar dela.',
    contactTitle: 'Fala com a Emori',
    contactIntro:
      'Tens uma dúvida, sugestão, ou queres falar sobre parcerias e imprensa? Escreve para',
  },

  privacidade: {
    metaTitle: 'Política de Privacidade — Emori',
    metaDescription:
      'Como a Emori recolhe, usa e protege os teus dados. Transparência sobre o teu diário emocional e as tuas informações.',
    h1: 'Política de Privacidade',
    tldr:
      'Esta política explica que dados a Emori recolhe, como são usados e quais são os teus direitos. O teu diário é teu: tratamos as tuas informações com cuidado e nunca vendemos os teus dados pessoais.',
    lastUpdatedLabel: 'Última atualização',
    lastUpdated: '4 de julho de 2026',
    sections: [
      {
        h2: '1. Quem somos',
        body:
          'A Emori é uma aplicação de diário emocional com inteligência artificial, disponível para Android sob o pacote app.emori. Este documento descreve como tratamos os dados dos utilizadores da aplicação e do site aemori.com.',
      },
      {
        h2: '2. Dados que recolhemos',
        body:
          'Recolhemos: (a) o conteúdo que crias — os textos do teu diário; (b) dados de conta, como identificador e e-mail, quando aplicável; (c) dados técnicos mínimos de funcionamento e diagnóstico, como tipo de dispositivo e versão da aplicação. Não recolhemos mais do que o necessário para a Emori funcionar.',
      },
      {
        h2: '3. Como usamos os teus dados',
        body:
          'Usamos os teus dados para: fornecer o serviço de diário; manter a memória que torna a Emori pessoal; melhorar a aplicação; e garantir segurança. O conteúdo do teu diário é processado para gerar as respostas e a memória da Emori. Não usamos o conteúdo do teu diário para publicidade.',
      },
      {
        h2: '4. Inteligência artificial',
        body:
          'A Emori usa modelos de inteligência artificial para conversar contigo e organizar a memória. Parte do processamento pode ocorrer em fornecedores de IA externos, sob contrato e com salvaguardas de confidencialidade. Enviamos apenas o necessário para gerar a resposta.',
      },
      {
        h2: '5. Partilha',
        body:
          'Não vendemos os teus dados pessoais. Partilhamos dados apenas com fornecedores essenciais (por exemplo, infraestrutura e IA), quando exigido por lei, ou com o teu consentimento.',
      },
      {
        h2: '6. Retenção e eliminação',
        body:
          'Guardamos os teus dados enquanto a tua conta existir. Podes pedir a eliminação dos teus dados a qualquer momento pelos canais de contacto indicados na aplicação. Após a eliminação, removemos os teus registos dos nossos sistemas, salvo obrigações legais.',
      },
      {
        h2: '7. Segurança',
        body:
          'Adotamos medidas técnicas e organizativas para proteger os teus dados, incluindo cifragem em trânsito. Nenhum sistema é 100% infalível, mas tratamos a segurança do teu diário como prioridade.',
      },
      {
        h2: '8. Os teus direitos',
        body:
          'Tens o direito de aceder, corrigir, exportar e eliminar os teus dados, além de retirar consentimentos. Para exercer esses direitos, usa os canais de contacto na aplicação. Respeitamos o RGPD (União Europeia) e a LGPD (Brasil).',
      },
      {
        h2: '9. Crianças',
        body:
          'A Emori não se destina a menores de idade sem consentimento dos responsáveis. Não recolhemos intencionalmente dados de crianças.',
      },
      {
        h2: '10. Alterações e contacto',
        body:
          'Podemos atualizar esta política. Alterações relevantes serão comunicadas na aplicação ou no site. Em caso de dúvidas sobre privacidade, contacta-nos pelos canais indicados na aplicação.',
      },
    ],
  },

  termos: {
    metaTitle: 'Termos de Utilização — Emori',
    metaDescription:
      'Os termos de utilização da aplicação e do site da Emori: os teus direitos, as tuas responsabilidades e as regras do serviço.',
    h1: 'Termos de Utilização',
    tldr:
      'Estes termos definem as regras para usar a Emori. Ao usar a aplicação ou o site, concordas com eles. A Emori é uma ferramenta de escrita emocional e autoconhecimento, e não substitui atendimento profissional de saúde.',
    lastUpdatedLabel: 'Última atualização',
    lastUpdated: '4 de julho de 2026',
    sections: [
      {
        h2: '1. Aceitação dos termos',
        body:
          'Ao aceder ou usar a Emori (aplicação app.emori e site aemori.com), concordas com estes Termos de Utilização. Se não concordares, não utilizes o serviço.',
      },
      {
        h2: '2. O que é a Emori',
        body:
          'A Emori é uma aplicação de diário emocional com inteligência artificial. Oferece um espaço para escrever e refletir, com memória e respostas geradas por IA. A Emori não é um serviço médico, psicológico ou de emergência.',
      },
      {
        h2: '3. Uso adequado',
        body:
          'Concordas em usar a Emori de forma legal e pessoal. É proibido usar o serviço para atividades ilícitas, abusar da infraestrutura ou tentar aceder a dados de outros utilizadores.',
      },
      {
        h2: '4. Não substitui atendimento profissional',
        body:
          'A Emori é uma ferramenta de autoconhecimento, não um serviço de saúde. Não diagnostica, trata nem previne doenças. Se estiveres em sofrimento intenso ou em risco, procura um profissional de saúde ou os serviços de emergência do teu país.',
      },
      {
        h2: '5. A tua conta e o teu conteúdo',
        body:
          'O conteúdo que crias na Emori é teu. És responsável por manter a segurança do teu acesso. Concedes à Emori as permissões estritamente necessárias para processar e armazenar o teu conteúdo e prestar o serviço, conforme a Política de Privacidade.',
      },
      {
        h2: '6. Planos e pagamentos',
        body:
          'A Emori oferece um plano gratuito e a subscrição opcional Emori Pro. As subscrições são cobradas pela loja de aplicações e seguem as regras dela, incluindo renovação e cancelamento.',
      },
      {
        h2: '7. Disponibilidade e alterações',
        body:
          'Procuramos manter a Emori sempre disponível, mas o serviço pode ter interrupções ou alterações. Podemos alterar, suspender ou descontinuar funcionalidades, avisando quando for razoável.',
      },
      {
        h2: '8. Limitação de responsabilidade',
        body:
          'A Emori é fornecida "tal como está". Na máxima medida permitida por lei, não nos responsabilizamos por danos indiretos decorrentes do uso do serviço. Nada nestes termos limita direitos que a lei não permite limitar.',
      },
      {
        h2: '9. Alterações aos termos',
        body:
          'Podemos atualizar estes Termos de Utilização. Alterações relevantes serão comunicadas na aplicação ou no site. O uso continuado após as alterações significa concordância.',
      },
      {
        h2: '10. Contacto',
        body:
          'Dúvidas sobre estes termos podem ser enviadas pelos canais de contacto indicados na aplicação.',
      },
    ],
  },

  blog: {
    metaTitle: 'Blog da Emori — diário emocional, journaling e autoconhecimento',
    metaDescription:
      'Guias práticos sobre diário emocional, journaling, ansiedade e autoconhecimento. Aprende a escrever sobre o que sentes com a Emori.',
    h1: 'O blog da Emori',
    tldr:
      'Aqui reunimos guias práticos e honestos sobre diário emocional, journaling e autoconhecimento — para te ajudar a começar, manter o hábito e compreender melhor o que sentes.',
    readingTime: 'min de leitura',
    allPosts: 'Todos os artigos',
    backToBlog: 'Voltar ao blog',
    publishedOn: 'Publicado a',
    by: 'Por',
    author: 'Equipa Emori',
    related: 'Lê também',
    share: 'Partilhar',
    copyLink: 'Copiar link',
    copied: 'Copiado!',
  },

  consent: {
    aria: 'Aviso de cookies',
    text: 'A Emori usa cookies do Google Analytics para perceber como o site é usado. Podes aceitar ou recusar.',
    privacy: 'Política de privacidade',
    accept: 'Aceitar',
    reject: 'Recusar',
  },
};

export default ptPT;
