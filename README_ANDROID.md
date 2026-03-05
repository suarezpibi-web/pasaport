# Com generar l'APK per a Android

Aquest projecte està configurat amb **Capacitor** per convertir l'aplicació web en una aplicació nativa d'Android.

## Requisits previs
Necessites tenir instal·lat al teu ordinador:
1. **Node.js** i **npm**.
2. **Android Studio** (per compilar l'APK).

## Passos per generar l'APK

1. **Descarrega el codi**:
   Descarrega tot el projecte al teu ordinador.

2. **Instal·la les dependències**:
   Obre una terminal a la carpeta del projecte i executa:
   ```bash
   npm install
   ```

3. **Compila l'aplicació web**:
   Genera els fitxers estàtics de l'aplicació:
   ```bash
   npm run build
   ```

4. **Sincronitza amb Android**:
   Copia els fitxers compilats al projecte d'Android:
   ```bash
   npx cap sync
   ```

5. **Obre Android Studio**:
   Obre el projecte natiu a Android Studio:
   ```bash
   npx cap open android
   ```

6. **Genera l'APK**:
   - A Android Studio, ves al menú **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   - Un cop acabi, apareixerà una notificació per localitzar el fitxer `.apk` generat.
   - Copia aquest fitxer al teu mòbil i instal·la'l!

## Notes importants
- Assegura't que el teu mòbil té activada l'opció d'instal·lar aplicacions d'orígens desconeguts (per a APKs fora de la Play Store).
- Si vols publicar l'app a la Play Store, hauràs de generar un **Signed Bundle** en lloc d'un APK normal.
