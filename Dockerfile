FROM python:3.10-slim

WORKDIR /app

# Копирование файлов проекта
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование кода приложения
COPY . .

# Запуск приложения
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
# uvicorn main:app --port 8080
