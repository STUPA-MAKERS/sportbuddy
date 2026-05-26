# Sportbuddy - Sportpartnerbörse Hochschule Reutlingen

Eine Web-Anwendung zur Vermittlung von Sportpartnern für Studierende der Hochschule Reutlingen.

## 📋 Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Technologie-Stack](#technologie-stack)
- [Projektstruktur](#projektstruktur)
- [Schnellstart](#schnellstart)
- [Konfiguration](#konfiguration)
- [Verwendung](#verwendung)
- [Go-Live Checkliste](#go-live-checkliste)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Entwicklung](#entwicklung)

## 🎯 Übersicht

**Sportbuddy** ist eine Sportpartnerbörse, die es Studierenden der Hochschule Reutlingen ermöglicht:

- Sportanfragen zu erstellen (z.B. "Suche Tennispartner")
- Bestehende Anfragen zu durchsuchen und zu filtern
- Eigene Anfragen zu bearbeiten und zu löschen
- Per E-Mail über neue Anfragen, Bearbeitungen und Löschungen informiert zu werden

### Hauptfunktionen

- ✅ **Anfrage erstellen**: Titel, Sportart, Beschreibung und Ablaufdatum
- ✅ **Anfragen durchsuchen**: Filterung nach Sportart
- ✅ **Anfrage bearbeiten**: Token-basierte Bearbeitung per E-Mail-Link
- ✅ **Anfrage löschen**: Token-basierte Löschung per E-Mail-Link
- ✅ **E-Mail-Benachrichtigungen**: Automatische E-Mails bei Erstellung, Bearbeitung und Löschung
- ✅ **Automatische Bereinigung**: Abgelaufene Anfragen werden automatisch gelöscht

## 🛠 Technologie-Stack

### Backend
- **NestJS** (Node.js Framework)
- **TypeORM** (ORM für Datenbankzugriffe)
- **PostgreSQL** (Datenbank)
- **Nodemailer** (E-Mail-Versand)
- **Handlebars** (E-Mail-Templates)

### Frontend
- **Angular 21** (Standalone Components)
- **PrimeNG 21** (UI-Komponenten)
- **PrimeIcons** (Icons)
- **RxJS** (Reactive Programming)

### Infrastructure
- **Docker** & **Docker Compose** (Containerisierung)
- **Nginx** (Web-Server für Frontend)
- **PostgreSQL 15** (Datenbank)

## 📁 Projektstruktur

```
STUPA/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── requests/       # Request-Modul (CRUD-Operationen)
│   │   ├── email/          # E-Mail-Service
│   │   ├── cleanup/        # Automatische Bereinigung
│   │   └── main.ts         # Einstiegspunkt
│   ├── templates/           # E-Mail-Templates (Handlebars)
│   ├── Dockerfile          # Docker-Image für Backend
│   └── package.json
│
├── frontend/                # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # UI-Komponenten
│   │   │   │   ├── home/           # Startseite (Liste)
│   │   │   │   ├── create-request/ # Anfrage erstellen
│   │   │   │   ├── edit-request/   # Anfrage bearbeiten
│   │   │   │   ├── request-detail/ # Anfrage-Details
│   │   │   │   └── delete-request/ # Anfrage löschen
│   │   │   └── services/    # API-Services
│   │   └── styles.scss     # Globale Styles (Corporate Design)
│   ├── Dockerfile          # Docker-Image für Frontend
│   ├── nginx.conf          # Nginx-Konfiguration
│   └── package.json
│
└── docker-compose.yml      # Docker Compose Konfiguration
```

## 🚀 Schnellstart

### Voraussetzungen

- **Docker** und **Docker Compose** installiert
- **Node.js 20+** (für lokale Entwicklung)
- **npm** oder **yarn**

### Installation mit Docker (Empfohlen)

1. **Repository klonen oder Dateien kopieren**

2. **Backend Environment-Variablen konfigurieren**

   Erstelle eine `.env` Datei im `backend/` Verzeichnis:

   ```bash
   cd backend
   cp .env.example .env  # Falls vorhanden
   # Oder erstelle manuell:
   ```

   Bearbeite `backend/.env`:

   ```env
   # Datenbank (wird von docker-compose überschrieben)
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

3. **Docker Compose starten**

   ```bash
   docker compose up -d --build
   ```

4. **Anwendung öffnen**

   - Frontend: `https://sportbuddy.example.com`
   - Backend API: `https://sportbuddy.example.com/api`

### Lokale Entwicklung (ohne Docker)

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## ⚙️ Konfiguration

### Backend Environment-Variablen

| Variable | Beschreibung | Beispiel | Erforderlich |
|----------|--------------|----------|-------------|
| `DB_HOST` | Datenbank-Host | `postgres` | ✅ |
| `DB_PORT` | Datenbank-Port | `5432` | ✅ |
| `DB_USER` | Datenbank-Benutzer | `postgres` | ✅ |
| `DB_PASSWORD` | Datenbank-Passwort | `postgres` | ✅ |
| `DB_NAME` | Datenbank-Name | `sportpartnerboerse` | ✅ |
| `PORT` | Backend-Port | `3000` | ❌ (Default: 3000) |
| `APP_URL` | Öffentliche URL für E-Mail-Links | `https://sportbuddy.example.com` | ✅ |
| `FRONTEND_URL` | Frontend-URL für CORS/E-Mail-Links | `https://sportbuddy.example.com` | ✅ |
| `CORS_ORIGINS` | Erlaubte CORS-Origins, kommagetrennt | `https://sportbuddy.example.com` | ❌ |
| `SMTP_HOST` | SMTP-Server | `smtp.example.com` | ✅ |
| `SMTP_PORT` | SMTP-Port | `587` | ✅ |
| `SMTP_SECURE` | SSL/TLS verwenden | `false` | ❌ (Default: false) |
| `SMTP_USER` | SMTP-Benutzername | `email@example.com` | ✅ |
| `SMTP_PASS` | SMTP-Passwort | `passwort` | ✅ |
| `SMTP_FROM` | Absender-E-Mail | `noreply@example.com` | ✅ |

### SMTP-Konfiguration für gängige Anbieter

#### Eigener SMTP-Server (Hochschule)

```env
SMTP_HOST=smtp.hochschule-reutlingen.de
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihr-benutzername
SMTP_PASS=ihr-passwort
SMTP_FROM=noreply@hochschule-reutlingen.de
```

#### Gmail (für Tests)

**Wichtig**: App-Passwort verwenden, nicht das normale Passwort!

1. 2-Faktor-Authentifizierung aktivieren
2. [App-Passwort erstellen](https://support.google.com/accounts/answer/185833)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@gmail.com
SMTP_PASS=ihr-app-passwort
SMTP_FROM=ihre-email@gmail.com
```

#### Outlook / Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@outlook.com
SMTP_PASS=ihr-passwort
SMTP_FROM=ihre-email@outlook.com
```

### Docker Compose Anpassungen

In `docker-compose.yml` können folgende Einstellungen angepasst werden:

- **Ports**: Standard-Ports (4200, 3000, 5433) bei Bedarf ändern
- **Datenbank-Passwort**: In Produktion starkes Passwort verwenden
- **Volumes**: Datenbank-Daten werden in `spb_pg_data` Volume gespeichert

## 📖 Verwendung

### Für Endbenutzer

1. **Anfrage erstellen**
   - Auf "Anfrage erstellen" klicken
   - Titel, Sportart, Beschreibung und optional Ablaufdatum eingeben
   - Nach dem Erstellen wird eine E-Mail mit Bearbeitungs- und Lösch-Links versendet

2. **Anfragen durchsuchen**
   - Auf der Startseite können alle Anfragen eingesehen werden
   - Filterung nach Sportart möglich

3. **Anfrage bearbeiten**
   - Link aus der E-Mail verwenden
   - Alle Felder können bearbeitet werden
   - Nach dem Speichern wird eine Bestätigungs-E-Mail versendet

4. **Anfrage löschen**
   - Link aus der E-Mail verwenden
   - Bestätigung erforderlich
   - Nach dem Löschen wird eine Bestätigungs-E-Mail versendet

### API-Endpunkte

#### Requests

- `GET /api/requests` - Alle Anfragen abrufen
- `GET /api/requests/:id` - Einzelne Anfrage abrufen
- `POST /api/requests` - Neue Anfrage erstellen
- `PATCH /api/requests/:token` - Anfrage bearbeiten (Token-basiert)
- `DELETE /api/requests/:token` - Anfrage löschen (Token-basiert)
- `GET /api/requests/sports/list` - Liste aller Sportarten

#### E-Mail (Test)

- `GET /email/test?to=email@example.com` - Test-E-Mail versenden

## ✅ Go-Live Checkliste

### 🔒 Sicherheit

- [ ] **Datenbank-Passwort ändern**
  - In `docker-compose.yml` starkes Passwort für PostgreSQL setzen
  - In `backend/.env` entsprechend anpassen

- [ ] **SMTP-Credentials prüfen**
  - Produktive SMTP-Daten verwenden
  - App-Passwort für Gmail/Google Workspace verwenden
  - Absender-E-Mail (`SMTP_FROM`) auf gültige Adresse setzen

- [ ] **CORS konfigurieren**
  - `FRONTEND_URL` in `backend/.env` auf Produktions-URL setzen
  - Beispiel: `FRONTEND_URL=https://sportbuddy.hochschule-reutlingen.de`

- [ ] **Umgebungsvariablen prüfen**
  - Alle `.env` Dateien auf Produktionswerte prüfen
  - Keine Test-Daten in Produktion verwenden

### 🌐 Domain & URLs

- [ ] **Frontend-URL konfigurieren**
  - `FRONTEND_URL` in Backend auf Produktions-URL setzen
  - Nginx-Konfiguration bei Bedarf anpassen

- [ ] **E-Mail-Links prüfen**
  - E-Mail-Templates verwenden korrekte URLs
  - Bearbeitungs- und Lösch-Links funktionieren

### 📧 E-Mail-Konfiguration

- [ ] **SMTP-Verbindung testen**
  - Test-Endpoint verwenden: `GET /email/test?to=test@example.com`
  - E-Mail kommt an und sieht korrekt aus

- [ ] **E-Mail-Templates prüfen**
  - Templates in `backend/templates/emails/` auf korrekte URLs prüfen
  - Corporate Design in E-Mails berücksichtigen (optional)

### 🗄️ Datenbank

- [ ] **Datenbank-Backup-Strategie**
  - Regelmäßige Backups des PostgreSQL-Volumes einrichten
  - Backup-Wiederherstellung testen

- [ ] **Datenbank-Migrationen**
  - Bei Schema-Änderungen: Migrations-Script ausführen
  - Datenbank-Struktur dokumentieren

### 🐳 Docker & Deployment

- [ ] **Docker-Images optimieren**
  - Multi-Stage Builds verwenden (bereits implementiert)
  - Image-Größe prüfen

- [ ] **Container-Logs konfigurieren**
  - Log-Rotation einrichten
  - Logs zentral sammeln (optional)

- [ ] **Health Checks**
  - Health Checks für alle Services prüfen
  - Monitoring einrichten (optional)

### 🎨 Frontend

- [ ] **Corporate Design prüfen**
  - Logo korrekt eingebunden
  - Farben entsprechen Corporate Design
  - Typografie korrekt

- [ ] **Meta-Tags & SEO**
  - Title-Tag korrekt (bereits: "Sportbuddy - Hochschule Reutlingen")
  - Meta-Description hinzufügen (optional)
  - Favicon prüfen

- [ ] **Performance**
  - Bundle-Größe prüfen (aktuell ~560KB, Budget: 500KB)
  - Lazy Loading funktioniert
  - Bilder optimiert

### 📝 Dokumentation

- [ ] **README aktualisieren**
  - Produktions-URLs dokumentieren
  - Wartungsanweisungen hinzufügen

- [ ] **Changelog erstellen**
  - Version dokumentieren
  - Änderungen auflisten

### 🧪 Testing

- [ ] **Funktionale Tests**
  - Alle Hauptfunktionen manuell testen
  - E-Mail-Versand testen
  - Token-basierte Bearbeitung/Löschung testen

- [ ] **Browser-Kompatibilität**
  - Chrome, Firefox, Safari, Edge testen
  - Mobile Ansicht prüfen

- [ ] **Fehlerbehandlung**
  - Fehlermeldungen sind benutzerfreundlich
  - 404-Seiten vorhanden (optional)

## 🚢 Deployment

### Produktions-Deployment

1. **Code auf Server kopieren**

   ```bash
   git clone <repository-url>
   cd STUPA
   ```

2. **Environment-Variablen konfigurieren**

   ```bash
   cd backend
   nano .env  # Produktionswerte eintragen
   ```

3. **Docker Compose starten**

   ```bash
   docker compose up -d --build
   ```

4. **Services prüfen**

   ```bash
   docker compose ps
   docker compose logs -f
   ```

### Reverse Proxy (Nginx/Apache)

Für Produktion empfohlen: Reverse Proxy vor Docker-Containern.

**Nginx Beispiel-Konfiguration:**

```nginx
server {
    listen 80;
    server_name sportbuddy.hochschule-reutlingen.de;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/TLS (HTTPS)

- **Let's Encrypt** für kostenloses SSL-Zertifikat
- **Certbot** für automatische Zertifikatsverlängerung

## 🔧 Troubleshooting

### Problem: Frontend zeigt Nginx Default-Seite

**Lösung:**
- Docker-Container neu bauen: `docker compose up -d --build frontend`
- Prüfen, ob Angular-Build erfolgreich war

### Problem: Backend kann nicht auf Datenbank zugreifen

**Lösung:**
- Datenbank-Container prüfen: `docker compose ps postgres`
- Datenbank-Logs prüfen: `docker compose logs postgres`
- Health Check prüfen: Datenbank muss "healthy" sein
- Environment-Variablen in `docker-compose.yml` prüfen

### Problem: E-Mails werden nicht versendet

**Lösung:**
1. SMTP-Credentials in `backend/.env` prüfen
2. Test-Endpoint verwenden: `GET /email/test?to=test@example.com`
3. Backend-Logs prüfen: `docker compose logs backend`
4. Bei Gmail: App-Passwort verwenden (nicht normales Passwort!)
5. Firewall/Port-Blockierung prüfen

### Problem: CORS-Fehler im Browser

**Lösung:**
- `FRONTEND_URL` in `backend/.env` auf korrekte URL setzen
- Backend neu starten: `docker compose restart backend`

### Problem: Port bereits belegt

**Lösung:**
- Ports in `docker-compose.yml` ändern
- Oder bestehenden Service beenden

### Problem: Datenbank-Daten gehen verloren

**Lösung:**
- Docker Volume `spb_pg_data` wird automatisch erstellt
- Bei Container-Löschung: Volume nicht löschen!
- Backup-Strategie implementieren

## 💻 Entwicklung

### Backend entwickeln

```bash
cd backend
npm install
npm run start:dev  # Hot-Reload aktiviert
```

### Frontend entwickeln

```bash
cd frontend
npm install
npm start
```

### Datenbank-Migrationen

Aktuell werden keine expliziten Migrationen verwendet. Bei Schema-Änderungen:

1. Entity-Dateien anpassen (`backend/src/requests/request.entity.ts`)
2. Datenbank manuell migrieren oder Container neu erstellen

### Code-Struktur

- **Backend**: NestJS-Module (Requests, Email, Cleanup)
- **Frontend**: Angular Standalone Components
- **Styling**: SCSS mit Corporate Design Variablen
- **Icons**: PrimeIcons

### Testing

```bash
# Backend Tests
cd backend
npm test

# Frontend Tests
cd frontend
npm test
```

## 📞 Support & Kontakt

Bei Fragen oder Problemen:

1. README durchlesen
2. Logs prüfen: `docker compose logs`
3. GitHub Issues erstellen

## 📄 Lizenz

Dieses Projekt wurde von Marc Brasche für die Hochschule Reutlingen entwickelt.

---

**Version**: 1.0.0  
**Letzte Aktualisierung**: 2025-01-02

