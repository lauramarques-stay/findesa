# 💳 FinaDesafios

> Consultora financeira com IA gamificada — analisa faturas e cria desafios personalizados.

---

## ✨ Funcionalidades

- **Upload de fatura** (PDF, CSV, XLS, TXT) com drag & drop
- **Análise por IA** — categorias, insights e "vazamentos" financeiros
- **5 desafios personalizados** gerados automaticamente com pontos e economia estimada
- **Chat com Luna** — consultora IA que já conhece toda a fatura
- **Sistema de pontos e níveis** (Iniciante → Poupador → Mestre → Lendário)
- **6 badges** desbloqueáveis por conquistas

---

## 🚀 Deploy na Vercel (recomendado — gratuito)

### Passo 1 — Criar conta na Anthropic e obter API Key

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Crie uma conta (gratuito para começar)
3. Vá em **API Keys** → **Create Key**
4. Copie a chave (começa com `sk-ant-...`)

> 💡 O custo médio por análise de fatura é de aproximadamente **US$ 0,01 a 0,03** (muito barato).

---

### Passo 2 — Subir o código no GitHub

1. Crie uma conta em [github.com](https://github.com) se não tiver
2. Clique em **New repository** → dê o nome `finadesafios`
3. Faça o upload de todos os arquivos desta pasta **OU** use o Git:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/finadesafios.git
git push -u origin main
```

---

### Passo 3 — Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New → Project**
3. Selecione o repositório `finadesafios`
4. Na tela de configuração, clique em **Environment Variables** e adicione:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-SUA_CHAVE_AQUI`
5. Clique em **Deploy** ✅

Em ~2 minutos, você terá um link como:
```
https://finadesafios.vercel.app
```

---

## 💻 Rodar localmente (para testar antes)

```bash
# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local e coloque sua ANTHROPIC_API_KEY

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🎨 Personalização

Para colocar seu nome/marca, edite o arquivo `pages/index.js` e procure por:

```js
💳 FinaDesafios
```

Substitua pelo nome da sua marca.

---

## 📁 Estrutura do projeto

```
finadesafios/
├── pages/
│   ├── index.js          ← App principal (UI completa)
│   └── api/
│       ├── analyze.js    ← API de análise de fatura
│       └── chat.js       ← API do chat com a Luna
├── .env.example          ← Modelo das variáveis de ambiente
├── package.json
└── next.config.js
```

---

## 💬 Suporte

Dúvidas sobre deploy? Volte ao chat com a Claude e peça ajuda! 🙂
