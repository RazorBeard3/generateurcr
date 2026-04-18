#!/usr/bin/env bash
set -e

# Chemins relatifs à ce script (fonctionne quel que soit l'endroit depuis lequel on le lance)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PID_BACKEND="/tmp/cr-backend.pid"
PID_FRONTEND="/tmp/cr-frontend.pid"
LOG_BACKEND="/tmp/cr-backend.log"
LOG_FRONTEND="/tmp/cr-frontend.log"

OLLAMA_URL="http://localhost:11434"
BACKEND_PORT="${PORT:-3001}"
OLLAMA_MODEL="${OLLAMA_MODEL:-generateur-cr}"

# ─── Couleurs ─────────────────────────────────────────────────────────────────
RESET="\033[0m"; BOLD="\033[1m"; DIM="\033[2m"
GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RED="\033[0;31m"

ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
warn() { echo -e "  ${YELLOW}!${RESET}  $1"; }
fail() { echo -e "  ${RED}✗${RESET}  $1"; exit 1; }
info() { echo -e "  ${DIM}→${RESET}  $1"; }
step() { echo -e "\n  ${BOLD}$1${RESET}"; }

# ─── Logo ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}  ┌─────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}  │                                         │${RESET}"
echo -e "${BOLD}  │   ▐ Générateur de CR                    │${RESET}"
echo -e "${BOLD}  │   Transcription → Structuration → IA    │${RESET}"
echo -e "${BOLD}  │                                         │${RESET}"
echo -e "${BOLD}  └─────────────────────────────────────────┘${RESET}"
echo ""

# ─── Vérification de l'environnement ─────────────────────────────────────────
step "Vérification de l'environnement"

# Node.js requis
if ! command -v node > /dev/null 2>&1; then
  fail "Node.js non installé. Téléchargez-le sur nodejs.org"
fi
ok "Node.js $(node -v)"

# Fichier .env backend
if [ -f "$BACKEND_DIR/.env" ]; then
  ok "backend/.env présent"
elif [ -f "$BACKEND_DIR/.env.example" ]; then
  warn "backend/.env absent — copie depuis .env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
else
  warn "backend/.env absent (pas de .env.example non plus)"
fi

# Ollama
if curl -s "$OLLAMA_URL" > /dev/null 2>&1; then
  ok "Ollama en cours d'exécution"
else
  warn "Ollama non démarré — tentative de lancement"
  if command -v ollama > /dev/null 2>&1; then
    ollama serve > /dev/null 2>&1 &
    sleep 3
    if curl -s "$OLLAMA_URL" > /dev/null 2>&1; then
      ok "Ollama démarré"
    else
      warn "Ollama ne répond pas — la génération de CR sera indisponible"
    fi
  else
    warn "Ollama non installé — téléchargez-le sur ollama.com"
  fi
fi

# Modèle
if ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
  ok "Modèle $OLLAMA_MODEL disponible"
else
  warn "Modèle $OLLAMA_MODEL introuvable"
  info "Créez-le avec : ollama create $OLLAMA_MODEL -f backend/ollama/Modelfile"
fi

# ─── Démarrage du backend ─────────────────────────────────────────────────────
step "Démarrage du backend"

# Stopper une instance précédente proprement
if [ -f "$PID_BACKEND" ]; then
  OLD_PID=$(cat "$PID_BACKEND")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null
    sleep 1
    info "Instance précédente arrêtée (PID $OLD_PID)"
  fi
  rm -f "$PID_BACKEND"
fi
# Fallback : libérer le port si toujours occupé
STALE=$(lsof -ti ":$BACKEND_PORT" 2>/dev/null || true)
if [ -n "$STALE" ]; then
  kill "$STALE" 2>/dev/null || true
  sleep 1
fi

cd "$BACKEND_DIR"
npm install --silent > /dev/null 2>&1
node server.js > "$LOG_BACKEND" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_BACKEND"
cd "$ROOT_DIR"

sleep 2
if kill -0 "$BACKEND_PID" 2>/dev/null; then
  ok "Backend démarré (PID $BACKEND_PID) → http://localhost:$BACKEND_PORT"
else
  fail "Le backend n'a pas pu démarrer. Logs : $LOG_BACKEND"
fi

# ─── Démarrage du frontend ────────────────────────────────────────────────────
step "Démarrage du frontend"

# Stopper une instance précédente
if [ -f "$PID_FRONTEND" ]; then
  OLD_PID=$(cat "$PID_FRONTEND")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null
    sleep 1
    info "Instance précédente arrêtée (PID $OLD_PID)"
  fi
  rm -f "$PID_FRONTEND"
fi

cd "$FRONTEND_DIR"
npm install --silent > /dev/null 2>&1
npm run dev > "$LOG_FRONTEND" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$PID_FRONTEND"
cd "$ROOT_DIR"

# Attendre que Vite démarre et écrive son URL dans le log
FRONTEND_PORT=""
for i in 1 2 3 4 5 6; do
  sleep 2
  FRONTEND_PORT=$(grep -oE 'localhost:[0-9]+' "$LOG_FRONTEND" 2>/dev/null | head -1 | cut -d: -f2)
  [ -n "$FRONTEND_PORT" ] && break
done

if [ -n "$FRONTEND_PORT" ]; then
  ok "Frontend démarré (PID $FRONTEND_PID) → http://localhost:$FRONTEND_PORT"
else
  warn "Frontend en démarrage — port non détecté (vérifiez $LOG_FRONTEND)"
  FRONTEND_PORT="5173"
fi

# ─── Prêt ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}${BOLD}Application prête.${RESET}"
echo ""
echo -e "  ${BOLD}→  http://localhost:$FRONTEND_PORT${RESET}  (frontend)"
echo -e "  ${BOLD}→  http://localhost:$BACKEND_PORT${RESET}   (API)"
echo ""
echo -e "  ${DIM}Logs  : tail -f $LOG_BACKEND${RESET}"
echo -e "  ${DIM}        tail -f $LOG_FRONTEND${RESET}"
echo -e "  ${DIM}Arrêt : bash $SCRIPT_DIR/stop-local.sh${RESET}"
echo ""
