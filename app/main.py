from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import logging
import asyncio
import os
from pathlib import Path

from app.routers import router as modular_router
from app.api_modular import router as api_modular_router

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Определяем корневую директорию приложения
BASE_DIR = Path(__file__).resolve().parent

# Создание экземпляра FastAPI
app = FastAPI(title="QWERTYTOWN API")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение статических файлов
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# Настройка шаблонизатора Jinja2
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Подключение роутеров
app.include_router(modular_router, prefix="")
app.include_router(api_modular_router, prefix="")

# Корневой маршрут
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Обработчик ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Необработанная ошибка: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Произошла внутренняя ошибка сервера."},
    )

if __name__ == "__main__":
    import uvicorn
    
    # Запуск сервера
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    ) 