# F1 — Controle de Custo de IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o endpoint de IA aberto: exigir autenticação Firebase, rate-limit e quota mensal por usuário no Lambda, e fazer o front enviar o ID token — sem violar `IRecipeRepository` e mantendo quota portável para a Fase 4.

**Architecture:** Proteção centralizada num wrapper `withAiGuard` no Lambda que (1) valida o Firebase ID token via `jose`+JWKS x509, (2) checa rate-limit + quota mensal contando uma tabela-ledger `AiUsageEvent` no Postgres (já provisionado via Prisma), (3) registra o uso, e só então chama o handler de IA. Quota e usage ficam atrás de uma interface `AiUsageRepository` (espelho do padrão `RecipeRepository` existente) → na F4 vira impl Go. No front, `IAuthProvider` ganha `getIdToken()` e `recipeAI.ts` anexa `Authorization: Bearer <token>`.

**Tech Stack:** TypeScript, AWS Lambda (Serverless Framework, nodejs20.x), Prisma + PostgreSQL, `jose` (JWT/JWKS), Jest (Lambda) / Vitest (front), React + Firebase Auth.

**Repos (paths absolutos):**
- Lambda: `/Users/andrewozniack/Documents/recipes/recipe-api`
- Front: `/Users/andrewozniack/Documents/recipes/recipe-hub`

**Decisões travadas (sessão de planejamento):**
- Verificação de token: `jose` + certs x509 do Google securetoken (não `firebase-admin`). Mais leve, sem secret de service-account, espelha o que o Go fará na F4.
- Escopo: proteger os **2 endpoints de IA reais** da API (`parseRecipe`, `generateCookMode`). Confirmado em `recipe-api` main (2026-06-12): `parseRecipeFromUrl` e `convertToSteps` **nunca existiram** na API — o front chama endpoints inexistentes (features quebradas em runtime), tratado como follow-up de produto, fora deste plano. O guard é um wrapper reutilizável → se esses endpoints forem construídos depois, basta envolvê-los.

**Pré-requisito de infra:** os endpoints de IA passam a **exigir `DATABASE_URL`** (quota é persistida). Garantir Postgres provisionado e `DATABASE_URL` setado no env do Lambda (Serverless) antes do deploy. Sem DB, os endpoints retornam 503.

---

## File Structure

**Lambda (`recipe-api`):**
- `src/config/env.ts` — modificar: adicionar `firebaseProjectId`, `allowedOrigins`, `aiRatePerMinute`, `aiMonthlyQuota`.
- `src/core/errors.ts` — modificar: `UnauthorizedError`, `RateLimitError`, `QuotaExceededError`.
- `src/core/http.ts` — modificar: CORS por origem (substituir `*`).
- `src/core/aiGuard.ts` — criar: wrapper `withAiGuard`.
- `src/modules/auth/firebaseToken.ts` — criar: verificação do ID token.
- `src/modules/usage/AiUsageRepository.ts` — criar: interface portável.
- `src/modules/usage/PrismaAiUsageRepository.ts` — criar: impl Prisma.
- `src/modules/usage/quota.ts` — criar: enforcement rate-limit + quota.
- `prisma/schema.prisma` — modificar: model `AiUsageEvent` + relação em `User`.
- `src/modules/recipes/http.ts` — modificar: handlers viram `AuthedHandler`.
- `src/handler.ts` — modificar: aplicar `withAiGuard` nas exports.
- `serverless.yml` / `.env.example` — modificar: novas env vars.
- `tests/...` — criar: testes por módulo.

**Front (`recipe-hub`):**
- `src/auth/types.ts` — modificar: `getIdToken()` na interface.
- `src/auth/providers/FirebaseAuthProvider.ts` — modificar: implementar.
- `src/auth/providers/CustomAuthProvider.ts` — modificar: implementar.
- `src/auth/AuthContext.tsx` — modificar: expor `getIdToken`.
- `src/lib/recipeAI.ts` — modificar: anexar header `Authorization`.
- `src/components/recipes/ImportRecipeDialog.tsx` — modificar: passar token.
- `src/components/recipes/RecipeForm.tsx` — modificar: passar token.

---

## PARTE A — Lambda (`recipe-api`)

Trabalhe sempre a partir de `/Users/andrewozniack/Documents/recipes/recipe-api`.

### Task 0: Confirmação de escopo (resolvido na escrita)

Investigado em 2026-06-12: `recipe-api` main contém **apenas** `parseRecipe` + `generateCookMode` (serverless.yml + `src/handler.ts`). `parseRecipeFromUrl` e `convertToSteps` não existem em nenhum commit da API. O front (`recipeAI.ts`) chama esses 2 endpoints inexistentes via UI alcançável (`ImportRecipeDialog` modo URL, `RecipeForm` "converter em passos") → features quebradas em runtime.

**Decisão:** este plano protege os 2 endpoints reais. As 2 features quebradas do front são **follow-up de produto separado** (construir os endpoints OU remover a UI) — registrado abaixo, fora do escopo de controle de custo.

- [ ] **Step 1: Registrar o follow-up**

