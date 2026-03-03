/**
 * AI Parser Heurístico (Magic Paste)
 * Usa expressões regulares e listas de palavras-chave para extrair dados
 * de textos desestruturados (ex: mensagens do WhatsApp) sem custo de API.
 */

const extractPhone = (text) => {
  // Busca padrões como (55) 99999-9999, 55999999999, etc.
  const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g;
  const matches = text.match(phoneRegex);
  if (matches && matches.length > 0) {
    // Retorna apenas números
    let number = matches[0].replace(/\D/g, '');
    if (number.length === 10 || number.length === 11) {
      // Adiciona o DDI do Brasil se não tiver
      number = "55" + number;
    }
    return number;
  }
  return '';
};

const extractName = (text) => {
  // Tenta buscar "meu nome é X", "aqui é o X", "sou o X", "fala, X"
  const namePatterns = [
    /meu nome [é|e] ([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /aqui [é|e] [oa]?\s?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /sou [oa]?\s?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /fala,? ([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
    /chamo ([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: tenta pegar a primeira palavra capitalizada após uma saudação
  const greetingPattern = /(?:ol[aá]|bom dia|boa tarde|boa noite|fala|oi)[\s,]+([A-Z][a-z]+)/i;
  const greetingMatch = text.match(greetingPattern);
  if (greetingMatch && greetingMatch[1]) {
    // Ignora palavras comuns que podem estar capitalizadas no início mas não são nomes
    const stopWords = ['Tudo', 'Como', 'Gostaria', 'Preciso', 'Tem'];
    if (!stopWords.includes(greetingMatch[1])) {
      return greetingMatch[1].trim();
    }
  }

  return '';
};

const extractCity = (text) => {
  const cityPatterns = [
    /sou de ([A-Z][a-zá-ú]+(?:\s[A-Z][a-zá-ú]+)*)/i,
    /moro em ([A-Z][a-zá-ú]+(?:\s[A-Z][a-zá-ú]+)*)/i,
    /aqui de ([A-Z][a-zá-ú]+(?:\s[A-Z][a-zá-ú]+)*)/i,
    /aqui em ([A-Z][a-zá-ú]+(?:\s[A-Z][a-zá-ú]+)*)/i,
    /da cidade de ([A-Z][a-zá-ú]+(?:\s[A-Z][a-zá-ú]+)*)/i,
    /oficina em ([A-Z][a-zá-ú]+(?:\s[A-Z][a-zá-ú]+)*)/i
  ];

  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
};

const extractType = (text) => {
  const textLower = text.toLowerCase();
  const mecKeywords = ['oficina', 'mecânico', 'mecanico', 'auto center', 'autocenter', 'mecânica', 'mecanica', 'retífica', 'retifica'];
  
  for (const kw of mecKeywords) {
    if (textLower.includes(kw)) {
      return 'Oficina';
    }
  }
  return 'Consumidor Final';
};

const extractSubject = (text) => {
  const textLower = text.toLowerCase();
  
  // Dicionário muito básico de auto peças para ajudar na heurística
  const parts = ['bateria', 'motor', 'pneu', 'pneus', 'parachoque', 'amortecedor', 'pastilha', 'freio', 'embreagem', 'vela', 'filtro', 'óleo', 'farol', 'lanterna', 'retrovisor', 'radiador', 'bomba', 'correia', 'suspensão', 'câmbio', 'roda'];
  const vehicles = ['gol', 'palio', 'uno', 'celta', 'corsa', 'fox', 'fiesta', 'ka', 'corolla', 'civic', 'Hilux', 's10', 'ranger', 'onix', 'hb20', 'xre', 'cg', 'biz', 'bros', 'titan', 'ybr', 'fazer', 'pcx'];

  let pecaProcurada = '';
  let veiculoModelo = '';

  // Procura padrão de intenção de compra
  const partPattern = /(?:preciso de|querendo|procuro|tem|de|procurando)(?:\s(?:uma?|uns|umas|o|a))?\s([a-zá-ú\s]{3,30})(?:\n|\.|,|para|pro|pra|$)/i;
  const partMatch = text.match(partPattern);
  
  if (partMatch && partMatch[1]) {
    const p = partMatch[1].trim();
    // Verifica se não pegou "um orçamento", "saber"
    if (!['um orçamento', 'saber', 'ver', 'uma informação'].includes(p.toLowerCase())) {
        pecaProcurada = p;
    }
  }

  // Se o regex não achou legal, tenta varrer pelo dicionário de peças
  if (!pecaProcurada) {
      for (const p of parts) {
          if (textLower.includes(p)) {
              pecaProcurada = p.charAt(0).toUpperCase() + p.slice(1);
              break;
          }
      }
  }

  // Tenta achar o veículo
  const vehiclePattern = /(?:para um|para uma|pro|pra|do|da|meu|minha)\s([a-zá-ú0-9\s-]{3,20})(?:\n|\.|,|$)/i;
  const vMatch = text.match(vehiclePattern);
  
  if (vMatch && vMatch[1]) {
      veiculoModelo = vMatch[1].trim();
  }

  // Fallback para veículo no dicionário
  if (!veiculoModelo) {
      for (const v of vehicles) {
          if (textLower.includes(v)) {
              veiculoModelo = v.charAt(0).toUpperCase() + v.slice(1);
              break;
          }
      }
  }

  return { pecaProcurada, veiculoModelo };
};

export const parseMagicText = (text) => {
  if (!text) return null;

  const { pecaProcurada, veiculoModelo } = extractSubject(text);
  
  const tipoCliente = extractType(text);
  const isOficina = tipoCliente === 'Oficina';

  return {
    clienteNome: extractName(text),
    clienteTelefone: extractPhone(text),
    clienteCidade: extractCity(text),
    tipoCliente,
    oficinaNome: isOficina ? extractName(text) + ' (Possível Oficina)' : '',
    pecaProcurada,
    veiculoModelo,
    observacoes: text.length > 200 ? text.substring(0, 200) + '...' : text
  };
};
