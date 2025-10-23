// frontend/src/components/Debug/PageDebug.tsx
// ⚠️ COMPONENTE TEMPORÁRIO PARA DIAGNÓSTICO

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function PageDebug() {
  const auth = useAuth();

  useEffect(() => {
    console.log('🔍 DEBUG - PageDebug montado');
    console.log('👤 Usuário:', auth?.user);
    console.log('🔐 Token:', auth?.token ? 'Existe' : 'Não existe');
    console.log('🎭 Papel:', auth?.user?.papel);
    console.log('📍 URL atual:', window.location.pathname);
  }, [auth]);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      margin: '20px',
      border: '2px solid #333',
      fontFamily: 'monospace'
    }}>
      <h2>🔍 DEBUG MODE</h2>
      <div>
        <strong>Autenticado:</strong> {auth?.user ? '✅ SIM' : '❌ NÃO'}
      </div>
      <div>
        <strong>Email:</strong> {auth?.user?.email || 'N/A'}
      </div>
      <div>
        <strong>Papel:</strong> {auth?.user?.papel || 'N/A'}
      </div>
      <div>
        <strong>Token:</strong> {auth?.token ? '✅ Existe' : '❌ Não existe'}
      </div>
      <div>
        <strong>URL:</strong> {window.location.pathname}
      </div>
    </div>
  );
}