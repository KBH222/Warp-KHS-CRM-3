\# BMAD Project Requirements \& Configuration



\## DATABASE SETUP

\- Use LOCAL PostgreSQL (not Docker)

\- Connection string: postgresql://username:password@localhost:5432/dbname

\- Run migrations with: npx prisma db push

\- If connection fails, check local PostgreSQL service is running



\## REQUIRED TESTING SETUP

Before any development:

```bash

\# Install testing dependencies

npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom



\# Create verification script in package.json:

"scripts": {

&nbsp; "verify": "npm run typecheck \&\& npm run lint \&\& npm run test",

&nbsp; "typecheck": "tsc --noEmit",

&nbsp; "lint": "eslint . --ext ts,tsx --max-warnings 0",

&nbsp; "test": "vitest run"

}



\# ALWAYS run before changes:

npm run verify

