# Guia de Testes

Este projeto ainda não possui uma suíte automatizada configurada. Abaixo está um roteiro sugerido para iniciar a cobertura de testes no backend (Node/Express) e no frontend (React + Vite).

## Backend (Node + Jest)

1. **Instalação das dependências**  
   ```bash
   cd backend
   npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
   ```

2. **Inicialização da configuração do Jest**  
   ```bash
   npx ts-jest config:init
   ```
   Ajuste o arquivo `jest.config.js` gerado para apontar para `src` e ignorar diretórios como `dist`.

3. **Scripts no `package.json`**  
   Adicione:
   ```json
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch",
     "test:coverage": "jest --coverage"
   }
   ```

4. **Primeiros testes**  
   - Crie a pasta `src/__tests__`.
   - Utilize `supertest` para testar rotas críticas (ex.: `/api/auth/login`, `/api/rotas`).
   - Para testes de serviços, use um banco de dados em memória (ex.: `sqlite` via Prisma) ou mocks de Prisma (`jest.mock`).

5. **Execução**  
   ```bash
   npm run test
   ```

## Frontend (React + Vitest + Testing Library)

1. **Instalação**  
   ```bash
   cd frontend-web
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
   ```

2. **Configuração do Vitest**  
   - Atualize `vite.config.ts` adicionando:
     ```ts
     import { defineConfig } from 'vite';
     import react from '@vitejs/plugin-react';

     export default defineConfig({
       plugins: [react()],
       test: {
         globals: true,
         environment: 'jsdom',
         setupFiles: './src/setupTests.ts',
       },
     });
     ```
   - Crie `src/setupTests.ts` com:
     ```ts
     import '@testing-library/jest-dom';
     ```

3. **Scripts**  
   ```json
   "scripts": {
     "test": "vitest",
     "test:watch": "vitest --watch",
     "test:coverage": "vitest run --coverage"
   }
   ```

4. **Primeiros testes**  
   - Pastas sugeridas: `src/__tests__/` ou lado a lado dos componentes.
   - Priorize fluxos críticos: autenticação (`Login`), rotas de alocação (verificar contadores e ações), modais de motoristas.

5. **Execução**  
   ```bash
   npm run test
   ```

## Automação futura
- Configure GitHub Actions ou outra pipeline para rodar `npm run test` em backend e frontend.
- Adote cobertura mínima (`--coverage`) para garantir evolução saudável.
- Sempre que possível, adicione testes ao implementar novas regras de negócio (ex.: elegibilidade de motoristas, reoferta de rotas).

Este documento pode ser expandido conforme a suíte de testes evoluir.
