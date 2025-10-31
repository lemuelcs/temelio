package com.temelio.motorista.data.repository

import android.location.Location
import com.temelio.motorista.data.api.TemelioApi
import com.temelio.motorista.data.models.OfertaRota
import com.temelio.motorista.data.models.OfertaRespostaRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OfertasRepository @Inject constructor(
    private val api: TemelioApi
) {
    suspend fun getOfertas(status: String? = "PENDENTE"): Result<List<OfertaRota>> {
        return try {
            val response = api.getOfertas(status)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro ao buscar ofertas: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun aceitarOferta(ofertaId: Int, location: Location? = null): Result<OfertaRota> {
        return try {
            val request = OfertaRespostaRequest(
                latitude = location?.latitude,
                longitude = location?.longitude
            )
            val response = api.aceitarOferta(ofertaId, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro ao aceitar oferta: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun recusarOferta(ofertaId: Int, location: Location? = null): Result<OfertaRota> {
        return try {
            val request = OfertaRespostaRequest(
                latitude = location?.latitude,
                longitude = location?.longitude
            )
            val response = api.recusarOferta(ofertaId, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro ao recusar oferta: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
