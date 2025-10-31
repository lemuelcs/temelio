package com.temelio.motorista.data.firebase

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.temelio.motorista.MainActivity
import com.temelio.motorista.R

class TemelioFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Novo token FCM: $token")

        // TODO: Enviar token para o backend
        // Você pode usar SharedPreferences ou DataStore para armazenar o token
        // e enviá-lo para o backend na próxima autenticação
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        Log.d(TAG, "Mensagem recebida de: ${message.from}")

        // Processar dados da mensagem
        message.data.isNotEmpty().let {
            Log.d(TAG, "Dados da mensagem: ${message.data}")
            handleDataMessage(message.data)
        }

        // Processar notificação
        message.notification?.let {
            Log.d(TAG, "Título da notificação: ${it.title}")
            Log.d(TAG, "Corpo da notificação: ${it.body}")

            showNotification(
                title = it.title ?: "Temelio",
                body = it.body ?: ""
            )
        }
    }

    private fun handleDataMessage(data: Map<String, String>) {
        val tipo = data["tipo"]

        when (tipo) {
            "NOVA_OFERTA" -> {
                // Processar nova oferta de rota
                val ofertaId = data["oferta_id"]
                showNotification(
                    title = "Nova Oferta de Rota!",
                    body = "Você tem uma nova oferta disponível. Toque para visualizar.",
                    channelId = CHANNEL_OFERTAS
                )
            }
            "ROTA_CONFIRMADA" -> {
                val rotaId = data["rota_id"]
                showNotification(
                    title = "Rota Confirmada",
                    body = "Sua rota foi confirmada! Toque para ver detalhes.",
                    channelId = CHANNEL_ROTAS
                )
            }
            else -> {
                showNotification(
                    title = data["title"] ?: "Temelio",
                    body = data["body"] ?: "Você tem uma nova notificação"
                )
            }
        }
    }

    private fun showNotification(
        title: String,
        body: String,
        channelId: String = CHANNEL_GERAL
    ) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Criar canal de notificação (Android 8.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                getChannelName(channelId),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificações do Temelio"
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Intent para abrir o app ao clicar na notificação
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Construir notificação
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun getChannelName(channelId: String): String {
        return when (channelId) {
            CHANNEL_OFERTAS -> "Ofertas de Rotas"
            CHANNEL_ROTAS -> "Rotas"
            CHANNEL_GERAL -> "Geral"
            else -> "Notificações"
        }
    }

    companion object {
        private const val TAG = "TemelioFCM"
        private const val CHANNEL_GERAL = "temelio_geral"
        private const val CHANNEL_OFERTAS = "temelio_ofertas"
        private const val CHANNEL_ROTAS = "temelio_rotas"
    }
}
