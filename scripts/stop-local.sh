#!/usr/bin/env bash

PID_BACKEND="/tmp/cr-backend.pid"
PID_FRONTEND="/tmp/cr-frontend.pid"

RESET="\033[0m"; BOLD="\033[1m"
GREEN="\033[0;32m"; YELLOW="\033[0;33m"; DIM="\033[2m"

ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
warn() { echo -e "  ${YELLOW}!${RESET}  $1"; }
info() { echo -e "  ${DIM}→${RESET}  $1"; }

echo ""
echo -e "  ${BOLD}Arrêt de l'application...${RESET}"
echo ""

# ─── Backend ──────────────────────────────────────────────────────────────────
if [ -f "$PID_BACKEND" ]; then
  PID=$(cat "$PID_BACKEND")
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null
    ok "Backend arrêté (PID $PID)"
  else
    warn "Backend : PID $PID introuvable (déjà arrêté ?)"
  fi
  rm -f "$PID_BACKEND"
else
  # Fallback : chercher un process node sur le port 3001
  STALE=$(lsof -ti :3001 2>/dev/null || true)
  if [ -n "$STALE" ]; then
    kill "$STALE" 2>/dev/null && ok "Backend arrêté via lsof (PID $STALE)"
  else
    info "Backend : aucun process trouvé"
  fi
fi

# ─── Frontend ─────────────────────────────────────────────────────────────────
if [ -f "$PID_FRONTEND" ]; then
  PID=$(cat "$PID_FRONTEND")
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null
    ok "Frontend arrêté (PID $PID)"
  else
    warn "Frontend : PID $PID introuvable (déjà arrêté ?)"
  fi
  rm -f "$PID_FRONTEND"
else
  # Fallback : pkill sur vite dans le dossier frontend
  if pkill -f "vite" 2>/dev/null; then
    ok "Frontend arrêté via pkill vite"
  else
    info "Frontend : aucun process Vite trouvé"
  fi
fi

# ─── Nettoyage logs ───────────────────────────────────────────────────────────
rm -f /tmp/cr-backend.log /tmp/cr-frontend.log
info "Logs temporaires supprimés"

echo ""
echo -e "  ${BOLD}Application arrêtée.${RESET}"
echo -e "  ${DIM}(Ollama reste actif — arrêtez-le manuellement si besoin)${RESET}"
echo ""
