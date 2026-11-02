FROM python:3.11-slim

WORKDIR /app

# Log vises med det samme i docker-compose logs.
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY hyper_extract.py .

CMD ["python", "hyper_extract.py"]
