import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, CheckCircle, XCircle, User, RefreshCw, MessageCircle } from 'lucide-react';
import api from '../../services/api';

interface Motorista {
  id: string;
  transporterId?: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento?: string;
  email: string;
  celular: string;
  chavePix?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  tipoVeiculo: 'MOTOCICLETA' | 'CARRO_PASSEIO' | 'CARGO_VAN' | 'LARGE_VAN';
  propriedadeVeiculo: 'PROPRIO' | 'TRANSPORTADORA';
  placaVeiculo?: string;
  anoFabricacaoVeiculo?: number;
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO' | 'ONBOARDING' | 'EXCLUIDO';
  documentos?: Array<{
    numeroCNH?: string;
    validadeCNH?: string;
    anoLicenciamento?: number;
    dataVerificacaoBRK?: string;
    proximaVerificacaoBRK?: string;
    statusBRK?: boolean;
  }>;
  contratos?: Array<{
    numeroContrato?: string;
    dataAssinatura?: string;
    dataVigenciaInicial?: string;
    cnpjMEI?: string;
    razaoSocialMEI?: string;
  }>;
  createdAt: string;
}

// Funções auxiliares para máscaras
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  }
  return numbers.substring(0, 11);
};

const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 14) {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2');
  }
  return numbers.substring(0, 14);
};

const formatCelular = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  return numbers.substring(0, 11);
};

const formatCEP = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 8) {
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  }
  return numbers.substring(0, 8);
};

// Ícones para cada status
const getStatusIcon = (status: string) => {
  const icons = {
    ATIVO: '✅',
    INATIVO: '⏸️',
    SUSPENSO: '⚠️',
    ONBOARDING: '🚀',
    EXCLUIDO: '🗑️',
  };
  return icons[status as keyof typeof icons] || '❓';
};

