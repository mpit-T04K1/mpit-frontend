from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
import os
import logging
from dotenv import load_dotenv

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения из .env файла
load_dotenv()

# Создание экземпляра FastAPI
app = FastAPI(
    title="Qwerty.town - Модульный интерфейс",
    description="Демонстрация модульного интерфейса",
    version="0.1.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение статических файлов
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Настройка шаблонов
templates = Jinja2Templates(directory="app/templates")

# Импорт роутера ситуационного центра
from app.routes.situation_center import router as situation_center_router

# Регистрация роутера ситуационного центра
app.include_router(situation_center_router)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """
    Главная страница с модульным интерфейсом
    """
    return templates.TemplateResponse(
        "cafe_example.html", 
        {
            "request": request,
            "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
        }
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(
        "main:app", 
        host=host, 
        port=port,
        reload=True
    ) 