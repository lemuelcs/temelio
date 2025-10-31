package com.temelio.motorista.data.models

import com.google.gson.annotations.SerializedName
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

// ========== AUTH ==========
data class LoginRequest(
    val email: String,
    val senha: String
)

data class LoginResponse(
    val token: String,
    val motorista: Motorista
)

// ========== MOTORISTA ==========
data class Motorista(
    @SerializedName("motorista_id") val motoristaId: Int,
    val nome: String,
    val email: String,
    val telefone: String?,
    val cpf: String?,
    val status: StatusMotorista,
    @SerializedName("data_nascimento") val dataNascimento: String?,
    val endereco: String?,
    val cidade: String?,
    val estado: String?,
    val cep: String?,
    @SerializedName("numero_cnh") val numeroCnh: String?,
    @SerializedName("validade_cnh") val validadeCnh: String?,
    @SerializedName("categoria_cnh") val categoriaCnh: String?,
    @SerializedName("numero_brk") val numeroBrk: String?,
    @SerializedName("validade_brk") val validadeBrk: String?,
    @SerializedName("tipo_veiculo") val tipoVeiculo: TipoVeiculo?,
    @SerializedName("placa_veiculo") val placaVeiculo: String?,
    @SerializedName("modelo_veiculo") val modeloVeiculo: String?,
    @SerializedName("ano_veiculo") val anoVeiculo: Int?,
    @SerializedName("chave_pix") val chavePix: String?,
    @SerializedName("tipo_pix") val tipoPix: TipoChavePix?,
    @SerializedName("pontuacao_media") val pontuacaoMedia: BigDecimal?,
    @SerializedName("nivel_motorista") val nivelMotorista: NivelMotorista?,
    @SerializedName("created_at") val createdAt: String?,
    @SerializedName("updated_at") val updatedAt: String?
)

enum class StatusMotorista {
    ATIVO, INATIVO, SUSPENSO
}

enum class TipoVeiculo {
    VAN, CAMINHAO_3_4, CAMINHAO_TOCO, CAMINHAO_TRUCK, CARRETA
}

enum class TipoChavePix {
    CPF, EMAIL, TELEFONE, CHAVE_ALEATORIA
}

enum class NivelMotorista {
    INICIANTE, BRONZE, PRATA, OURO, ELITE
}

// ========== DASHBOARD ==========
data class DashboardResponse(
    @SerializedName("motorista_id") val motoristaId: Int,
    val nome: String,
    val status: StatusMotorista,
    @SerializedName("nivel_motorista") val nivelMotorista: NivelMotorista,
    @SerializedName("pontuacao_media") val pontuacaoMedia: BigDecimal,
    @SerializedName("total_rotas_realizadas") val totalRotasRealizadas: Int,
    @SerializedName("total_ganhos") val totalGanhos: BigDecimal,
    @SerializedName("proximas_rotas") val proximasRotas: List<RotaResumo>,
    @SerializedName("ofertas_pendentes") val ofertasPendentes: Int,
    @SerializedName("alertas_ativos") val alertasAtivos: List<Alerta>?
)

// ========== OFERTAS ==========
data class OfertaRota(
    @SerializedName("oferta_id") val ofertaId: Int,
    @SerializedName("rota_id") val rotaId: Int,
    @SerializedName("motorista_id") val motoristaId: Int,
    @SerializedName("status_oferta") val statusOferta: StatusOferta,
    @SerializedName("data_oferta") val dataOferta: String,
    @SerializedName("data_resposta") val dataResposta: String?,
    @SerializedName("latitude_resposta") val latitudeResposta: BigDecimal?,
    @SerializedName("longitude_resposta") val longitudeResposta: BigDecimal?,
    @SerializedName("ip_resposta") val ipResposta: String?,
    @SerializedName("dispositivo_resposta") val dispositivoResposta: String?,
    val rota: RotaDetalhada?
)

enum class StatusOferta {
    PENDENTE, ACEITA, RECUSADA, EXPIRADA
}

data class OfertaRespostaRequest(
    val latitude: Double?,
    val longitude: Double?
)

// ========== ROTAS ==========
data class RotaResumo(
    @SerializedName("rota_id") val rotaId: Int,
    @SerializedName("data_rota") val dataRota: String,
    @SerializedName("ciclo_rota") val cicloRota: CicloRota,
    @SerializedName("origem_cidade") val origemCidade: String,
    @SerializedName("destino_cidade") val destinoCidade: String,
    @SerializedName("status_rota") val statusRota: StatusRota,
    @SerializedName("valor_rota") val valorRota: BigDecimal
)

