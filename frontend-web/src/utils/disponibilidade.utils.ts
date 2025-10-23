// frontend/src/utils/disponibilidade.utils.ts
import { TurnoDisponibilidade } from '../types/disponibilidade';

/**
 * Retorna o início da semana (domingo) para uma data
 */
export function getInicioSemana(data: Date): Date {
  const d = new Date(data);
  const dia = d.getDay();
  const diff = d.getDate() - dia;
  return new Date(d.setDate(diff));
}

/**
 * Retorna o fim da semana (sábado) para uma data
 */
export function getFimSemana(data: Date): Date {
  const inicio = getInicioSemana(data);
  return new Date(inicio.setDate(inicio.getDate() + 6));
}

/**
 * Retorna array de 7 datas (domingo a sábado) de uma semana
 */
export function getDiasSemana(inicioSemana: Date): Date[] {
  const dias: Date[] = [];
  const inicio = new Date(inicioSemana);
  
  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);
    dias.push(dia);
  }
  
  return dias;
}

/**
 * Retorna semana corrente e próxima semana
 */
export function getSemanaCorrenteEProxima() {
  const hoje = new Date();
  const inicioSemanaCorrente = getInicioSemana(hoje);
  const fimSemanaCorrente = getFimSemana(hoje);
  
  const inicioProximaSemana = new Date(fimSemanaCorrente);
  inicioProximaSemana.setDate(inicioProximaSemana.getDate() + 1);
  
  const fimProximaSemana = getFimSemana(inicioProximaSemana);
  
  return {
    semanaCorrente: {
      inicio: inicioSemanaCorrente,
      fim: fimSemanaCorrente,
      dias: getDiasSemana(inicioSemanaCorrente)
    },
    proximaSemana: {
      inicio: inicioProximaSemana,
      fim: fimProximaSemana,
      dias: getDiasSemana(inicioProximaSemana)
    }
  };
}

/**
 * Formata data para exibição (DD/MM)
 */
export function formatarDiaMes(data: Date): string {
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  return `${dia}/${mes}`;
}

/**
 * Formata data para ISO string (YYYY-MM-DD)
 */
export function formatarDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const dia = data.getDate().toString().padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Retorna nome do dia da semana
 */
export function getNomeDiaSemana(data: Date): string {
  const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  return dias[data.getDay()];
}

/**
 * Retorna ícone do turno
 */
export function getIconeTurno(turno: TurnoDisponibilidade): string {
  const icones = {
    [TurnoDisponibilidade.MATUTINO]: '☀️',
    [TurnoDisponibilidade.VESPERTINO]: '🌤️',
    [TurnoDisponibilidade.NOTURNO]: '🌙'
  };
  return icones[turno];
}

/**
 * Retorna label do turno
 */
export function getLabelTurno(turno: TurnoDisponibilidade): string {
  const labels = {
    [TurnoDisponibilidade.MATUTINO]: 'Matutino (8h-12h)',
    [TurnoDisponibilidade.VESPERTINO]: 'Vespertino (13h-17h)',
    [TurnoDisponibilidade.NOTURNO]: 'Noturno (18h-22h)'
  };
  return labels[turno];
}

/**
 * Gera array de 42 disponibilidades (2 semanas × 7 dias × 3 turnos)
 */
export function gerarDisponibilidadesVazias(): Array<{
  data: string;
  turno: TurnoDisponibilidade;
  disponivel: boolean;
}> {
  const { semanaCorrente, proximaSemana } = getSemanaCorrenteEProxima();
  const todasDatas = [...semanaCorrente.dias, ...proximaSemana.dias];
  const turnos = [
    TurnoDisponibilidade.MATUTINO,
    TurnoDisponibilidade.VESPERTINO,
    TurnoDisponibilidade.NOTURNO
  ];
  
  const disponibilidades: Array<{
    data: string;
    turno: TurnoDisponibilidade;
    disponivel: boolean;
  }> = [];
  
  todasDatas.forEach(data => {
    turnos.forEach(turno => {
      disponibilidades.push({
        data: formatarDataISO(data),
        turno,
        disponivel: false
      });
    });
  });
  
  return disponibilidades;
}

/**
 * Verifica se uma data é hoje
 */
export function isHoje(data: Date): boolean {
  const hoje = new Date();
  return (
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear()
  );
}

/**
 * Verifica se uma data já passou
 */
export function isPassado(data: Date): boolean {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);
  return data < hoje;
}
