# dashboard-one

`dashboard-one` ist ein fruehes Dashboard-Projekt mit Fokus auf einem klaren, wartbaren Einstieg: zuerst ein einfacher lokaler Login und eine geschuetzte App-Shell, spaeter erweiterbar in Richtung OIDC, weitere Datenquellen und gecachte Integrationen.

Der Code soll bewusst klein, modular und gut weiterentwickelbar bleiben. Das Projekt dient gleichzeitig als Referenz dafuer, wie agentisches Coding in einem echten Entwicklungsalltag funktionieren kann.

## Projektidee

- einfacher Einstieg ueber einen lokalen Login
- geschuetzter Dashboard-Bereich als Basis fuer weitere Features
- saubere Struktur fuer spaetere Auth-, Datenbank- und Integrations-Erweiterungen
- lokale Persistenz und Caching als Grundlage fuer externe Datenquellen

## Learnings und Projektnotizen

Die laufenden Learnings aus dem Projekt werden in [.agentic/notes.md](.agentic/notes.md) gesammelt. Dort stehen vor allem Arbeitsnotizen, Beobachtungen aus der Umsetzung und Erkenntnisse zum agentischen Entwicklungsprozess.

Weitere projektbezogene Kontexte liegen in:

- [.agentic/project-context.md](.agentic/project-context.md)
- [.agentic/decisions.md](.agentic/decisions.md)
- [.agentic/backlog.md](.agentic/backlog.md)

## Technologie

- Next.js mit App Router
- TypeScript
- Tailwind CSS
- Prisma als ORM
- SQLite als aktuelle Entwicklungsdatenbank

Die Architektur ist so angelegt, dass spaeter ein Wechsel auf PostgreSQL und eine staerkere Auth-Loesung moeglich bleibt.

## Lokaler Einstieg

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed-demo-data
npm run auth:seed-demo
npm run dev
```

Danach ist die App lokal unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Login fuer die lokale Entwicklung

Fuer die lokale Entwicklung wird der Demo-User ueber die Werte in der lokalen `.env` angelegt.

- E-Mail: `demo@example.com`
- Passwort: siehe `DEMO_LOGIN_PASSWORD` in der lokalen `.env`

Die Werte kommen aus der lokalen `.env` bzw. `.env.example` und koennen bei Bedarf angepasst werden. Nach einer Aenderung der Demo-Credentials sollte `npm run auth:seed-demo` erneut ausgefuehrt werden.

## Schnell deployen auf Railway

Fuer den aktuellen Stand des Projekts ist Railway der einfachste Weg, weil die App serverseitig laeuft und SQLite auf einer persistenten Volume weiterverwenden kann.

### 1. Service anlegen

- Repository mit Railway verbinden
- eine Volume mounten, zum Beispiel auf `/data`

### 2. Environment Variables setzen

```bash
DATABASE_URL=file:/data/app.db
AUTH_SECRET=<lange-zufaellige-secret-zeichenkette>
DEMO_LOGIN_EMAIL=demo@example.com
DEMO_LOGIN_PASSWORD=ChangeMe123!
```

`AUTH_SECRET` sollte mindestens 32 Zeichen lang sein.

### 3. Build- und Start-Command

Railway kann die Standardbefehle aus `package.json` verwenden:

- Build: `npm run build`
- Pre-deploy: `npm run railway:predeploy`
- Start: `npm run railway:start`

`postinstall` fuehrt automatisch `prisma generate` aus. `railway:predeploy` wendet die vorhandenen Prisma-Migrationen an. `railway:start` prueft vor dem Serverstart, ob das Demo bereits seeded ist, und fuehrt das Seed nur bei Bedarf aus.

### 4. Demo-User einmalig anlegen

Die Railway-Volume sollte fuer den ersten produktionsartigen Start eine frische SQLite-Datei verwenden, damit `prisma migrate deploy` das Schema sauber anlegen kann. Falls Railway den Pre-deploy-Schritt nicht wie erwartet vor dem ersten Request wirksam macht, ist der Start-Command absichtlich selbstheilend und holt Migration plus einmaliges Demo-Seed nach.

Mit dem gesetzten Pre-deploy-Schritt ist kein zusaetzlicher manueller Shell-Schritt noetig.

Danach ist die App mit den gesetzten Demo-Credentials erreichbar.
