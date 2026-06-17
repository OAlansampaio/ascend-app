# ASCEND — RPG da vida real (Capacitor + React)

App original inspirado no conceito "um Sistema que dá missões reais para você subir de nível".
Missões diárias geram XP/atributos; você usa o poder para escalar a Torre contra inimigos variados.
Inclui streak diário, lembretes de penalidade agendados, e integração de atividade (Health Connect / Strava).

> Tudo aqui é conteúdo original. Não usa nomes, arte, personagens ou marcas de obras protegidas.

---

## 1. Pré-requisitos
- **Node.js 18+** e npm
- **Android:** Android Studio (SDK + um emulador ou celular com depuração USB) e JDK 17
- **iOS (opcional):** macOS + Xcode + CocoaPods

## 2. Instalar e rodar no navegador (teste rápido)
```bash
npm install
npm run dev
```

## 3. Gerar o app Android
```bash
npm run build          # gera a pasta dist/
npx cap add android    # cria o projeto nativo (uma vez)
npm i capacitor-health-connect   # plugin de passos (Android) — comunidade
npx cap sync           # copia o build + plugins para o nativo
npx cap open android   # abre no Android Studio -> Run / Build APK
```
No Android Studio: **Build > Build Bundle(s)/APK(s) > Build APK(s)** para gerar o `.apk` de teste,
ou **Build > Generate Signed Bundle/APK** para o `.aab` de publicação.

## 4. Gerar o app iOS (opcional, precisa de Mac)
```bash
npx cap add ios
npx cap sync
npx cap open ios       # abre no Xcode -> Run / Archive
```

---

## 5. Ajustes nativos necessários

### a) Notificações (Android 13+)
O plugin já pede a permissão `POST_NOTIFICATIONS` em runtime. Nada a fazer além de aceitar no app.

### b) Health Connect (passos no Android)
1. Instale o app **Health Connect** (no Android 14+ já vem no sistema).
2. No `android/app/src/main/AndroidManifest.xml`, dentro de `<application>`, declare o uso e as permissões
   conforme a documentação do plugin `capacitor-health-connect` (permissão de leitura de passos/distância
   e a `<queries>` do pacote do Health Connect). A API do plugin pode variar — confira o README dele
   e ajuste os nomes de método em `src/services/health.js` se necessário.
3. Sem Health Connect (ex.: iOS ou device sem suporte), o app cai no modo demonstração automaticamente.

> Importante: o **Google Fit** foi descontinuado (sem novos cadastros desde 2024, fim em 2026).
> Para apps novos, o caminho é **Health Connect** (Android) — já é o que este projeto usa.

### c) Strava (OAuth)
1. Crie um app em https://www.strava.com/settings/api (precisa de assinatura Strava; há tier pago para o programa de devs).
2. Coloque seu **Client ID** e a URL do backend em `src/services/strava.js`.
3. Suba o backend de `backend-strava-exemplo/` (guarda o `client_secret` e faz a troca/renovação de token).
4. Registre o deep link `ascend://strava-callback` no Android adicionando um `intent-filter` na Activity
   principal do `AndroidManifest.xml`:
   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="ascend" android:host="strava-callback" />
   </intent-filter>
   ```
   Tokens do Strava expiram em ~6h: use `/strava/refresh` para renovar antes de chamar a API.

---

## 6. Publicar nas lojas
- **Google Play:** conta de desenvolvedor (taxa única ~US$25). Gere o `.aab` assinado, preencha ficha,
  classificação etária e a política de privacidade (obrigatória, ainda mais usando dados de saúde).
- **App Store:** conta Apple Developer (~US$99/ano). Faça o Archive no Xcode e envie pelo App Store Connect.
  A revisão da Apple é mais rigorosa — declare uso de dados de saúde corretamente.

## 7. Estrutura
```
src/
  App.jsx                 # o jogo inteiro (UI + lógica)
  main.jsx                # bootstrap React
  services/
    storage.js            # salva progresso (Capacitor Preferences)
    notifications.js      # agenda o lembrete de penalidade
    health.js             # lê passos do Health Connect (Android)
    strava.js             # fluxo OAuth do Strava
capacitor.config.ts       # appId, appName, plugins
backend-strava-exemplo/   # troca/renova token do Strava (Node)
```

## 8. Ideias de evolução
- Inventário e equipamentos cosméticos que mudam o avatar
- Missões semanais e eventos de "Portão" especiais
- Ranking entre amigos
- Salvar na nuvem (Firebase) para sincronizar entre dispositivos

---

## 9. Gerar o APK pelo celular via GitHub Actions

### Passo 1 — Criar conta no GitHub
Acesse **github.com** pelo navegador do celular e crie uma conta gratuita.

### Passo 2 — Criar o repositório
1. Toque em **+** > **New repository**
2. Nome: `ascend-app`
3. Deixe **Private** (recomendado) e toque em **Create repository**

### Passo 3 — Subir os arquivos pelo celular
Na página do repositório vazio, toque em **uploading an existing file**.
- Selecione todos os arquivos do ZIP extraído e faça upload.
- **Importante:** a pasta `.github/workflows/build-android.yml` precisa estar no upload.
  Se o navegador não mostrar pastas ocultas (que começam com `.`), use o passo alternativo abaixo.

#### Alternativa sem pasta oculta (100% pelo celular):
1. Suba todos os arquivos normais primeiro.
2. Na raiz do repositório, toque em **Add file > Create new file**.
3. No campo de nome, digite: `.github/workflows/build-android.yml`
   (o GitHub cria as pastas automaticamente quando você usa `/` no nome).
4. Cole o conteúdo do arquivo `build-android.yml` e confirme.

### Passo 4 — Acompanhar o build
1. Toque na aba **Actions** do repositório.
2. Você verá o workflow "Build Android APK" rodando (ícone amarelo = em progresso).
3. Aguarde ~10–15 minutos.

### Passo 5 — Baixar o APK
1. Quando o ícone ficar verde (✓), toque no workflow concluído.
2. Role até a seção **Artifacts** no final.
3. Toque em **ASCEND-debug-APK** para baixar o ZIP.
4. Extraia o ZIP — dentro estará o arquivo `app-debug.apk`.

### Passo 6 — Instalar no celular
1. No Android, vá em **Configurações > Segurança** e ative **"Instalar apps de fontes desconhecidas"**
   (ou "Fontes desconhecidas" / "Permitir deste aplicativo", dependendo da versão do Android).
2. Abra o gerenciador de arquivos, encontre o `app-debug.apk` e toque para instalar.
3. Confirme a instalação e abra o **ASCEND**.

### Observações
- O APK de **debug** é para uso pessoal/teste — funciona perfeitamente no seu celular.
- Para publicar na Play Store, é necessário um APK/AAB de **release** assinado com keystore
  (processo mais complexo, documentado em [developer.android.com](https://developer.android.com/studio/publish/app-signing)).
- O GitHub Actions oferece **2.000 minutos gratuitos por mês** em repositórios privados —
  suficiente para muitos builds.