data class RotaDetalhada(
    @SerializedName("rota_id") val rotaId: Int,
    @SerializedName("codigo_rota") val codigoRota: String,
    @SerializedName("motorista_id") val motoristaId: Int?,
    @SerializedName("data_rota") val dataRota: String,
    @SerializedName("ciclo_rota") val cicloRota: CicloRota,
    @SerializedName("origem_cidade") val origemCidade: String,
    @SerializedName("origem_estado") val origemEstado: String,
    @SerializedName("origem_endereco") val origemEndereco: String?,
    @SerializedName("origem_latitude") val origemLatitude: BigDecimal?,
    @SerializedName("origem_longitude") val origemLongitude: BigDecimal?,
    @SerializedName("destino_cidade") val destinoCidade: String,
    @SerializedName("destino_estado") val destinoEstado: String,
    @SerializedName("destino_endereco") val destinoEndereco: String?,
    @SerializedName("destino_latitude") val destinoLatitude: BigDecimal?,
    @SerializedName("destino_longitude") val destinoLongitude: BigDecimal?,
    @SerializedName("distancia_km") val distanciaKm: BigDecimal?,
    @SerializedName("duracao_estimada_horas") val duracaoEstimadaHoras: BigDecimal?,
    @SerializedName("quantidade_pacotes") val quantidadePacotes: Int,
    @SerializedName("valor_rota") val valorRota: BigDecimal,
    @SerializedName("valor_ajuda_combustivel") val valorAjudaCombustivel: BigDecimal?,
    @SerializedName("status_rota") val statusRota: StatusRota,
    @SerializedName("observacoes") val observacoes: String?,
    @SerializedName("created_at") val createdAt: String
)

enum class CicloRota {
    CICLO_1, CICLO_2, SAME_DAY
}

enum class StatusRota {
    PLANEJADA,
    OFERTADA,
    ACEITA_MOTORISTA,
    CONFIRMADA,
    EM_ANDAMENTO,
    CONCLUIDA,
    CANCELADA
}

data class TrackingUpdateRequest(
    @SerializedName("novo_status") val novoStatus: StatusTracking,
    val latitude: Double?,
    val longitude: Double?
)

enum class StatusTracking {
    AGUARDANDO,
    A_CAMINHO,
    NO_LOCAL,
    ROTA_INICIADA,
    ROTA_CONCLUIDA
}

// ========== DISPONIBILIDADE ==========
data class DisponibilidadeResponse(
    @SerializedName("semana_atual") val semanaAtual: SemanaDisponibilidade,
    @SerializedName("proxima_semana") val proximaSemana: SemanaDisponibilidade
)

data class SemanaDisponibilidade(
    @SerializedName("numero_semana") val numeroSemana: Int,
    val ano: Int,
    @SerializedName("data_inicio") val dataInicio: String,
    @SerializedName("data_fim") val dataFim: String,
    val dias: List<DiaDisponibilidade>
)

data class DiaDisponibilidade(
    @SerializedName("dia_semana") val diaSemana: Int,
    val data: String,
    @SerializedName("ciclo_1") val ciclo1: Boolean,
    @SerializedName("ciclo_2") val ciclo2: Boolean,
    @SerializedName("same_day") val sameDay: Boolean,
    @SerializedName("disponibilidade_id") val disponibilidadeId: Int?
)

data class DisponibilidadeBatchRequest(
    val disponibilidades: List<DisponibilidadeItem>
)

data class DisponibilidadeItem(
    val data: String,
    @SerializedName("ciclo_1") val ciclo1: Boolean,
    @SerializedName("ciclo_2") val ciclo2: Boolean,
    @SerializedName("same_day") val sameDay: Boolean
)

// ========== ALERTAS ==========
data class Alerta(
    @SerializedName("alerta_id") val alertaId: Int,
    @SerializedName("motorista_id") val motoristaId: Int?,
    val tipo: TipoAlerta,
    val mensagem: String,
    val severidade: SeveridadeAlerta,
    @SerializedName("data_criacao") val dataCriacao: String,
    @SerializedName("data_leitura") val dataLeitura: String?,
    val lido: Boolean
)

enum class TipoAlerta {
    DOCUMENTO_VENCIDO,
    DOCUMENTO_PROXIMO_VENCIMENTO,
    NOVA_OFERTA_ROTA,
    ROTA_CONFIRMADA,
    ANIVERSARIO,
    SISTEMA,
    OUTRO
}

enum class SeveridadeAlerta {
    BAIXA, MEDIA, ALTA, CRITICA
}

// ========== API RESPONSES ==========
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String?
)

data class ErrorResponse(
    val error: String,
    val message: String,
    val details: List<String>?
)
