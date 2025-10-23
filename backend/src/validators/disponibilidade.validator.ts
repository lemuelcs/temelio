// backend/src/validators/disponibilidade.validator.ts

import { body, ValidationChain } from 'express-validator';
import { 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  isAfter, 
  isBefore,
  startOfDay,
  parseISO 
} from 'date-fns';

/**
 * ✅ VALIDAÇÃO CORRIGIDA
 * 
 * Permite salvar disponibilidade apenas para:
 * - Dias FUTUROS da semana atual (não permite dias passados)
 * - Todos os dias da próxima semana
 * 
 * Isso resolve o problema de quarta-feira (ou qualquer dia no meio da semana)
 * onde os dias anteriores já passaram.
 */

export const validarBatchDisponibilidade: ValidationChain[] = [
  body('disponibilidades')
    .isArray({ min: 1 })
    .withMessage('Deve enviar ao menos uma disponibilidade'),

  body('disponibilidades.*.data')
    .notEmpty()
    .withMessage('Data é obrigatória')
    .isISO8601()
    .withMessage('Data deve estar no formato ISO (YYYY-MM-DD)')
    .custom((value) => {
      const hoje = startOfDay(new Date());
      const dataDisponibilidade = startOfDay(parseISO(value));
      
      // ✅ PERMITIR SOMENTE DATAS FUTURAS OU HOJE
      if (isBefore(dataDisponibilidade, hoje)) {
        throw new Error('Não é possível definir disponibilidade para datas passadas');
      }

      // ✅ PERMITIR ATÉ 2 SEMANAS A PARTIR DE HOJE
      const duasSemanasAFrente = addWeeks(hoje, 2);
      if (isAfter(dataDisponibilidade, duasSemanasAFrente)) {
        throw new Error('Disponibilidade pode ser definida apenas para as próximas 2 semanas');
      }

      return true;
    }),

  body('disponibilidades.*.turno')
    .notEmpty()
    .withMessage('Turno é obrigatório')
    .isIn(['MATUTINO', 'VESPERTINO', 'NOTURNO'])
    .withMessage('Turno deve ser MATUTINO, VESPERTINO ou NOTURNO'),

  body('disponibilidades.*.disponivel')
    .isBoolean()
    .withMessage('Disponível deve ser true ou false')
];

/**
 * Validação customizada para verificar se o motorista está preenchendo
 * pelo menos a disponibilidade mínima recomendada
 */
export function validarDisponibilidadeMinima(disponibilidades: any[]): {
  valido: boolean;
  mensagem?: string;
  avisos?: string[];
} {
  const hoje = startOfDay(new Date());
  const inicioSemanaAtual = startOfWeek(hoje, { weekStartsOn: 0 }); // Domingo
  const fimSemanaAtual = endOfWeek(hoje, { weekStartsOn: 0 }); // Sábado
  const inicioProximaSemana = addWeeks(inicioSemanaAtual, 1);
  const fimProximaSemana = addWeeks(fimSemanaAtual, 1);

  // Separar disponibilidades por semana
  const dispSemanaAtual = disponibilidades.filter(d => {
    const data = parseISO(d.data);
    return d.disponivel && 
           !isBefore(data, hoje) && // ✅ Somente hoje ou futuro
           !isAfter(data, fimSemanaAtual);
  });

  const dispProximaSemana = disponibilidades.filter(d => {
    const data = parseISO(d.data);
    return d.disponivel && 
           !isBefore(data, inicioProximaSemana) && 
           !isAfter(data, fimProximaSemana);
  });

  const avisos: string[] = [];

  // Calcular dias restantes na semana atual
  const diasRestantesSemanaAtual = Math.ceil(
    (fimSemanaAtual.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // ✅ VALIDAÇÃO FLEXÍVEL: Avisar mas não bloquear
  
  // Se tiver menos de 50% de disponibilidade nos dias restantes da semana
  if (dispSemanaAtual.length < diasRestantesSemanaAtual * 0.5) {
    avisos.push(
      `Você marcou apenas ${dispSemanaAtual.length} dia(s) disponível(is) ` +
      `dos ${diasRestantesSemanaAtual} dias restantes desta semana. ` +
      `Quanto mais disponibilidade, mais chances de receber rotas!`
    );
  }

  // Se tiver menos de 50% de disponibilidade na próxima semana
  if (dispProximaSemana.length < 7 * 0.5) {
    avisos.push(
      `Você marcou apenas ${dispProximaSemana.length} dia(s) disponível(is) ` +
      `na próxima semana. Recomendamos marcar pelo menos 3-4 dias.`
    );
  }

  // ✅ NUNCA BLOQUEAR - apenas avisar
  return {
    valido: true,
    avisos: avisos.length > 0 ? avisos : undefined
  };
}

/**
 * Helper para calcular estatísticas de disponibilidade
 */
export function calcularEstatisticasDisponibilidade(disponibilidades: any[]) {
  const hoje = startOfDay(new Date());
  const inicioSemanaAtual = startOfWeek(hoje, { weekStartsOn: 0 });
  const fimSemanaAtual = endOfWeek(hoje, { weekStartsOn: 0 });

  const totalDisponiveis = disponibilidades.filter(d => d.disponivel).length;
  const totalTurnos = disponibilidades.length;

  // Dias únicos (uma data pode ter 3 turnos)
  const diasUnicos = new Set(
    disponibilidades
      .filter(d => d.disponivel)
      .map(d => d.data)
  ).size;

  return {
    totalDisponiveis,
    totalTurnos,
    diasUnicos,
    percentualDisponibilidade: totalTurnos > 0 
      ? Math.round((totalDisponiveis / totalTurnos) * 100) 
      : 0
  };
}
