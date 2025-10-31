package com.temelio.motorista.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.temelio.motorista.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun login(email: String, senha: String) {
        if (email.isBlank() || senha.isBlank()) {
            _uiState.value = LoginUiState.Error("E-mail e senha são obrigatórios")
            return
        }

        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            authRepository.login(email, senha)
                .onSuccess {
                    _uiState.value = LoginUiState.Success
                }
                .onFailure { error ->
                    _uiState.value = LoginUiState.Error(
                        error.message ?: "Erro ao fazer login"
                    )
                }
        }
    }

    fun resetState() {
        _uiState.value = LoginUiState.Idle
    }
}

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    object Success : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}
