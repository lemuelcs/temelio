# Guia Completo de Publicação na Google Play Store

Este guia detalha todos os passos necessários para publicar o aplicativo **Temelio Motorista** na Google Play Store.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Criar Conta de Desenvolvedor Google Play](#criar-conta-de-desenvolvedor)
3. [Preparar o Aplicativo](#preparar-o-aplicativo)
4. [Criar Keystore de Assinatura](#criar-keystore-de-assinatura)
5. [Gerar APK/AAB de Release](#gerar-apkaab-de-release)
6. [Criar Aplicativo no Google Play Console](#criar-aplicativo-no-console)
7. [Configurar Ficha da Loja](#configurar-ficha-da-loja)
8. [Configurar Classificação de Conteúdo](#configurar-classificação)
9. [Configurar Público-Alvo e Conteúdo](#configurar-público)
10. [Upload do App Bundle](#upload-do-bundle)
11. [Testes Internos e Fechados](#testes)
12. [Revisão e Publicação](#revisão-e-publicação)
13. [Pós-Publicação](#pós-publicação)
14. [Checklist Final](#checklist-final)

---

## 1. Pré-requisitos

Antes de começar, certifique-se de ter:

- [ ] Aplicativo totalmente desenvolvido e testado
- [ ] Conta Google (Gmail)
- [ ] Cartão de crédito válido (para taxa única de US$ 25)
- [ ] Ícone do app em alta resolução (512x512px)
- [ ] Screenshots do app (mínimo 2, máximo 8)
- [ ] Banner de recursos (1024x500px)
- [ ] Descrição do app (curta e longa)
- [ ] Política de privacidade publicada online
- [ ] Termos de serviço (se aplicável)

---

## 2. Criar Conta de Desenvolvedor Google Play

### Passo 1: Acesse o Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Clique em **"Começar"** ou **"Sign In"**
3. Faça login com sua conta Google

### Passo 2: Registrar-se como Desenvolvedor

1. Aceite o **Acordo de Distribuição para Desenvolvedores**
2. Pague a **taxa de registro única de US$ 25**
   - Insira informações do cartão de crédito
   - A taxa é cobrada uma única vez e vale para sempre
3. Complete seu **perfil de desenvolvedor**:
   - Nome do desenvolvedor (será exibido na Play Store)
   - E-mail de contato
   - Website (opcional mas recomendado)
   - Telefone

### Passo 3: Verificar Identidade (se solicitado)

O Google pode solicitar verificação de identidade:
- Upload de documento de identificação
- Verificação de endereço
- Verificação de conta bancária (para pagamentos)

**Tempo de aprovação**: 1-3 dias úteis

---

## 3. Preparar o Aplicativo

### 3.1. Atualizar Informações do App

Edite `app/build.gradle.kts`:

```kotlin
android {
    defaultConfig {
        applicationId = "com.temelio.motorista"
        minSdk = 24
        targetSdk = 34
        versionCode = 1        // Incrementar a cada nova versão
        versionName = "1.0.0"  // Versão visível para usuários
    }
}
```

**Importante**:
- `versionCode`: Número inteiro que deve aumentar a cada atualização (1, 2, 3...)
- `versionName`: String legível para usuários ("1.0.0", "1.0.1", "1.1.0"...)

### 3.2. Remover Código de Debug

Certifique-se de que não há código de depuração em produção:
- Remova `Log.d()`, `Log.v()` desnecessários
- Desabilite ferramentas de debug
- Remova bibliotecas de teste de produção

### 3.3. Configurar ProGuard/R8

O arquivo `proguard-rules.pro` já está configurado. Verifique se está ativado:

```kotlin
buildTypes {
    release {
        isMinifyEnabled = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

### 3.4. Testar Exaustivamente

- [ ] Teste em diferentes dispositivos (telefones e tablets)
- [ ] Teste em diferentes versões do Android (API 24-34)
- [ ] Teste todas as funcionalidades
- [ ] Teste conectividade de rede (online/offline)
- [ ] Teste permissões (localização, notificações)
- [ ] Teste em modo retrato e paisagem

---

## 4. Criar Keystore de Assinatura

**CRÍTICO**: Guarde o keystore em local seguro! Se perder, nunca poderá atualizar o app!

### Gerar Keystore

```bash
keytool -genkey -v -keystore temelio-release.keystore \
  -alias temelio \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Responda as perguntas:
# - Senha do keystore: [ANOTE EM LOCAL SEGURO]
# - Nome e sobrenome: Temelio Tecnologia
# - Nome da empresa: Temelio
# - Cidade: [Sua cidade]
# - Estado: [Seu estado]
# - Código do país: BR
# - Senha da chave: [ANOTE EM LOCAL SEGURO - pode ser a mesma do keystore]
```

### Configurar Assinatura no Gradle

Crie `keystore.properties` na raiz do projeto:

```properties
storePassword=SUA_SENHA_KEYSTORE
keyPassword=SUA_SENHA_CHAVE
keyAlias=temelio
storeFile=../temelio-release.keystore
```

Edite `app/build.gradle.kts`:

```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
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
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### Fazer Backup do Keystore

**IMPORTANTE**: Faça backup do keystore em 3 locais diferentes:
1. Pendrive/HD externo
2. Nuvem (Google Drive, OneDrive, etc - em pasta privada)
3. Cofre físico (se possível)

Anote as senhas em local seguro (gerenciador de senhas).

---

## 5. Gerar APK/AAB de Release

O Google Play exige **Android App Bundle (AAB)** para novos apps.

### Gerar App Bundle

```bash
# No terminal, no diretório raiz do projeto
./gradlew bundleRelease

# O arquivo será gerado em:
# app/build/outputs/bundle/release/app-release.aab
```

### Verificar a Assinatura

```bash
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab

# Deve mostrar: "jar verified."
```

### Tamanho do App

Verifique o tamanho do AAB:
```bash
ls -lh app/build/outputs/bundle/release/app-release.aab

# Recomendado: < 150 MB
# Limite máximo: 150 MB (sem expansão)
```

---

## 6. Criar Aplicativo no Google Play Console

### Passo 1: Criar App

1. Acesse [Google Play Console](https://play.google.com/console)
2. Clique em **"Criar app"**
3. Preencha:
   - **Nome do app**: Temelio Motorista
   - **Idioma padrão**: Português (Brasil)
   - **Tipo de app**: Aplicativo
   - **Gratuito ou pago**: Gratuito
4. Marque as declarações:
   - [ ] Política de Privacidade
   - [ ] Diretrizes do programa para desenvolvedores
   - [ ] Leis de exportação dos EUA
5. Clique em **"Criar app"**

### Passo 2: Configurar Dashboard

O Google Play Console mostrará um painel com tarefas a completar:
- Configurar ficha da loja
- Classificação de conteúdo
- Público-alvo
- Dados de segurança
- Upload de app

Vamos preencher cada seção.

---

## 7. Configurar Ficha da Loja

### 7.1. Detalhes do App

**Nome do app**: Temelio Motorista (máx. 30 caracteres)

**Descrição curta**: (máx. 80 caracteres)
```
Gerencie suas rotas, ofertas e disponibilidade com facilidade.
```

**Descrição completa**: (máx. 4000 caracteres)
```
O Temelio Motorista é o aplicativo oficial para motoristas parceiros do sistema Temelio.
Com ele, você tem total controle sobre suas rotas, ofertas e disponibilidade, tudo na
palma da sua mão.

🚚 PRINCIPAIS FUNCIONALIDADES:

📊 Dashboard Completo
• Visualize suas estatísticas em tempo real
• Acompanhe seu nível e pontuação
• Veja seus ganhos totais
• Confira suas próximas rotas

📬 Ofertas de Rotas
• Receba notificações de novas ofertas
• Visualize todos os detalhes da rota
• Aceite ou recuse ofertas instantaneamente
• Informações completas de origem e destino

🗺️ Rastreamento em Tempo Real
• Atualize o status das suas rotas
• Compartilhe sua localização em tempo real
• Registre pontos importantes do trajeto
• Histórico completo de rotas realizadas

📅 Gestão de Disponibilidade
• Informe sua disponibilidade para os próximos dias
• Gerencie ciclos de trabalho (Ciclo 1, Ciclo 2, Same Day)
• Edite facilmente suas preferências
• Sincronização automática com o sistema

👤 Perfil Completo
• Mantenha seus dados sempre atualizados
• Gerenciamento de documentos (CNH, BRK)
• Informações do veículo
• Dados bancários para recebimento

🔔 Notificações Inteligentes
• Receba alertas de novas ofertas
• Notificações de rotas confirmadas
• Lembretes de documentos próximos ao vencimento
• Alertas importantes do sistema

✨ POR QUE ESCOLHER O TEMELIO?

• Interface moderna e intuitiva
• Funciona de forma rápida e eficiente
• Segurança dos seus dados
• Suporte dedicado para motoristas
• Atualizações constantes

📱 REQUISITOS:

• Android 7.0 ou superior
• Conexão com internet
• GPS habilitado
• Permissão de notificações

💼 PARA MOTORISTAS PARCEIROS TEMELIO

Este aplicativo é exclusivo para motoristas cadastrados e aprovados no sistema Temelio.
Se você ainda não é um parceiro, entre em contato com nossa equipe para saber como
se tornar um motorista Temelio.

🔒 PRIVACIDADE E SEGURANÇA

Levamos sua privacidade a sério. Todos os seus dados são protegidos e utilizados apenas
para melhorar sua experiência e o serviço de entregas. Leia nossa Política de Privacidade
completa em nosso site.

📞 SUPORTE

Precisa de ajuda? Entre em contato:
• E-mail: suporte@temelio.com.br
• Website: https://www.temelio.com.br

Baixe agora o Temelio Motorista e leve sua experiência de entregas para o próximo nível!
```

### 7.2. Gráficos

Você precisará criar e fazer upload dos seguintes recursos:

#### Ícone do App
- **Formato**: PNG (32-bit)
- **Tamanho**: 512 x 512 pixels
- **Tamanho máximo**: 1 MB
- Deve ser a versão de alta resolução do ícone do app

#### Screenshots do Smartphone
- **Formato**: PNG ou JPG
- **Tamanho**: Mínimo 320px, máximo 3840px
- **Proporção**: 16:9 ou 9:16
- **Quantidade**: Mínimo 2, máximo 8
- Recomendado: 4-6 screenshots mostrando principais funcionalidades

**Sugestões de screenshots**:
1. Tela de login
2. Dashboard com estatísticas
3. Lista de ofertas
4. Detalhes de uma rota
5. Calendário de disponibilidade
6. Perfil do motorista

#### Banner de Recursos (Feature Graphic)
- **Formato**: PNG ou JPG
- **Tamanho**: 1024 x 500 pixels
- **Tamanho máximo**: 1 MB
- Será exibido no topo da ficha da loja

### 7.3. Categorização

- **Aplicativo ou jogo**: Aplicativo
- **Categoria**: Negócios ou Produtividade
- **Tags**: logística, entregas, motorista, rotas, transporte

### 7.4. Detalhes de Contato

- **E-mail**: suporte@temelio.com.br
- **Telefone**: +55 (XX) XXXX-XXXX (opcional)
- **Website**: https://www.temelio.com.br
- **Política de privacidade**: https://www.temelio.com.br/privacidade

---

## 8. Configurar Classificação de Conteúdo

### Passo 1: Iniciar Questionário

1. Vá para **"Classificação de conteúdo"** no menu lateral
2. Clique em **"Iniciar questionário"**
3. Preencha o e-mail de contato

### Passo 2: Responder Questionário

**Categoria**: Outros (aplicativos de utilidade/produtividade)

**Perguntas típicas**:
- O app contém violência? **Não**
- O app tem conteúdo sexual? **Não**
- O app tem linguagem imprópria? **Não**
- O app tem conteúdo de drogas? **Não**
- O app tem conteúdo de apostas? **Não**
- O app compartilha localização? **Sim** (para rastreamento de rotas)
- O app permite comunicação entre usuários? **Não** (ou Sim, se houver chat)

### Passo 3: Revisar e Enviar

- Revise as respostas
- Clique em **"Enviar"**
- A classificação será calculada automaticamente

**Classificação esperada**: Livre (L) ou 10+

---

## 9. Configurar Público-Alvo e Conteúdo

### 9.1. Público-Alvo

1. **Grupo etário**: 18 anos ou mais
2. **Atrai crianças?**: Não

### 9.2. Dados de Segurança

Esta seção é **obrigatória** e muito importante.

#### Coleta de Dados

Declare quais dados o app coleta:

**Dados pessoais coletados**:
- [ ] Nome
- [ ] E-mail
- [ ] CPF
- [ ] Telefone
- [ ] Endereço
- [ ] Localização precisa (GPS)
- [ ] Fotos/vídeos (se upload de documentos)

**Finalidade da coleta**:
- Funcionalidade do app
- Autenticação
- Rastreamento de rotas
- Comunicação com motorista

**Compartilhamento de dados**:
- Dados são compartilhados com terceiros? (Firebase, Google Maps)
- Para qual finalidade?

**Segurança**:
- [ ] Dados são criptografados em trânsito (HTTPS)
- [ ] Dados são criptografados em repouso (se aplicável)
- [ ] Usuários podem solicitar exclusão de dados

#### Declaração de Privacidade

Você precisará de uma **Política de Privacidade** publicada online.

**Exemplo de URL**: https://www.temelio.com.br/privacidade

**Mínimo que deve conter**:
- Quais dados são coletados
- Como os dados são usados
- Com quem os dados são compartilhados
- Como os dados são protegidos
- Como usuários podem solicitar exclusão
- Informações de contato

### 9.3. Outros Dados

- **Acesso a localização em segundo plano**: Sim (se rastreamento contínuo)
  - Justificativa: "Rastreamento em tempo real de rotas de entrega"
- **Google Play Instant**: Não (por enquanto)

---

## 10. Upload do App Bundle

### Passo 1: Criar Nova Versão

1. Vá para **"Versão > Produção"** (ou "Teste interno/fechado/aberto" primeiro)
2. Clique em **"Criar nova versão"**

### Passo 2: Upload do AAB

1. Clique em **"Upload"**
2. Selecione o arquivo `app-release.aab`
3. Aguarde o upload (pode levar alguns minutos)

### Passo 3: Revisar Alertas

O Google Play pode mostrar alertas/avisos:
- Permissões solicitadas
- Recursos usados
- Compatibilidade de dispositivos

Revise e confirme se está tudo correto.

### Passo 4: Notas da Versão

Adicione notas da versão para usuários (todos os idiomas suportados):

**Português (Brasil)**:
```
Versão 1.0.0 - Lançamento Inicial

• Gerenciamento completo de ofertas de rotas
• Dashboard com estatísticas em tempo real
• Calendário de disponibilidade
• Rastreamento de rotas com GPS
• Notificações push de novas ofertas
• Perfil completo do motorista

Bem-vindo ao Temelio Motorista!
```

### Passo 5: Salvar

- Clique em **"Salvar"**
- Ainda não clique em "Revisar versão" (faremos isso depois)

---

## 11. Testes Internos e Fechados

**RECOMENDADO**: Antes de publicar para todos, faça testes internos.

### 11.1. Teste Interno

1. Vá para **"Versão > Teste interno"**
2. Crie uma lista de testadores (e-mails)
3. Faça upload do AAB
4. Compartilhe o link de teste com testadores
5. Colete feedback
6. Corrija bugs encontrados

**Tempo de aprovação**: Imediato (não passa por revisão)

### 11.2. Teste Fechado (Opcional)

Para grupos maiores (até 100 usuários):
1. Crie uma lista de testadores maior
2. Faça upload do AAB
3. Configure duração do teste
4. Monitore feedback e métricas

**Tempo de aprovação**: 1-2 dias

### 11.3. Teste Aberto (Opcional)

Para testes públicos antes do lançamento oficial:
- Qualquer pessoa pode participar
- Limite de usuários configurável
- Bom para testes de carga

---

## 12. Revisão e Publicação

### Passo 1: Completar Todos os Itens

Certifique-se de que todos os itens do painel estão completos:
- [x] Ficha da loja configurada
- [x] Classificação de conteúdo preenchida
- [x] Público-alvo definido
- [x] Dados de segurança declarados
- [x] App Bundle enviado
- [x] Política de privacidade publicada

### Passo 2: Revisar Versão

1. Vá para **"Versão > Produção"**
2. Clique em **"Revisar versão"**
3. Revise todas as informações
4. Clique em **"Iniciar lançamento para produção"**

### Passo 3: Aguardar Aprovação

- O Google Play revisará seu app
- **Tempo de aprovação**: 1-7 dias (geralmente 1-3 dias)
- Você receberá e-mail com o resultado

### Possíveis Resultados:

**✅ Aprovado**: App será publicado automaticamente

**⚠️ Revisão adicional**: Google pode pedir mais informações

**❌ Rejeitado**: Leia os motivos e corrija os problemas

---

## 13. Pós-Publicação

### 13.1. Monitoramento

Após a publicação, monitore:

1. **Google Play Console > Painel**:
   - Instalações
   - Desinstalações
   - Avaliações e comentários
   - Crashes e ANRs

2. **Firebase Console**:
   - Usuários ativos
   - Eventos personalizados
   - Crashes (Firebase Crashlytics - se configurado)

### 13.2. Responder Avaliações

- Responda a todas as avaliações (especialmente negativas)
- Seja profissional e prestativo
- Agradeça feedback positivo
- Ofereça soluções para problemas

### 13.3. Atualizações

Para publicar uma atualização:

1. Incremente `versionCode` e `versionName`
2. Gere novo AAB
3. Faça upload no Google Play Console
4. Adicione notas da versão
5. Publique

**Importante**: Sempre use o mesmo keystore de assinatura!

### 13.4. Análise de Performance

Ferramentas úteis:
- Google Play Console > Estatísticas
- Firebase Analytics
- Google Analytics (se integrado)

Métricas importantes:
- Taxa de retenção
- Tempo de sessão
- Crashes
- Taxa de desinstalação

---

## 14. Checklist Final

Antes de enviar para revisão, verifique:

### Aplicativo
- [ ] Versão de produção totalmente testada
- [ ] Sem código de debug em produção
- [ ] ProGuard/R8 habilitado
- [ ] Assinado com keystore de produção
- [ ] AAB gerado com sucesso
- [ ] Tamanho do AAB < 150 MB
- [ ] Testado em múltiplos dispositivos
- [ ] Testado em múltiplas versões do Android

### Google Play Console
- [ ] Conta de desenvolvedor criada e paga
- [ ] Nome do app definido
- [ ] Descrição curta e completa preenchidas
- [ ] Ícone 512x512 enviado
- [ ] Mínimo 2 screenshots enviados
- [ ] Banner de recursos 1024x500 enviado
- [ ] Categoria selecionada
- [ ] E-mail de contato configurado
- [ ] Website configurado
- [ ] Política de privacidade publicada e URL adicionada
- [ ] Classificação de conteúdo concluída
- [ ] Público-alvo definido
- [ ] Dados de segurança declarados
- [ ] AAB enviado
- [ ] Notas da versão preenchidas

### Segurança
- [ ] Keystore backup em 3 locais
- [ ] Senhas anotadas em local seguro
- [ ] Keystore NÃO commitado no Git
- [ ] API keys em local.properties (não no Git)

### Legal
- [ ] Política de privacidade atualizada
- [ ] Termos de serviço (se aplicável)
- [ ] Conformidade com LGPD/GDPR
- [ ] Direitos autorais de imagens/ícones verificados

### Opcional mas Recomendado
- [ ] Teste interno realizado
- [ ] Feedback de testadores incorporado
- [ ] Firebase Crashlytics configurado
- [ ] Firebase Analytics configurado
- [ ] Deep linking configurado
- [ ] Vídeo promocional (se disponível)

---

## 🎉 Parabéns!

Se você completou todos os passos, seu aplicativo está pronto para ser publicado na Google Play Store!

Lembre-se:
- Mantenha o app atualizado regularmente
- Ouça o feedback dos usuários
- Corrija bugs rapidamente
- Adicione novas funcionalidades
- Monitore métricas de desempenho

**Boa sorte com o lançamento do Temelio Motorista!** 🚀

---

## 📚 Recursos Úteis

- [Documentação Google Play Console](https://support.google.com/googleplay/android-developer)
- [Políticas do Google Play](https://play.google.com/about/developer-content-policy/)
- [Diretrizes de Design Android](https://developer.android.com/design)
- [Android Developers Blog](https://android-developers.googleblog.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/android)

---

## ❓ Perguntas Frequentes

**Q: Quanto tempo leva para o app ser aprovado?**
A: Geralmente 1-3 dias, mas pode levar até 7 dias.

**Q: Quanto custa publicar um app?**
A: Taxa única de US$ 25 para criar a conta de desenvolvedor. Sem custos recorrentes.

**Q: Posso mudar o nome do app depois de publicado?**
A: Sim, mas pode afetar o SEO e downloads.

**Q: Posso testar o app antes de publicar para todos?**
A: Sim! Use os testes internos, fechados ou abertos.

**Q: O que acontece se eu perder o keystore?**
A: Você nunca poderá atualizar o app. Terá que publicar um novo app com novo pacote.

**Q: Posso publicar o mesmo app em diferentes países?**
A: Sim, você pode selecionar os países onde o app estará disponível.

**Q: Como faço para monetizar o app?**
A: Pode adicionar anúncios, compras no app ou torná-lo pago. Requer configuração adicional.