Anotar no backlog (ou plano de hardening #4): decidir destino de `parseRecipeFromUrl` / `convertTextToSteps` no front — construir endpoints na API ou remover UI (`ImportRecipeDialog` aba URL, botão converter-em-passos do `RecipeForm`). Nada a codar nesta task.

---

### Task 1: Dependência `jose` + novas env vars

**Files:**
- Modify: `recipe-api/package.json` (via npm)
- Modify: `recipe-api/src/config/env.ts`
- Modify: `recipe-api/.env.example`
- Modify: `recipe-api/serverless.yml`
- Test: `recipe-api/tests/config/env.test.ts`

- [ ] **Step 1: Instalar `jose`**

```bash
cd /Users/andrewozniack/Documents/recipes/recipe-api
npm install jose
```

- [ ] **Step 2: Escrever teste falhando para o env**

Create `tests/config/env.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "@jest/globals";

describe("env config", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.FIREBASE_PROJECT_ID = "recipe-hub-test";
    process.env.ALLOWED_ORIGINS = "https://app.example.com, http://localhost:5173";
    process.env.AI_RATE_LIMIT_PER_MINUTE = "5";
    process.env.AI_MONTHLY_QUOTA = "100";
  });

  it("lê firebaseProjectId", async () => {
    const { env } = await import("../../src/config/env.js");
    expect(env.firebaseProjectId).toBe("recipe-hub-test");
  });

  it("faz parse de allowedOrigins como lista trimada", async () => {
    const { env } = await import("../../src/config/env.js");
    expect(env.allowedOrigins).toEqual([
      "https://app.example.com",
      "http://localhost:5173",
    ]);
  });

  it("usa defaults para rate-limit e quota quando ausentes", async () => {
    delete process.env.AI_RATE_LIMIT_PER_MINUTE;
    delete process.env.AI_MONTHLY_QUOTA;
    jest.resetModules();
    const { env } = await import("../../src/config/env.js");
    expect(env.aiRatePerMinute).toBe(10);
    expect(env.aiMonthlyQuota).toBe(100);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx jest tests/config/env.test.ts`
Expected: FAIL — `env.firebaseProjectId` é `undefined`.

- [ ] **Step 4: Implementar no env.ts**

Em `src/config/env.ts`, adicionar helper e campos:

```ts
function readCsv(name: string): string[] {
  return readEnv(name)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
```

E no objeto `env`, adicionar:

```ts
  firebaseProjectId: readEnv("FIREBASE_PROJECT_ID"),
  allowedOrigins: readCsv("ALLOWED_ORIGINS"),
  aiRatePerMinute: readOptionalInt("AI_RATE_LIMIT_PER_MINUTE", 10),
  aiMonthlyQuota: readOptionalInt("AI_MONTHLY_QUOTA", 100),
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx jest tests/config/env.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 6: Atualizar .env.example e serverless.yml**

Em `.env.example` adicionar:

```
FIREBASE_PROJECT_ID=recipe-hub-xxxxx
ALLOWED_ORIGINS=https://seu-app.vercel.app,http://localhost:5173
AI_RATE_LIMIT_PER_MINUTE=10
AI_MONTHLY_QUOTA=100
```

Em `serverless.yml`, no bloco `provider.environment`, adicionar:

```yaml
    FIREBASE_PROJECT_ID: ${env:FIREBASE_PROJECT_ID}
    ALLOWED_ORIGINS: ${env:ALLOWED_ORIGINS, ''}
    AI_RATE_LIMIT_PER_MINUTE: ${env:AI_RATE_LIMIT_PER_MINUTE, '10'}
    AI_MONTHLY_QUOTA: ${env:AI_MONTHLY_QUOTA, '100'}
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/config/env.ts .env.example serverless.yml tests/config/env.test.ts
git commit -m "feat(env): add firebase, CORS, rate-limit and quota config"
```

---

### Task 2: Tipos de erro

**Files:**
- Modify: `recipe-api/src/core/errors.ts`
- Test: `recipe-api/tests/core/errors.test.ts`

- [ ] **Step 1: Ler o arquivo atual**

```bash
cat src/core/errors.ts
```
Confirmar o padrão de `ValidationError` (classe que estende `Error`).

- [ ] **Step 2: Escrever teste falhando**

Create `tests/core/errors.test.ts`:

```ts
import { describe, expect, it } from "@jest/globals";
import {
  UnauthorizedError,
  RateLimitError,
  QuotaExceededError,
} from "../../src/core/errors.js";

describe("erros de IA", () => {
  it("UnauthorizedError carrega mensagem e nome", () => {
    const err = new UnauthorizedError("token inválido");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("UnauthorizedError");
    expect(err.message).toBe("token inválido");
  });

  it("RateLimitError tem retryAfterSeconds", () => {
    const err = new RateLimitError("muitas requisições", 42);
    expect(err.name).toBe("RateLimitError");
    expect(err.retryAfterSeconds).toBe(42);
  });

  it("QuotaExceededError tem nome próprio", () => {
    const err = new QuotaExceededError("quota mensal esgotada");
    expect(err.name).toBe("QuotaExceededError");
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx jest tests/core/errors.test.ts`
Expected: FAIL — exports não existem.

- [ ] **Step 4: Implementar**

Adicionar ao final de `src/core/errors.ts`:

```ts
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx jest tests/core/errors.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 6: Commit**

```bash
git add src/core/errors.ts tests/core/errors.test.ts
git commit -m "feat(errors): add auth, rate-limit and quota error types"
```

---

### Task 3: Verificação do Firebase ID token (`jose` + x509)

Firebase ID tokens são RS256, assinados por `securetoken@system.gserviceaccount.com`. Os certs públicos vêm em `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com` (mapa `kid → cert PEM`). Validar `iss`, `aud`, `exp` e assinatura.

**Files:**
- Create: `recipe-api/src/modules/auth/firebaseToken.ts`
- Test: `recipe-api/tests/modules/auth/firebaseToken.test.ts`

> **Design para testabilidade (sem OpenSSL):** `verifyFirebaseToken` recebe um **resolver de chave injetável** `getKey(kid) => Promise<CryptoKey>`. Em produção o default resolve via `importX509` dos certs do Google. No teste, geramos um par RSA em runtime com `jose.generateKeyPair` e injetamos a chave pública direto — nenhum cert x509 nem material gerado por OpenSSL é necessário.

- [ ] **Step 1: Escrever teste falhando (resolver de chave injetável)**

Create `tests/modules/auth/firebaseToken.test.ts`:

```ts
import { describe, expect, it, beforeAll } from "@jest/globals";
import { generateKeyPair, SignJWT, type CryptoKey } from "jose";
import { verifyFirebaseToken } from "../../../src/modules/auth/firebaseToken.js";
import { UnauthorizedError } from "../../../src/core/errors.js";

const PROJECT_ID = "recipe-hub-test";
const KID = "test-kid-1";

let privateKey: CryptoKey;
let publicKey: CryptoKey;

// Resolver injetado: devolve a chave pública gerada em runtime (casa com privateKey).
const getKey = async (kid: string): Promise<CryptoKey> => {
  if (kid !== KID) throw new UnauthorizedError("Chave de assinatura desconhecida");
  return publicKey;
};

async function signToken(overrides: Record<string, unknown> = {}) {
  return new SignJWT({ email: "user@example.com", ...overrides })
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuer(`https://securetoken.google.com/${PROJECT_ID}`)
    .setAudience(PROJECT_ID)
    .setSubject("firebase-uid-123")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}

describe("verifyFirebaseToken", () => {
  beforeAll(async () => {
    ({ privateKey, publicKey } = await generateKeyPair("RS256"));
  });

  it("aceita token válido e retorna uid/email", async () => {
    const jwt = await signToken();
    const result = await verifyFirebaseToken(`Bearer ${jwt}`, {
      projectId: PROJECT_ID,
      getKey,
    });
    expect(result.uid).toBe("firebase-uid-123");
    expect(result.email).toBe("user@example.com");
  });

  it("rejeita header ausente", async () => {
    await expect(
      verifyFirebaseToken(undefined, { projectId: PROJECT_ID, getKey }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejeita audience errada", async () => {
    const jwt = await signToken();
    await expect(
      verifyFirebaseToken(`Bearer ${jwt}`, { projectId: "outro-projeto", getKey }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejeita kid desconhecido", async () => {
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", kid: "kid-errado" })
      .setIssuer(`https://securetoken.google.com/${PROJECT_ID}`)
      .setAudience(PROJECT_ID)
      .setSubject("uid")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);
    await expect(
      verifyFirebaseToken(`Bearer ${jwt}`, { projectId: PROJECT_ID, getKey }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
```

> **Nota:** o tipo `CryptoKey` é reexportado por `jose`. Se a versão instalada não o expõe, use `import type { KeyLike } from "jose"` e troque `CryptoKey` por `KeyLike`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest tests/modules/auth/firebaseToken.test.ts`
Expected: FAIL — módulo `firebaseToken` não existe.

- [ ] **Step 3: Implementar `firebaseToken.ts`**

Create `src/modules/auth/firebaseToken.ts`:

```ts
import {
  importX509,
  jwtVerify,
  decodeProtectedHeader,
  type CryptoKey,
} from "jose";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../core/errors.js";

const CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export interface FirebaseUser {
  uid: string;
  email?: string;
}

interface VerifyOptions {
  projectId?: string;
  // Resolver de chave por kid; default = certs x509 do Google. Injetável em teste.
  getKey?: (kid: string) => Promise<CryptoKey>;
}

let cachedCerts: Record<string, string> | null = null;

async function fetchCerts(): Promise<Record<string, string>> {
  if (cachedCerts) {
    return cachedCerts;
  }
  const response = await fetch(CERT_URL);
  if (!response.ok) {
    throw new UnauthorizedError("Não foi possível obter chaves de verificação");
  }
  cachedCerts = (await response.json()) as Record<string, string>;
  return cachedCerts;
}

async function defaultGetKey(kid: string): Promise<CryptoKey> {
  const certs = await fetchCerts();
  const certPem = certs[kid];
  if (!certPem) {
    cachedCerts = null; // kid desconhecido: invalidar cache p/ próxima tentativa
    throw new UnauthorizedError("Chave de assinatura desconhecida");
  }
  return importX509(certPem, "RS256");
}

function extractBearer(authHeader?: string): string {
  if (!authHeader) {
    throw new UnauthorizedError("Token de autenticação ausente");
  }
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Formato de Authorization inválido");
  }
  return token;
}

export async function verifyFirebaseToken(
  authHeader: string | undefined,
  options: VerifyOptions = {},
): Promise<FirebaseUser> {
  const projectId = options.projectId ?? env.firebaseProjectId;
  if (!projectId) {
    throw new UnauthorizedError("FIREBASE_PROJECT_ID não configurado");
  }

  const token = extractBearer(authHeader);

  let kid: string | undefined;
  try {
    kid = decodeProtectedHeader(token).kid;
  } catch {
    throw new UnauthorizedError("Token malformado");
  }
  if (!kid) {
    throw new UnauthorizedError("Token sem kid");
  }

  const getKey = options.getKey ?? defaultGetKey;

  try {
    const key = await getKey(kid);
    const { payload } = await jwtVerify(token, key, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) {
      throw new UnauthorizedError("Token sem subject");
    }
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest tests/modules/auth/firebaseToken.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/firebaseToken.ts tests/modules/auth/
git commit -m "feat(auth): verify Firebase ID token via jose x509"
```

---

### Task 4: Model `AiUsageEvent` (Prisma)

Tabela-ledger: 1 linha por chamada de IA aceita. Serve quota (contar do mês), rate-limit (contar últimos 60s) e futura analytics.

**Files:**
- Modify: `recipe-api/prisma/schema.prisma`

- [ ] **Step 1: Adicionar o model e a relação**

Em `prisma/schema.prisma`, adicionar ao model `User` (na lista de relações):

```prisma
  aiUsageEvents     AiUsageEvent[]
```

E adicionar o novo model ao final:

```prisma
model AiUsageEvent {
  id        String   @id @default(cuid())
  userId    String   @db.VarChar(128)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind      String
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}
```

- [ ] **Step 2: Gerar a migração**

```bash
cd /Users/andrewozniack/Documents/recipes/recipe-api
# Requer DATABASE_URL apontando para um Postgres de dev acessível.
npx prisma migrate dev --name add_ai_usage_event
```
Expected: cria `prisma/migrations/<timestamp>_add_ai_usage_event/` e regenera o client.

> Se não houver Postgres local: `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script` para revisar o SQL, e aplique a migração no ambiente onde o DB existe. **Não** prosseguir para a Task 5 sem o client regenerado (`npx prisma generate`).

- [ ] **Step 3: Verificar o client**

```bash
npx prisma generate
```
Expected: `AiUsageEvent` disponível em `@prisma/client`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add AiUsageEvent ledger model"
```

---

### Task 5: `AiUsageRepository` (interface + impl Prisma)

Espelha o padrão de `RecipeRepository` (portável para a F4). `recordUsage` faz upsert do `User` (o FK exige), semeando a tabela `users`.

**Files:**
- Create: `recipe-api/src/modules/usage/AiUsageRepository.ts`
- Create: `recipe-api/src/modules/usage/PrismaAiUsageRepository.ts`
- Test: `recipe-api/tests/modules/usage/PrismaAiUsageRepository.test.ts`

- [ ] **Step 1: Definir a interface**

Create `src/modules/usage/AiUsageRepository.ts`:

```ts
export interface AiUsageRepository {
  countSince(userId: string, since: Date): Promise<number>;
  recordUsage(input: {
    userId: string;
    email?: string;
    kind: string;
  }): Promise<void>;
}
```

- [ ] **Step 2: Escrever teste falhando (Prisma mockado)**

Create `tests/modules/usage/PrismaAiUsageRepository.test.ts`:

```ts
import { describe, expect, it, jest } from "@jest/globals";
import { PrismaAiUsageRepository } from "../../../src/modules/usage/PrismaAiUsageRepository.js";

function makePrismaMock() {
  return {
    aiUsageEvent: {
      count: jest.fn(async () => 3),
      create: jest.fn(async () => ({})),
    },
    user: {
      upsert: jest.fn(async () => ({})),
    },
  };
}

describe("PrismaAiUsageRepository", () => {
  it("countSince conta eventos do usuário após a data", async () => {
    const prisma = makePrismaMock();
    const repo = new PrismaAiUsageRepository(prisma as never);
    const since = new Date("2026-06-01T00:00:00Z");

    const count = await repo.countSince("uid-1", since);

    expect(count).toBe(3);
    expect(prisma.aiUsageEvent.count).toHaveBeenCalledWith({
      where: { userId: "uid-1", createdAt: { gte: since } },
    });
  });

  it("recordUsage faz upsert do user e cria o evento", async () => {
    const prisma = makePrismaMock();
    const repo = new PrismaAiUsageRepository(prisma as never);

    await repo.recordUsage({
      userId: "uid-1",
      email: "a@b.com",
      kind: "parseRecipe",
    });

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { id: "uid-1" },
      update: { email: "a@b.com" },
      create: { id: "uid-1", email: "a@b.com" },
    });
    expect(prisma.aiUsageEvent.create).toHaveBeenCalledWith({
      data: { userId: "uid-1", kind: "parseRecipe" },
    });
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx jest tests/modules/usage/PrismaAiUsageRepository.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 4: Implementar**

Create `src/modules/usage/PrismaAiUsageRepository.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import { AiUsageRepository } from "./AiUsageRepository.js";

export class PrismaAiUsageRepository implements AiUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async countSince(userId: string, since: Date): Promise<number> {
    return this.prisma.aiUsageEvent.count({
      where: { userId, createdAt: { gte: since } },
    });
  }

  async recordUsage(input: {
    userId: string;
    email?: string;
    kind: string;
  }): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: input.userId },
      update: { email: input.email },
      create: { id: input.userId, email: input.email },
    });
    await this.prisma.aiUsageEvent.create({
      data: { userId: input.userId, kind: input.kind },
    });
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx jest tests/modules/usage/PrismaAiUsageRepository.test.ts`
Expected: PASS (2 testes).

- [ ] **Step 6: Commit**

```bash
git add src/modules/usage/AiUsageRepository.ts src/modules/usage/PrismaAiUsageRepository.ts tests/modules/usage/
git commit -m "feat(usage): add portable AiUsageRepository + Prisma impl"
```

---

### Task 6: Enforcement de rate-limit + quota

**Files:**
- Create: `recipe-api/src/modules/usage/quota.ts`
- Test: `recipe-api/tests/modules/usage/quota.test.ts`

Política: rate-limit = nº de eventos nos últimos 60s < `aiRatePerMinute`. Quota = nº de eventos desde o 1º dia do mês (UTC) < `aiMonthlyQuota`. Checa-se **antes** de gravar/chamar Claude.

- [ ] **Step 1: Escrever teste falhando**

Create `tests/modules/usage/quota.test.ts`:

```ts
import { describe, expect, it, jest } from "@jest/globals";
import { enforceLimits } from "../../../src/modules/usage/quota.js";
import { RateLimitError, QuotaExceededError } from "../../../src/core/errors.js";

function repoWith(rateCount: number, monthCount: number) {
  return {
    countSince: jest.fn(async (_uid: string, since: Date) => {
      // since < ~2min atrás → janela de rate; senão → janela mensal
      const ageMs = Date.now() - since.getTime();
      return ageMs <= 120_000 ? rateCount : monthCount;
    }),
    recordUsage: jest.fn(),
  };
}

const limits = { ratePerMinute: 5, monthlyQuota: 100 };

describe("enforceLimits", () => {
  it("passa quando abaixo dos limites", async () => {
    const repo = repoWith(2, 10);
    await expect(enforceLimits(repo, "uid-1", limits)).resolves.toBeUndefined();
  });

  it("lança RateLimitError quando excede a janela de 60s", async () => {
    const repo = repoWith(5, 10);
    await expect(enforceLimits(repo, "uid-1", limits)).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it("lança QuotaExceededError quando excede o mês", async () => {
    const repo = repoWith(0, 100);
    await expect(enforceLimits(repo, "uid-1", limits)).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest tests/modules/usage/quota.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Create `src/modules/usage/quota.ts`:

```ts
import { AiUsageRepository } from "./AiUsageRepository.js";
import { RateLimitError, QuotaExceededError } from "../../core/errors.js";

export interface UsageLimits {
  ratePerMinute: number;
  monthlyQuota: number;
}

function startOfMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function enforceLimits(
  repo: AiUsageRepository,
  userId: string,
  limits: UsageLimits,
): Promise<void> {
  const now = new Date();

  const oneMinuteAgo = new Date(now.getTime() - 60_000);
  const recent = await repo.countSince(userId, oneMinuteAgo);
  if (recent >= limits.ratePerMinute) {
    throw new RateLimitError(
      "Muitas requisições em pouco tempo. Aguarde um instante.",
      60,
    );
  }

  const monthCount = await repo.countSince(userId, startOfMonthUtc(now));
  if (monthCount >= limits.monthlyQuota) {
    throw new QuotaExceededError(
      "Você atingiu o limite de importações por IA deste mês.",
    );
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest tests/modules/usage/quota.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/modules/usage/quota.ts tests/modules/usage/quota.test.ts
git commit -m "feat(usage): enforce per-user rate-limit and monthly quota"
```

---

### Task 7: CORS por origem (substituir `*`)

**Files:**
- Modify: `recipe-api/src/core/http.ts`
- Test: `recipe-api/tests/core/http.test.ts`

- [ ] **Step 1: Escrever teste falhando**

Create `tests/core/http.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "@jest/globals";

describe("CORS headers", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ALLOWED_ORIGINS = "https://app.example.com,http://localhost:5173";
  });

  it("ecoa origem permitida", async () => {
    const { corsHeaders } = await import("../../src/core/http.js");
    const headers = corsHeaders("http://localhost:5173");
    expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:5173");
  });

  it("cai no primeiro permitido quando a origem não está na lista", async () => {
    const { corsHeaders } = await import("../../src/core/http.js");
    const headers = corsHeaders("https://evil.com");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://app.example.com");
  });

  it("json() usa a origem do request", async () => {
    const { json } = await import("../../src/core/http.js");
    const res = json(200, { ok: true }, "http://localhost:5173");
    expect(res.headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5173",
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest tests/core/http.test.ts`
Expected: FAIL — `corsHeaders` não existe / `json` não aceita origem.

- [ ] **Step 3: Reescrever `src/core/http.ts`**

```ts
import { env } from "../config/env.js";

const BASE_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, Accept",
  "Access-Control-Max-Age": "86400",
};

export function corsHeaders(requestOrigin?: string) {
  const allowed = env.allowedOrigins;
  const origin =
    requestOrigin && allowed.includes(requestOrigin)
      ? requestOrigin
      : (allowed[0] ?? "*");
  return { ...BASE_HEADERS, "Access-Control-Allow-Origin": origin };
}

export function json(statusCode: number, body: unknown, origin?: string) {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: JSON.stringify(body),
  };
}

export function empty(statusCode = 200, origin?: string) {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: "",
  };
}
```

> **Nota de compat:** `json`/`empty` ganham 3º/2º arg opcional `origin`. Chamadas existentes em `src/modules/recipes/http.ts` continuam compilando (arg opcional). A Task 9 passa a origem real. `JSON_HEADERS` foi removido — se algo o importava, trocar por `corsHeaders()`.

- [ ] **Step 4: Conferir importadores de `JSON_HEADERS`**

```bash
grep -rn "JSON_HEADERS" src/ tests/
```
Se houver uso, trocar por `corsHeaders()`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx jest tests/core/http.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 6: Commit**

```bash
git add src/core/http.ts tests/core/http.test.ts
git commit -m "feat(http): lock down CORS to allowed origins"
```

---

### Task 8: Wrapper `withAiGuard`

Higher-order que protege qualquer handler de IA: OPTIONS passa direto; valida token; aplica limites; grava uso; chama o `AuthedHandler`; mapeia erros de guard para 401/429/503.

**Files:**
- Create: `recipe-api/src/core/aiGuard.ts`
- Test: `recipe-api/tests/core/aiGuard.test.ts`

- [ ] **Step 1: Escrever teste falhando**

Create `tests/core/aiGuard.test.ts`:

```ts
import { describe, expect, it, jest } from "@jest/globals";
import { withAiGuard } from "../../src/core/aiGuard.js";
import { UnauthorizedError, RateLimitError } from "../../src/core/errors.js";

function event(overrides: Record<string, unknown> = {}) {
  return {
    httpMethod: "POST",
    headers: { Authorization: "Bearer x", origin: "http://localhost:5173" },
    body: "{}",
    requestContext: { requestId: "req-1" },
    ...overrides,
  } as never;
}

const okDeps = {
  verifyToken: jest.fn(async () => ({ uid: "uid-1", email: "a@b.com" })),
  enforce: jest.fn(async () => undefined),
  record: jest.fn(async () => undefined),
};

describe("withAiGuard", () => {
  it("OPTIONS retorna 200 sem chamar o handler", async () => {
    const inner = jest.fn();
    const handler = withAiGuard("parseRecipe", inner as never, okDeps);
    const res = await handler(event({ httpMethod: "OPTIONS" }), {} as never, () => {});
    expect(res.statusCode).toBe(200);
    expect(inner).not.toHaveBeenCalled();
  });

  it("fluxo feliz: valida, grava e chama o handler com auth", async () => {
    const inner = jest.fn(async () => ({ statusCode: 200, headers: {}, body: "{}" }));
    const handler = withAiGuard("parseRecipe", inner as never, okDeps);
    await handler(event(), {} as never, () => {});
    expect(okDeps.record).toHaveBeenCalledWith({
      userId: "uid-1",
      email: "a@b.com",
      kind: "parseRecipe",
    });
    expect(inner).toHaveBeenCalledWith(expect.anything(), {
      uid: "uid-1",
      email: "a@b.com",
    });
  });

  it("token inválido → 401, handler não chamado", async () => {
    const inner = jest.fn();
    const deps = { ...okDeps, verifyToken: jest.fn(async () => { throw new UnauthorizedError("nope"); }) };
    const handler = withAiGuard("parseRecipe", inner as never, deps);
    const res = await handler(event(), {} as never, () => {});
    expect(res.statusCode).toBe(401);
    expect(inner).not.toHaveBeenCalled();
  });

  it("rate-limit → 429 com Retry-After", async () => {
    const inner = jest.fn();
    const deps = { ...okDeps, enforce: jest.fn(async () => { throw new RateLimitError("slow", 60); }) };
    const handler = withAiGuard("parseRecipe", inner as never, deps);
    const res = await handler(event(), {} as never, () => {});
    expect(res.statusCode).toBe(429);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest tests/core/aiGuard.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Create `src/core/aiGuard.ts`:

```ts
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { json, empty } from "./http.js";
import {
  UnauthorizedError,
  RateLimitError,
  QuotaExceededError,
} from "./errors.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { verifyFirebaseToken, FirebaseUser } from "../modules/auth/firebaseToken.js";
import { enforceLimits } from "../modules/usage/quota.js";
import { PrismaAiUsageRepository } from "../modules/usage/PrismaAiUsageRepository.js";
import { prisma } from "../lib/prisma.js";
import { hasDatabaseUrl } from "../config/env.js";

export type AuthedHandler = (
  event: Parameters<APIGatewayProxyHandler>[0],
  auth: FirebaseUser,
) => Promise<APIGatewayProxyResult>;

// Dependências injetáveis para teste.
export interface GuardDeps {
  verifyToken: (authHeader?: string) => Promise<FirebaseUser>;
  enforce: (userId: string) => Promise<void>;
  record: (input: { userId: string; email?: string; kind: string }) => Promise<void>;
}

function defaultDeps(): GuardDeps {
  const repo = new PrismaAiUsageRepository(prisma);
  return {
    verifyToken: (h) => verifyFirebaseToken(h),
    enforce: (uid) =>
      enforceLimits(repo, uid, {
        ratePerMinute: env.aiRatePerMinute,
        monthlyQuota: env.aiMonthlyQuota,
      }),
    record: (input) => repo.recordUsage(input),
  };
}

function getHeader(headers: Record<string, string | undefined> | null, name: string) {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return undefined;
}

export function withAiGuard(
  kind: string,
  handler: AuthedHandler,
  deps: GuardDeps = defaultDeps(),
): APIGatewayProxyHandler {
  return async (event) => {
    const origin = getHeader(event.headers, "origin");
    const requestId = event.requestContext?.requestId ?? "unknown";

    if (event.httpMethod === "OPTIONS") {
      return empty(200, origin);
    }

    if (!hasDatabaseUrl()) {
      logger.error("aiGuard: DATABASE_URL ausente", { requestId });
      return json(503, { error: "Serviço de IA indisponível no momento." }, origin);
    }

    let auth: FirebaseUser;
    try {
      auth = await deps.verifyToken(getHeader(event.headers, "authorization"));
    } catch (error) {
      logger.warn("aiGuard: auth falhou", { requestId, kind });
      return json(401, { error: "Autenticação necessária." }, origin);
    }

    try {
      await deps.enforce(auth.uid);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return {
          statusCode: 429,
          headers: { ...json(429, {}, origin).headers, "Retry-After": String(error.retryAfterSeconds) },
          body: JSON.stringify({ error: error.message }),
        };
      }
      if (error instanceof QuotaExceededError) {
        return json(429, { error: error.message, code: "QUOTA_EXCEEDED" }, origin);
      }
      throw error;
    }

    await deps.record({ userId: auth.uid, email: auth.email, kind });

    return handler(event, auth);
  };
}
```

> **Nota:** `verifyToken` recebe o valor do header `authorization` (case-insensitive — API Gateway pode entregar `Authorization` ou `authorization`). No teste, `okDeps.verifyToken` ignora o arg, então passa.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest tests/core/aiGuard.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/core/aiGuard.ts tests/core/aiGuard.test.ts
git commit -m "feat(core): add withAiGuard wrapper (auth + limits + usage)"
```

---

### Task 9: Aplicar o guard aos handlers de IA

Refatorar `parseRecipeHandler` e `generateCookModeHandler` para `AuthedHandler` (recebem `auth`), passar a origem para `json/empty`, e envolver com `withAiGuard` nas exports.

**Files:**
- Modify: `recipe-api/src/modules/recipes/http.ts`
- Modify: `recipe-api/src/handler.ts`
- Test: `recipe-api/tests/modules/recipes/http.test.ts` (atualizar se existir)

- [ ] **Step 1: Conferir testes existentes dos handlers**

```bash
ls tests/ && grep -rln "parseRecipeHandler\|generateCookModeHandler" tests/
```
Se existirem, eles passam o `event` direto sem auth → vão precisar passar pelo guard ou testar o handler interno. Ajustar para importar o handler interno (renomeado abaixo) OU mockar deps do guard.

- [ ] **Step 2: Refatorar `src/modules/recipes/http.ts`**

Mudanças:
1. Importar o tipo `AuthedHandler` e `withAiGuard`:

```ts
import { withAiGuard, AuthedHandler } from "../../core/aiGuard.js";
```

2. Remover a checagem de `OPTIONS`/método dos handlers (o guard cuida de OPTIONS; método continua restrito a POST no `serverless.yml`). Trocar as assinaturas para `AuthedHandler` e extrair a origem:

```ts
const parseRecipeInner: AuthedHandler = async (event, _auth) => {
  const requestId = event.requestContext?.requestId ?? "unknown";
  const origin = event.headers?.origin;

  if (event.httpMethod !== "POST") {
    return buildErrorResponse(405, "Method not allowed", undefined, undefined, origin);
  }

  logger.info("parseRecipe iniciado", { requestId, uid: _auth.uid });
  // ... corpo idêntico ao atual, mas todas as respostas passam `origin` ...
};
```

3. `buildErrorResponse` e os `json(...)` internos passam a aceitar/propagar `origin`. Atualizar a assinatura:

```ts
function buildErrorResponse(
  statusCode: number,
  error: string,
  message?: string,
  details?: string,
  origin?: string,
) {
  return json(statusCode, {
    error,
    ...(message ? { message } : {}),
    ...(details ? { details } : {}),
  }, origin);
}
```

E todas as chamadas de `buildErrorResponse`/`json` dentro dos handlers passam `origin` como último arg. O `handleUnexpectedError`/`handleAxiosError` também recebem `origin` e propagam.

4. Exportar os handlers protegidos:

```ts
export const parseRecipeHandler = withAiGuard("parseRecipe", parseRecipeInner);
export const generateCookModeHandler = withAiGuard("generateCookMode", generateCookModeInner);
```

> **Importante (DRY):** o miolo de validação/sanitização/chamada de IA de cada handler **não muda** — só (a) deixa de tratar OPTIONS, (b) recebe `auth`, (c) propaga `origin` nas respostas. Repita o mesmo padrão para `generateCookModeInner`.

- [ ] **Step 3: `src/handler.ts` permanece reexportando**

`handler.ts` já reexporta `parseRecipeHandler as parseRecipe` e `generateCookModeHandler as generateCookMode`. Como agora essas exports já são as versões guardadas, **nenhuma mudança** é necessária além de confirmar. (Só há 2 endpoints de IA — ver Task 0.)

- [ ] **Step 4: Atualizar/escrever teste de integração do handler**

Em `tests/modules/recipes/http.test.ts`, testar o handler protegido injetando deps de guard mockadas **não** é possível (as exports usam `defaultDeps`). Em vez disso, exportar também os `*Inner` para teste direto:

```ts
// no fim de src/modules/recipes/http.ts
export const __test__ = { parseRecipeInner, generateCookModeInner };
```

Teste:

```ts
import { describe, expect, it, jest } from "@jest/globals";
import { __test__ } from "../../../src/modules/recipes/http.js";

jest.mock("../../../src/modules/recipes/ai.js", () => ({
  parseRecipeWithAI: jest.fn(async () => ({ title: "Bolo", ingredients: [], steps: [] })),
  generateCookModeWithAI: jest.fn(async () => ({ steps: [{ title: "x", instruction: "y" }] })),
}));

const auth = { uid: "uid-1", email: "a@b.com" };

describe("parseRecipeInner", () => {
  it("retorna 200 com receita parseada", async () => {
    const event = {
      httpMethod: "POST",
      headers: { origin: "http://localhost:5173" },
      body: JSON.stringify({ recipeText: "x".repeat(60) }),
      requestContext: { requestId: "r1" },
    } as never;
    const res = await __test__.parseRecipeInner(event, auth);
    expect(res.statusCode).toBe(200);
  });
});
```

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npx jest`
Expected: PASS em todos os arquivos. Corrigir qualquer teste antigo que dependia de OPTIONS no handler (agora no guard).

- [ ] **Step 6: Type-check + build**

Run: `npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 7: Commit**

```bash
git add src/modules/recipes/http.ts src/handler.ts tests/
git commit -m "feat(ai): require auth + quota on parseRecipe and generateCookMode"
```

---

## PARTE B — Front (`recipe-hub`)

Trabalhe a partir de `/Users/andrewozniack/Documents/recipes/recipe-hub`.

### Task 10: `getIdToken()` na abstração de auth

**Files:**
- Modify: `recipe-hub/src/auth/types.ts`
- Modify: `recipe-hub/src/auth/providers/FirebaseAuthProvider.ts`
- Modify: `recipe-hub/src/auth/providers/CustomAuthProvider.ts`
- Test: `recipe-hub/src/auth/providers/FirebaseAuthProvider.test.ts`

- [ ] **Step 1: Escrever teste falhando**

Create `src/auth/providers/FirebaseAuthProvider.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { FirebaseAuthProvider } from "./FirebaseAuthProvider";

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual<typeof import("firebase/auth")>("firebase/auth");
  return {
    ...actual,
    getAuth: () => ({
      currentUser: { getIdToken: vi.fn(async () => "fake-id-token") },
    }),
    onAuthStateChanged: vi.fn(),
    GoogleAuthProvider: class {},
  };
});

vi.mock("../../lib/firebase", () => ({
  getOrCreateFirebaseApp: () => ({}),
}));

describe("FirebaseAuthProvider.getIdToken", () => {
  it("retorna o token do currentUser", async () => {
    const provider = new FirebaseAuthProvider({
      provider: "firebase",
      firebaseConfig: { apiKey: "x", authDomain: "x", projectId: "x" },
    } as never);
    await expect(provider.getIdToken()).resolves.toBe("fake-id-token");
  });
});
```

> Ajuste os nomes mockados conforme os imports reais de `FirebaseAuthProvider.ts` (confira `getAuth`, `onAuthStateChanged`, providers no topo do arquivo). O objetivo: `currentUser.getIdToken()` é chamado.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd /Users/andrewozniack/Documents/recipes/recipe-hub && npx vitest run src/auth/providers/FirebaseAuthProvider.test.ts`
Expected: FAIL — `getIdToken` não existe.

- [ ] **Step 3: Adicionar à interface**

Em `src/auth/types.ts`, dentro de `interface IAuthProvider`, após `signOut()`:

```ts
  // Get current user's ID token for backend authorization (null if signed out)
  getIdToken(): Promise<string | null>;
```

- [ ] **Step 4: Implementar em FirebaseAuthProvider**

Em `src/auth/providers/FirebaseAuthProvider.ts`, adicionar método à classe:

```ts
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.getIdToken() : null;
  }
```

- [ ] **Step 5: Implementar em CustomAuthProvider**

Em `src/auth/providers/CustomAuthProvider.ts`, adicionar método (usa o `auth_token` que ele já guarda no localStorage):

```ts
  async getIdToken(): Promise<string | null> {
    return localStorage.getItem("auth_token");
  }
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/auth/providers/FirebaseAuthProvider.test.ts`
Expected: PASS.

- [ ] **Step 7: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros (ambos providers implementam o novo método).

- [ ] **Step 8: Commit**

```bash
git add src/auth/types.ts src/auth/providers/
git commit -m "feat(auth): add getIdToken to auth provider abstraction"
```

---

### Task 11: Expor `getIdToken` no AuthContext

**Files:**
- Modify: `recipe-hub/src/auth/AuthContext.tsx`

- [ ] **Step 1: Adicionar ao tipo do contexto**

Em `AuthContextType`, adicionar:

```ts
  getIdToken: () => Promise<string | null>;
```

- [ ] **Step 2: Implementar o callback**

Dentro de `AuthProvider`, junto aos outros `useCallback`:

```ts
  const getIdToken = useCallback(async () => {
    if (!provider) return null;
    return provider.getIdToken();
  }, [provider]);
```

E incluir `getIdToken` no objeto `value`:

```ts
    getIdToken,
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/auth/AuthContext.tsx
git commit -m "feat(auth): expose getIdToken via AuthContext"
```

---

### Task 12: `recipeAI.ts` envia `Authorization`

**Files:**
- Modify: `recipe-hub/src/lib/recipeAI.ts`
- Test: `recipe-hub/src/lib/recipeAI.test.ts`

- [ ] **Step 1: Escrever teste falhando**

Adicionar a `src/lib/recipeAI.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseRecipeWithAI } from "./recipeAI";

describe("parseRecipeWithAI auth header", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("anexa Authorization quando authToken é fornecido", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ title: "Bolo", ingredients: [], steps: [] }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    await parseRecipeWithAI("x".repeat(60), "token-123");

    const [, init] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-123");
  });
});
```

> Se `__API_ENDPOINT__` não estiver definido em teste, adicionar `define` no `vitest.config.ts` (`define: { __API_ENDPOINT__: JSON.stringify("http://test/parseRecipe") }`) ou stub via `vi.stubGlobal`. Confirmar no `vitest.config.ts` existente.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/recipeAI.test.ts`
Expected: FAIL — `parseRecipeWithAI` não aceita 2º arg / não manda header.

- [ ] **Step 3: Implementar header builder + params**

Em `src/lib/recipeAI.ts`, adicionar helper no topo:

```ts
function buildHeaders(authToken?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}
```

Adicionar `authToken?: string` à assinatura de cada função e usar `buildHeaders`:

```ts
export async function parseRecipeWithAI(
  recipeText: string,
  authToken?: string,
): Promise<AIRecipeResponse> {
  // ...
    const response = await fetch(__API_ENDPOINT__, {
      method: "POST",
      headers: buildHeaders(authToken),
      signal: controller.signal,
      body: JSON.stringify({ recipeText: recipeText.trim() }),
    });
  // ...
}
```

Repetir para `parseRecipeFromUrl(url, authToken?)` e `convertTextToSteps(text, authToken?)`, trocando os `headers: { "Content-Type": "application/json" }` por `headers: buildHeaders(authToken)`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/recipeAI.test.ts`
Expected: PASS (incluindo testes pré-existentes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/recipeAI.ts src/lib/recipeAI.test.ts vitest.config.ts
git commit -m "feat(ai): send Firebase ID token on AI requests"
```

---

### Task 13: Call sites passam o token

**Files:**
- Modify: `recipe-hub/src/components/recipes/ImportRecipeDialog.tsx`
- Modify: `recipe-hub/src/components/recipes/RecipeForm.tsx`

- [ ] **Step 1: ImportRecipeDialog — obter token e passar**

Em `src/components/recipes/ImportRecipeDialog.tsx`:
1. Importar o hook (se ainda não):

```ts
import { useAuth } from "@/auth/AuthContext";
```

2. No componente, obter `getIdToken`:

```ts
  const { getIdToken } = useAuth();
```

3. Antes das chamadas (linhas ~45/51), obter o token uma vez e passar:

```ts
      const authToken = (await getIdToken()) ?? undefined;
      // ...
        parsedRecipe = await parseRecipeFromUrl(recipeUrl.trim(), authToken);
      // ...
        parsedRecipe = await parseRecipeWithAI(recipeText, authToken);
```

- [ ] **Step 2: RecipeForm — idem para convertTextToSteps**

Em `src/components/recipes/RecipeForm.tsx`:
1. Garantir `import { useAuth } from "@/auth/AuthContext";` e `const { getIdToken } = useAuth();`.
2. Na linha ~208:

```ts
      const authToken = (await getIdToken()) ?? undefined;
      const converted = await convertTextToSteps(rawText, authToken);
```

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc -p tsconfig.app.json --noEmit && npx eslint src/components/recipes/ImportRecipeDialog.tsx src/components/recipes/RecipeForm.tsx`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/recipes/ImportRecipeDialog.tsx src/components/recipes/RecipeForm.tsx
git commit -m "feat(ai): pass auth token from call sites to AI client"
```

---

### Task 14: Verificação end-to-end + checklist de deploy

**Files:** nenhum (verificação).

- [ ] **Step 1: Suítes completas verdes**

```bash
cd /Users/andrewozniack/Documents/recipes/recipe-api && npx jest && npx tsc --noEmit
cd /Users/andrewozniack/Documents/recipes/recipe-hub && npx vitest run && npx tsc -p tsconfig.app.json --noEmit
```
Expected: tudo PASS, sem erros de tipo.

- [ ] **Step 2: Smoke local do Lambda (opcional, requer DB + token real)**

```bash
cd /Users/andrewozniack/Documents/recipes/recipe-api
# garantir DATABASE_URL e FIREBASE_PROJECT_ID no .env
npm run dev
# em outro terminal, sem token → espera 401:
curl -s -X POST localhost:3000/parseRecipe -H 'content-type: application/json' -d '{"recipeText":"..."}' -i | head -1
# com token Firebase válido no header Authorization → espera 200
```
Expected: sem `Authorization` → `401`; com token válido → `200`.

- [ ] **Step 3: Checklist de deploy (registrar, não executar sem aprovação)**

Antes de `sls deploy`, garantir no ambiente do Lambda:
- `FIREBASE_PROJECT_ID` = project id do Firebase do app.
- `DATABASE_URL` = Postgres acessível pelo Lambda (migração `add_ai_usage_event` aplicada).
- `ALLOWED_ORIGINS` = domínio Vercel de produção + `http://localhost:5173` para dev.
- `AI_RATE_LIMIT_PER_MINUTE` / `AI_MONTHLY_QUOTA` conforme desejado (defaults 10 / 100).

E no front (Vercel): nenhuma env nova — o token vem do Firebase Auth já configurado.

- [ ] **Step 4: Commit final / merge**

Seguir o skill `superpowers:finishing-a-development-branch` para integrar a branch.

---

## Self-Review (executado na escrita)

**Cobertura do spec 1.1:**
- "exigir autenticação / valida token Firebase antes de chamar Claude" → Tasks 3, 8, 9 (guard valida antes do handler interno). ✅
- "front envia ID token no header Authorization" → Tasks 10–13. ✅
- "rate-limit por usuário" → Tasks 6, 8. ✅
- "quota por usuário (ai_usage por mês), portável" → Tasks 4, 5, 6 (`AiUsageRepository` interface + ledger Postgres, sem acoplamento RTDB). ✅
- CORS aberto (`*`) era vetor de abuso correlato → Task 7. ✅

**Fora do escopo deste plano (outros planos da F1):** analytics/PostHog (#2), Sentry (#3), expandir vitest de fluxos críticos + audit das Firebase security rules (#4). Não duplicar aqui.

**Consistência de tipos:** `AiUsageRepository.countSince/recordUsage` usados igual em `quota.ts`, `PrismaAiUsageRepository`, `aiGuard` defaultDeps. `FirebaseUser {uid,email}` consistente entre `firebaseToken`, `aiGuard`, `AuthedHandler`. `withAiGuard(kind, handler, deps?)` assinatura única. `getIdToken(): Promise<string|null>` igual na interface, providers, contexto; call sites convertem `null → undefined` antes de `recipeAI`. ✅

**Sem placeholders de implementação:** todo passo de código mostra o código. Task 3 usa resolver de chave injetável → teste gera par RSA em runtime via `jose.generateKeyPair`; sem cert x509, sem OpenSSL, sem fixture com `<COLE AQUI>`. Zero material externo a gerar.
