package com.temelio.motorista.data.repository

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.temelio.motorista.data.api.TemelioApi
import com.temelio.motorista.data.models.LoginRequest
import com.temelio.motorista.data.models.LoginResponse
import com.temelio.motorista.data.models.Motorista
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "auth_prefs")

@Singleton
class AuthRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val api: TemelioApi
) {
    companion object {
        val TOKEN_KEY = stringPreferencesKey("auth_token")
        val USER_ID_KEY = stringPreferencesKey("user_id")
        val USER_NAME_KEY = stringPreferencesKey("user_name")
        val USER_EMAIL_KEY = stringPreferencesKey("user_email")
    }

    val authToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }

    val isLoggedIn: Flow<Boolean> = authToken.map { it != null }

    val userName: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_NAME_KEY]
    }

    suspend fun login(email: String, senha: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(email, senha))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                saveUserData(loginResponse)
                Result.success(loginResponse)
            } else {
                Result.failure(Exception("Erro ao fazer login: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        try {
            api.logout()
        } catch (e: Exception) {
            // Ignorar erros de rede ao fazer logout
        } finally {
            clearUserData()
        }
    }

    suspend fun getCurrentUser(): Result<Motorista> {
        return try {
            val response = api.getCurrentUser()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Erro ao buscar usuário atual"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun saveUserData(loginResponse: LoginResponse) {
        context.dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = loginResponse.token
            preferences[USER_ID_KEY] = loginResponse.motorista.motoristaId.toString()
            preferences[USER_NAME_KEY] = loginResponse.motorista.nome
            preferences[USER_EMAIL_KEY] = loginResponse.motorista.email
        }
    }

    private suspend fun clearUserData() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
