# Sportbuddy — Sportpartnerbörse Hochschule Reutlingen

Webanwendung zur Vermittlung von Sportpartnern für Studierende.

## Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, Nodemailer, altcha-lib
- **Frontend**: Angular 21, PrimeNG
- **Infra**: Docker Compose, Nginx, altcha-srv

## Schnellstart

```bash
cp .env.example .env
# .env befüllen
docker compose up -d --build
```

Frontend: http://localhost:8094 | Backend: http://localhost:8093

### Lokale Entwicklung

```bash
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm start
```

## Konfiguration (`.env` im Root)

Alle Secrets leben in einer einzigen `.env` im Root-Verzeichnis. Vorlage: `.env.example`.

| Variable | Beschreibung |
|----------|--------------|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | PostgreSQL |
| `PORT` | Backend-Port (default: 3000) |
| `FRONTEND_URL` | CORS-Origin (z.B. `https://sportbuddy.hs-rt.de`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | E-Mail |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | `true` (default) oder `false` für selbstsignierte Certs |
| `API_SECRET` | Schützt interne `/email/*` Endpunkte (`X-Api-Key` Header) |
| `ALTCHA_HMAC_KEY` | Geteilter HMAC-Key zwischen altcha-srv und Backend |

`docker-compose.yml` übergibt alle Variablen an die jeweiligen Services — kein separates `backend/.env` nötig.

## API-Endpunkte

```
GET    /api/requests                    Liste aller Anfragen (?sport=, ?skip=, ?take=)
GET    /api/requests/:id                Einzelne Anfrage
POST   /api/requests                    Anfrage erstellen (Altcha erforderlich)
GET    /api/requests/manage/:token      Anfrage per editToken abrufen
PUT    /api/requests/manage/:token      Anfrage bearbeiten
DELETE /api/requests/manage/:token      Anfrage löschen
POST   /api/requests/:id/replies        Antwort senden (Altcha erforderlich)
GET    /api/altcha/challenge            Altcha-Challenge (intern von altcha-srv)
GET    /api/sports                      Sportartenliste
```

## Deployment

```bash
git clone <repo>
cd hsrt_stupa_sportbuddy
cp .env.example .env
nano .env  # Produktionswerte eintragen
docker compose up -d --build
docker compose logs -f
```

Nginx Reverse Proxy:
```nginx
location /api { proxy_pass http://localhost:8093; }
location /    { proxy_pass http://localhost:8094; }
```

## Troubleshooting

- **Nginx Default-Seite**: `docker compose up -d --build frontend`
- **DB nicht erreichbar**: `docker compose logs postgres`
- **Mails nicht gesendet**: SMTP-Credentials in `.env` prüfen, `docker compose logs backend`
- **CORS-Fehler**: `FRONTEND_URL` in `.env` setzen, `docker compose restart backend`
- **Altcha schlägt fehl**: `ALTCHA_HMAC_KEY` in `.env` gesetzt? `docker compose logs backend`
