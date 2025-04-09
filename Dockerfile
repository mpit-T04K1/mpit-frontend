FROM python:3.10-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y netcat-openbsd && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Копирование файлов проекта
COPY requirements.txt .

# Установка зависимостей Python
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir requests

# Копирование кода приложения
COPY . .

# Установка переменных окружения
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Создаем скрипт для запуска
RUN echo '#!/bin/bash\n\
echo "Ожидание готовности PostgreSQL..."\n\
while ! nc -z postgres 5432; do\n\
  sleep 0.5\n\
done\n\
echo "PostgreSQL готов!"\n\
\n\
echo "Инициализация базы данных..."\n\
python -m app.init_db\n\
\n\
echo "Запуск приложения..."\n\
uvicorn main:app --host 0.0.0.0 --port 8080\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Порт, на котором будет запущено приложение
EXPOSE 8080

# Запуск приложения
CMD ["/app/entrypoint.sh"] 