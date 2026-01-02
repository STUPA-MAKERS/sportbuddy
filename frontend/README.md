# Sportbuddy Frontend

Angular 21 Frontend für die Sportpartnerbörse Hochschule Reutlingen.

## 🚀 Schnellstart

### Mit Docker (Empfohlen)

```bash
docker compose up -d --build frontend
```

Frontend läuft auf: http://localhost:4200

### Lokale Entwicklung

```bash
npm install
npm start
```

## 🛠 Technologie-Stack

- **Angular 21** (Standalone Components)
- **PrimeNG 21** (UI-Komponenten)
- **PrimeIcons** (Icons)
- **RxJS** (Reactive Programming)

## 📁 Struktur

```
src/
├── app/
│   ├── components/
│   │   ├── home/           # Startseite (Anfragen-Liste)
│   │   ├── create-request/ # Anfrage erstellen
│   │   ├── edit-request/   # Anfrage bearbeiten
│   │   ├── request-detail/ # Anfrage-Details
│   │   └── delete-request/ # Anfrage löschen
│   ├── services/
│   │   └── request.service.ts  # API-Service
│   ├── app.config.ts       # App-Konfiguration
│   └── app.routes.ts       # Routing
├── styles.scss            # Globale Styles (Corporate Design)
└── index.html
```

## 🎨 Corporate Design

Das Frontend verwendet das Corporate Design der Hochschule Reutlingen:

- **Farben**: HSRT-1 Grau (#707173), HSRT-Gruen-4 (#0aa459), HSRT-Gruen-6 (#79b63e)
- **Header/Footer**: Dunkler Hintergrund (#1A1919)
- **Logo**: STUPA_Neu-Breit-Color-White.png

Styles sind in `src/styles.scss` definiert.

## 🔧 Build

```bash
# Development Build
npm run build

# Production Build (automatisch im Docker)
npm run build
```

## 📝 Wichtige Hinweise

- **API-URL**: Wird über `RequestService` konfiguriert (Standard: `http://localhost:3000/api`)
- **Routing**: Alle Routen sind in `app.routes.ts` definiert
- **PrimeNG Theme**: Aura Theme mit deaktiviertem Dark Mode
- **Responsive**: Mobile-first Design

## 🐛 Troubleshooting

**Problem**: Frontend zeigt Nginx Default-Seite
- Lösung: Docker Container neu bauen: `docker compose up -d --build frontend`

**Problem**: API-Verbindung fehlschlägt
- Lösung: Backend-Service prüfen und CORS-Einstellungen kontrollieren
