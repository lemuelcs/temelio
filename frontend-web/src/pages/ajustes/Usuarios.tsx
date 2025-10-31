import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, AlertCircle, X, Key, UserCheck, UserX, Shield, User, Truck } from 'lucide-react';
import api from '../../services/api';

interface Usuario {
  id: string;
  email: string;
  nome: string;
  perfil: 'DESPACHANTE_PLANEJADOR' | 'MOTORISTA' | 'ADMINISTRADOR';
  ativo: boolean;
  deveAlterarSenha: boolean;
  createdAt: string;
  updatedAt: string;
  motorista?: {
    id: string;
    nomeCompleto: string;
    status: string;
  };
}

const perfilLabels: Record<string, string> = {
  DESPACHANTE_PLANEJADOR: 'Despachante/Planejador',
  MOTORISTA: 'Motorista',
  ADMINISTRADOR: 'Administrador'
};

const perfilIcons: Record<string, any> = {
  DESPACHANTE_PLANEJADOR: Shield,
  MOTORISTA: Truck,
  ADMINISTRADOR: User
};

const perfilColors: Record<string, string> = {
  DESPACHANTE_PLANEJADOR: 'bg-blue-100 text-blue-800 border-blue-200',
  MOTORISTA: 'bg-green-100 text-green-800 border-green-200',
  ADMINISTRADOR: 'bg-purple-100 text-purple-800 border-purple-200'
};