const getStatusColor = (status: string) => {
  const colors = {
    ATIVO: 'bg-green-100 text-green-800',
    INATIVO: 'bg-gray-100 text-gray-800',
    SUSPENSO: 'bg-yellow-100 text-yellow-800',
    ONBOARDING: 'bg-blue-100 text-blue-800',
    EXCLUIDO: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export default function Motoristas() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedMotoristaId, setSelectedMotoristaId] = useState<string | null>(null);
  const [selectedMotoristaStatus, setSelectedMotoristaStatus] = useState<string>('');
  
  const queryClient = useQueryClient();

  // Buscar motoristas
  const { data: motoristas = [], isLoading } = useQuery({
    queryKey: ['motoristas'],
    queryFn: async () => {
      try {
        const response = await api.get('/gestao/motoristas');
        const dados = response.data?.data?.motoristas || response.data?.motoristas || response.data;
        const motoristasArray = Array.isArray(dados) ? dados : [];

        // Ordenar por updatedAt DESC
        return motoristasArray.sort((a: any, b: any) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return [];
      }
    },
  });

  // Filtrar motoristas
  const filteredMotoristas = motoristas.filter((m: any) => {
    const matchesSearch = (m.nomeCompleto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (m.cpf || '').includes(searchTerm) ||
                         (m.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    // Se não houver filtro de status, mostrar apenas ATIVO e ONBOARDING
    const matchesStatus = filterStatus ? m.status === filterStatus : (m.status === 'ATIVO' || m.status === 'ONBOARDING');
    const matchesTipo = !filterTipo || m.tipoVeiculo === filterTipo;
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleChangeStatus = (id: string, currentStatus: string) => {
    setSelectedMotoristaId(id);
    setSelectedMotoristaStatus(currentStatus);
    setShowStatusModal(true);
  };

  const getTipoVeiculoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      MOTOCICLETA: 'Moto',
      CARRO_PASSEIO: 'Carro',
      CARGO_VAN: 'Cargo Van',
      LARGE_VAN: 'Large Van',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motoristas</h1>
          <p className="text-gray-600 mt-1">Gerencie os motoristas parceiros</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Novo Motorista
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
            <option value="SUSPENSO">Suspensos</option>
            <option value="EXCLUIDO">Excluídos</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os veículos</option>
            <option value="MOTOCICLETA">Motocicleta</option>
            <option value="CARRO_PASSEIO">Carro Passeio</option>
            <option value="CARGO_VAN">Cargo Van</option>
            <option value="LARGE_VAN">Large Van</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando motoristas...</p>
          </div>
        ) : filteredMotoristas.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum motorista encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Contato</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMotoristas.map((motorista: any) => {
                  const documentos = motorista.documentos?.[0] || {};
                  const cnhValida = documentos.validadeCNH ? new Date(documentos.validadeCNH) > new Date() : false;
                  const brkValido = documentos.statusBRK || false;
                  const temDocumentos = documentos.numeroCNH && documentos.validadeCNH && documentos.anoLicenciamento;
                  const elegivel = cnhValida && brkValido && temDocumentos;
                  
                  // WhatsApp link
                  const celularLimpo = motorista.celular.replace(/\D/g, '');
                  const whatsappLink = `https://api.whatsapp.com/send?phone=55${celularLimpo}&text=Aqui+%C3%A9+a+Temelio.+Vai+tudo+bem%3F+%F0%9F%98%89`;
                  
                  return (
                    <tr key={motorista.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{motorista.nomeCompleto}</div>
                          <div className="text-sm text-gray-500">{motorista.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCPF(motorista.cpf)}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getTipoVeiculoLabel(motorista.tipoVeiculo)}
                          </div>
                          {motorista.placaVeiculo && (
                            <div className="text-sm text-gray-500">{motorista.placaVeiculo}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span 
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getStatusColor(motorista.status)}`}
                            title={motorista.status}
                          >
                            {getStatusIcon(motorista.status)}
                          </span>
                          {elegivel ? (
                            <CheckCircle className="w-5 h-5 text-green-600" title="Elegível" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" title="Não Elegível" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a 
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full transition"
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(motorista.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleChangeStatus(motorista.id, motorista.status)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Alterar Status"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <MotoristaModal
          motoristaId={editingId}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
        />
      )}

      {showStatusModal && selectedMotoristaId && (
        <StatusModal
          motoristaId={selectedMotoristaId}
          currentStatus={selectedMotoristaStatus}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedMotoristaId(null);
          }}
        />
      )}
    </div>
  );
}

// Modal de Mudança de Status
function StatusModal({ motoristaId, currentStatus, onClose }: { motoristaId: string; currentStatus: string; onClose: () => void }) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [motivo, setMotivo] = useState('');
  const queryClient = useQueryClient();

  const statusQueRequeremMotivo = ['EXCLUIDO', 'INATIVO', 'SUSPENSO'];
  const precisaMotivo = statusQueRequeremMotivo.includes(newStatus);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/gestao/motoristas/${motoristaId}/status`, {
        status: newStatus,
        motivo: precisaMotivo ? motivo : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao alterar status');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (precisaMotivo && !motivo.trim()) {
      alert('Motivo é obrigatório para este status');
      return;
    }

    if (window.confirm(`Confirma a alteração de status para ${newStatus}?`)) {
      mutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Alterar Status do Motorista</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Novo Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ONBOARDING">🚀 Onboarding</option>
              <option value="ATIVO">✅ Ativo</option>
              <option value="INATIVO">⏸️ Inativo</option>
              <option value="SUSPENSO">⚠️ Suspenso</option>
              <option value="EXCLUIDO">🗑️ Excluído</option>
            </select>
          </div>

          {precisaMotivo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                required
                placeholder="Descreva o motivo da alteração de status..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Obrigatório para Inativo, Suspenso e Excluído</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {mutation.isPending ? 'Salvando...' : 'Confirmar Alteração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Criação/Edição (mantém o código existente completo)
function MotoristaModal({ motoristaId, onClose }: { motoristaId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEditing = !!motoristaId;

  const [formData, setFormData] = useState({
    transporterId: '',
    nomeCompleto: '',
    cpf: '',
    dataNascimento: '',
    email: '',
    celular: '',
    chavePix: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: 'DF',
    tipoVeiculo: 'CARGO_VAN',
    propriedadeVeiculo: 'PROPRIO',
    placaVeiculo: '',
    anoFabricacaoVeiculo: 2020,
    status: 'ONBOARDING',
    numeroCNH: '',
    validadeCNH: '',
    anoLicenciamento: new Date().getFullYear(),
    dataVerificacaoBRK: '',
    proximaVerificacaoBRK: '',
    statusBRK: false,
    numeroContrato: '',
    dataAssinatura: '',
    dataVigenciaInicial: '',
    cnpjMEI: '',
    razaoSocialMEI: '',
  });

  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cnhError, setCnhError] = useState('');

  const { data: motoristaData, isLoading: loadingMotorista } = useQuery({
    queryKey: ['motorista', motoristaId],
    queryFn: async () => {
      if (!motoristaId) return null;
      const response = await api.get(`/gestao/motoristas/${motoristaId}`);
      return response.data?.data?.motorista || response.data?.motorista || response.data;
    },
    enabled: !!motoristaId,
  });

  useEffect(() => {
    if (motoristaData && isEditing) {
      const doc = motoristaData.documentos?.[0] || {};
      const contrato = motoristaData.contratos?.[0] || {};

      setFormData({
        transporterId: motoristaData.transporterId || '',
        nomeCompleto: motoristaData.nomeCompleto || '',
        cpf: motoristaData.cpf || '',
        dataNascimento: motoristaData.dataNascimento ? motoristaData.dataNascimento.split('T')[0] : '',
        email: motoristaData.email || '',
        celular: motoristaData.celular || '',
        chavePix: motoristaData.chavePix || '',
        cep: motoristaData.cep || '',
        logradouro: motoristaData.logradouro || '',
        numero: motoristaData.numero || '',
        complemento: motoristaData.complemento || '',
        bairro: motoristaData.bairro || '',
        cidade: motoristaData.cidade || '',
        uf: motoristaData.uf || 'DF',
        tipoVeiculo: motoristaData.tipoVeiculo || 'CARGO_VAN',
        propriedadeVeiculo: motoristaData.propriedadeVeiculo || 'PROPRIO',
        placaVeiculo: motoristaData.placaVeiculo || '',
        anoFabricacaoVeiculo: motoristaData.anoFabricacaoVeiculo || 2020,
        status: motoristaData.status || 'ONBOARDING',
        numeroCNH: doc.numeroCNH || '',
        validadeCNH: doc.validadeCNH ? doc.validadeCNH.split('T')[0] : '',
        anoLicenciamento: doc.anoLicenciamento || new Date().getFullYear(),
        dataVerificacaoBRK: doc.dataVerificacaoBRK ? doc.dataVerificacaoBRK.split('T')[0] : '',
        proximaVerificacaoBRK: doc.proximaVerificacaoBRK ? doc.proximaVerificacaoBRK.split('T')[0] : '',
        statusBRK: doc.statusBRK || false,
        numeroContrato: contrato.numeroContrato || '',
        dataAssinatura: contrato.dataAssinatura ? contrato.dataAssinatura.split('T')[0] : '',
        dataVigenciaInicial: contrato.dataVigenciaInicial ? contrato.dataVigenciaInicial.split('T')[0] : '',
        cnpjMEI: contrato.cnpjMEI || '',
        razaoSocialMEI: contrato.razaoSocialMEI || '',
      });
    }
  }, [motoristaData, isEditing]);

  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || '',
        }));
      } else {
        alert('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP');
    } finally {
      setLoadingCEP(false);
    }
  };

  const validarCNH = (data: string) => {
    if (!data) {
      setCnhError('');
      return true;
    }

    const dataValidadeCNH = new Date(data);
    const dataMinima = new Date();
    dataMinima.setDate(dataMinima.getDate() + 15);
    
    if (dataValidadeCNH < dataMinima) {
      setCnhError('A validade da CNH deve ser maior que hoje + 15 dias');
      return false;
    }
    
    setCnhError('');
    return true;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        transporterId: data.transporterId || null,
        nomeCompleto: data.nomeCompleto,
        cpf: data.cpf.replace(/\D/g, ''),
        dataNascimento: data.dataNascimento || null,
        email: data.email,
        celular: data.celular.replace(/\D/g, ''),
        chavePix: data.chavePix || null,
        cep: data.cep ? data.cep.replace(/\D/g, '') : null,
        logradouro: data.logradouro || null,
        numero: data.numero || null,
        complemento: data.complemento || null,
        bairro: data.bairro || null,
        cidade: data.cidade,
        uf: data.uf,
        tipoVeiculo: data.tipoVeiculo,
        propriedadeVeiculo: data.propriedadeVeiculo,
        placaVeiculo: data.placaVeiculo || null,
        anoFabricacaoVeiculo: parseInt(data.anoFabricacaoVeiculo),
        status: data.status,
        numeroCNH: data.numeroCNH || null,
        validadeCNH: data.validadeCNH || null,
        anoLicenciamento: parseInt(data.anoLicenciamento),
        dataVerificacaoBRK: data.dataVerificacaoBRK || null,
        proximaVerificacaoBRK: data.proximaVerificacaoBRK || null,
        statusBRK: data.statusBRK,
        numeroContrato: data.numeroContrato || null,
        dataAssinatura: data.dataAssinatura || null,
        dataVigenciaInicial: data.dataVigenciaInicial || null,
        cnpjMEI: data.cnpjMEI ? data.cnpjMEI.replace(/\D/g, '') : null,
        razaoSocialMEI: data.razaoSocialMEI || null,
      };

      if (isEditing) {
        return api.put(`/gestao/motoristas/${motoristaId}`, payload);
      }
      return api.post('/gestao/motoristas', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      onClose();
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao salvar motorista';
      alert(mensagem);
      console.error('Erro:', error.response?.data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.validadeCNH && !validarCNH(formData.validadeCNH)) {
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isEditing && loadingMotorista) {
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
      <div className="bg-white rounded-lg max-w-6xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Motorista' : 'Novo Motorista'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
                <input
                  type="text"
                  required
                  value={formatCPF(formData.cpf)}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Celular *</label>
                <input
                  type="tel"
                  required
                  value={formatCelular(formData.celular)}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chave PIX</label>
                <input
                  type="text"
                  value={formData.chavePix}
                  onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                  placeholder="CPF, e-mail, celular ou chave aleatória"
                  maxLength={60}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                  <option value="SUSPENSO">Suspenso</option>
                </select>
              </div>
              {isEditing && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transporter ID</label>
                  <input
                    type="text"
                    value={formData.transporterId}
                    onChange={(e) => setFormData({ ...formData, transporterId: e.target.value })}
                    maxLength={14}
                    placeholder="ID externo do sistema de transporte"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Preencher após concluir onboarding</p>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                <input
                  type="text"
                  value={formatCEP(formData.cep)}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  onBlur={(e) => buscarCEP(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {loadingCEP && <p className="text-xs text-blue-600 mt-1">Buscando CEP...</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Logradouro</label>
                <input
                  type="text"
                  value={formData.logradouro}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                <input
                  type="text"
                  required
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UF *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Veículo */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Veículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Veículo *</label>
                <select
                  value={formData.tipoVeiculo}
                  onChange={(e) => setFormData({ ...formData, tipoVeiculo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MOTOCICLETA">Motocicleta</option>
                  <option value="CARRO_PASSEIO">Carro Passeio</option>
                  <option value="CARGO_VAN">Cargo Van</option>
                  <option value="LARGE_VAN">Large Van</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Propriedade *</label>
                <select
                  value={formData.propriedadeVeiculo}
                  onChange={(e) => setFormData({ ...formData, propriedadeVeiculo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PROPRIO">Veículo Próprio</option>
                  <option value="TRANSPORTADORA">Veículo da Transportadora</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                <input
                  type="text"
                  value={formData.placaVeiculo}
                  onChange={(e) => setFormData({ ...formData, placaVeiculo: e.target.value.toUpperCase() })}
                  maxLength={7}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ano Fabricação *</label>
                <input
                  type="number"
                  required
                  min="1990"
                  max={new Date().getFullYear()}
                  value={formData.anoFabricacaoVeiculo}
                  onChange={(e) => setFormData({ ...formData, anoFabricacaoVeiculo: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documentação</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número CNH</label>
                <input
                  type="text"
                  value={formData.numeroCNH}
                  onChange={(e) => setFormData({ ...formData, numeroCNH: e.target.value })}
                  maxLength={11}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Validade CNH</label>
                <input
                  type="date"
                  value={formData.validadeCNH}
                  onChange={(e) => {
                    setFormData({ ...formData, validadeCNH: e.target.value });
                    validarCNH(e.target.value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    cnhError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {cnhError && <p className="text-xs text-red-600 mt-1">{cnhError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ano Licenciamento</label>
                <input
                  type="number"
                  min="2020"
                  max={new Date().getFullYear()}
                  value={formData.anoLicenciamento}
                  onChange={(e) => setFormData({ ...formData, anoLicenciamento: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Verificação BRK */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Verificação BRK (Background Check)</h3>
            <p className="text-sm text-gray-600 mb-4">
              A verificação BRK é obrigatória para elegibilidade do motorista
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Verificação</label>
                <input
                  type="date"
                  value={formData.dataVerificacaoBRK}
                  onChange={(e) => setFormData({ ...formData, dataVerificacaoBRK: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Próxima Verificação</label>
                <input
                  type="date"
                  value={formData.proximaVerificacaoBRK}
                  onChange={(e) => setFormData({ ...formData, proximaVerificacaoBRK: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Renovação a cada 12 meses</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status BRK</label>
                <select
                  value={formData.statusBRK ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, statusBRK: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="false">❌ Não Aprovado / Pendente</option>
                  <option value="true">✅ Aprovado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contrato e MEI */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contrato e Dados MEI</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número do Contrato</label>
                <input
                  type="text"
                  value={formData.numeroContrato}
                  onChange={(e) => setFormData({ ...formData, numeroContrato: e.target.value })}
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Assinatura</label>
                <input
                  type="date"
                  value={formData.dataAssinatura}
                  onChange={(e) => setFormData({ ...formData, dataAssinatura: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Vigência Inicial</label>
                <input
                  type="date"
                  value={formData.dataVigenciaInicial}
                  onChange={(e) => setFormData({ ...formData, dataVigenciaInicial: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ MEI</label>
                <input
                  type="text"
                  value={formatCNPJ(formData.cnpjMEI)}
                  onChange={(e) => setFormData({ ...formData, cnpjMEI: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Razão Social MEI</label>
                <input
                  type="text"
                  value={formData.razaoSocialMEI}
                  onChange={(e) => setFormData({ ...formData, razaoSocialMEI: e.target.value })}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
              disabled={saveMutation.isPending || !!cnhError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Motorista')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}