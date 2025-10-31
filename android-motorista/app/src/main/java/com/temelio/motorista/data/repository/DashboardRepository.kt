package com.temelio.motorista.data.repository

import com.temelio.motorista.data.api.TemelioApi
import com.temelio.motorista.data.models.DashboardResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DashboardRepository @Inject constructor(
    private val api: TemelioApi
) {
    suspend fun getDashboard(): Result<DashboardResponse> {
        return try {
            val response = api.getDashboard()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro ao buscar dashboard: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
