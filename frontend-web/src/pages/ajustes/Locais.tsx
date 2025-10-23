// frontend/src/pages/ajustes/Locais.tsx
// CORRIGIDO: Tratamento do erro "locais.map is not a function"

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Power, PowerOff, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface Local {
  id: string;
  codigo: string;
  nome: string;
  endereco: string;
  cep: string;
  latitude: number;
  longitude: number;
  cidade: string;
  uf: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  codigo: string;
  nome: string;
  endereco: string;
  cep: string;
  latitude: number;
  longitude: number;
  cidade: string;
  uf: string;
}

const Locais: React.FC = () => {
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    ativo: true,
    cidade: '',
    uf: ''
  });

  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nome: '',
    endereco: '',
    cep: '',
    latitude: 0,
    longitude: 0,
    cidade: '',
    uf: ''
  });

  // Carregar locais
  useEffect(() => {
    carregarLocais();
  }, [filtros]);

  const carregarLocais = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (filtros.ativo !== undefined) {
        params.append('ativo', String(filtros.ativo));
      }
      if (filtros.cidade) {
        params.append('cidade', filtros.cidade);
      }
      if (filtros.uf) {
        params.append('uf', filtros.uf);
      }

      const response = await api.get(`/locais?${params.toString()}`);
      
      // CORREÇÃO CRÍTICA: Tratar diferentes estruturas de resposta da API
      let dadosLocais = response.data?.data?.locais || 
                       response.data?.data || 
                       response.data?.locais || 
                       response.data;
      
      // Se não for array, tentar converter ou usar array vazio
      if (!Array.isArray(dadosLocais)) {
        console.warn('Resposta da API não é um array:', dadosLocais);
        dadosLocais = [];
      }
      
      setLocais(dadosLocais);
    } catch (error: any) {
      console.error('Erro ao carregar locais:', error);
      setError(error.response?.data?.message || 'Erro ao carregar locais');
      setLocais([]); // IMPORTANTE: Garantir que locais seja sempre array
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para novo local
  const abrirModalNovo = () => {
    setEditingId(null);
    setFormData({
      codigo: '',
      nome: '',
      endereco: '',
      cep: '',
      latitude: 0,
      longitude: 0,
      cidade: '',
      uf: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (local: Local) => {
    setEditingId(local.id);
    setFormData({
      codigo: local.codigo,
      nome: local.nome,
      endereco: local.endereco,
      cep: local.cep,
      latitude: local.latitude,
      longitude: local.longitude,
      cidade: local.cidade,
      uf: local.uf
    });
    setShowModal(true);
  };

  // Salvar (criar ou atualizar)
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Atualizar
        await api.put(`/locais/${editingId}`, formData);
        alert('Local atualizado com sucesso!');
      } else {
        // Criar
        await api.post('/locais', formData);
        alert('Local cadastrado com sucesso!');
      }

      setShowModal(false);
      carregarLocais();
    } catch (error: any) {
      console.error('Erro ao salvar local:', error);
      alert(error.response?.data?.message || 'Erro ao salvar local');
    }
  };

  // Alternar status
  const handleToggleStatus = async (id: string, ativoAtual: boolean) => {
    const acao = ativoAtual ? 'desativar' : 'ativar';
    
    if (!confirm(`Deseja ${acao} este local?`)) {
      return;
    }

    try {
      await api.patch(`/locais/${id}/status`, { ativo: !ativoAtual });
      alert(`Local ${acao === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`);
      carregarLocais();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      alert(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  // Deletar
  const handleDeletar = async (id: string) => {
    if (!confirm('Deseja realmente deletar este local?')) {
      return;
    }

    try {
      await api.delete(`/locais/${id}`);
      alert('Local deletado com sucesso!');
      carregarLocais();
    } catch (error: any) {
      console.error('Erro ao deletar local:', error);
      alert(error.response?.data?.message || 'Erro ao deletar local');
    }
  };

  // Formatar CEP
  const formatarCEP = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 5) {
      return apenasNumeros;
    }
    return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5, 8)}`;
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarCEP(e.target.value);
    setFormData({ ...formData, cep: valorFormatado });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locais (Estações Amazon)</h1>
          <p className="text-gray-600 mt-1">Gerenciar locais de operação</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={carregarLocais}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={abrirModalNovo}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Local
          </button>
        </div>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Erro ao carregar locais</p>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={carregarLocais}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={filtros.cidade}
              onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })}
              placeholder="Filtrar por cidade"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UF
            </label>
            <input
              type="text"
              value={filtros.uf}
              onChange={(e) => setFiltros({ ...filtros, uf: e.target.value.toUpperCase() })}
              placeholder="UF"
              maxLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md uppercase"
            />
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filtros.ativo ? 'true' : 'false'}
              onChange={(e) => setFiltros({ ...filtros, ativo: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Locais */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando locais...</p>
        </div>
      ) : locais.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {error ? 'Erro ao carregar locais' : 'Nenhum local cadastrado ainda'}
          </p>
          <p className="text-sm text-gray-500">
            Clique em "Novo Local" para cadastrar o primeiro local
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CEP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cidade/UF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locais.map((local) => (
                <tr key={local.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {local.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {local.nome}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {local.endereco}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {local.cep}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {local.cidade}/{local.uf}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        local.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {local.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirModalEditar(local)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(local.id, local.ativo)}
                        className={local.ativo ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                        title={local.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {local.ativo ? <PowerOff size={18} /> : <Power size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeletar(local.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Deletar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingId ? 'Editar Local' : 'Novo Local'}
              </h2>

              <form onSubmit={handleSalvar} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Código */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!!editingId}
                    />
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* CEP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={handleCEPChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Latitude */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Longitude */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Cidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* UF */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.uf}
                      onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 uppercase"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingId ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Locais;