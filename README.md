# DIAR

Diário pessoal com estética hacker. Feed público + painel de escrita com IA.

**Stack:** HTML + CSS + JS Vanilla · Firebase (Auth + Firestore) · Gemini 1.5 Flash · GitHub Pages

---

## Setup (5 minutos)

### 1. Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie ou abra seu projeto
3. **Authentication → Sign-in method → Google** → Ativar
4. **Firestore Database** → Criar banco (modo produção)
5. **Configurações do projeto → Seus apps → Web** → copie o `firebaseConfig`

**Regras do Firestore** (cole em Firestore → Regras):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{post} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.email == "seu@email.com";
    }
  }
}
```

### 2. Gemini API Key (gratuito)

1. Acesse [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Clique em **Create API key**
3. Copie a chave

### 3. Configurar o projeto

Edite `assets/js/config.js` e substitua os valores:

```js
export const FIREBASE_CONFIG = {
  apiKey:            "sua-api-key",
  authDomain:        "seu-projeto.firebaseapp.com",
  projectId:         "seu-projeto-id",
  storageBucket:     "seu-projeto.appspot.com",
  messagingSenderId: "seu-sender-id",
  appId:             "seu-app-id",
};

export const GEMINI_API_KEY = "sua-gemini-key";
export const ALLOWED_EMAIL  = "seu@email.com";
```

### 4. GitHub Pages

1. Faça push para seu repositório
2. **Settings → Pages → Branch: main → / (root)** → Save
3. Acesse: `https://isHirog.github.io/diar`
4. Admin em: `https://isHirog.github.io/diar/admin.html`

---

## Estrutura

```
diar/
├── index.html          # Feed público
├── admin.html          # Painel de escrita (login necessário)
└── assets/
    └── js/
        ├── config.js   # ← suas keys ficam aqui
        ├── firebase.js # auth + firestore
        └── gemini.js   # IA de refinamento
```

---

## Uso

- **`/`** → feed público com todos os posts
- **`/admin.html`** → login com Google, escreve, refina com IA, publica
- **IA**: clique em `[ IA // REFINAR ]` para sugerir uma versão polida do texto. Aceite, regenere ou cancele.
- **Tags**: separe por vírgula no campo de tags antes de publicar
