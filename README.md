# LDO_rahul
This is for testing purpose

## Local environment

Copy `.env.example` to `.env` and fill in deployment-specific values before running the app. The app expects PostgreSQL and Redis to be reachable via `DATABASE_URL` and `REDIS_URL`.

## OCR worker

OCR jobs are consumed by a standalone BullMQ worker. Run it in a separate process alongside the Next.js app:

```bash
npm run worker:ocr
```

Image OCR uses the `tesseract` CLI when it is installed on the host. If `tesseract` is unavailable, image uploads are marked with degraded OCR confidence instead of silently pretending text was extracted.
