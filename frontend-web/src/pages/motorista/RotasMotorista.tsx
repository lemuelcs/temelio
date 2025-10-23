// frontend/src/pages/motorista/MinhasRotas.tsx
import { Truck, Calendar, Clock } from 'lucide-react';

export default function RotasMotoristas() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🚚 Minhas Rotas</h1>
        <p className="text-gray-600 mt-1">
          Visualize e gerencie suas rotas
        </p>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-10 h-10 text-gray-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Em desenvolvimento
          </h3>
          
          <p className="text-gray-600 mb-6">
            Em breve você poderá visualizar rotas oferecidas, aceitar/recusar rotas e acompanhar rotas confirmadas aqui.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-3">
              Funcionalidades futuras:
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Ver rotas oferecidas para você (D-1)</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Aceitar ou recusar rotas oferecidas</span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Ver rotas confirmadas (D+0)</span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Executar rotas (check-in, navegação)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
