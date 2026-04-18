# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes utiles

### Lancer l'app en mode dev (sans Tauri)
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

### Lancer via script
```bash
bash scripts/start-local.sh   # démarre backend + frontend
bash scripts/stop-local.sh    # arrête backend + frontend
```

### Lancer l'app Tauri (desktop)
```bash
cd frontend && npm run tauri:dev    # dev (compile Rust ~5 min la 1ère fois)
cd frontend && npm run tauri:build  # build production .app
```

### Ollama (LLM local)
```bash
ollama serve                          # démarrer le serveur LLM
ollama create generateur-cr -f backend/ollama/Modelfile   # créer le modèle custom
ollama list                           # vérifier que le modèle existe
```

## Architecture

### Stack
- **Frontend** : React 18 + Vite + Tailwind, port 5173
- **Backend** : Node.js + Express, port 3001
- **Desktop** : Tauri v2 (Rust) — wraps le frontend, spawn le backend Node.js en sidecar
- **LLM** : Ollama en local (modèle `generateur-cr` basé sur llama3), port 11434
- **Transcription** : Whisper via subprocess Python
- **Stockage** : fichiers JSON dans `backend/data/`

### Flux principal
```
Audio → POST /api/transcribe (Whisper Python)
     → POST /api/generate-cr (reportEngine)
          ├─ Ollama (local-llm) → JSON structuré
          └─ rulesService (local-rules) — fallback si Ollama indispo
     → reportFormatter → Markdown
     → POST /api/crs → data/crs.json
```

### Communication frontend ↔ backend
- **Dev** : Vite proxifie `/api` et `/uploads` vers `http://localhost:3001`
- **Prod / Tauri** : appels directs à `http://localhost:3001/api`
- Le switch se fait dans `frontend/src/lib/api.js` via `import.meta.env.DEV`

### Services backend (`backend/src/services/`)
| Fichier | Rôle |
|---------|------|
| `reporting/reportEngine.js` | Orchestrateur principal — essaie Ollama, tombe sur les règles |
| `localLlm.js` | Appelle Ollama, attend un JSON pur en réponse |
| `reporting/rulesService.js` | Extraction par mots-clés si Ollama indispo |
| `formatting/reportFormatter.js` | JSON structuré → Markdown |
| `whisper.js` | Transcription audio via subprocess Python |

### Tauri (desktop)
- `frontend/src-tauri/src/lib.rs` : spawn le backend Node.js au démarrage, le kill à la fermeture (via `Drop`)
- En dev : chemin backend résolu depuis `CARGO_MANIFEST_DIR` (compile-time)
- En prod : backend copié dans le bundle via `tauri.conf.json > bundle.resources`

## Variables d'environnement

`backend/.env` (copier depuis `.env.example`) :
```
PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=generateur-cr
```
