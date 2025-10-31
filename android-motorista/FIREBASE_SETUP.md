# Configuração do Firebase para o App Temelio Motorista

## Passo 1: Criar Projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"** ou **"Criar novo projeto"**
3. Nome do projeto: **Temelio** (ou nome de sua preferência)
4. Aceite os termos e clique em **"Continuar"**
5. Habilite ou desabilite Google Analytics conforme preferência
6. Clique em **"Criar projeto"**

## Passo 2: Adicionar o App Android ao Projeto Firebase

1. No Firebase Console, clique no ícone do Android para adicionar um app
2. Preencha os dados:
   - **Nome do pacote Android**: `com.temelio.motorista` (OBRIGATÓRIO - deve ser exatamente este)
   - **Apelido do app**: Temelio Motorista
   - **Certificado de assinatura SHA-1**: (Opcional para desenvolvimento, obrigatório para produção)

### Como obter o SHA-1:

```bash
# No diretório raiz do projeto Android
./gradlew signingReport

# Ou usando keytool (para debug keystore)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

3. Clique em **"Registrar app"**

## Passo 3: Baixar o arquivo google-services.json

1. Clique em **"Baixar google-services.json"**
2. Mova o arquivo para o diretório: `android-motorista/app/`
3. **IMPORTANTE**: O arquivo deve estar em `app/google-services.json` (não em `app/src/`)

## Passo 4: Configurar Firebase Cloud Messaging (FCM)

1. No Firebase Console, vá para **"Configurações do projeto"** (ícone de engrenagem)
2. Vá para a aba **"Cloud Messaging"**
3. Copie o **"ID do remetente"** e a **"Chave do servidor"** (você pode precisar deles no backend)

## Passo 5: Configurar Google Maps API Key

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto do Firebase (ou crie um novo)
3. Vá para **"APIs e Serviços"** > **"Credenciais"**
4. Clique em **"Criar credenciais"** > **"Chave de API"**
5. Nomeie a chave como **"Android Maps Key"**
6. Restrinja a chave:
   - **Restrição de aplicativo**: Apps Android
   - **Nome do pacote**: `com.temelio.motorista`
   - **Impressão digital do certificado SHA-1**: (adicione a SHA-1 do debug e release)
7. **Restrições de API**: Adicione as seguintes APIs:
   - Maps SDK for Android
   - Places API
   - Directions API
   - Geolocation API

### Adicionar a API Key ao projeto:

Edite o arquivo `android-motorista/local.properties` e adicione:

```properties
MAPS_API_KEY=SUA_GOOGLE_MAPS_API_KEY
```

## Passo 6: Habilitar APIs Necessárias

No Google Cloud Console, habilite as seguintes APIs:
- ✅ Maps SDK for Android
- ✅ Places API
- ✅ Directions API
- ✅ Geolocation API

## Passo 7: Verificar a Configuração

1. Abra o projeto no Android Studio
2. Sincronize o Gradle: `File > Sync Project with Gradle Files`
3. Verifique se não há erros no arquivo `app/build.gradle.kts`
4. Execute o build: `Build > Make Project`

## Estrutura de Arquivos Esperada

```
android-motorista/
├── app/
│   ├── google-services.json          ← ARQUIVO DO FIREBASE (baixado)
│   ├── google-services.json.template ← Template de exemplo
│   ├── build.gradle.kts
│   └── src/...
├── local.properties                  ← Adicione MAPS_API_KEY aqui
├── build.gradle.kts
└── settings.gradle.kts
```

## Configurar Notificações Push (Opcional)

Para testar notificações push:

1. No Firebase Console, vá para **"Cloud Messaging"**
2. Clique em **"Enviar sua primeira mensagem"**
3. Preencha:
   - **Título**: Teste de Notificação
   - **Texto**: Esta é uma notificação de teste
4. Clique em **"Enviar mensagem de teste"**
5. Insira o token FCM do dispositivo (será exibido nos logs do app)

## Solução de Problemas

### Erro: "google-services.json is missing"
- Verifique se o arquivo está em `app/google-services.json`
- Sincronize o Gradle novamente

### Erro: "API key not found" ao usar mapas
- Verifique se `MAPS_API_KEY` está em `local.properties`
- Verifique se as APIs estão habilitadas no Google Cloud Console
- Verifique se a SHA-1 está correta nas restrições da API key

### Notificações não chegam
- Verifique se o app tem permissão de notificações (Android 13+)
- Verifique os logs do Logcat para ver o token FCM
- Verifique se o serviço `TemelioFirebaseMessagingService` está registrado no Manifest

## Próximos Passos

Após configurar o Firebase:
1. Configure o backend para enviar notificações usando a chave do servidor FCM
2. Teste o envio de notificações de novas ofertas de rotas
3. Implemente o deep linking para abrir ofertas específicas via notificação
