# 🔌 API

## Transcription

POST /api/transcribe

Body:
- audio (file)

Response:
{
  "transcription": "..."
}

---

## Génération CR

POST /api/generate-cr

Body:
{
  "transcription": "...",
  "config": {}
}

Response:
{
  "content": "..."
}

---

## Comptes rendus

GET /api/crs  
POST /api/crs  
PUT /api/crs/:id  
DELETE /api/crs/:id  

---

## Projets

GET /api/projects  
POST /api/projects  
PUT /api/projects/:id  
DELETE /api/projects/:id