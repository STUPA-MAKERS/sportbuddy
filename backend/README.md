# Sportbuddy Backend

NestJS + TypeORM + PostgreSQL. Konfiguration und Deployment: siehe root `README.md`.

## Entwicklung

```bash
npm install
npm run start:dev
```

## Stack

- NestJS, TypeORM, PostgreSQL, Nodemailer, Handlebars, altcha-lib

## API

```
GET    /api/requests
GET    /api/requests/:id
POST   /api/requests                    (Altcha erforderlich)
GET    /api/requests/manage/:token      (editToken only)
PUT    /api/requests/manage/:token
DELETE /api/requests/manage/:token
POST   /api/requests/:id/replies        (Altcha erforderlich)
GET    /api/altcha/challenge
GET    /api/sports
```

`/email/*` Endpunkte erfordern `X-Api-Key` Header.
