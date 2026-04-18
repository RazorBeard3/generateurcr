# 🏗 Architecture technique

## Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Design system inspiré shadcn/ui

### Backend
- Node.js (Express)
- API REST

### Transcription
- Whisper (Python)
- Appelé via subprocess depuis Node

### Génération IA
- API Anthropic (Claude)

### Stockage (V1)
- JSON local (backend/data)
- localStorage (frontend fallback)

---

## Flux principal

Audio → Upload → Backend  
→ Whisper → Transcription  
→ Claude → Compte rendu  
→ Sauvegarde → Affichage

---

## Modes

### MOCK_MODE=true
- Données simulées
- Aucun besoin d’API externe

### MOCK_MODE=false
- Transcription réelle
- Génération réelle