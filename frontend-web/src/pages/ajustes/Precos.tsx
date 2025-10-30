import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, History, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';

interface TabelaPreco {
  id: string;
  versao: number;
  estacao: string;
  tipoServico: 'BIKE' | 'SMALL_VAN' | 'LARGE_VAN' | 'HELPER' | 'PASSENGER';
  propriedade: 'PROPRIO' | 'TRANSPORTADORA';
  valorHora: number;
  valorCancelamento: number;
  valorKm: number;
  bonusWeekend: number;
  valorHoraDSP?: number;
  valorCancelamentoDSP?: number;
  bonusWeekendDSP?: number;
  valorPorPacote?: number;
  dataInicioVigencia: string;
  dataFimVigencia?: string;
  ativo: boolean;
  createdAt: string;
}

const tiposServicoLabels: Record<string, string> = {
  BIKE: 'Motocicleta',
  SMALL_VAN: 'Small Van',
  LARGE_VAN: 'Large Van',
  HELPER: 'Ajudante',
  PASSENGER: 'Carro Passeio'
};

const propriedadeLabels: Record<string, string> = {
  PROPRIO: 'Próprio',
  TRANSPORTADORA: 'Transportadora (DMF)'
};

export default function Precos() {
  const [showModal, setShowModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historicoKey, setHistoricoKey] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstacao, setFilterEstacao] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterPropriedade, setFilterPropriedade] = useState('');
  
  const queryClient = useQueryClient();

  // Buscar tabelas de preços
  const { data: tabelas = [], isLoading } = useQuery({
    queryKey: ['tabelas-precos', filterEstacao, filterTipo, filterPropriedade],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterEstacao) params.append('estacao', filterEstacao);
      if (filterTipo) params.append('tipoServico', filterTipo);
      if (filterPropriedade) params.append('propriedade', filterPropriedade);
      params.append('ativo', 'true');
      
      const response = await api.get(`/tabela-precos?${params.toString()}`);
      return response.data?.data?.tabelas || [];
    },
  });

  // Deletar tabela
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tabela-precos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabelas-precos'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao deletar tabela de preços');
    }
  });

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tabela de preços?\n\nAtenção: Só é possível deletar se não houver rotas vinculadas.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleShowHistorico = (tabela: TabelaPreco) => {
    setHistoricoKey({
      estacao: tabela.estacao,
      tipoServico: tabela.tipoServico,
      propriedade: tabela.propriedade
    });
    setShowHistoricoModal(true);
  };

  const filteredTabelas = tabelas.filter((t: TabelaPreco) => {
    const matchesSearch = 
      tiposServicoLabels[t.tipoServico]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.estacao.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabela de Preços</h1>
          <p className="text-gray-600 mt-1">Gerencie os valores do Rate Card Amazon</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nova Tabela
        </button>
      </div>

      {/* Alerta de Integridade */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Integridade Referencial:</strong> Ao criar uma nova tabela de preços, as rotas futuras usarão os novos valores.
              As rotas já criadas mantêm os valores originais (snapshot).
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterEstacao}
            onChange={(e) => setFilterEstacao(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as Estações</option>
            <option value="DBS5">DBS5 (Brasília)</option>
            <option value="DGO2">DGO2 (Hidrolândia)</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Tipos</option>
            <option value="BIKE">Motocicleta</option>
            <option value="SMALL_VAN">Small Van</option>
            <option value="LARGE_VAN">Large Van</option>
            <option value="HELPER">Ajudante</option>
            <option value="PASSENGER">Carro Passeio</option>
          </select>

          <select
            value={filterPropriedade}
            onChange={(e) => setFilterPropriedade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as Propriedades</option>
            <option value="PROPRIO">Próprio</option>
            <option value="TRANSPORTADORA">Transportadora (DMF)</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando tabelas...</p>
          </div>
        ) : filteredTabelas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Nenhuma tabela de preços encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Serviço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propriedade</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor/Hora</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cancel/Hora</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bonus Weekend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Adicional/KM</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Versão</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTabelas.map((tabela: TabelaPreco) => (
                  <tr key={tabela.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {tabela.estacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tiposServicoLabels[tabela.tipoServico]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {propriedadeLabels[tabela.propriedade]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      R$ {Number(tabela.valorHora).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      R$ {Number(tabela.valorCancelamento).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      R$ {Number(tabela.bonusWeekend).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      R$ {Number(tabela.valorKm).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        v{tabela.versao}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleShowHistorico(tabela)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Ver Histórico"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(tabela.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tabela.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <TabelaPrecoModal
          tabelaId={editingId}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
        />
      )}

      {showHistoricoModal && historicoKey && (
        <HistoricoModal
          historicoKey={historicoKey}
          onClose={() => {
            setShowHistoricoModal(false);
            setHistoricoKey(null);
          }}
        />
      )}
    </div>
  );
}

// Continua na Parte 2...

// Modal de Criação/Edição
function TabelaPrecoModal({ tabelaId, onClose }: { tabelaId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEditing = !!tabelaId;

  const [formData, setFormData] = useState({
    estacao: 'DBS5',
    tipoServico: 'SMALL_VAN',
    propriedade: 'PROPRIO',
    valorHora: '',
    valorCancelamento: '',
    valorKm: '0.64',
    bonusWeekend: '',
    valorHoraDSP: '',
    valorCancelamentoDSP: '',
    bonusWeekendDSP: '',
    valorPorPacote: '',
    dataInicioVigencia: new Date().toISOString().split('T')[0]
  });

  // Buscar dados para edição
  const { data: tabelaData, isLoading: loadingTabela } = useQuery({
    queryKey: ['tabela-preco', tabelaId],
    queryFn: async () => {
      if (!tabelaId) return null;
      const response = await api.get(`/tabela-precos/${tabelaId}`);
      return response.data?.data?.tabela || response.data?.tabela || response.data;
    },
    enabled: !!tabelaId,
  });

  // Preencher formulário quando carregar dados
  useEffect(() => {
    if (tabelaData && isEditing) {
      setFormData({
        estacao: tabelaData.estacao || 'DBS5',
        tipoServico: tabelaData.tipoServico || 'SMALL_VAN',
        propriedade: tabelaData.propriedade || 'PROPRIO',
        valorHora: tabelaData.valorHora?.toString() || '',
        valorCancelamento: tabelaData.valorCancelamento?.toString() || '',
        valorKm: tabelaData.valorKm?.toString() || '0.64',
        bonusWeekend: tabelaData.bonusWeekend?.toString() || '',
        valorHoraDSP: tabelaData.valorHoraDSP?.toString() || '',
        valorCancelamentoDSP: tabelaData.valorCancelamentoDSP?.toString() || '',
        bonusWeekendDSP: tabelaData.bonusWeekendDSP?.toString() || '',
        valorPorPacote: tabelaData.valorPorPacote?.toString() || '',
        dataInicioVigencia: tabelaData.dataInicioVigencia
          ? tabelaData.dataInicioVigencia.split('T')[0]
          : new Date().toISOString().split('T')[0]
      });
    }
  }, [tabelaData, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        return api.put(`/tabela-precos/${tabelaId}`, data);
      }
      return api.post('/tabela-precos', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabelas-precos'] });
      onClose();
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao salvar tabela de preços';
      alert(mensagem);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      estacao: formData.estacao,
      tipoServico: formData.tipoServico,
      propriedade: formData.propriedade,
      valorHora: parseFloat(formData.valorHora),
      valorCancelamento: parseFloat(formData.valorCancelamento),
      valorKm: parseFloat(formData.valorKm),
      bonusWeekend: parseFloat(formData.bonusWeekend),
      valorHoraDSP: formData.valorHoraDSP ? parseFloat(formData.valorHoraDSP) : null,
      valorCancelamentoDSP: formData.valorCancelamentoDSP ? parseFloat(formData.valorCancelamentoDSP) : null,
      bonusWeekendDSP: formData.bonusWeekendDSP ? parseFloat(formData.bonusWeekendDSP) : null,
      valorPorPacote: formData.valorPorPacote ? parseFloat(formData.valorPorPacote) : null,
      dataInicioVigencia: formData.dataInicioVigencia
    };
    
    saveMutation.mutate(payload);
  };

  if (isEditing && loadingTabela) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Tabela de Preços' : 'Nova Tabela de Preços'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Identificação */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Identificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estação *</label>
                <select
                  required
                  value={formData.estacao}
                  onChange={(e) => setFormData({ ...formData, estacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DBS5">DBS5 (Brasília)</option>
                  <option value="DGO2">DGO2 (Hidrolândia)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Serviço *</label>
                <select
                  required
                  value={formData.tipoServico}
                  onChange={(e) => setFormData({ ...formData, tipoServico: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BIKE">Motocicleta</option>
                  <option value="SMALL_VAN">Small Van</option>
                  <option value="LARGE_VAN">Large Van</option>
                  <option value="HELPER">Ajudante</option>
                  <option value="PASSENGER">Carro Passeio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Propriedade *</label>
                <select
                  required
                  value={formData.propriedade}
                  onChange={(e) => setFormData({ ...formData, propriedade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PROPRIO">Próprio</option>
                  <option value="TRANSPORTADORA">Transportadora (DMF)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Valores DA (Motorista) */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Valores DA (Pago ao Motorista)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor por Hora *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.valorHora}
                  onChange={(e) => setFormData({ ...formData, valorHora: e.target.value })}
                  placeholder="40.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor Cancelamento/Hora *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.valorCancelamento}
                  onChange={(e) => setFormData({ ...formData, valorCancelamento: e.target.value })}
                  placeholder="10.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Weekend *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.bonusWeekend}
                  onChange={(e) => setFormData({ ...formData, bonusWeekend: e.target.value })}
                  placeholder="8.50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adicional por KM *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.valorKm}
                  onChange={(e) => setFormData({ ...formData, valorKm: e.target.value })}
                  placeholder="0.64"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Valor padrão: R$ 0,64</p>
              </div>
            </div>
          </div>

          {/* Valores DSP (Opcional) */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Valores DSP (Transportadora) - Opcional</h3>
            <p className="text-sm text-gray-600 mb-4">Valores recebidos pela transportadora da Amazon</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor por Hora DSP</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorHoraDSP}
                  onChange={(e) => setFormData({ ...formData, valorHoraDSP: e.target.value })}
                  placeholder="50.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancelamento DSP</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorCancelamentoDSP}
                  onChange={(e) => setFormData({ ...formData, valorCancelamentoDSP: e.target.value })}
                  placeholder="12.50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Weekend DSP</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.bonusWeekendDSP}
                  onChange={(e) => setFormData({ ...formData, bonusWeekendDSP: e.target.value })}
                  placeholder="9.75"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor por Pacote</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorPorPacote}
                  onChange={(e) => setFormData({ ...formData, valorPorPacote: e.target.value })}
                  placeholder="0.25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Vigência */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vigência</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Início Vigência *</label>
              <input
                type="date"
                required
                value={formData.dataInicioVigencia}
                onChange={(e) => setFormData({ ...formData, dataInicioVigencia: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Data a partir da qual esta tabela de preços será válida
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Tabela')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Histórico
function HistoricoModal({ historicoKey, onClose }: { historicoKey: any; onClose: () => void }) {
  const { data: historico = [], isLoading } = useQuery({
    queryKey: ['historico-precos', historicoKey],
    queryFn: async () => {
      const params = new URLSearchParams({
        estacao: historicoKey.estacao,
        tipoServico: historicoKey.tipoServico,
        propriedade: historicoKey.propriedade
      });
      const response = await api.get(`/tabela-precos/historico?${params.toString()}`);
      return response.data?.data?.historico || [];
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Histórico de Versões
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {historicoKey.estacao} / {tiposServicoLabels[historicoKey.tipoServico]} / {propriedadeLabels[historicoKey.propriedade]}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando histórico...</p>
            </div>
          ) : historico.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Nenhum histórico encontrado</p>
          ) : (
            <div className="space-y-4">
              {historico.map((h: any) => (
                <div key={h.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-semibold text-lg">Versão {h.versao}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Criado em {new Date(h.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      h.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {h.ativo ? '✅ Ativa' : '⏸️ Inativa'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Valor/Hora</p>
                      <p className="font-semibold text-blue-900">R$ {Number(h.valorHora).toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Cancelamento</p>
                      <p className="font-semibold text-red-900">R$ {Number(h.valorCancelamento).toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Bonus Weekend</p>
                      <p className="font-semibold text-green-900">R$ {Number(h.bonusWeekend).toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Adicional KM</p>
                      <p className="font-semibold text-purple-900">R$ {Number(h.valorKm).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>Vigência:</strong> {new Date(h.dataInicioVigencia).toLocaleDateString('pt-BR')}
                      {h.dataFimVigencia && ` até ${new Date(h.dataFimVigencia).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
