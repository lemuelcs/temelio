import { AppError } from '../middlewares/error.middleware';

// NOTA: Este serviço está DESCONTINUADO.
// Use tabelaPrecos.service.ts no lugar.
// Os campos tipoVeiculo/propriedadeVeiculo foram removidos do schema.
// Agora use tipoServico/propriedade.

interface CriarTabelaPrecoData {
  // TODO: Migrar para novos campos
  [key: string]: any;
}

class PrecoService {
  // DESCONTINUADO: Use tabelaPrecosService.criar
  async criar(data: CriarTabelaPrecoData) {
    throw new AppError('Este serviço está descontinuado. Use /api/tabela-precos', 410);
  }

  // DESCONTINUADO: Use tabelaPrecosService.listar
  async listar(filtros: any = {}) {
    throw new AppError('Este serviço está descontinuado. Use /api/tabela-precos', 410);
  }

  // DESCONTINUADO: Use tabelaPrecosService.buscarVigente
  async buscarAtiva(...args: any[]) {
    throw new AppError('Este serviço está descontinuado. Use /api/tabela-precos', 410);
  }

  // DESCONTINUADO: Use tabelaPrecosService.buscarPorId
  async buscarPorId(id: string) {
    throw new AppError('Este serviço está descontinuado. Use /api/tabela-precos', 410);
  }

  // DESCONTINUADO: Use tabelaPrecosService.atualizar
  async atualizar(id: string, data: any) {
    throw new AppError('Este serviço está descontinuado. Use /api/tabela-precos', 410);
  }

  // DESCONTINUADO: Use tabelaPrecosService.desativar
  async desativar(id: string) {
    throw new AppError('Este serviço está descontinuado. Use /api/tabela-precos', 410);
  }

  // DESCONTINUADO
  async criarTabelasPadrao() {
    throw new AppError('Este serviço está descontinuado. Use /api/tabela-precos', 410);
  }
}

export default new PrecoService();
