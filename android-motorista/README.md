# Temelio - Aplicativo Android para Motoristas

Aplicativo nativo Android desenvolvido para motoristas do sistema Temelio, permitindo gerenciamento de rotas, ofertas, disponibilidade e acompanhamento em tempo real.

## 📱 Sobre o Projeto

O Temelio Motorista é um aplicativo Android moderno construído com as mais recentes tecnologias e padrões de desenvolvimento do ecossistema Android.

### Tecnologias Utilizadas

- **Linguagem**: Kotlin 1.9.22
- **UI Framework**: Jetpack Compose (Material Design 3)
- **Arquitetura**: MVVM (Model-View-ViewModel)
- **Injeção de Dependência**: Hilt / Dagger
- **Networking**: Retrofit 2.9.0 + OkHttp 4.12.0
- **Banco de Dados Local**: Room 2.6.1
- **Armazenamento**: DataStore Preferences
- **Mapas**: Google Maps SDK + Maps Compose
- **Localização**: Google Play Services Location
- **Notificações**: Firebase Cloud Messaging
- **Imagens**: Coil
- **Trabalhos em Background**: WorkManager
- **Navegação**: Navigation Compose

### Requisitos Mínimos

- **Android 7.0** (API 24) ou superior
- **Android 14** (API 34) para versão de destino
- Conexão com a internet
- GPS/Localização
- Permissões de notificação (Android 13+)

## 🏗️ Arquitetura do Projeto

```
app/src/main/java/com/temelio/motorista/
├── data/
│   ├── api/           # Interfaces Retrofit e Interceptors
│   ├── models/        # Modelos de dados (DTOs)
│   ├── repository/    # Repositórios (camada de dados)
│   ├── local/         # Room Database (para uso futuro)
│   └── firebase/      # Serviços do Firebase
├── di/                # Módulos de injeção de dependência (Hilt)
├── ui/
│   ├── login/         # Tela de login
│   ├── dashboard/     # Dashboard do motorista
│   ├── ofertas/       # Ofertas de rotas
│   ├── rotas/         # Minhas rotas
│   ├── disponibilidade/ # Calendário de disponibilidade
│   ├── perfil/        # Perfil do motorista
│   ├── navigation/    # Navegação do app
│   ├── components/    # Componentes reutilizáveis
│   └── theme/         # Tema, cores e tipografia
├── utils/             # Utilitários e extensões
├── TemelioApplication.kt  # Classe Application
└── MainActivity.kt    # Activity principal
```

## 🚀 Como Executar o Projeto

### Pré-requisitos

1. **Android Studio** (versão mais recente)
   - Download: https://developer.android.com/studio

2. **JDK 17** ou superior
   - Verificar: `java -version`

3. **Git**
   - Verificar: `git --version`

### Passos para Configuração

#### 1. Clone o repositório

```bash
git clone https://github.com/lemuelcs/temelio.git
cd temelio/android-motorista
```

#### 2. Configure o Firebase

Siga as instruções detalhadas em **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**

Resumo:
1. Crie um projeto no Firebase Console
2. Adicione um app Android com o pacote `com.temelio.motorista`
3. Baixe o arquivo `google-services.json`
4. Coloque-o em `android-motorista/app/google-services.json`

#### 3. Configure a API Key do Google Maps

Edite ou crie o arquivo `local.properties` na raiz do projeto:

```properties
sdk.dir=/path/to/Android/sdk
MAPS_API_KEY=SUA_GOOGLE_MAPS_API_KEY
```

**Como obter a API Key:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie uma API Key para Android
3. Habilite as APIs: Maps SDK for Android, Places API, Directions API
4. Adicione as restrições (pacote + SHA-1)

#### 4. Configure a URL da API Backend

Edite `app/build.gradle.kts` e ajuste a URL da API:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://api.temelio.com.br/api\"")

// Para desenvolvimento local no emulador:
// buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api\"")

