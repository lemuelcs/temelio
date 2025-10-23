// frontend/src/utils/export.utils.ts

/**
 * Exportar dados para CSV
 */
export function exportarCSV(dados: any[][], nomeArquivo: string) {
  const csvContent = dados.map(row => row.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeArquivo}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exportar tabela HTML para Excel (usando biblioteca XLSX)
 * Nota: Requer instalação de 'xlsx' -> npm install xlsx
 */
export function exportarExcel(dados: any[][], nomeArquivo: string) {
  // Se não tiver a biblioteca instalada, fazer fallback para CSV
  try {
    // @ts-ignore
    const XLSX = window.XLSX;
    if (!XLSX) {
      console.warn('Biblioteca XLSX não encontrada. Exportando como CSV.');
      exportarCSV(dados, nomeArquivo);
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumo');
    XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    exportarCSV(dados, nomeArquivo);
  }
}

/**
 * Preparar dados do resumo para exportação
 */
export function prepararDadosResumo(
  resumo: any,
  datas: string[],
  periodo: string
): any[][] {
  const dados: any[][] = [];
  
  // Cabeçalho
  dados.push([
    `Resumo de Disponibilidade - ${periodo}`,
    '', '', '', '', '', '', ''
  ]);
  dados.push([]); // Linha em branco
  
  // Cabeçalho da tabela
  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  dados.push([
    'Ciclo / Veículo',
    ...diasSemana,
    'Total'
  ]);
  
  // Para cada ciclo
  const ciclos = [
    { key: 'CICLO_1', label: 'Ciclo 1', descricao: 'Manhã/Tarde (7h-17h)', icon: '🌅' },
    { key: 'CICLO_2', label: 'Ciclo 2', descricao: 'Tarde (12h-20h)', icon: '🌇' },
    { key: 'SAME_DAY', label: 'Same Day', descricao: 'Noite (18h-23h)', icon: '🌃' }
  ];
  
  const veiculos = [
    { key: 'MOTOCICLETA', label: 'Motocicleta', icon: '🏍️' },
    { key: 'CARRO_PASSEIO', label: 'Carro Passeio', icon: '🚗' },
    { key: 'CARGO_VAN', label: 'Cargo Van', icon: '🚚' },
    { key: 'LARGE_VAN', label: 'Large Van', icon: '🚛' }
  ];
  
  ciclos.forEach(ciclo => {
    // Header do ciclo
    dados.push([`${ciclo.icon} ${ciclo.label} - ${ciclo.descricao}`, '', '', '', '', '', '', '']);
    
    // Linhas de veículos
    veiculos.forEach(veiculo => {
      const valores = resumo.ciclos[ciclo.key][veiculo.key];
      const total = valores.reduce((acc: number, val: number) => acc + val, 0);
      dados.push([
        `  ${veiculo.icon} ${veiculo.label}`,
        ...valores,
        total
      ]);
    });
    
    // Subtotal do ciclo
    const subtotal = resumo.ciclos[ciclo.key].subtotal;
    const totalSubtotal = subtotal.reduce((acc: number, val: number) => acc + val, 0);
    dados.push([
      'Subtotal',
      ...subtotal,
      totalSubtotal
    ]);
    
    dados.push([]); // Linha em branco
  });
  
  // Total geral
  const totalGeral = resumo.totalGeral.reduce((acc: number, val: number) => acc + val, 0);
  dados.push([
    'TOTAL GERAL',
    ...resumo.totalGeral,
    totalGeral
  ]);
  
  return dados;
}

/**
 * Formatar nome de arquivo com data
 */
export function gerarNomeArquivo(prefixo: string): string {
  const agora = new Date();
  const data = agora.toISOString().split('T')[0]; // YYYY-MM-DD
  const hora = agora.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  return `${prefixo}_${data}_${hora}`;
}
