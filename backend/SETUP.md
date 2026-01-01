# SMTP Email-Setup Anleitung

## Was wurde erstellt?

✅ Vollständiges NestJS Backend mit Email-Service
✅ SMTP-Integration mit Nodemailer
✅ Email-Templates (Handlebars)
✅ Docker-Support
✅ Test-Endpoint für Email-Versand

## Schnellstart

### 1. Abhängigkeiten installieren

```bash
cd backend
npm install
```

### 2. Environment-Variablen konfigurieren

Erstellen Sie eine `.env` Datei (kopieren Sie die `.env.example`):

```bash
cp .env.example .env
```

Bearbeiten Sie die `.env` Datei mit Ihren SMTP-Daten:

```env
# Ihre SMTP-Konfiguration
SMTP_HOST=ihr-smtp-server.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@example.com
SMTP_PASS=ihr-passwort
SMTP_FROM=noreply@sportpartnerboerse.de

# Server-Konfiguration
PORT=3000
FRONTEND_URL=http://localhost:4200
```

### 3. Server starten

```bash
npm run start:dev
```

Der Server läuft jetzt auf `http://localhost:3000`

### 4. Test-Email versenden

Öffnen Sie im Browser:
```
http://localhost:3000/email/test?to=ihre-email@example.com
```

Oder mit curl:
```bash
curl "http://localhost:3000/email/test?to=ihre-email@example.com"
```

## SMTP-Konfiguration für gängige Anbieter

### Eigener SMTP-Server

Wenn Sie einen eigenen SMTP-Server haben (z.B. an der Hochschule):

```env
SMTP_HOST=smtp.hochschule-reutlingen.de
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihr-benutzername
SMTP_PASS=ihr-passwort
SMTP_FROM=noreply@hochschule-reutlingen.de
```

**Hinweise:**
- Port 587 = StartTLS (SMTP_SECURE=false)
- Port 465 = SSL/TLS (SMTP_SECURE=true)
- Port 25 = Meist ohne Verschlüsselung (nicht empfohlen)

### Gmail (für Tests)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@gmail.com
SMTP_PASS=ihr-app-passwort  # WICHTIG: App-Passwort verwenden!
SMTP_FROM=ihre-email@gmail.com
```

**Wichtig bei Gmail:**
1. 2-Faktor-Authentifizierung aktivieren
2. [App-Passwort erstellen](https://support.google.com/accounts/answer/185833)
3. Normales Passwort funktioniert nicht!

### Outlook / Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@outlook.com
SMTP_PASS=ihr-passwort
SMTP_FROM=ihre-email@outlook.com
```

### Mailtrap (für Entwicklungstests)

[Mailtrap](https://mailtrap.io) ist perfekt zum Testen ohne echte Emails zu versenden:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=ihr-mailtrap-user
SMTP_PASS=ihr-mailtrap-pass
SMTP_FROM=test@mailtrap.io
```

## Verfügbare Email-Funktionen

### 1. Email bei neuer Anfrage

```typescript
await emailService.sendRequestCreatedEmail('user@example.com', {
  requestTitle: 'Fußballpartner gesucht',
  sportart: 'Fußball',
  editUrl: 'http://localhost:4200/edit/token-123',
  deleteUrl: 'http://localhost:4200/delete/token-123',
});
```

### 2. Email bei aktualisierter Anfrage

```typescript
await emailService.sendRequestUpdatedEmail('user@example.com', {
  requestTitle: 'Fußballpartner gesucht',
  editUrl: 'http://localhost:4200/edit/token-123',
  deleteUrl: 'http://localhost:4200/delete/token-123',
});
```

### 3. Email bei gelöschter Anfrage

```typescript
await emailService.sendRequestDeletedEmail('user@example.com', 'Fußballpartner gesucht');
```

## Troubleshooting

### Problem: "SMTP-Verbindung fehlgeschlagen"

**Lösung:**
1. ✅ Prüfen Sie die SMTP-Credentials in `.env`
2. ✅ Stellen Sie sicher, dass Port nicht blockiert ist
3. ✅ Bei Gmail: App-Passwort verwenden
4. ✅ Firewall-Einstellungen prüfen
5. ✅ SMTP_HOST und SMTP_PORT nochmals überprüfen

### Problem: "Email kommt nicht an"

**Lösung:**
1. ✅ Spam-Ordner prüfen
2. ✅ "From"-Adresse muss valide sein
3. ✅ Server-Logs prüfen (in der Konsole)
4. ✅ SMTP-Verbindung testen mit Test-Endpoint

### Problem: "Authentication failed"

**Lösung:**
1. ✅ Benutzername/Passwort nochmals prüfen
2. ✅ Bei Gmail: App-Passwort verwenden (nicht normales Passwort!)
3. ✅ SMTP_USER sollte die vollständige Email-Adresse sein

## Logs und Debugging

Beim Start des Servers sehen Sie:
- ✅ "SMTP-Verbindung erfolgreich verifiziert" = Alles OK
- ❌ "SMTP-Verbindung fehlgeschlagen" = Problem mit Config

Bei Email-Versand in den Logs:
- ✅ "Email erfolgreich gesendet an..." = Erfolg
- ❌ "Fehler beim Versenden der Email..." = Problem

## Nächste Schritte

Nachdem der Email-Versand funktioniert:

1. ✅ Datenbank-Schema erstellen
2. ✅ Request-Endpoints implementieren
3. ✅ Token-Generierung für Bearbeitungs-URLs
4. ✅ Frontend-Integration

