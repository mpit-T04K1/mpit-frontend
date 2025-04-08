from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
import os
import logging
from dotenv import load_dotenv
from pathlib import Path
from app.routes import situation_center
from app.routes import business_registration

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

# Подключаем роутеры
app.include_router(situation_center.router)
app.include_router(business_registration.router)

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

@app.get("/test", response_class=HTMLResponse)
async def test_page(request: Request):
    """
    Тестовая страница с данными последнего зарегистрированного бизнеса из JSON
    """
    logger.debug("Обработка запроса к маршруту /test")
    try:
        # Загружаем данные о бизнесах из JSON файла
        import json
        from pathlib import Path
        
        # Путь к файлу с данными
        json_path = Path("app/data/businesses.json")
        
        # Проверяем существование файла
        if json_path.exists():
            # Загружаем данные
            with open(json_path, "r", encoding="utf-8") as f:
                businesses_data = json.load(f)
                
            if businesses_data:
                # Получаем последний добавленный бизнес (последний ключ в словаре)
                last_business_id = list(businesses_data.keys())[-1]
                business = businesses_data[last_business_id]
                logger.info(f"Загружены данные последнего бизнеса: {business['name']}")
                
                return templates.TemplateResponse(
                    "business.html",
                    {
                        "request": request, 
                        "business": business,
                        "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                    }
                )
            else:
                logger.warning("Файл businesses.json пуст")
                return templates.TemplateResponse(
                    "business.html",
                    {
                        "request": request,
                        "error": "Нет зарегистрированных бизнесов",
                        "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                    }
                )
        else:
            logger.error(f"Файл с данными не найден: {json_path}")
            return templates.TemplateResponse(
                "business.html",
                {
                    "request": request,
                    "error": "Файл данных не найден",
                    "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                }
            )
    except Exception as e:
        logger.error(f"Ошибка при загрузке данных: {e}")
        return templates.TemplateResponse(
            "business.html",
            {
                "request": request,
                "error": str(e),
                "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
            }
        )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 9090))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(
        "main:app", 
        host=host, 
        port=port,
        reload=True
    ) 