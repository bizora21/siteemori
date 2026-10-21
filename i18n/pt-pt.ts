// Dicionário PT-PT. Mesmo shape que PT-BR (ver Dictionary em ./pt-br).
// Vocabulário PT: "utilizador", "telemóvel", "gratuito".

import type { Dictionary } from './pt-br';

const ptPT: Dictionary = {
  meta: {
    siteName: 'Emori',
    tagline: 'Emori — a tua companheira de oração e fé cristã',
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
    tryEmori: 'Começa a orar com a Emori',
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
      'A Emori é uma app de oração e comunidade cristã. Regista as tuas orações, recebe versículos e reflexões bíblicas, e ora com outros irmãos na fé.',
    product: 'Produto',
    company: 'A Emori',
    legal: 'Legal',
    rights: 'Todos os direitos reservados.',
    madeWith: 'Feito com fé para quem busca a Deus todos os dias.',
    langLabel: 'Idioma',
  },

  home: {
    metaTitle: 'App de oração cristã e comunidade de fé | Emori',
    metaDescription:
      'Regista as tuas orações, recebe versículos bíblicos e reflexões diárias, e ora com uma comunidade de fé. App cristão gratuito para Android — o teu diário de oração no telemóvel.',
    h1: 'A app que fortalece a tua vida de oração',
    tldr:
      'A Emori é uma app cristã de oração onde registas os teus pedidos, recebes versículos e reflexões bíblicas personalizadas, e participas numa comunidade que ora junta. Gratuita no Android.',
    eyebrow: 'Oração e fé cristã',
    cartaLabel: 'A tua carta mensal de oração',
    cartaBody:
      'Este mês, oraste 18 vezes em 12 dias diferentes. Os teus pedidos de intercessão aumentaram, e a gratidão esteve presente nas semanas mais difíceis. "O Senhor é o meu pastor; nada me faltará." — Salmos 23:1',
    primaryCtaNote: 'Sem cartão. Começa a orar em menos de um minuto.',
    valueTitle: 'Porque orar com a Emori',
    values: [
      {
        title: 'Cada oração recebe uma resposta bíblica',
        body:
          'Quando registas uma oração, a Emori responde com um versículo bíblico, uma palavra de encorajamento e uma reflexão para aprofundar a tua conversa com Deus. Cada tipo de oração — gratidão, pedido, louvor, intercessão, confissão — recebe uma resposta pensada para esse momento.',
      },
      {
        title: 'Comunidade que ora por ti',
        body:
          'Partilha os teus pedidos de oração e ora pelos pedidos de outros irmãos. Quando Deus responder, marca a oração como atendida e encoraja toda a comunidade. Ninguém ora sozinho.',
      },
      {
        title: 'Acompanha a tua jornada de fé',
        body:
          'Resumos semanais mostram quantas vezes oraste, os tipos de oração e como a tua vida de oração está a crescer. A carta mensal é um retrato completo do mês — com versículo e encorajamento.',
      },
      {
        title: 'Privado e seguro',
        body:
          'As tuas orações são tuas. A Emori foi feita para ser um espaço íntimo entre ti e Deus. Lê a nossa política de privacidade para saberes como protegemos os teus dados.',
      },
    ],
    howTitle: 'Como funciona',
    howSteps: [
      {
        title: 'Escreve a tua oração',
        body: 'Escolhe o tipo de oração — gratidão, pedido, louvor, intercessão ou confissão — e escreve o que está no teu coração. Também podes usar a voz.',
      },
      {
        title: 'Recebe a Palavra',
        body: 'A Emori responde com um versículo bíblico, uma reflexão e uma pergunta para aprofundar a tua conversa com Deus.',
      },
      {
        title: 'Ora em comunidade',
        body: 'Partilha pedidos, ora por outros irmãos e celebra quando Deus responder uma oração.',
      },
    ],
    therapyTitle: 'Uma aliada da tua vida espiritual',
    therapyBody:
      'A Emori não substitui a igreja, o pastor ou a comunidade presencial — ela complementa. Nos dias em que não consegues ir ao culto, no momento antes de dormir, na pausa do trabalho, a Emori está ali para te ajudar a manter a conversa com Deus viva.',
    therapyNote: 'Usa a Emori no teu tempo devocional diário como um companheiro de oração.',
    faq: [
      {
        q: 'O que é a Emori?',
        a: 'A Emori é uma app cristã de oração e comunidade de fé. Registas as tuas orações, recebes versículos bíblicos e reflexões, e podes orar com outros irmãos na comunidade.',
      },
      {
        q: 'A Emori é gratuita?',
        a: 'Sim. A Emori é gratuita para usar todos os dias: registo de orações, respostas bíblicas, reflexões guiadas, resumo semanal e comunidade. A Emori Pro é opcional, para quem quer extras como a carta mensal e exportação em PDF.',
      },
      {
        q: 'A Emori é de qual denominação cristã?',
        a: 'A Emori é interdenominacional. Usamos a Bíblia como base e respeitamos todas as tradições cristãs. O foco é a oração e a relação pessoal com Deus.',
      },
      {
        q: 'Em que aparelhos é que a Emori funciona?',
        a: 'A Emori está disponível para telemóveis Android na Google Play. A versão para iPhone está em desenvolvimento.',
      },
      {
        q: 'Posso orar por outras pessoas na Emori?',
        a: 'Sim. Na comunidade de oração, podes partilhar pedidos, orar pelos pedidos de outros e celebrar quando uma oração é atendida. É um espaço de fé e apoio mútuo.',
      },
      {
        q: 'As minhas orações são privadas?',
        a: 'Sim. O teu diário de oração é privado — só tu vês. Na comunidade, escolhes o que partilhar. A Emori foi feita para ser um espaço seguro entre ti e Deus.',
      },
    ],
  },

  produto: {
    metaTitle: 'App de oração cristã: como a Emori funciona — diário, versículos e comunidade',
    metaDescription:
      'Percebe como a Emori funciona: regista orações por tipo, recebe versículos bíblicos e reflexões, acompanha a tua jornada de fé com resumos semanais, e ora com uma comunidade cristã.',
    h1: 'Como a Emori fortalece a tua oração',
    tldr:
      'A Emori é uma app cristã onde registas orações por tipo (gratidão, pedido, louvor, intercessão, confissão), recebes versículos e reflexões bíblicas, acompanhas a evolução da tua vida de oração e participas numa comunidade que ora junta.',
    sections: [
      {
        h2: 'Regista cada oração',
        body:
          'A Emori oferece um espaço para escrever o que está no teu coração. Escolhe o tipo de oração — gratidão, pedido, louvor, intercessão ou confissão — e escreve livremente, ou usa a voz. Cada oração fica guardada no teu diário, formando um registo da tua caminhada com Deus.',
      },
      {
        h2: 'Versículos e reflexões para cada momento',
        body:
          'Depois de registares a tua oração, a Emori responde com um versículo bíblico selecionado para o tipo de oração que fizeste, uma palavra de encorajamento e uma reflexão para aprofundar a conversa com Deus. Não é uma resposta genérica — é uma resposta pensada para aquele momento.',
      },
      {
        h2: 'Reflexão guiada',
        body:
          'Quando quiseres ir mais fundo, a reflexão guiada faz perguntas baseadas na Bíblia para te ajudar a examinar o coração, reconhecer a ação de Deus e fortalecer a fé. É como um momento devocional estruturado, ao teu ritmo.',
      },
      {
        h2: 'Resumo semanal da tua vida de oração',
        body:
          'Toda semana, a Emori prepara um resumo: quantas vezes oraste, os tipos de oração, as categorias mais presentes e uma palavra de encorajamento com versículo. É uma forma de ver como a tua fé está a crescer.',
      },
      {
        h2: 'Comunidade de oração',
        body:
          'Partilha pedidos de oração com a comunidade e ora pelos pedidos de outros irmãos. Filtra por tipo de oração, e quando Deus responder, marca como "oração atendida" para encorajar a todos. Ninguém precisa de orar sozinho.',
      },
      {
        h2: 'No teu telemóvel, no teu tempo',
        body:
          'A Emori foi feita para o telemóvel, para caber nos momentos reais do teu dia — antes de dormir, na pausa, no transporte. É rápida de abrir e não exige nada além da tua disposição de conversar com Deus.',
      },
    ],
    featuresTitle: 'Funcionalidades',
    features: [
      'Diário de oração por categorias',
      'Versículos bíblicos personalizados',
      'Reflexão guiada com perguntas bíblicas',
      'Resumo semanal de oração',
      'Comunidade de oração e intercessão',
      'Oração por voz',
      'Espaço privado e seguro',
      'Gratuito para começar',
    ],
    faq: [
      {
        q: 'A Emori tem versículos bíblicos?',
        a: 'Sim. Cada vez que registas uma oração, a Emori responde com um versículo bíblico selecionado para o tipo de oração e um encorajamento. Os resumos semanais e a carta mensal também trazem versículos.',
      },
      {
        q: 'Que tipos de oração posso registar?',
        a: 'A Emori organiza as orações em cinco categorias: gratidão, pedido, louvor, intercessão e confissão. Também podes orar sem escolher uma categoria.',
      },
      {
        q: 'A comunidade é segura?',
        a: 'Sim. A comunidade é moderada por denúncias. Conteúdo reportado é analisado e removido se necessário. O foco é oração e apoio mútuo.',
      },
      {
        q: 'Posso usar a Emori no meu devocional diário?',
        a: 'Sim, e muita gente faz isso. A Emori combina registo de oração, versículos e reflexão guiada — tudo o que precisas para um momento devocional completo no telemóvel.',
      },
      {
        q: 'A Emori funciona offline?',
        a: 'Podes escrever a oração offline. Quando a internet voltar, ela é enviada automaticamente e a resposta bíblica chega em seguida.',
      },
    ],
  },

  pro: {
    metaTitle: 'Emori Pro — carta mensal, exportação PDF e sem anúncios',
    metaDescription:
      'A Emori Pro remove anúncios, desbloqueia a carta mensal de oração com versículo, exportação em PDF e histórico ilimitado. Continua a usar o essencial gratuitamente ou vai mais fundo com o Pro.',
    h1: 'Emori Pro: para aprofundar a oração',
    tldr:
      'A Emori Pro é o plano opcional para quem quer ir mais fundo: carta mensal personalizada com versículo, exportação em PDF das tuas orações, histórico ilimitado e sem anúncios. O essencial da Emori — oração diária, versículos, reflexão e comunidade — continua gratuito.',
    intro:
      'A Emori é gratuita porque acreditamos que orar não deve ter barreiras. A Emori Pro existe para quem faz da oração um hábito diário e quer ir além — e para ajudar a manter a Emori de pé.',
    benefitsTitle: 'O que ganhas com o Pro',
    benefits: [
      {
        title: 'Carta mensal de oração',
        body:
          'Um retrato completo do teu mês de oração: quantas vezes oraste, os temas mais presentes, um versículo escolhido para o momento e uma palavra de encorajamento personalizada.',
      },
      {
        title: 'Sem anúncios',
        body:
          'Uma experiência limpa e sem interrupções para os teus momentos de oração e reflexão.',
      },
      {
        title: 'Exportação em PDF',
        body:
          'Exporta as tuas orações e cartas mensais em PDF para guardar, imprimir ou partilhar com o teu pastor ou grupo de oração.',
      },
      {
        title: 'Apoia a Emori',
        body:
          'Assinar o Pro sustenta o desenvolvimento contínuo e mantém a Emori independente e centrada na fé, não em anúncios.',
      },
    ],
    valueTitle: 'Porque vale a pena',
    valueBody:
      'A maioria das apps cristãs ou é paga desde o início ou está cheia de anúncios. A Emori é diferente: o essencial é gratuito e será sempre. O Pro é para quem quer uma experiência mais completa e quer apoiar o projeto — por menos do que um café por semana.',
    faq: [
      {
        q: 'Preciso de pagar para usar a Emori?',
        a: 'Não. A Emori é gratuita para orar todos os dias, receber versículos, usar a reflexão guiada, o resumo semanal e a comunidade. O Pro é opcional.',
      },
      {
        q: 'O que acontece se cancelar o Pro?',
        a: 'Voltas ao plano gratuito e continuas com todas as funcionalidades essenciais. As tuas orações continuam a ser tuas.',
      },
      {
        q: 'Como faço para assinar?',
        a: 'A subscrição é feita diretamente na app, pela Google Play. Podes cancelar a qualquer momento.',
      },
    ],
  },

  sobre: {
    metaTitle: 'Sobre a Emori — a missão por trás da app de oração cristã',
    metaDescription:
      'A Emori nasceu da convicção de que toda a gente merece um espaço para conversar com Deus. Conhece a missão, os valores e o compromisso da Emori com a fé e a privacidade.',
    h1: 'Sobre a Emori',
    tldr:
      'A Emori é uma app de oração e comunidade cristã criada para ser um espaço íntimo de conversa com Deus. Existe porque acreditamos que a oração deveria ser acessível, diária e comunitária.',
    sections: [
      {
        h2: 'Porque é que a Emori existe',
        body:
          'Muita gente quer orar mais, mas não sabe por onde começar. Outros oram, mas sentem-se sozinhos. A Emori nasceu para preencher esse espaço — um lugar no telemóvel para registar as tuas orações, receber a Palavra de Deus em resposta e orar junto com uma comunidade de fé. Não para substituir a igreja, mas para estar presente nos momentos em que ela não pode.',
      },
      {
        h2: 'A Palavra no centro',
        body:
          'Cada resposta, cada reflexão, cada resumo na Emori é fundamentado na Bíblia. Não inventamos frases motivacionais — entregamos a Palavra de Deus, com versículos reais e referências que podes conferir. A Bíblia é a base de tudo o que a Emori oferece.',
      },
      {
        h2: 'Comunidade que ora junta',
        body:
          'A Emori não é só um diário pessoal. Na comunidade, partilhas pedidos, oras por outros irmãos e celebras quando Deus responde. Porque a Bíblia nos ensina a levar as cargas uns dos outros.',
      },
    ],
    valuesTitle: 'No que acreditamos',
    values: [
      {
        title: 'Fundamentada na Bíblia',
        body:
          'Todo o conteúdo da Emori tem base bíblica. Versículos reais, referências verificáveis, nada inventado.',
      },
      {
        title: 'Interdenominacional',
        body:
          'A Emori respeita todas as tradições cristãs. O foco é a oração e a relação com Deus, não uma denominação específica.',
      },
      {
        title: 'Privacidade como valor',
        body:
          'As tuas orações são íntimas. Não vendemos os teus dados e tratamos a privacidade como sagrada.',
      },
      {
        title: 'Acessível a todos',
        body:
          'O essencial da Emori é gratuito, porque conversar com Deus não deve ter um preço.',
      },
    ],
    founderTitle: 'Quem está por trás',
    founderBefore: 'A Emori foi criada por',
    founderAfter:
      ' — alguém que conhece de perto a importância do cuidado emocional e espiritual. A Emori nasceu da convicção de que orar deveria ser tão natural quanto respirar, e que ninguém deveria sentir-se sozinho nessa caminhada.',
    contactTitle: 'Fala com a Emori',
    contactIntro:
      'Tens uma dúvida, sugestão, pedido de oração ou queres falar sobre parcerias? Escreve para',
  },

  privacidade: {
    metaTitle: 'Política de Privacidade — Emori',
    metaDescription:
      'Como a Emori recolhe, usa e protege os teus dados. Transparência sobre as tuas orações e informações pessoais.',
    h1: 'Política de Privacidade',
    tldr:
      'Esta política explica que dados a Emori recolhe, como são usados e quais são os teus direitos. As tuas orações são tuas: tratamos as tuas informações com cuidado e nunca vendemos os teus dados pessoais.',
    lastUpdatedLabel: 'Última atualização',
    lastUpdated: '21 de outubro de 2026',
    sections: [
      {
        h2: '1. Quem somos',
        body:
          'A Emori é uma aplicação de oração e comunidade cristã, disponível para Android sob o pacote app.emori. Este documento descreve como tratamos os dados dos utilizadores da aplicação e do site aemori.com.',
      },
      {
        h2: '2. Dados que recolhemos',
        body:
          'Recolhemos: (a) o conteúdo que crias — os textos das tuas orações e os pedidos que partilhas na comunidade; (b) dados de conta, como identificador e e-mail, quando aplicável; (c) dados técnicos mínimos de funcionamento e diagnóstico, como tipo de dispositivo e versão da aplicação. Não recolhemos mais do que o necessário para a Emori funcionar.',
      },
      {
        h2: '3. Como usamos os teus dados',
        body:
          'Usamos os teus dados para: fornecer o serviço de oração e comunidade; selecionar versículos e reflexões relevantes; gerar os resumos semanais e cartas mensais; melhorar a aplicação; e garantir segurança. Não usamos o conteúdo das tuas orações para publicidade.',
      },
      {
        h2: '4. Processamento de dados',
        body:
          'A Emori processa as tuas orações para gerar respostas com versículos bíblicos e reflexões, e para compilar os resumos da tua vida de oração. Parte deste processamento pode ocorrer em servidores de terceiros, sob contrato e com salvaguardas de confidencialidade.',
      },
      {
        h2: '5. Partilha',
        body:
          'Não vendemos os teus dados pessoais. Partilhamos dados apenas com fornecedores essenciais de infraestrutura, quando exigido por lei, ou com o teu consentimento. Os pedidos que partilhas na comunidade são visíveis a outros utilizadores — o teu diário privado não é.',
      },
      {
        h2: '6. Retenção e eliminação',
        body:
          'Guardamos os teus dados enquanto a tua conta existir. Podes pedir a eliminação dos teus dados a qualquer momento pelos canais de contacto indicados na aplicação. Após a eliminação, removemos os teus registos dos nossos sistemas, salvo obrigações legais.',
      },
      {
        h2: '7. Segurança',
        body:
          'Adotamos medidas técnicas e organizativas para proteger os teus dados, incluindo cifragem em trânsito. Nenhum sistema é 100% infalível, mas tratamos a segurança das tuas orações como prioridade.',
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
      'Os termos de utilização da aplicação e do site da Emori: os teus direitos, as tuas responsabilidades e as regras do serviço de oração e comunidade cristã.',
    h1: 'Termos de Utilização',
    tldr:
      'Estes termos definem as regras para usar a Emori. Ao usar a aplicação ou o site, concordas com eles. A Emori é uma app de oração e comunidade cristã, e não substitui aconselhamento pastoral ou profissional.',
    lastUpdatedLabel: 'Última atualização',
    lastUpdated: '21 de outubro de 2026',
    sections: [
      {
        h2: '1. Aceitação dos termos',
        body:
          'Ao aceder ou usar a Emori (aplicação app.emori e site aemori.com), concordas com estes Termos de Utilização. Se não concordares, não utilizes o serviço.',
      },
      {
        h2: '2. O que é a Emori',
        body:
          'A Emori é uma aplicação de oração e comunidade cristã. Oferece um espaço para registar orações, receber versículos bíblicos e reflexões, e participar numa comunidade de fé. A Emori não é um serviço de aconselhamento pastoral, psicológico ou de emergência.',
      },
      {
        h2: '3. Uso adequado',
        body:
          'Concordas em usar a Emori de forma legal, respeitosa e pessoal. É proibido usar o serviço para atividades ilícitas, publicar conteúdo ofensivo na comunidade, abusar da infraestrutura ou tentar aceder a dados de outros utilizadores.',
      },
      {
        h2: '4. Natureza do serviço',
        body:
          'A Emori é uma ferramenta de oração e reflexão bíblica, não um serviço de saúde ou aconselhamento profissional. Se estiveres em sofrimento intenso ou em risco, procura um profissional de saúde, o teu pastor ou os serviços de emergência do teu país.',
      },
      {
        h2: '5. A tua conta e o teu conteúdo',
        body:
          'O conteúdo que crias na Emori — orações, reflexões e pedidos — é teu. És responsável por manter a segurança do teu acesso. Concedes à Emori as permissões necessárias para processar e armazenar o teu conteúdo e prestar o serviço, conforme a Política de Privacidade.',
      },
      {
        h2: '6. Comunidade',
        body:
          'Os pedidos partilhados na comunidade são visíveis a outros utilizadores. És responsável pelo que publicas. Conteúdo reportado é analisado e pode ser removido. A Emori reserva-se o direito de remover conteúdo ou suspender contas que violem estas regras.',
      },
      {
        h2: '7. Planos e pagamentos',
        body:
          'A Emori oferece um plano gratuito e a subscrição opcional Emori Pro. As subscrições são cobradas pela loja de aplicações e seguem as regras dela, incluindo renovação e cancelamento.',
      },
      {
        h2: '8. Disponibilidade e alterações',
        body:
          'Procuramos manter a Emori sempre disponível, mas o serviço pode ter interrupções ou alterações. Podemos alterar, suspender ou descontinuar funcionalidades, avisando quando for razoável.',
      },
      {
        h2: '9. Limitação de responsabilidade',
        body:
          'A Emori é fornecida "tal como está". Na máxima medida permitida por lei, não nos responsabilizamos por danos indiretos decorrentes do uso do serviço. Nada nestes termos limita direitos que a lei não permite limitar.',
      },
      {
        h2: '10. Alterações e contacto',
        body:
          'Podemos atualizar estes Termos de Utilização. Alterações relevantes serão comunicadas na aplicação ou no site. O uso continuado após as alterações significa concordância. Dúvidas podem ser enviadas pelos canais de contacto indicados na aplicação.',
      },
    ],
  },

  blog: {
    metaTitle: 'Blog da Emori — oração, fé cristã, versículos e vida devocional',
    metaDescription:
      'Guias práticos sobre oração, vida devocional, versículos bíblicos e crescimento espiritual. Fortalece a tua fé com a Emori.',
    h1: 'O blog da Emori',
    tldr:
      'Aqui reunimos reflexões e guias sobre oração, vida devocional e crescimento na fé — para te ajudar a orar mais, compreender a Palavra e caminhar mais perto de Deus.',
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
