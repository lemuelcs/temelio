package com.temelio.motorista.data.repository

import android.location.Location
import com.temelio.motorista.data.api.TemelioApi
import com.temelio.motorista.data.models.RotaDetalhada
import com.temelio.motorista.data.models.StatusTracking
import com.temelio.motorista.data.models.TrackingUpdateRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RotasRepository @Inject constructor(
    private val api: TemelioApi
) {
    suspend fun getRotas(
        status: String? = null,
        dataInicio: String? = null,
        dataFim: String? = null
    ): Result<List<RotaDetalhada>> {
        return try {
            val response = api.getRotas(status, dataInicio, dataFim)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro ao buscar rotas: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getRotaById(rotaId: Int): Result<RotaDetalhada> {
        return try {
            val response = api.getRotaById(rotaId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro ao buscar rota: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateTracking(
        rotaId: Int,
        novoStatus: StatusTracking,
        location: Location? = null
    ): Result<Unit> {
        return try {
            val request = TrackingUpdateRequest(
                novoStatus = novoStatus,
                latitude = location?.latitude,
                longitude = location?.longitude
            )
            val response = api.updateTracking(rotaId, request)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Erro ao atualizar tracking: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
