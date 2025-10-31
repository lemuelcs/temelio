// frontend/src/pages/Motorista/Dashboard.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { OfertaRota, Rota } from '../../types';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Badge as MuiBadge,
  IconButton,
  Divider
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  LocalShipping as TruckIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

// ============================================================================
// INTERFACES
// ============================================================================

interface DashboardData {
  motorista: {
    nomeCompleto: string;
    nivel: string;
    pontuacao: number;
    proximoNivel: string;
    pontosProximoNivel: number;
    badge: string;
  };
  disponibilidade: {
    semanaAtualPreenchida: boolean;
    proximaSemanaPreenchida: boolean;
    diasDisponiveis: number;
    totalDiasSemana: number;
  };
  faturamento: {
    mesAtual: number;
    mesAnterior: number;
    projecaoMes: number;
    rotasRealizadas: number;
  };
  rotasPendentes: {
    quantidade: number;
    proximaData: string | null;
    turno: string | null;
  };
  performance: {
    taxaConclusao: number;
    taxaPontuacao: number;
    avaliacaoMedia: number;
  };
}

// ============================================================================
// CONFIGURAÇÃO DE BADGES POR NÍVEL
// ============================================================================

const BADGES_CONFIG = {
  ELITE: {
    cor: '#FFD700',
    gradiente: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    icone: '👑',
    titulo: 'ELITE',
    descricao: 'Excelência Máxima'
  },
  OURO: {
    cor: '#FFA500',
    gradiente: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
    icone: '🥇',
    titulo: 'OURO',
    descricao: 'Alta Performance'
  },
  PRATA: {
    cor: '#C0C0C0',
    gradiente: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
    icone: '🥈',
    titulo: 'PRATA',
    descricao: 'Boa Performance'
  },
  BRONZE: {
    cor: '#CD7F32',
    gradiente: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
    icone: '🥉',
    titulo: 'BRONZE',
    descricao: 'Em Desenvolvimento'
  },
  INICIANTE: {
    cor: '#4A90E2',
    gradiente: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
    icone: '🌟',
    titulo: 'INICIANTE',
    descricao: 'Bem-vindo!'
  }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DashboardMotorista() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // BUSCAR OFERTAS DE ROTAS PENDENTES
  // ========================================================================

  const { data: rotasOferecidas = [], isLoading: loadingOfertas, refetch: refetchOfertas } = useQuery({
    queryKey: ['rotas-oferecidas', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/ofertas-rotas', {
          params: {
            motoristaId: user?.id,
            status: 'PENDENTE',
          },
        });
        const dados = response.data?.data?.ofertas || response.data?.ofertas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas oferecidas:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // ========================================================================
  // MUTATIONS PARA ACEITAR/RECUSAR OFERTAS
  // ========================================================================

  const aceitarOfertaMutation = useMutation({
    mutationFn: async (ofertaId: string) => {
      return api.patch(`/ofertas-rotas/${ofertaId}/aceitar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-oferecidas'] });
      carregarDashboard(); // Atualiza os dados do dashboard também
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao aceitar oferta');
    },
  });

  const recusarOfertaMutation = useMutation({
    mutationFn: async ({ ofertaId, motivo }: { ofertaId: string; motivo: string }) => {
      return api.patch(`/ofertas-rotas/${ofertaId}/recusar`, { motivoRecusa: motivo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-oferecidas'] });
      carregarDashboard(); // Atualiza os dados do dashboard também
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao recusar oferta');
    },
  });

  // ========================================================================
  // HANDLERS PARA ACEITAR/RECUSAR
  // ========================================================================

  const handleAceitarOferta = (ofertaId: string) => {
    if (confirm('Deseja aceitar esta rota?')) {
      aceitarOfertaMutation.mutate(ofertaId);
    }
  };

  const handleRecusarOferta = (ofertaId: string) => {
    const motivo = prompt('Por que você está recusando esta rota? (opcional)');
    if (motivo !== null) { // Usuário não cancelou o prompt
      recusarOfertaMutation.mutate({ ofertaId, motivo: motivo || 'Não informado' });
    }
  };

  // ========================================================================
  // CARREGAR DADOS DO DASHBOARD
  // ========================================================================

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/motoristas/dashboard');
      setData(response.data.data);
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Carregando seu painel...
          </Typography>
        </Box>
      </Container>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (error || !data) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || 'Erro ao carregar dados do dashboard'}
        </Alert>
      </Container>
    );
  }

  // ========================================================================
  // FUNÇÕES AUXILIARES PARA FORMATAÇÃO
  // ========================================================================

  const normalizarDataUtcParaLocal = (valor: string) => {
    const parsed = new Date(valor);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  };

  const getDiaDaRota = (dataRota: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const dataReferencia = normalizarDataUtcParaLocal(dataRota);
    const dataComparacao = dataReferencia ? new Date(dataReferencia) : null;
    if (dataComparacao) {
      dataComparacao.setHours(0, 0, 0, 0);
    }

    const dataCompleta = dataReferencia
      ? dataReferencia.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '';

    if (dataComparacao && dataComparacao.getTime() === hoje.getTime()) {
      return { texto: 'HOJE', dataCompleta };
    }

    if (dataComparacao && dataComparacao.getTime() === amanha.getTime()) {
      return { texto: 'AMANHÃ', dataCompleta };
    }

    if (dataComparacao) {
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return { texto: diasSemana[dataComparacao.getDay()], dataCompleta };
    }

    return { texto: 'Data indisponível', dataCompleta };
  };

  const calcularHorarioColeta = (horaInicio?: string | null) => {
    if (!horaInicio) return '';

    const formatoHorarioSimples = /^(\d{2}):(\d{2})/;
    let minutosTotal = 0;

    const correspondenciaSimples = formatoHorarioSimples.exec(horaInicio);
    if (correspondenciaSimples) {
      const hora = Number(correspondenciaSimples[1]);
      const minuto = Number(correspondenciaSimples[2]);
      minutosTotal = hora * 60 + minuto;
    } else {
      const parsed = new Date(horaInicio);
      if (!Number.isNaN(parsed.getTime())) {
        minutosTotal = parsed.getUTCHours() * 60 + parsed.getUTCMinutes();
      }
    }

    if (minutosTotal === 0) return '';

    // Subtrair 45 minutos
    minutosTotal -= 45;
    if (minutosTotal < 0) minutosTotal += 24 * 60; // Ajuste para dia anterior

    const horaColeta = Math.floor(minutosTotal / 60);
    const minutoColeta = minutosTotal % 60;

    return `${String(horaColeta).padStart(2, '0')}:${String(minutoColeta).padStart(2, '0')}`;
  };

  const formatHoraRota = (valor?: string | null) => {
    if (!valor) return '';
    const parsed = new Date(valor);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(11, 16);
    }

    if (typeof valor === 'string' && valor.includes(':')) {
      return valor.substring(0, 5);
    }

    return '';
  };

  const calcularValorEstimado = (rota: Rota) => {
    if (rota.valorProjetado !== undefined && rota.valorProjetado !== null) {
      return Number(rota.valorProjetado).toFixed(2);
    }

    const valorHora = rota.valorHora ?? 0;
    const horas = rota.tamanhoHoras ?? rota.horasEstimadas ?? 0;
    return Number(valorHora * horas).toFixed(2);
  };

  const obterDuracaoHoras = (rota: Rota) => rota.tamanhoHoras ?? rota.horasEstimadas ?? 0;

  // ========================================================================
  // CONFIGURAÇÃO DO BADGE ATUAL
  // ========================================================================

  const badgeConfig = BADGES_CONFIG[data.motorista.nivel as keyof typeof BADGES_CONFIG] || BADGES_CONFIG.INICIANTE;
  const progressoNivel = (data.motorista.pontuacao / data.motorista.pontosProximoNivel) * 100;

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {/* ====================================================================== */}
      {/* CARD DE DESTAQUE: OFERTAS DE ROTAS PENDENTES */}
      {/* ====================================================================== */}

      {rotasOferecidas.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {rotasOferecidas.map((oferta: OfertaRota) => {
            const rota = oferta.rota!;
            const dia = getDiaDaRota(rota.dataRota);
            const horarioColeta = calcularHorarioColeta(rota.horaInicio);
            const valorEstimado = calcularValorEstimado(rota);
            const origem: any = (rota as any).localOrigem || (rota as any).local;
            const nomeOrigem = origem?.nome || 'Local não informado';
            const enderecoOrigem = origem
              ? `${origem.endereco || ''}${origem.cidade ? `, ${origem.cidade}` : ''}${
                  origem.estado ? ` - ${origem.estado}` : ''
                }`
              : '';

            return (
              <Card
                key={oferta.id}
                sx={{
                  mb: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  {/* Cabeçalho com Notificação */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <NotificationIcon sx={{ fontSize: 48, mr: 2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        🚨 Nova Rota Disponível!
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.95 }}>
                        Aceite agora para garantir esta rota
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 3 }} />

                  {/* Informação do Dia da Rota */}
                  <Box sx={{ mb: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {dia.texto}
                      </Typography>
                      {dia.dataCompleta && (
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {dia.dataCompleta}
                        </Typography>
                      )}
                    </Paper>
                  </Box>

                  {/* Grid com Informações da Rota */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
                        <AccessTimeIcon sx={{ fontSize: 28, mb: 1 }} />
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, mb: 0.5 }}>
                          Horário de Coleta
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {horarioColeta}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
                        <ScheduleIcon sx={{ fontSize: 28, mb: 1 }} />
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, mb: 0.5 }}>
                          Início da Rota
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {formatHoraRota(rota.horaInicio)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
                        <TruckIcon sx={{ fontSize: 28, mb: 1 }} />
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, mb: 0.5 }}>
                          Duração
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {obterDuracaoHoras(rota)}h
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.3)', textAlign: 'center' }}>
                        <MoneyIcon sx={{ fontSize: 28, mb: 1 }} />
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, mb: 0.5 }}>
                          Valor Estimado
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          R$ {valorEstimado}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Informações Adicionais */}
                  <Box sx={{ mb: 2 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.15)' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        📍 Local de Origem
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 0.5 }}>
                        {nomeOrigem}
                      </Typography>
                      {enderecoOrigem && (
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {enderecoOrigem}
                        </Typography>
                      )}
                    </Paper>
                  </Box>

                  {rota.descricao && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        <strong>Descrição:</strong> {rota.descricao}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, gap: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<CheckIcon />}
                    onClick={() => handleAceitarOferta(oferta.id)}
                    disabled={aceitarOfertaMutation.isPending}
                    sx={{
                      backgroundColor: 'white',
                      color: '#667eea',
                      fontWeight: 'bold',
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        transform: 'scale(1.02)',
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    {aceitarOfertaMutation.isPending ? 'Aceitando...' : 'Aceitar Rota'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<CloseIcon />}
                    onClick={() => handleRecusarOferta(oferta.id)}
                    disabled={recusarOfertaMutation.isPending}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      fontWeight: 'bold',
                      py: 1.5,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    {recusarOfertaMutation.isPending ? 'Recusando...' : 'Recusar'}
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}

      <Grid container spacing={3}>
        
        {/* ================================================================== */}
        {/* COLUNA ESQUERDA */}
        {/* ================================================================== */}
        
        <Grid item xs={12} md={8}>

          {/* CARD: DISPONIBILIDADE */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">
                  Disponibilidade
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Semana Atual
                    </Typography>
                    {data.disponibilidade.semanaAtualPreenchida ? (
                      <Chip 
                        icon={<CheckIcon />} 
                        label="Preenchida" 
                        color="success" 
                        size="small"
                      />
                    ) : (
                      <Chip 
                        icon={<WarningIcon />} 
                        label="Pendente" 
                        color="warning" 
                        size="small"
                      />
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Próxima Semana
                    </Typography>
                    {data.disponibilidade.proximaSemanaPreenchida ? (
                      <Chip 
                        icon={<CheckIcon />} 
                        label="Preenchida" 
                        color="success" 
                        size="small"
                      />
                    ) : (
                      <Chip 
                        icon={<WarningIcon />} 
                        label="Pendente" 
                        color="warning" 
                        size="small"
                      />
                    )}
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Dias disponíveis: {data.disponibilidade.diasDisponiveis} de {data.disponibilidade.totalDiasSemana}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(data.disponibilidade.diasDisponiveis / data.disponibilidade.totalDiasSemana) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/motorista/disponibilidade')}
              >
                Gerenciar Disponibilidade
              </Button>
            </CardActions>
          </Card>

          {/* CARD: FATURAMENTO */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon sx={{ fontSize: 32, mr: 2, color: 'success.main' }} />
                <Typography variant="h6">
                  Faturamento
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mês Atual
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      R$ {data.faturamento.mesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mês Anterior
                    </Typography>
                    <Typography variant="h6">
                      R$ {data.faturamento.mesAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Projeção
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      R$ {data.faturamento.projecaoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Rotas realizadas este mês
                </Typography>
                <Chip 
                  icon={<TruckIcon />} 
                  label={data.faturamento.rotasRealizadas} 
                  size="small"
                  color="primary"
                />
              </Box>
            </CardContent>
          </Card>

          {/* CARD: PERFORMANCE */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUpIcon sx={{ fontSize: 32, mr: 2, color: 'info.main' }} />
                <Typography variant="h6">
                  Performance
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Taxa de Conclusão
                    </Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                      <CircularProgressWithLabel value={data.performance.taxaConclusao} />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Taxa de Pontuação
                    </Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                      <CircularProgressWithLabel value={data.performance.taxaPontuacao} />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Avaliação Média
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {data.performance.avaliacaoMedia.toFixed(1)} ⭐
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

        </Grid>

        {/* ================================================================== */}
        {/* COLUNA DIREITA - GAMIFICAÇÃO */}
        {/* ================================================================== */}
        
        <Grid item xs={12} md={4}>
          
          {/* CARD: NÍVEL E BADGE */}
          <Card 
            sx={{ 
              mb: 3,
              background: badgeConfig.gradiente,
              color: 'white',
              position: 'relative',
              overflow: 'visible'
            }}
          >
            <CardContent sx={{ textAlign: 'center', pt: 4 }}>
              
              {/* BADGE PRINCIPAL */}
              <Box 
                sx={{ 
                  fontSize: '80px',
                  mb: 2,
                  textShadow: '2px 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                {badgeConfig.icone}
              </Box>

              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                {badgeConfig.titulo}
              </Typography>

              <Typography variant="body2" sx={{ opacity: 0.9, mb: 3 }}>
                {badgeConfig.descricao}
              </Typography>

              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 2 }} />

              {/* PONTUAÇÃO ATUAL */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {data.motorista.pontuacao}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  pontos
                </Typography>
              </Box>

              {/* PROGRESSO PARA PRÓXIMO NÍVEL */}
              {data.motorista.nivel !== 'ELITE' && (
                <>
                  <Typography variant="body2" gutterBottom sx={{ opacity: 0.9 }}>
                    Próximo nível: {data.motorista.proximoNivel}
                  </Typography>
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={progressoNivel}
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'white'
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Faltam {data.motorista.pontosProximoNivel - data.motorista.pontuacao} pontos
                  </Typography>
                </>
              )}

              {data.motorista.nivel === 'ELITE' && (
                <Typography variant="body2" sx={{ opacity: 0.9, fontStyle: 'italic' }}>
                  🎉 Você está no nível máximo!
                </Typography>
              )}

            </CardContent>

            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained"
                sx={{ 
                  backgroundColor: 'white',
                  color: badgeConfig.cor,
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)'
                  }
                }}
                onClick={() => navigate('/motorista/gamificacao')}
              >
                Ver Detalhes
              </Button>
            </CardActions>
          </Card>

          {/* CARD: DICAS RÁPIDAS */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 Dicas para Melhorar
              </Typography>

              <Box sx={{ mt: 2 }}>
                {!data.disponibilidade.semanaAtualPreenchida && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Preencha sua disponibilidade para receber mais rotas!
                  </Alert>
                )}

                {data.performance.taxaConclusao < 90 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Tente concluir todas as rotas aceitas para melhorar sua pontuação.
                  </Alert>
                )}

                {data.motorista.nivel === 'INICIANTE' && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Complete suas primeiras 20 rotas para sair do nível Iniciante!
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>

        </Grid>

      </Grid>
    </Container>
  );
}

// ============================================================================
// COMPONENTE AUXILIAR: PROGRESSO CIRCULAR COM LABEL
// ============================================================================

function CircularProgressWithLabel({ value }: { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `conic-gradient(#4caf50 ${value * 3.6}deg, #e0e0e0 0deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {value}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default DashboardMotorista;
