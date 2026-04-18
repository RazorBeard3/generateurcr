#!/usr/bin/env python3
"""
Transcription audio via Whisper medium.
Appelé par le backend Node.js en subprocess.
Usage : python3 transcribe.py <chemin_audio>

Conventions de sortie :
  stdout : JSON {"text": "...", "language": "fr"}  en cas de succès
           JSON {"error": "message lisible"}         en cas d'échec
  stderr : messages de progression (ignorés par Node.js sauf pour affichage)
  code   : 0 = succès, 1 = échec
"""

import sys
import json
import os


def fail(message):
    """Écrit un message d'erreur propre sur stdout et quitte avec code 1."""
    print(json.dumps({"error": message}), flush=True)
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        fail("Chemin audio manquant.")

    audio_path = sys.argv[1]

    if not os.path.exists(audio_path):
        fail(f"Fichier audio introuvable : {audio_path}")

    try:
        import whisper
    except ImportError:
        fail("Le module 'whisper' n'est pas installé. Lancez : pip install openai-whisper")

    try:
        print("Chargement du modèle Whisper medium…", file=sys.stderr, flush=True)
        model = whisper.load_model("medium")

        print("Transcription en cours…", file=sys.stderr, flush=True)
        result = model.transcribe(audio_path, language=None)

        print(json.dumps({
            "text": result["text"].strip(),
            "language": result.get("language", "fr"),
        }), flush=True)

    except Exception as e:
        # Extraire la partie utile du message (évite de renvoyer tout le banner ffmpeg)
        msg = str(e)
        lines = [l.strip() for l in msg.splitlines() if l.strip()]
        # La dernière ligne non vide est toujours la plus précise
        clean = lines[-1] if lines else msg
        fail(clean)


if __name__ == "__main__":
    main()