function UsuarioModal({ usuarioId, onClose }: { usuarioId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    perfil: 'DESPACHANTE_PLANEJADOR',
    senha: '',
    confirmarSenha: '',
    deveAlterarSenha: true
  });

  // Carregar dados do usuário se estiver editando
  const { data: usuario, isLoading } = useQuery({
    queryKey: ['usuario', usuarioId],
    queryFn: async () => {
      if (!usuarioId) return null;
      const response = await api.get(`/gestao/usuarios/${usuarioId}`);
      return response.data?.data;
    },
    enabled: !!usuarioId,
  });

  // Atualizar formulário quando dados do usuário forem carregados
  useEffect(() => {
    if (usuario) {
      setFormData({
        email: usuario.email || '',
        nome: usuario.nome || '',
        perfil: usuario.perfil || 'DESPACHANTE_PLANEJADOR',
        senha: '',
        confirmarSenha: '',
        deveAlterarSenha: usuario.deveAlterarSenha || false
      });
    }
  }, [usuario]);

  // Mutation para criar/atualizar
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (usuarioId) {
        // Atualizar
        const { senha, confirmarSenha, ...updateData } = data;
        return await api.put(`/gestao/usuarios/${usuarioId}`, updateData);
      } else {
        // Criar
        return await api.post('/gestao/usuarios', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      onClose();
      alert(usuarioId ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao salvar usuário');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!usuarioId) {
      if (!formData.senha) {
        alert('Senha é obrigatória para novos usuários');
        return;
      }
      if (formData.senha !== formData.confirmarSenha) {
        alert('As senhas não coincidem');
        return;
      }
      if (formData.senha.length < 6) {
        alert('A senha deve ter no mínimo 6 caracteres');
        return;
      }
    }

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {usuarioId ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informações Básicas</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perfil *
              </label>
              <select
                required
                value={formData.perfil}
                onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DESPACHANTE_PLANEJADOR">Despachante/Planejador</option>
                <option value="MOTORISTA">Motorista</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </div>
          </div>

          {/* Senha (apenas para novo usuário) */}
          {!usuarioId && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Senha de Acesso</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="deveAlterarSenha"
                  checked={formData.deveAlterarSenha}
                  onChange={(e) => setFormData({ ...formData, deveAlterarSenha: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="deveAlterarSenha" className="ml-2 text-sm text-gray-700">
                  Senha temporária (usuário deverá alterar no primeiro login)
                </label>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saveMutation.isLoading ? 'Salvando...' : usuarioId ? 'Salvar Alterações' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AlterarSenhaModal({ usuarioId, usuarioNome, onClose }: { usuarioId: string; usuarioNome: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    novaSenha: '',
    confirmarSenha: '',
    senhaTemporaria: true
  });

  const alterarSenhaMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.patch(`/gestao/usuarios/${usuarioId}/senha`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      onClose();
      alert('Senha alterada com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao alterar senha');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.novaSenha) {
      alert('Nova senha é obrigatória');
      return;
    }
    if (formData.novaSenha !== formData.confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }
    if (formData.novaSenha.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    alterarSenhaMutation.mutate({
      novaSenha: formData.novaSenha,
      senhaTemporaria: formData.senhaTemporaria
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Alterar Senha
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Alterando senha de: <strong>{usuarioNome}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha *
            </label>
            <input
              type="password"
              required
              value={formData.novaSenha}
              onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha *
            </label>
            <input
              type="password"
              required
              value={formData.confirmarSenha}
              onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="senhaTemporaria"
              checked={formData.senhaTemporaria}
              onChange={(e) => setFormData({ ...formData, senhaTemporaria: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="senhaTemporaria" className="ml-2 text-sm text-gray-700">
              <strong>Senha temporária</strong> - usuário deverá alterar no próximo login
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={alterarSenhaMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {alterarSenhaMutation.isLoading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Usuarios() {
  const [showModal, setShowModal] = useState(false);
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerfil, setFilterPerfil] = useState('');
  const [filterAtivo, setFilterAtivo] = useState('');

  const queryClient = useQueryClient();

  // Buscar usuários
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', filterPerfil, filterAtivo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterPerfil) params.append('perfil', filterPerfil);
      if (filterAtivo) params.append('ativo', filterAtivo);

      const response = await api.get(`/gestao/usuarios?${params.toString()}`);
      return response.data?.data?.usuarios || [];
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gestao/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      alert('Usuário excluído com sucesso!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao excluir usuário');
    }
  });

  // Mutation para ativar/desativar
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/gestao/usuarios/${id}/ativo`, { ativo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao alterar status do usuário');
    }
  });

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleDelete = async (usuario: Usuario) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(usuario.id);
    }
  };

  const handleAlterarSenha = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowSenhaModal(true);
  };

  const handleToggleAtivo = (usuario: Usuario) => {
    const acao = usuario.ativo ? 'desativar' : 'ativar';
    if (window.confirm(`Tem certeza que deseja ${acao} o usuário "${usuario.nome}"?`)) {
      toggleAtivoMutation.mutate({ id: usuario.id, ativo: !usuario.ativo });
    }
  };

  // Filtrar e agrupar usuários
  const filteredUsuarios = usuarios.filter((u: Usuario) => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Agrupar por perfil e ordenar por data (mais recentes primeiro)
  const usuariosAgrupados = filteredUsuarios.reduce((acc: any, usuario: Usuario) => {
    if (!acc[usuario.perfil]) {
      acc[usuario.perfil] = [];
    }
    acc[usuario.perfil].push(usuario);
    return acc;
  }, {});

  // Ordenar cada grupo por data de criação (mais recentes primeiro)
  Object.keys(usuariosAgrupados).forEach(perfil => {
    usuariosAgrupados[perfil].sort((a: Usuario, b: Usuario) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {/* Alerta */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Atenção:</strong> Apenas administradores podem gerenciar usuários do sistema.
              Usuários inativos não conseguem fazer login.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterPerfil}
            onChange={(e) => setFilterPerfil(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Perfis</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="DESPACHANTE_PLANEJADOR">Despachante/Planejador</option>
            <option value="MOTORISTA">Motorista</option>
          </select>

          <select
            value={filterAtivo}
            onChange={(e) => setFilterAtivo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      )}

      {/* Lista de Usuários Agrupados */}
      {!isLoading && Object.keys(usuariosAgrupados).length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum usuário encontrado</p>
        </div>
      )}

      {!isLoading && Object.keys(usuariosAgrupados).map(perfil => {
        const PerfilIcon = perfilIcons[perfil] || User;

        return (
          <div key={perfil} className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <PerfilIcon className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {perfilLabels[perfil]}
                </h2>
                <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                  {usuariosAgrupados[perfil].length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Senha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastro
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosAgrupados[perfil].map((usuario: Usuario) => (
                    <tr key={usuario.id} className={!usuario.ativo ? 'bg-gray-50 opacity-60' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {usuario.perfil === 'MOTORISTA' && (
                            <Truck className="w-4 h-4 text-green-600 mr-2" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.nome}
                            </div>
                            {usuario.motorista && (
                              <div className="text-xs text-gray-500">
                                {usuario.motorista.nomeCompleto}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{usuario.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          usuario.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usuario.deveAlterarSenha ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Temporária
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Definida
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAlterarSenha(usuario)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Alterar Senha"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAtivo(usuario)}
                            className={`p-2 rounded-lg transition ${
                              usuario.ativo
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={usuario.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {usuario.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(usuario.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(usuario)}
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
          </div>
        );
      })}

      {/* Modals */}
      {showModal && (
        <UsuarioModal
          usuarioId={editingId}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
        />
      )}

      {showSenhaModal && selectedUsuario && (
        <AlterarSenhaModal
          usuarioId={selectedUsuario.id}
          usuarioNome={selectedUsuario.nome}
          onClose={() => {
            setShowSenhaModal(false);
            setSelectedUsuario(null);
          }}
        />
      )}
    </div>
  );
}
