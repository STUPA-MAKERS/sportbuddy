# Sportpartnerbörse Backend

Backend für die Sportpartnerbörse der Hochschule Reutlingen.

## Features

- ✅ SMTP-basierter Email-Versand
- ✅ Email-Templates mit Handlebars
- ✅ Automatische Email-Benachrichtigungen
- ✅ Docker-Support
- ✅ TypeScript mit NestJS

## Setup

### Lokale Entwicklung

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Environment-Variablen konfigurieren:**
   ```bash
   cp .env.example .env
   ```
   
   Bearbeiten Sie die `.env` Datei und tragen Sie Ihre SMTP-Daten ein:
   ```env
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@example.com
   SMTP_PASS=your_password
   SMTP_FROM=noreply@sportpartnerboerse.de
   ```

3. **Server starten:**
   ```bash
   npm run start:dev
   ```

Der Server läuft auf `http://localhost:3000`

### Mit Docker

```bash
docker build -t sportpartnerboerse-backend .
docker run -p 3000:3000 --env-file .env sportpartnerboerse-backend
```

## API Endpoints

### Health Check
- `GET /health` - Prüft ob der Server läuft

### Email Test
- `GET /email/test?to=test@example.com` - Sendet eine Test-Email

### Email Endpoints (für später)
- `POST /email/request-created` - Email bei neuer Anfrage
- `POST /email/request-updated` - Email bei aktualisierter Anfrage
- `POST /email/request-deleted` - Email bei gelöschter Anfrage

## SMTP-Konfiguration

### Beispiel: Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # App-Passwort erforderlich!
```

**Wichtig bei Gmail:** Sie müssen ein [App-Passwort](https://support.google.com/accounts/answer/185833) erstellen.

### Beispiel: Office 365 / Outlook
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### Beispiel: Mailtrap (für Tests)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
```

## Testing

### Test-Email versenden

1. Server starten: `npm run start:dev`
2. Im Browser öffnen: `http://localhost:3000/email/test?to=ihre-email@example.com`

Oder mit curl:
```bash
curl "http://localhost:3000/email/test?to=ihre-email@example.com"
```

## Email-Templates

Die Email-Templates befinden sich in `templates/emails/` und verwenden Handlebars-Syntax.

Verfügbare Templates:
- `request-created.hbs` - Email bei neuer Anfrage
- `request-updated.hbs` - Email bei aktualisierter Anfrage
- `request-deleted.hbs` - Email bei gelöschter Anfrage

## Troubleshooting

### SMTP-Verbindung fehlgeschlagen
- Prüfen Sie Ihre SMTP-Credentials in der `.env` Datei
- Stellen Sie sicher, dass der SMTP-Port nicht blockiert ist
- Bei Gmail: Verwenden Sie ein App-Passwort, nicht das normale Passwort
- Prüfen Sie die Firewall-Einstellungen

### Emails kommen nicht an
- Prüfen Sie den Spam-Ordner
- Verifizieren Sie die "From"-Adresse
- Prüfen Sie die Server-Logs: `npm run start:dev`

## Entwicklung

```bash
# Entwicklung mit Hot-Reload
npm run start:dev

# Build für Produktion
npm run build

# Produktion starten
npm run start:prod

# Tests ausführen
npm test
```

