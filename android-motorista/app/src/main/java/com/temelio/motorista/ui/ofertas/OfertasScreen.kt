package com.temelio.motorista.ui.ofertas

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.temelio.motorista.data.models.OfertaRota
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OfertasScreen(
    onNavigateBack: () -> Unit,
    viewModel: OfertasViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val actionState by viewModel.actionState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(actionState) {
        when (val state = actionState) {
            is OfertaActionState.Success -> {
                snackbarHostState.showSnackbar(state.message)
                viewModel.resetActionState()
            }
            is OfertaActionState.Error -> {
                snackbarHostState.showSnackbar(state.message)
                viewModel.resetActionState()
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ofertas de Rotas") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Voltar")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        when (val state = uiState) {
            is OfertasUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            is OfertasUiState.Success -> {
                if (state.ofertas.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Nenhuma oferta disponível no momento",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(state.ofertas) { oferta ->
                            OfertaCard(
                                oferta = oferta,
                                onAceitar = { viewModel.aceitarOferta(oferta.ofertaId) },
                                onRecusar = { viewModel.recusarOferta(oferta.ofertaId) },
                                isLoading = actionState is OfertaActionState.Loading
                            )
                        }
                    }
                }
            }

            is OfertasUiState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = state.message,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadOfertas() }) {
                            Text("Tentar novamente")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OfertaCard(
    oferta: OfertaRota,
    onAceitar: () -> Unit,
    onRecusar: () -> Unit,
    isLoading: Boolean
) {
    val rota = oferta.rota

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Cabeçalho
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = rota?.codigoRota ?: "Rota #${oferta.rotaId}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                if (rota != null) {
                    Text(
                        text = formatCurrency(rota.valorRota.toDouble()),
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider()
            Spacer(modifier = Modifier.height(12.dp))

            // Detalhes da Rota
            if (rota != null) {
                InfoRow(label = "Origem", value = "${rota.origemCidade}, ${rota.origemEstado}")
                InfoRow(label = "Destino", value = "${rota.destinoCidade}, ${rota.destinoEstado}")
                InfoRow(label = "Data", value = rota.dataRota)
                InfoRow(label = "Ciclo", value = rota.cicloRota.name)
                InfoRow(label = "Distância", value = "${rota.distanciaKm ?: "-"} km")
                InfoRow(label = "Pacotes", value = rota.quantidadePacotes.toString())

                if (rota.valorAjudaCombustivel != null && rota.valorAjudaCombustivel.toDouble() > 0) {
                    InfoRow(
                        label = "Ajuda Combustível",
                        value = formatCurrency(rota.valorAjudaCombustivel.toDouble())
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Botões de Ação
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onRecusar,
                    modifier = Modifier.weight(1f),
                    enabled = !isLoading
                ) {
                    Icon(Icons.Default.Cancel, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Recusar")
                }

                Button(
                    onClick = onAceitar,
                    modifier = Modifier.weight(1f),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Icon(Icons.Default.CheckCircle, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Aceitar")
                    }
                }
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

fun formatCurrency(value: Double): String {
    val format = NumberFormat.getCurrencyInstance(Locale("pt", "BR"))
    return format.format(value)
}
