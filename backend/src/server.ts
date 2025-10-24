import app from './app';
import logger from './lib/logger';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
    },
    'Servidor iniciado'
  );
});
