#!/bin/bash

echo "=== Остановка Kaliningrad ==="

# Остановка контейнеров
docker compose -f docker/docker-compose.yml down

echo "Проект успешно остановлен" 