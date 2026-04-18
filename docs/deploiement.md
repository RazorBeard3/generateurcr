# Déploiement — Générateur de CR

## Prérequis

- Compte [Vercel](https://vercel.com) (frontend)
- Compte [Render](https://render.com) (backend)
- Clé API Anthropic (`ANTHROPIC_API_KEY`)
- Clé API AssemblyAI (`ASSEMBLYAI_API_KEY`)

---

## 1. Déployer le backend sur Render

### Créer le service

1. Render → **New Web Service**
2. Connecter le dépôt GitHub
3. Configurer :
   - **Root directory** : `backend`
   - **Build command** : `npm install`
   - **Start command** : `node server.js`
   - **Runtime** : Node 20

### Variables d'environnement à renseigner sur Render

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `TRANSCRIPTION_MODE` | `hosted` |
| `REPORT_MODE` | `hosted` |
| `ANTHROPIC_API_KEY` | ta clé Anthropic |
| `ASSEMBLYAI_API_KEY` | ta clé AssemblyAI |
| `FRONTEND_URL` | l'URL Vercel (à renseigner après l'étape 2) |

### URL du backend

Une fois déployé, Render fournit une URL du type :
```
https://generateur-cr-backend.onrender.com
```
Note cette URL — elle sera nécessaire pour Vercel.

### Point d'attention : stockage éphémère

Le plan gratuit Render ne persiste pas les fichiers sur disque.
Les données `data/crs.json` et `uploads/` sont perdues à chaque redémarrage.
→ Migration vers une base de données nécessaire (Phase 5).

---

## 2. Déployer le frontend sur Vercel

### Créer le projet

1. Vercel → **New Project**
2. Connecter le dépôt GitHub
3. Configurer :
   - **Root directory** : `frontend`
   - **Framework preset** : Vite
   - **Build command** : `npm run build`
   - **Output directory** : `dist`

### Variables d'environnement à renseigner sur Vercel

| Variable | Valeur |
|---|---|
| `VITE_API_URL` | l'URL Render (ex: `https://generateur-cr-backend.onrender.com`) |

### URL du frontend

Une fois déployé, Vercel fournit une URL du type :
```
https://generateur-cr.vercel.app
```

---

## 3. Finaliser la configuration CORS

Une fois les deux services déployés :

1. Aller sur Render → **Environment**
2. Mettre à jour `FRONTEND_URL` avec l'URL Vercel exacte :
   ```
   FRONTEND_URL=https://generateur-cr.vercel.app
   ```
3. Redémarrer le service Render.

---

## Vérification

Tester dans cet ordre :

```
GET https://generateur-cr-backend.onrender.com/api/health
→ doit retourner { "status": "ok" }

Ouvrir https://generateur-cr.vercel.app
→ l'interface doit se charger

Faire une transcription test
→ doit passer par AssemblyAI

Générer un CR test
→ doit passer par Claude API
```

---

## Ce qui reste à faire (Phase 5)

- Remplacer `data/crs.json` par une base de données persistante (ex: Supabase ou PlanetScale)
- Gérer le stockage des fichiers audio (ex: Cloudflare R2 ou S3)
