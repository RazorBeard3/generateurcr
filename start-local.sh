#!/usr/bin/env bash

# ─── Couleurs ANSI ────────────────────────────────────────────────────────────
RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
DIM="\033[2m"

# ─── Logo ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}  ┌─────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}  │                                         │${RESET}"
echo -e "${BOLD}  │   ▐ Générateur de CR                    │${RESET}"
echo -e "${BOLD}  │   Transcription → Structuration → IA    │${RESET}"
echo -e "${BOLD}  │                                         │${RESET}"
echo -e "${BOLD}  └─────────────────────────────────────────┘${RESET}"
echo ""

# ─── Fonctions d'affichage ────────────────────────────────────────────────────
ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
warn() { echo -e "  ${YELLOW}!${RESET}  $1"; }
fail() { echo -e "  ${RED}✗${RESET}  $1"; }
info() { echo -e "  ${DIM}→${RESET}  $1"; }
step() { echo -e "\n  ${BOLD}$1${RESET}"; }

# ─── Vérification environnement ───────────────────────────────────────────────
step "Vérification de l'environnement"

# Ollama
if curl -s http://localhost:11434 > /dev/null 2>&1; then
  ok "Ollama en cours d'exécution"
else
  warn "Ollama non démarré — lancement en arrière-plan"
  ollama serve > /dev/null 2>&1 &
  sleep 2
  if curl -s http://localhost:11434 > /dev/null 2>&1; then
    ok "Ollama démarré"
  else
    fail "Impossible de démarrer Ollama. Lancez : ollama serve"
    exit 1
  fi
fi

# Modèle generateur-cr
MODEL="${OLLAMA_MODEL:-generateur-cr}"
if ollama list 2>/dev/null | grep -q "$MODEL"; then
  ok "Modèle $MODEL disponible"
else
  warn "Modèle $MODEL introuvable"
  info "Créez-le avec : ollama create generateur-cr -f backend/ollama/Modelfile"
fi

# Node.js
if command -v node > /dev/null 2>&1; then
  ok "Node.js $(node -v)"
else
  fail "Node.js non installé. Téléchargez-le sur nodejs.org"
  exit 1
fi

# fichier .env
if [ -f "backend/.env" ]; then
  ok "Fichier backend/.env présent"
else
  warn "backend/.env absent — copie depuis .env.example"
  cp backend/.env.example backend/.env 2>/dev/null || true
fi

# ─── Démarrage backend ────────────────────────────────────────────────────────
step "Démarrage du backend"

# Arrêter l'instance précédente si elle tourne
PREV=$(lsof -ti :3001 2>/dev/null)
if [ -n "$PREV" ]; then
  kill "$PREV" 2>/dev/null
  sleep 1
  info "Instance précédente arrêtée"
fi

cd backend && npm install --silent > /dev/null 2>&1
node server.js > /tmp/cr-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2
if kill -0 "$BACKEND_PID" 2>/dev/null; then
  ok "Backend démarré (PID $BACKEND_PID) → http://localhost:3001"
else
  fail "Le backend n'a pas pu démarrer"
  info "Consultez les logs : cat /tmp/cr-backend.log"
  exit 1
fi

# ─── Démarrage frontend ───────────────────────────────────────────────────────
step "Démarrage du frontend"

cd frontend && npm install --silent > /dev/null 2>&1
npm run dev > /tmp/cr-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 3

# Détecter le port (5173 ou 5174 si déjà occupé)
FRONTEND_PORT=""
for port in 5173 5174 5175; do
  if lsof -i ":$port" | grep -q "$FRONTEND_PID" 2>/dev/null; then
    FRONTEND_PORT=$port
    break
  fi
done

if [ -n "$FRONTEND_PORT" ]; then
  ok "Frontend démarré (PID $FRONTEND_PID) → http://localhost:$FRONTEND_PORT"
else
  warn "Frontend en cours de démarrage — consultez http://localhost:5173"
fi

# ─── Application prête ────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}${BOLD}Application prête.${RESET}"
echo ""
if [ -n "$FRONTEND_PORT" ]; then
  echo -e "  ${BOLD}→  http://localhost:$FRONTEND_PORT${RESET}"
else
  echo -e "  ${BOLD}→  http://localhost:5173${RESET}"
fi
echo ""
echo -e "  ${DIM}Logs backend  : tail -f /tmp/cr-backend.log${RESET}"
echo -e "  ${DIM}Logs frontend : tail -f /tmp/cr-frontend.log${RESET}"
echo -e "  ${DIM}Arrêter       : kill $BACKEND_PID $FRONTEND_PID${RESET}"
echo ""
