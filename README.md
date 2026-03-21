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
npm run auth:seed-demo
npm run dev
```

Danach ist die App lokal unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Standard-Logindaten

Fuer die lokale Entwicklung sind aktuell folgende Demo-Zugangsdaten vorgesehen:

- E-Mail: `demo@example.com`
- Passwort: `ChangeMe123!`

Die Werte kommen aus der lokalen `.env` bzw. `.env.example` und koennen bei Bedarf angepasst werden. Nach einer Aenderung der Demo-Credentials sollte `npm run auth:seed-demo` erneut ausgefuehrt werden.