// Para desenvolvimento local em dispositivo físico:
// buildConfigField("String", "API_BASE_URL", "\"http://SEU_IP_LOCAL:3000/api\"")
```

#### 5. Abra o projeto no Android Studio

```bash
# No diretório android-motorista
# Abra o Android Studio e selecione "Open" > android-motorista
```

#### 6. Sincronize o Gradle

- `File > Sync Project with Gradle Files`
- Aguarde o download das dependências (pode levar alguns minutos na primeira vez)

#### 7. Execute o aplicativo

- Conecte um dispositivo Android via USB (com depuração USB habilitada) **OU**
- Crie um emulador no AVD Manager
- Clique em **Run** (ícone de play) ou pressione **Shift + F10**

## 📦 Funcionalidades Implementadas

### ✅ Autenticação
- Login com e-mail e senha
- Gerenciamento de sessão com JWT
- Armazenamento seguro de token

### ✅ Dashboard
- Visão geral de KPIs (nível, pontuação, rotas, ganhos)
- Próximas rotas agendadas
- Contador de ofertas pendentes
- Alertas ativos

### ✅ Ofertas de Rotas
- Listagem de ofertas pendentes
- Detalhes completos da rota
- Aceitar/recusar ofertas
- Captura de localização no momento da resposta

### ✅ Rotas (a implementar)
- Minhas rotas aceitas
- Rastreamento em tempo real
- Atualização de status (a caminho, no local, iniciada, concluída)
- Histórico de rotas

### ✅ Disponibilidade (a implementar)
- Calendário de 2 semanas
- Seleção de ciclos (Ciclo 1, Ciclo 2, Same Day)
- Salvar disponibilidade em lote

### ✅ Perfil (a implementar)
- Dados pessoais
- Documentos (CNH, BRK)
- Dados do veículo
- Dados bancários (PIX)

### ✅ Notificações Push
- Firebase Cloud Messaging configurado
- Canais de notificação separados
- Tratamento de notificações de ofertas e rotas

## 🔧 Build e Variantes

### Debug Build

```bash
./gradlew assembleDebug
```

O APK será gerado em: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build

```bash
./gradlew assembleRelease
```

**IMPORTANTE**: Para build de release, você precisa configurar a assinatura do app. Veja a seção **[Configurar Assinatura](#configurar-assinatura)** abaixo.

### Instalação via ADB

```bash
# Debug
adb install app/build/outputs/apk/debug/app-debug.apk

# Release
adb install app/build/outputs/apk/release/app-release.apk
```

## 🔐 Configurar Assinatura

Para builds de release (produção), você precisa criar um keystore de assinatura:

### 1. Criar Keystore

```bash
keytool -genkey -v -keystore temelio-release.keystore \
  -alias temelio -keyalg RSA -keysize 2048 -validity 10000

# Você será solicitado a:
# - Criar uma senha para o keystore
# - Criar uma senha para a chave (alias)
# - Preencher informações da organização
```

### 2. Configurar no Gradle

Crie/edite o arquivo `keystore.properties` na raiz do projeto:

```properties
storePassword=SUA_SENHA_KEYSTORE
keyPassword=SUA_SENHA_CHAVE
keyAlias=temelio
storeFile=../temelio-release.keystore
```

### 3. Atualizar build.gradle.kts

Adicione ao `app/build.gradle.kts`:

```kotlin
// Carregar propriedades do keystore
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ...

    signingConfigs {
        create("release") {
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            // ...
        }
    }
}
```

**⚠️ SEGURANÇA**: Nunca commite o arquivo `keystore.properties` ou `.keystore` no Git!

Adicione ao `.gitignore`:
```
*.keystore
*.jks
keystore.properties
```

## 🧪 Testes

### Executar Testes Unitários

```bash
./gradlew test
```

### Executar Testes de Interface (Instrumentados)

```bash
./gradlew connectedAndroidTest
```

## 📝 Próximos Passos de Desenvolvimento

- [ ] Implementar tela de Rotas completa com mapa
- [ ] Implementar tela de Disponibilidade
- [ ] Implementar tela de Perfil
- [ ] Adicionar suporte offline com Room Database
- [ ] Implementar sincronização em background
- [ ] Adicionar deep linking para notificações
- [ ] Implementar testes unitários e de UI
- [ ] Adicionar analytics (Firebase Analytics)
- [ ] Implementar versionamento semântico
- [ ] Configurar CI/CD (GitHub Actions)

## 🐛 Solução de Problemas

### Build falha com "google-services.json is missing"
**Solução**: Baixe o arquivo do Firebase Console e coloque em `app/google-services.json`

### Erro "API_BASE_URL is not defined"
**Solução**: Verifique se a URL está definida em `app/build.gradle.kts`

### Mapas não carregam
**Solução**:
- Verifique se `MAPS_API_KEY` está em `local.properties`
- Verifique se as APIs estão habilitadas no Google Cloud Console
- Adicione a SHA-1 do keystore nas restrições da API Key

### App crasha ao fazer login
**Solução**:
- Verifique se o backend está rodando e acessível
- Verifique a URL da API em `BuildConfig.API_BASE_URL`
- Veja os logs no Logcat

## 📄 Licença

Este projeto é proprietário da empresa Temelio.

## 👥 Contribuindo

Para contribuir com o projeto:

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
3. Push para a branch: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Contate a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para motoristas Temelio**
