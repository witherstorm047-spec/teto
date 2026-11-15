# Teto word of the day — versão Android (.apk)

Mostra a palavra do dia (a mesma que no PC, porque usa o mesmo método de escolha) com a Teto a abrir a boca,
o som, e um lembrete diário à hora que escolheres.

## Como obter o .apk (sem instalar nada no PC)

1. Cria uma conta em https://github.com (grátis) e um repositório novo (pode ser privado).
2. Envia para lá **todo o conteúdo desta pasta** (arrastar para a página do repositório → "uploading an existing file").
   Tem de ficar a pasta escondida `.github/workflows/build-apk.yml`.
3. Separador **Actions** → "Gerar APK" → **Run workflow**. Demora ~5–8 minutos.
4. Quando terminar, abre a execução e em **Artifacts** descarrega `teto-word-apk` (um .zip com o `app-debug.apk`).
5. Passa o .apk para o telemóvel e abre-o. O Android vai pedir para permitir "instalar de fontes desconhecidas".

## Notas
- É um APK de *debug* (assinado com a chave de debug): serve perfeitamente para uso pessoal, mas não para a Play Store.
- Na primeira abertura pede a hora do lembrete e a permissão de notificações. "Mudar horário" (canto inferior direito) altera-a.
- Em alguns telemóveis (Xiaomi, Huawei, Samsung…) convém retirar a app da poupança de bateria para o lembrete chegar à hora certa.
- Precisa de internet para ir buscar a lista de palavras e a definição; sem internet usa a lista pequena de reserva.

## Compilar localmente (opcional)
Precisas de Node 20+, JDK 21 e Android SDK:
```
npm install
npx cap add android
npx capacitor-assets generate --android --iconBackgroundColor "#fefefe"
npx cap sync android
cd android && ./gradlew assembleDebug
```
O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`.
