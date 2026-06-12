# Recipe Hub — Roadmap de Produto (Design)

**Data:** 2026-06-12
**Status:** Aprovado para planejamento
**Objetivo:** Transformar o MVP atual em produto real, sustentável e monetizado, sem comprometer uma futura migração para backend próprio.

---

## Contexto atual

Recipe Hub é um livro de receitas digital (PT-BR), construído com:

- **Front:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Dados:** Firebase Realtime Database (via `IRecipeRepository` → `FirebaseRepository`)
- **Auth:** Firebase Auth
- **IA:** AWS Lambda + Claude (parsing de receita por texto/URL, conversão texto→passos, cook mode) — repositório separado
- **Deploy:** Vercel

**Features existentes:** CRUD de receitas, categorias, favoritos, pastas, import por IA, cook mode passo-a-passo, compartilhamento por link, importação por link, lista de compras, export PDF.

**Avaliação:** MVP single-user sólido. Falta a camada de "produto": controle de custo de IA, monetização, observabilidade e crescimento.

### Pontos fortes a preservar

- **Repository pattern** (`IRecipeRepository`) já desacopla o front da camada de dados. É o pilar que torna a migração futura (Fase 4) barata. **Não violar essa abstração.**

---

## Princípios diretores

1. **Endurecer antes de monetizar.** Não cobrar por produto que vaza custo ou quebra.
2. **Quota como alavanca.** O contador de uso de IA criado na Fase 1 vira o mecanismo de gating pago na Fase 2 e a moeda de referral na Fase 3.
3. **Portabilidade desde já.** Lógica de plano/quota não pode ser enterrada de forma Firebase-specific. Stripe é a fonte de verdade do estado de assinatura; Firebase é cache. Isso prepara a Fase 4.
4. **YAGNI na migração.** RTDB aguenta o MVP. Backend Go/Postgres só depois que houver usuários/receita que justifiquem o esforço.
5. **Segurança do backend de IA é bloqueador.** Endpoint de IA aberto = qualquer um gasta a conta Claude do dono.

---

## Fase 1 — Endurecer (pré-monetização)

**Objetivo:** estabilidade + custo de IA sob controle. Bloqueador para monetizar.

### 1.1 Controle de custo de IA (crítico)

- **Backend Lambda:** exigir autenticação. Front envia o ID token do Firebase no header `Authorization`; Lambda valida o token (Firebase Admin SDK) antes de chamar Claude. Hoje o endpoint é aberto.
- **Rate-limit por usuário** na Lambda.
- **Quota por usuário:** contador de chamadas de IA (ex: `ai_usage` por mês) persistido. Desenhar de forma **portável** (não acoplado a particularidades do RTDB) para virar serviço Go na Fase 4.

### 1.2 Analytics

- Instrumentar PostHog (ou GA4). Eventos mínimos: signup, criar receita, import IA, share, cook mode, retenção D1/D7.
- Sem dados não há como decidir limites/preço da Fase 2.

### 1.3 Observabilidade de erros

- Integrar Sentry no front. Já existe `ErrorBoundary`; falta reporting.

### 1.4 Hardening de qualidade

- Rodar e expandir a suíte vitest existente cobrindo fluxos críticos: auth, CRUD de receita, parse de IA.
- **Auditar Firebase security rules:** usuário só lê/escreve o próprio path (`users/{uid}/...`); validar regras de `sharedRecipes`.

**Dependência externa:** repositório do Lambda (clonado adjacente). Itens 1.1 envolvem código do Lambda.

---

## Fase 2 — Monetizar (freemium)

**Objetivo:** MRR. Reusa a quota da Fase 1 como alavanca de gating.

### 2.1 Planos

- **Free:** limite de receitas (ex: 25), imports de IA por mês (ex: 5), cook mode limitado, sem export PDF.
- **Pro:** ilimitado + cook mode + export PDF + meal planning. Faixa ~R$15–20/mês, com plano anual em desconto.
- Limites e preço exatos: **decidir com base nos dados da Fase 1** (definido no plano da Fase 2).

### 2.2 Pagamento

- **Stripe.** Mercado BR: habilitar Pix + cartão.
- Webhook do Stripe → grava `plan` + `status` no usuário. **Stripe é a fonte de verdade**; Firebase é cache do estado.

### 2.3 Gating

- Front checa `plan` para UI (badges, paywall modal) — UX apenas.
- **Backend Lambda checa `plan` antes da IA.** Gating só no front é burlável.

### 2.4 Tela de billing

- Estender `UserProfile` com gestão de assinatura: upgrade, cancelar, portal Stripe.

---

## Fase 3 — Crescer

**Objetivo:** aquisição barata + viral loop.

### 3.1 Receitas públicas + SEO

- Tornar `/compartilhar/{id}` indexável: meta tags, pré-render/SSR para rotas públicas, sitemap.
- Cada receita compartilhada vira página que ranqueia no Google → aquisição orgânica.
- **Nota técnica:** Vite SPA não indexa bem; exige pré-render (vite-plugin-ssg) ou SSR nas rotas públicas. Decisão detalhada no plano da Fase 3.

### 3.2 Descoberta

- Feed público / explorar receitas. Quebra o silo single-user.

### 3.3 Onboarding

- Primeiro-uso guiado, receita-exemplo, ativação rápida.

### 3.4 Referral

- Convidar amigo → bônus de imports de IA. Usa a quota como moeda.

---

## Fase 4 — Backend próprio (Go + DB relacional)

**Objetivo:** controle total, dados estruturados, custo previsível.

- Substituir Firebase RTDB + Lambda por API em Go (chi/echo/gin) + Postgres.
- **Habilitado pelas fases anteriores:** nova implementação de `IRecipeRepository` (`GoApiRepository`); quota e billing já portáveis.
- **Quando:** após a Fase 2 validar tração. Migrar cedo é over-engineering.
- **Sketch do modelo relacional:** `users`, `recipes`, `ingredients`, `shared_recipes`, `subscriptions`, `ai_usage`.

---

## Sequência e dependências

```
F1 Endurecer ──► F2 Monetizar ──► F3 Crescer ──► F4 Backend Go/Postgres
     │                │                                      ▲
     │ quota          │ billing source-of-truth              │
     └────────────────┴──── portabilidade ───────────────────┘
```

- F1 cria a quota → F2 a usa para gating → F3 a usa como moeda de referral.
- F1–F3 mantêm abstração de repo + lógica portável → F4 vira troca de implementação, não reescrita.

---

## Fora de escopo (por enquanto)

- Migração de backend antes de validar tração (Fase 4 é futura).
- App mobile nativo.
- Limites/preço exatos da Fase 2 (decididos com dados da Fase 1).

---

## Próximo passo

Detalhar o **plano de implementação da Fase 1** (writing-plans), começando pelo controle de custo de IA no Lambda clonado.
