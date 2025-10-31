package com.temelio.motorista.ui.ofertas

import android.location.Location
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.temelio.motorista.data.models.OfertaRota
import com.temelio.motorista.data.repository.OfertasRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OfertasViewModel @Inject constructor(
    private val ofertasRepository: OfertasRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<OfertasUiState>(OfertasUiState.Loading)
    val uiState: StateFlow<OfertasUiState> = _uiState.asStateFlow()

    private val _actionState = MutableStateFlow<OfertaActionState>(OfertaActionState.Idle)
    val actionState: StateFlow<OfertaActionState> = _actionState.asStateFlow()

    init {
        loadOfertas()
    }

    fun loadOfertas() {
        viewModelScope.launch {
            _uiState.value = OfertasUiState.Loading
            ofertasRepository.getOfertas()
                .onSuccess { ofertas ->
                    _uiState.value = OfertasUiState.Success(ofertas)
                }
                .onFailure { error ->
                    _uiState.value = OfertasUiState.Error(
                        error.message ?: "Erro ao carregar ofertas"
                    )
                }
        }
    }

    fun aceitarOferta(ofertaId: Int, location: Location? = null) {
        viewModelScope.launch {
            _actionState.value = OfertaActionState.Loading
            ofertasRepository.aceitarOferta(ofertaId, location)
                .onSuccess {
                    _actionState.value = OfertaActionState.Success("Oferta aceita com sucesso!")
                    loadOfertas() // Recarregar lista
                }
                .onFailure { error ->
                    _actionState.value = OfertaActionState.Error(
                        error.message ?: "Erro ao aceitar oferta"
                    )
                }
        }
    }

    fun recusarOferta(ofertaId: Int, location: Location? = null) {
        viewModelScope.launch {
            _actionState.value = OfertaActionState.Loading
            ofertasRepository.recusarOferta(ofertaId, location)
                .onSuccess {
                    _actionState.value = OfertaActionState.Success("Oferta recusada")
                    loadOfertas() // Recarregar lista
                }
                .onFailure { error ->
                    _actionState.value = OfertaActionState.Error(
                        error.message ?: "Erro ao recusar oferta"
                    )
                }
        }
    }

    fun resetActionState() {
        _actionState.value = OfertaActionState.Idle
    }
}

sealed class OfertasUiState {
    object Loading : OfertasUiState()
    data class Success(val ofertas: List<OfertaRota>) : OfertasUiState()
    data class Error(val message: String) : OfertasUiState()
}

sealed class OfertaActionState {
    object Idle : OfertaActionState()
    object Loading : OfertaActionState()
    data class Success(val message: String) : OfertaActionState()
    data class Error(val message: String) : OfertaActionState()
}
