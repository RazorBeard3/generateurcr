🚀 Générateur de Compte Rendu IA

Application web permettant de transformer un enregistrement audio de réunion en compte rendu structuré, personnalisable et partageable.

Automatiser la création de comptes rendus de réunion :
	•	🎙 Transcription audio (Whisper)
	•	🧠 Génération IA (Claude)
	•	📁 Organisation par projet
	•	📤 Partage rapide

    🛠 Stack technique

Frontend
	•	React (Vite)
	•	Tailwind CSS
	•	UI inspirée shadcn

Backend
	•	Node.js (Express)

IA
	•	Whisper (transcription)
	•	Claude (génération CR)

⸻

⚙️ Fonctionnalités
	•	Upload ou enregistrement audio
	•	Transcription automatique
	•	Génération de compte rendu :
	•	Résumé
	•	Actions
	•	Décisions
	•	Points bloquants
	•	Édition manuelle
	•	Sauvegarde par projet
	•	Historique
	•	Partage (email, WhatsApp, Telegram)

    🧪 Mode développement

Mock activé

MOCK_MODE=true

Permet de tester sans :
	•	Whisper
	•	clé API Claude

MOCK_MODE=false

Mode réel

MOCK_MODE=false

Nécessite :
	•	Whisper installé
	•	clé API Anthropic valide

🚀 Lancer le projet

Backend

cd backend
npm install
npm run dev

Frontend

cd backend
npm install
npm run dev


⸻

🔁 Flow utilisateur
	1.	Importer ou enregistrer un audio
	2.	Transcription automatique
	3.	Configuration du compte rendu
	4.	Génération IA
	5.	Édition
	6.	Sauvegarde
	7.	Consultation dans l’historique


⚠️ Limitations V1
	•	Whisper medium peut être lent
	•	Pas d’authentification
	•	Stockage local JSON
	•	Partage simplifié


📈 Roadmap
	•	Auth utilisateur
	•	Base de données (PostgreSQL)
	•	Intégrations natives (Telegram, Email)
	•	Amélioration UX
	•	Déploiement SaaS

💡 Vision

Créer un assistant intelligent capable de transformer n’importe quelle réunion en livrable exploitable.

👨‍💻 Auteur

Projet développé dans une logique d’apprentissage + création produit IA.
