FROM python:3.12-slim
WORKDIR /app
RUN useradd -m casml
COPY services/ml/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/ml/main.py .
USER casml
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

