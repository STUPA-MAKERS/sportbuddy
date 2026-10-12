# Sportbuddy — Sportpartnerbörse Hochschule Reutlingen

Webanwendung zur Vermittlung von Sportpartnern für Studierende.

## Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, Nodemailer, altcha-lib
- **Frontend**: Angular 21, [STUPA-MAKERS/ui-kit](https://github.com/STUPA-MAKERS/ui-kit) (Git-Submodul unter `frontend/vendor/ui-kit`), Material Symbols (self-hosted SVG)
- **Infra**: Docker Compose, Nginx, altcha-srv

## Schnellstart

```bash
git submodule update --init   # ui-kit unter frontend/vendor/ui-kit
cp .env.example .env
# .env befüllen
docker compose up -d --build
```

Frontend: http://localhost:8094 | Backend: http://localhost:8093

### Lokale Entwicklung

```bash
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm start   # Proxy /api -> localhost:3000
```

Mit Nix: `nix develop` (Shell mit Node 22), `nix build .#backend` bzw. `nix build .#frontend`.
Das Flake bindet das ui-kit-Submodul ein (`inputs.self.submodules = true`, ab Nix 2.27).
Nach Änderungen an einer `package-lock.json` den `npmDepsHash` in `flake.nix` aktualisieren
(`nix run nixpkgs#prefetch-npm-deps -- frontend/package-lock.json`).

### NixOS-Modul

Das Flake liefert `nixosModules.default` mit `services.sportbuddy`: das Backend als
systemd-Dienst, standardmäßig nur auf `127.0.0.1:3000`, mit einer lokalen PostgreSQL-Datenbank.
Das Backend erreicht sie über den Unix-Socket mit Peer-Authentifizierung und braucht so kein
Datenbank-Passwort. Die Secrets (`SMTP_PASS`, `API_SECRET`, `ALTCHA_HMAC_KEY`,
`SESSION_SECRET`, `OIDC_CLIENT_SECRET`) kommen aus `environmentFile`. Den Webserver
konfiguriert das Modul nicht: Er liefert `config.services.sportbuddy.frontend` aus und leitet
`/api` an das Backend weiter, wie `frontend/nginx.conf`.

```nix
services.sportbuddy = {
  enable = true;
  url = "https://sportbuddy.example.org";
  smtp = { host = "mail.example.org"; user = "noreply@example.org"; from = "noreply@example.org"; };
  oidc.issuer = "https://sso.example.org/application/o/sportbuddy/";
  environmentFile = "/run/secrets/sportbuddy-env";
};
```

`nix flake check` startet das Modul in einer VM (`checks.x86_64-linux.module`).

Sport- und UI-Symbole kommen aus `@material-symbols/svg-400` und werden nach
`frontend/src/app/shared/symbols.generated.ts` erzeugt: `npm run symbols` im Frontend.

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
| `ALTCHA_HMAC_KEY` | HMAC-Key für Altcha-Challenges |
| `MODERATION_EMAIL` | Optional: zusätzliche Empfänger für Hinweise auf neue Meldungen, kommagetrennt. Alle Admins, die sich einmal angemeldet haben, bekommen sie ohnehin (abschaltbar in den Einstellungen). |
| `SESSION_SECRET` | Signiert das Sitzungs-Cookie der Verwaltung |
| `OIDC_ISSUER` / `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | OpenID-Connect-Client für die Verwaltung |
| `OIDC_REDIRECT_URI` | Default `${FRONTEND_URL}/api/admin/auth/callback` |
| `OIDC_SCOPES` | Default `openid profile email` |
| `OIDC_GROUPS_CLAIM` | Claim mit den Gruppen, Punkt-Pfade erlaubt (Default `groups`) |
| `OIDC_ADMIN_GROUP` | Gruppe mit Zugriff auf `/admin` (Default `STUPA.Sportbuddy.Admin`) |

## Verwaltung (`/admin`)

Anmeldung per OIDC (Authorization Code + PKCE). Zugriff hat nur, wer die Gruppe aus
`OIDC_ADMIN_GROUP` im Groups-Claim hat; alle anderen sehen eine 403-Seite. Dort lassen sich
Anfragen prüfen, ausblenden, wieder einblenden und löschen, Meldungen verwerfen, Sportarten
pflegen, Laufzeit und Schwelle fürs automatische Ausblenden einstellen und E-Mail-Adressen
oder ganze Domains sperren.

`docker-compose.yml` übergibt alle Variablen an die jeweiligen Services — kein separates `backend/.env` nötig.

## API-Endpunkte

```
GET    /api/requests                          Sichtbare Anfragen (?sport=, ?q=, ?skip=, ?take=) -> { items, total }
GET    /api/requests/:id                      Einzelne Anfrage
POST   /api/requests                          Anfrage erstellen (Altcha)
GET    /api/requests/verify/:token            E-Mail bestätigen
POST   /api/requests/:id/resend-verification  Bestätigungs-E-Mail erneut senden (gedrosselt)
POST   /api/requests/:id/replies              Antwort senden (Altcha)
POST   /api/requests/:id/reports              Anfrage melden (Altcha)
GET    /api/requests/manage/:token            Anfrage per Verwaltungslink abrufen
PUT    /api/requests/manage/:token            Anfrage bearbeiten
POST   /api/requests/manage/:token/extend     Laufzeit verlängern
DELETE /api/requests/manage/:token            Anfrage löschen
GET    /api/sports                            Aktive Sportarten mit Symbol und Anzahl
GET    /api/config                            Öffentliche Einstellungen (Laufzeit)
GET    /api/altcha/challenge                  Altcha-Challenge

GET    /api/admin/auth/login|callback|me|config|denied, POST /api/admin/auth/logout
GET    /api/admin/requests (?status=review|unverified|online|hidden|all, ?q=)
GET    /api/admin/requests/:id, POST .../hide|unhide|approve|resend-verification, DELETE .../:id
POST   /api/admin/requests/bulk
GET|PUT /api/admin/settings, /api/admin/sports(...), /api/admin/blocked-emails(...)
```

Alte Links `/edit/:token`, `/delete/:token` und `/request/:id` leiten auf die neuen Seiten um.

## Deployment

```bash
git clone <repo>
cd sportbuddy
git submodule update --init
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
