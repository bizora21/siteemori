// Dicionário PT-PT. Mesmo shape que PT-BR (ver Dictionary em ./pt-br).
// Vocabulário PT: "utilizador", "telemóvel", "gratuito".

import type { Dictionary } from './pt-br';

const ptPT: Dictionary = {
  meta: {
    siteName: 'Emori',
    tagline: 'O teu diário emocional com IA que se lembra de ti',
  },

  nav: {
    home: 'Início',
    produto: 'Produto',
    pro: 'Emori Pro',
    blog: 'Blog',
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
    betaNote: 'A Emori está em teste fechado no Android. Entra na fila e avisamos assim que a tua vaga abrir.',
  },

  waitlist: {
    badge: 'Teste fechado',
    buttonLabel: 'Entrar na fila de espera',
    dialogTitle: 'Entra na fila de espera da Emori',
    dialogIntro:
      'A Emori está em teste fechado no Android. Deixa o teu e-mail e avisamos assim que abrir uma vaga para ti.',
    emailLabel: 'O teu melhor e-mail',
    emailPlaceholder: 'tu@exemplo.com',
    submit: 'Quero ser avisado',
    submitting: 'A enviar…',
    successTitle: 'Pronto! Estás na fila.',
    successBody:
      'Assim que abrirmos a tua vaga no teste, recebes o convite por e-mail. Obrigada pela paciência.',
    errorTitle: 'Não resultou agora',
    errorBody: 'Tenta novamente dentro de momentos ou escreve para',
    close: 'Fechar',
    privacyNote: 'Usamos o teu e-mail apenas para o convite do teste. Sem spam.',
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
    metaTitle: 'Emori — diário emocional com IA que se lembra de ti',
    metaDescription:
      'A Emori é uma aplicação de diário emocional com inteligência artificial. Escreve ou fala sobre o teu dia, e a Emori lembra-se do que importa para te ajudar a compreender o que sentes. Gratuito para começar.',
    h1: 'Um diário emocional que realmente se lembra de ti',
    tldr:
      'A Emori é uma aplicação de diário com inteligência artificial que conversa contigo por texto ou voz, guarda o contexto do que viveste e ajuda-te a compreender as tuas emoções ao longo do tempo. É gratuito para começar e funciona no teu telemóvel Android.',
    primaryCtaNote: 'Sem cartão. Começa a escrever em menos de um minuto.',
    valueTitle: 'Porque é que a Emori é diferente',
    values: [
      {
        title: 'Ela lembra-se do teu contexto',
        body:
          'Ao contrário de uma aplicação de notas, a Emori guarda memória do que já lhe contaste. Quando voltas, ela sabe quem são as pessoas, o que te preocupa e o que mudou desde a última vez.',
      },
      {
        title: 'Escreve ou fala',
        body:
          'Nem sempre dá para escrever. Regista por voz quando estiveres no autocarro, deitado ou sem vontade de escrever — a Emori transcreve e compreende da mesma forma.',
      },
      {
        title: 'Conversa, não formulário',
        body:
          'A Emori faz perguntas gentis que te ajudam a chegar ao que estás realmente a sentir, em vez de te deixar uma página em branco a olhar para ti.',
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
        body: 'Escreve ou grava um áudio a contar como foi o teu dia — do jeito que sair.',
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
    faq: [
      {
        q: 'O que é a Emori?',
        a: 'A Emori é uma aplicação de diário emocional com inteligência artificial. Escreves ou falas sobre o teu dia e ela conversa contigo, lembrando-se do contexto para te ajudar a compreender o que sentes ao longo do tempo.',
      },
      {
        q: 'A Emori é gratuita?',
        a: 'Sim. A Emori é gratuita para começar e usar todos os dias. Existe um plano opcional, a Emori Pro, com memória alargada e funcionalidades avançadas para quem quer ir mais fundo.',
      },
      {
        q: 'Preciso de saber escrever bem para usar?',
        a: 'Não. Podes falar por áudio ou escrever de qualquer forma. A Emori faz perguntas simples para te ajudar quando não sabes por onde começar.',
      },
      {
        q: 'Em que aparelhos é que a Emori funciona?',
        a: 'A Emori está disponível para telemóveis Android na Google Play. A versão para iPhone está em desenvolvimento.',
      },
      {
        q: 'A Emori substitui terapia?',
        a: 'Não. A Emori é uma ferramenta de autoconhecimento e escrita emocional, não um serviço de saúde. Pode ser um bom complemento, mas não substitui acompanhamento psicológico profissional.',
      },
    ],
  },

  produto: {
    metaTitle: 'Como a Emori funciona — diário emocional com IA e memória',
    metaDescription:
      'Percebe como a Emori funciona: diário por texto ou voz, memória que guarda o teu contexto e uma IA que conversa contigo para te ajudar a compreender as tuas emoções.',
    h1: 'O que é a Emori e como funciona',
    tldr:
      'A Emori é um diário emocional com IA onde escreves ou falas sobre o teu dia. O diferencial é a memória: ela guarda o contexto do que contas e usa isso para conversar contigo de forma cada vez mais pessoal, ajudando a reconhecer padrões emocionais.',
    sections: [
      {
        h2: 'Um diário que conversa contigo',
        body:
          'A maioria dos diários é uma página em branco. A Emori é diferente: ela responde. Depois de escreveres ou gravares um áudio, a Emori reflete contigo e faz uma pergunta gentil que ajuda a chegar ao que estás realmente a sentir. Não é um formulário nem um teste — é uma conversa ao teu ritmo.',
      },
      {
        h2: 'A memória: o que torna a Emori única',
        body:
          'A Emori lembra-se. Ela guarda o contexto do que é importante para ti — as pessoas da tua vida, o que te preocupa, o que te faz bem — e traz isso de volta quando faz sentido. Não precisas de te explicar do zero de cada vez. Com o tempo, essa memória torna-se um retrato honesto da tua vida emocional.',
      },
      {
        h2: 'Escreve ou fala, à tua maneira',
        body:
          'Podes escrever quando tens calma para isso, ou gravar um áudio quando escrever parece demais. A Emori transcreve a tua voz e compreende da mesma forma. Muita gente desabafa melhor a falar — e a Emori foi feita para isso.',
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
    ],
    featuresTitle: 'Principais funcionalidades',
    features: [
      'Diário por texto e por voz',
      'Memória que guarda o teu contexto',
      'IA que conversa e faz perguntas',
      'Reconhecimento de padrões emocionais',
      'Espaço privado e íntimo',
      'Gratuito para começar',
    ],
    faq: [
      {
        q: 'A Emori lembra-se mesmo do que escrevi antes?',
        a: 'Sim. A memória é a funcionalidade central da Emori. Ela guarda o contexto do que importa e usa isso para conversar contigo de forma mais pessoal a cada dia.',
      },
      {
        q: 'Posso usar só por voz?',
        a: 'Podes. Gravas um áudio e a Emori transcreve e compreende. É ideal para quando não queres ou não podes escrever.',
      },
      {
        q: 'A Emori dá conselhos?',
        a: 'A Emori reflete contigo e faz perguntas para te ajudar a compreenderes-te. Não é uma terapeuta nem dá diagnósticos — o foco é o autoconhecimento.',
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
      'A Emori Pro alarga a memória, liberta funcionalidades avançadas de reflexão e voz, e apoia o desenvolvimento da Emori. Continua a usar o essencial gratuitamente ou vai mais fundo com o Pro.',
    h1: 'Emori Pro: para ir mais fundo',
    tldr:
      'A Emori Pro é o plano opcional para quem quer mais: memória alargada, reflexões mais profundas e funcionalidades avançadas de voz. O essencial da Emori continua gratuito — o Pro é para quem quer aprofundar a prática e apoiar o projeto.',
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
        title: 'Voz sem limites',
        body:
          'Regista por áudio o quanto quiseres, com transcrição fluida para os dias em que escrever não é uma opção.',
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
          'Recolhemos: (a) o conteúdo que crias — textos e áudios do teu diário; (b) dados de conta, como identificador e e-mail, quando aplicável; (c) dados técnicos mínimos de funcionamento e diagnóstico, como tipo de dispositivo e versão da aplicação. Não recolhemos mais do que o necessário para a Emori funcionar.',
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
  },
};

export default ptPT;
