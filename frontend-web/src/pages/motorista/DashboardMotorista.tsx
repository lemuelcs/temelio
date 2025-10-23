// frontend/src/pages/Motorista/Dashboard.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
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
  Schedule as ScheduleIcon
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      {/* HEADER COM BOAS-VINDAS */}
      {/* ====================================================================== */}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Olá, {data.motorista.nomeCompleto.split(' ')[0]}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bem-vindo ao seu painel de controle
        </Typography>
      </Box>

      <Grid container spacing={3}>
        
        {/* ================================================================== */}
        {/* COLUNA ESQUERDA */}
        {/* ================================================================== */}
        
        <Grid item xs={12} md={8}>
          
          {/* CARD: ROTAS PENDENTES (PRIORIDADE) */}
          {data.rotasPendentes.quantidade > 0 && (
            <Card 
              sx={{ 
                mb: 3, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NotificationIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6">
                      🚨 Você tem {data.rotasPendentes.quantidade} rota(s) disponível(is)!
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Próxima: {data.rotasPendentes.proximaData} - Turno {data.rotasPendentes.turno}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  sx={{ 
                    backgroundColor: 'white', 
                    color: '#667eea',
                    '&:hover': { backgroundColor: '#f0f0f0' }
                  }}
                  onClick={() => navigate('/motorista/rotas')}
                >
                  Ver Rotas Disponíveis
                </Button>
              </CardActions>
            </Card>
          )}

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
