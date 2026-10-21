FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
CMD ["sh", "-c", "cd backend && gunicorn app.main:app --workers 4 --timeout 120 --bind 0.0.0.0:${PORT}"]