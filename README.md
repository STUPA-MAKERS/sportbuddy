# Sportbuddy — Sportpartnerbörse Hochschule Reutlingen

Webanwendung zur Vermittlung von Sportpartnern für Studierende.

## Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, Nodemailer
- **Frontend**: Angular 21, PrimeNG
- **Infra**: Docker Compose, Nginx

## Schnellstart

```bash
# backend/.env anlegen (siehe unten)
docker compose up -d --build
```

Frontend: http://localhost:4200 | Backend: http://localhost:3000

### Lokale Entwicklung

```bash
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm start
```

## Konfiguration (`backend/.env`)

| Variable | Beschreibung |
|----------|--------------|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL |
| `PORT` | Backend-Port (default: 3000) |
| `FRONTEND_URL` | CORS-Origin (z.B. `https://sportbuddy.hs-rt.de`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | E-Mail |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | `true` (default, empfohlen) oder `false` |
| `API_SECRET` | Schützt interne `/email/*` Endpunkte |

## API-Endpunkte

```
GET    /api/requests           Liste aller Anfragen
GET    /api/requests/:id       Einzelne Anfrage
POST   /api/requests           Neue Anfrage erstellen
GET    /api/requests/manage/:token   Anfrage per Token abrufen
PUT    /api/requests/manage/:token   Anfrage bearbeiten
DELETE /api/requests/manage/:token   Anfrage löschen
POST   /api/requests/:id/replies     Antwort senden
GET    /api/sports             Sportartenliste
```

## Deployment

```bash
git clone <repo>
cd STUPA
# backend/.env mit Produktionswerten befüllen
docker compose up -d --build
docker compose logs -f
```

Nginx Reverse Proxy (Beispiel):
```nginx
location /api { proxy_pass http://localhost:3000; }
location /    { proxy_pass http://localhost:4200; }
```

## Troubleshooting

- **Nginx Default-Seite**: `docker compose up -d --build frontend`
- **DB nicht erreichbar**: `docker compose logs postgres`
- **Mails nicht gesendet**: SMTP-Credentials prüfen, `docker compose logs backend`
- **CORS-Fehler**: `FRONTEND_URL` in `.env` korrekt setzen, Backend neu starten
