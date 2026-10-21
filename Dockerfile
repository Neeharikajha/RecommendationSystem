FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PORT=8000

CMD ["gunicorn", "app.main:app", "--workers", "4", "--timeout", "120", "--bind", "0.0.0.0:8000"]
