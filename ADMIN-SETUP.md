# Painel Admin — Setup

Guia rápido para colocar o painel no ar (uma única vez).

## 1) Criar o Vercel KV

1. Acesse: <https://vercel.com/kalebebmartins-projects/unitech-landing-page/storage>
2. Clique em **Create Database** → escolha **KV** (Redis)
3. Nome: `unitech-kv` (qualquer um)
4. Região: **iad1** (Washington DC — boa latência pro Brasil)
5. Clique em **Create** → depois em **Connect Project** e marque `unitech-landing-page`
6. Em "Environment", deixe as 3 opções marcadas (Production, Preview, Development)
7. Clique em **Connect**

Pronto. As env vars `KV_*` foram adicionadas ao projeto automaticamente.

## 2) Gerar o `SESSION_SECRET`

No terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Copie o valor que aparecer.

## 3) Adicionar `SESSION_SECRET` no Vercel

```bash
vercel env add SESSION_SECRET production
# cole o valor quando pedir

vercel env add SESSION_SECRET preview
# (mesmo valor)

vercel env add SESSION_SECRET development
# (mesmo valor — opcional, só pra rodar local)
```

## 4) Trazer as env vars pro local + criar o primeiro admin

```bash
# Baixa env vars do Vercel pro arquivo local
vercel env pull .env.development.local

# Cria o primeiro usuário (escolha seu username/senha)
node scripts/seed.js kalebe sua-senha-aqui-min-8-chars
```

Saída esperada:
```
✓ Admin user "kalebe" created.
```

## 5) Redeploy

```bash
vercel --prod
```

Aguarde ~10 segundos.

## 6) Login

Acesse <https://unitech-landing-page-eta.vercel.app/admin/> e entre com o usuário criado.

---

## Como usar o painel

- **Landing page**: preview da LP pública.
- **Textos da LP**: edita textos marcados com `data-cms="..."` no HTML. Mudanças entram no ar **na hora** (sem deploy).
- **Head & Footer**: cola códigos de tracking (GTM, Meta Pixel, etc). Injetado server-side antes do HTML chegar ao usuário.
- **Leads**: lista quem preencheu o formulário. Pode exportar pra CSV.
- **Usuários**: adicionar/remover desenvolvedores. Toda senha é hasheada com bcrypt (cost 12).

## Quando precisar de ajuda

- Esqueci minha senha → outro admin pode te remover e criar de novo, OU rode `node scripts/seed.js` (vai falhar se o user existe; precisa apagar primeiro via KV CLI ou outro admin).
- Quero adicionar mais campos editáveis → me avise, é só adicionar `data-cms="nome_chave"` no HTML + linha no `admin/index.html` form de Textos.
- Quero ver leads em produção → entre no painel → aba Leads.
