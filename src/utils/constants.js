export const ADMIN_EMAILS = [
    "admin@kobber.com.br",
    "diretoria@kobber.com.br",
    "ti@kobber.com.br",
    "kaduoficial@gmail.com",
    "cadubraga99@gmail.com"
];

export const META_MENSAL = 75000;

export const ESTADOS_FOCO = ["RS", "SC", "PR", "SP", "Outro"];

export const ORIGENS_CLIENTE = [
    "WhatsApp Business",
    "Meta Ads (Face/Insta)",
    "Instagram Direct",
    "Google (Pesquisa)",
    "Google Maps (Meu Negócio)",
    "OLX / Marketplace",
    "Indicação",
    "Já era cliente",
    "Passante (Frente loja)",
];

export const MOTIVOS_PERDA = [
    "Falta de Estoque",
    "Preço (Concorrência)",
    "Prazo/Frete",
    "Só pesquisando/Curioso",
    "Cliente vai pensar"
];

export const CANAIS_VENDA = ["Online", "Balcão"];

export const METODOS_PAGAMENTO = ["Pix", "Crédito", "Débito", "Dinheiro", "Boleto"];

export const FUNNEL_STAGES = [
    { id: 'novo', label: 'Novo', color: '#3B82F6', icon: 'Sparkles' },
    { id: 'contatado', label: 'Em Contato', color: '#F59E0B', icon: 'MessageCircle' },
    { id: 'em_negociacao', label: 'Em Negociação', color: '#8B5CF6', icon: 'Handshake' },
    { id: 'proposta_enviada', label: 'Proposta Enviada', color: '#F97316', icon: 'FileText' },
    { id: 'fechado_ganho', label: 'Venda Fechada ✅', color: '#10B981', icon: 'CheckCircle' },
    { id: 'fechado_perdido', label: 'Lead Perdido ❌', color: '#EF4444', icon: 'XCircle' },
];

export const STAGE_ACTIONS = {
    novo: {
        msg: 'Enviar mensagem de boas-vindas',
        template: 'Olá {nome}, tudo bem? Aqui é da Kobber Auto Peças! Vi que você entrou em contato sobre *{peca}*. Como posso te ajudar? 🚗'
    },
    contatado: {
        msg: 'Enviar catálogo/preço',
        template: 'Oi {nome}! Sobre a *{peca}* que conversamos, tenho disponível aqui. Posso te passar os detalhes e valores?'
    },
    em_negociacao: {
        msg: 'Confirmar interesse e preparar proposta',
        template: 'Fala {nome}! Só confirmando: você tem interesse na *{peca}*? Estou preparando uma proposta especial pra você! 🚗'
    },
    proposta_enviada: {
        msg: 'Enviar proposta/PDF e aguardar retorno',
        template: 'Oi {nome}! Enviei a proposta para *{peca}*. Conseguiu visualizar? Qualquer dúvida sobre preço ou prazo, me chama! 🤝'
    },
    fechado_ganho: {
        msg: 'Agradecer e pedir avaliação no Google',
        template: 'Oi {nome}! Tudo certo com a sua compra da *{peca}*? Muito obrigado por escolher a nossa loja! 🙏\n\nSe puder avaliar o nosso atendimento no Google rapidinho, nos ajuda demais! ⭐\nhttps://g.page/r/CQ2q3BtRyDuCEAE/review'
    },
};
