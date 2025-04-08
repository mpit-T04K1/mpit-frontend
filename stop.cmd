@echo off
echo === Остановка Kaliningrad ===

rem Остановка контейнеров
docker compose -f docker/docker-compose.yml down

echo Проект успешно остановлен 