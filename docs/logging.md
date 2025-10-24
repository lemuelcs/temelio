# Logger

O backend passou a usar [Pino](https://getpino.io/) com transporte prettifier em ambiente de desenvolvimento.

## Configuração

- `LOG_LEVEL`: nível mínimo de log (`debug`, `info`, `warn`, `error`). Padrão: `debug` em desenvolvimento, `info` em produção.
- `NODE_ENV`: quando diferente de `production`, o logger usa `pino-pretty` para saída legível no console.

## Uso

- Logs podem ser emitidos via `import logger from './lib/logger';` e `logger.info/debug/warn/error(...)`.
- Em produção, a saída é JSON estruturado, pronto para ser enviado a soluções como CloudWatch, Loki ou Datadog.

## Boas práticas

- Evite logar dados sensíveis (CPFs, tokens, senhas).
- Prefira `logger.debug` para rastros detalhados que podem ser desativados em produção pela configuração de nível.
- Centralize logs de erros em `error.middleware.ts`, evitando `console.*` dispersos.
