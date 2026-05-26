# Sportbuddy Backend

NestJS Backend für die Sportpartnerbörse Hochschule Reutlingen.

## 🚀 Schnellstart

### Mit Docker (Empfohlen)

```bash
docker compose up -d --build backend
```

Backend läuft auf dem in `BACKEND_PORT` gesetzten Port (Default: 3000).

### Lokale Entwicklung

```bash
npm install
npm run start:dev
```

## ⚙️ Konfiguration

Erstelle eine `.env` Datei im `backend/` Verzeichnis:

```env
# Datenbank
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sportpartnerboerse

# Server
PORT=3000
APP_URL=https://sportbuddy.example.com
FRONTEND_URL=https://sportbuddy.example.com
CORS_ORIGINS=https://sportbuddy.example.com

# SMTP (E-Mail)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@example.com
SMTP_PASS=ihr-passwort
SMTP_FROM=noreply@sportpartnerboerse.de
```

## 🛠 Technologie-Stack

- **NestJS** (Node.js Framework)
- **TypeORM** (ORM)
- **PostgreSQL** (Datenbank)
- **Nodemailer** (E-Mail-Versand)
- **Handlebars** (E-Mail-Templates)

## 📁 Struktur

```
src/
├── requests/          # Request-Modul (CRUD-Operationen)
│   ├── request.entity.ts
│   ├── requests.controller.ts
│   ├── requests.service.ts
│   └── requests.module.ts
├── email/            # E-Mail-Service
│   ├── email.service.ts
│   └── email.controller.ts
├── cleanup/          # Automatische Bereinigung
│   └── cleanup.service.ts
└── main.ts           # Einstiegspunkt

templates/
└── emails/           # E-Mail-Templates (Handlebars)
    ├── request-created.hbs
    ├── request-updated.hbs
    └── request-deleted.hbs
```

## 🔌 API-Endpunkte

### Requests

- `GET /api/requests` - Alle Anfragen abrufen
- `GET /api/requests/:id` - Einzelne Anfrage abrufen
- `POST /api/requests` - Neue Anfrage erstellen
- `POST /api/requests/:id/replies` - Antwort auf eine Anzeige per E-Mail senden
- `GET /api/requests/manage/:token` - Private Anzeige per Token laden
- `PUT /api/requests/manage/:token` - Anfrage bearbeiten (Token-basiert)
- `DELETE /api/requests/manage/:token` - Anfrage löschen (Token-basiert)
- `GET /api/sports` - Liste aller Sportarten

### E-Mail (Test)

- `GET /email/test?to=email@example.com` - Test-E-Mail versenden

## 📧 E-Mail-Konfiguration

### SMTP für gängige Anbieter

**Gmail** (App-Passwort erforderlich!):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@gmail.com
SMTP_PASS=ihr-app-passwort
```

**Outlook/Office 365**:
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

## 🔄 Automatische Bereinigung

Abgelaufene Anfragen werden automatisch täglich um 2:00 Uhr gelöscht (via `@nestjs/schedule`).

## 🐛 Troubleshooting

**Problem**: Datenbank-Verbindung schlägt fehl
- Lösung: PostgreSQL-Container prüfen: `docker compose ps postgres`
- Lösung: Environment-Variablen in `.env` prüfen

**Problem**: E-Mails werden nicht versendet
- Lösung: SMTP-Credentials in `.env` prüfen
- Lösung: Test-Endpoint verwenden: `GET /email/test?to=test@example.com`
- Lösung: Bei Gmail: App-Passwort verwenden (nicht normales Passwort!)

**Problem**: CORS-Fehler
- Lösung: `FRONTEND_URL` in `.env` auf korrekte URL setzen

## 📝 Wichtige Hinweise

- **Token-System**: Jede Anfrage erhält einen `editToken` und `deleteToken` für sichere Bearbeitung/Löschung
- **E-Mail-Links**: Enthalten Token für Bearbeitung/Löschung
- **Validierung**: Eingaben werden mit `class-validator` validiert
- **CORS**: Nur die in `FRONTEND_URL` angegebene Domain ist erlaubt
