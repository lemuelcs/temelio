package com.temelio.motorista.data.api

import com.temelio.motorista.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface TemelioApi {

    // ========== AUTENTICAÇÃO ==========
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<Motorista>

    // ========== DASHBOARD ==========
    @GET("motoristas/dashboard")
    suspend fun getDashboard(): Response<DashboardResponse>

    // ========== OFERTAS DE ROTAS ==========
    @GET("ofertas-rotas")
    suspend fun getOfertas(
        @Query("status") status: String? = "PENDENTE"
    ): Response<List<OfertaRota>>

    @GET("ofertas-rotas/{id}")
    suspend fun getOfertaById(@Path("id") ofertaId: Int): Response<OfertaRota>

    @PATCH("ofertas-rotas/{id}/aceitar")
    suspend fun aceitarOferta(
        @Path("id") ofertaId: Int,
        @Body request: OfertaRespostaRequest
    ): Response<OfertaRota>

    @PATCH("ofertas-rotas/{id}/recusar")
    suspend fun recusarOferta(
        @Path("id") ofertaId: Int,
        @Body request: OfertaRespostaRequest
    ): Response<OfertaRota>

    // ========== ROTAS ==========
    @GET("rotas")
    suspend fun getRotas(
        @Query("status") status: String? = null,
        @Query("data_inicio") dataInicio: String? = null,
        @Query("data_fim") dataFim: String? = null
    ): Response<List<RotaDetalhada>>

    @GET("rotas/{id}")
    suspend fun getRotaById(@Path("id") rotaId: Int): Response<RotaDetalhada>

    @PATCH("rotas/{rotaId}/tracking")
    suspend fun updateTracking(
        @Path("rotaId") rotaId: Int,
        @Body request: TrackingUpdateRequest
    ): Response<Unit>

    @GET("rotas/{rotaId}/tracking/historico")
    suspend fun getHistoricoTracking(@Path("rotaId") rotaId: Int): Response<List<Any>>

    // ========== DISPONIBILIDADE ==========
    @GET("motorista/disponibilidades/semanas")
    suspend fun getDisponibilidades(): Response<DisponibilidadeResponse>

    @GET("motorista/disponibilidades")
    suspend fun getMinhasDisponibilidades(
        @Query("data_inicio") dataInicio: String? = null,
        @Query("data_fim") dataFim: String? = null
    ): Response<List<DiaDisponibilidade>>

    @POST("motorista/disponibilidades/batch")
    suspend fun salvarDisponibilidades(
        @Body request: DisponibilidadeBatchRequest
    ): Response<Unit>

    @DELETE("motorista/disponibilidades/{id}")
    suspend fun deletarDisponibilidade(@Path("id") disponibilidadeId: Int): Response<Unit>

    // ========== PERFIL ==========
    @GET("motoristas/perfil")
    suspend fun getPerfil(): Response<Motorista>

    @PATCH("motoristas/perfil")
    suspend fun updatePerfil(@Body motorista: Motorista): Response<Motorista>

    // ========== ALERTAS ==========
    @GET("alertas")
    suspend fun getAlertas(
        @Query("lido") lido: Boolean? = null
    ): Response<List<Alerta>>

    @PATCH("alertas/{id}/marcar-lido")
    suspend fun marcarAlertaLido(@Path("id") alertaId: Int): Response<Unit>

    @DELETE("alertas/{id}")
    suspend fun deletarAlerta(@Path("id") alertaId: Int): Response<Unit>
}
