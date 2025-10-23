// frontend/src/pages/motorista/Perfil.tsx
import { User, Mail, Phone, MapPin, Truck, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function PerfilMotorista() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">👤 Meu Perfil</h1>
        <p className="text-gray-600 mt-1">
          Suas informações e estatísticas
        </p>
      </div>

      {/* Card de informações */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.nome}</h2>
            <p className="text-gray-600 text-sm">{user?.perfil}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-5 h-5 text-gray-400" />
            <span>{user?.email}</span>
          </div>
          
          {/* Dados do motorista virão aqui */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 italic">
              Mais informações do perfil serão exibidas aqui em breve...
            </p>
          </div>
        </div>
      </div>

      {/* Gamificação (placeholder) */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Seu Nível de Performance
          </h3>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-yellow-600 mb-2">
            EM BREVE
          </div>
          <p className="text-gray-600 text-sm">
            Aqui você verá seu nível (Iniciante, Bronze, Prata, Ouro, Elite) e pontuação da gamificação
          </p>
        </div>
      </div>

      {/* Estatísticas (placeholder) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Suas Estatísticas
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Truck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-600">Rotas Concluídas</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Award className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-600">Taxa de Sucesso</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 text-center mt-4 italic">
          Estatísticas detalhadas em breve...
        </p>
      </div>
    </div>
  );
}
