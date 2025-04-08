#!/bin/bash
set -e

echo "Starting Qwerty.town application initialization..."

# Функция для проверки доступности сервиса
wait_for_service() {
  local host="$1"
  local port="$2"
  local service="$3"
  local max_attempts=30
  local attempt=0

  echo "Ожидаем доступности $service на $host:$port..."

  while ! nc -z "$host" "$port" >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "Сервис $service недоступен после $max_attempts попыток. Выход."
      exit 1
    fi
    echo "Попытка $attempt из $max_attempts: $service еще не доступен. Ожидаем..."
    sleep 2
  done

  echo "$service доступен на $host:$port!"
}

# Ожидаем доступности PostgreSQL
wait_for_service "postgres" "5432" "PostgreSQL"

# Ожидаем доступности RabbitMQ
wait_for_service "rabbitmq" "5672" "RabbitMQ"

# Ожидаем доступности Redis
wait_for_service "redis" "6379" "Redis"

# Применяем миграции к базе данных
echo "Применяем миграции к базе данных..."
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"

# Запускаем приложение
echo "Запускаем приложение..."
exec "$@" 