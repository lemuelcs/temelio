import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rotas
import authRoutes from './routes/auth.routes';
import rotaRoutes from './routes/rota.routes';
import disponibilidadeMotoristaRoutes from './routes/disponibilidade.motorista.routes';
import disponibilidadesGestaoRoutes from './routes/disponibilidades.gestao.routes';
import localRoutes from './routes/local.routes';
import precoRoutes from './routes/preco.routes';
import alertaRoutes from './routes/alerta.routes';
import kpiRoutes from './routes/kpi.routes';
import tabelaPrecosRoutes from './routes/tabelaPrecos.routes';
import dashboardRoutes from './routes/dashboard.routes';
import gestaoMotoristasRoutes from './routes/gestao.motoristas.routes';


// Importar middlewares
import { errorHandler } from './middlewares/error.middleware';

// Carregar variáveis de ambiente
dotenv.config();

const app: Application = express();

// ========================================
// MIDDLEWARES GLOBAIS
// ========================================

// CORS - permitir requisições de outros domínios
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Parse de JSON
app.use(express.json());

// Parse de URL encoded
app.use(express.urlencoded({ extended: true }));

// ========================================
// ROTA DE SAÚDE (Health Check)
// ========================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🚚 API Transportadora - Sistema de Gestão',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ========================================
// ROTAS DA API
// ========================================

app.use('/api/auth', authRoutes);
app.use('/api/rotas', rotaRoutes);
app.use('/api/motorista/disponibilidades', disponibilidadeMotoristaRoutes);
app.use('/api/gestao/disponibilidades', disponibilidadesGestaoRoutes);
app.use('/api/locais', localRoutes);
app.use('/api/precos', precoRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/tabela-precos', tabelaPrecosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gestao/motoristas', gestaoMotoristasRoutes);

// ========================================
// MIDDLEWARE DE ERRO (DEVE SER O ÚLTIMO)
// ========================================

app.use(errorHandler);

export default app;