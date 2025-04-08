from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
import logging
import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

# Импортируем маршруты
from app.routes import business, business_registration, situation_center

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG,  # Изменено с INFO на DEBUG для более подробного логирования
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения из .env файла
load_dotenv()

# Определяем корневую директорию приложения
BASE_DIR = Path(__file__).resolve().parent
logger.debug(f"Корневая директория приложения: {BASE_DIR}")

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
static_dir = os.path.join(BASE_DIR, "static")
logger.debug(f"Директория статических файлов: {static_dir}")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    logger.debug("Статические файлы успешно подключены")
else:
    logger.error(f"Директория статических файлов не существует: {static_dir}")

# Настройка шаблонизатора Jinja2
templates_dir = os.path.join(BASE_DIR, "templates")
logger.debug(f"Директория шаблонов: {templates_dir}")
if os.path.exists(templates_dir):
    templates = Jinja2Templates(directory=templates_dir)
    logger.debug("Шаблонизатор Jinja2 успешно настроен")
    
    # Проверка наличия необходимых шаблонов
    required_templates = ["cafe_example.html", "business.html", "test_page.html", "modular_base.html"]
    for template in required_templates:
        template_path = os.path.join(templates_dir, template)
        if os.path.exists(template_path):
            logger.debug(f"Шаблон {template} существует")
        else:
            logger.error(f"Шаблон {template} не существует")
else:
    logger.error(f"Директория шаблонов не существует: {templates_dir}")

# Подключаем маршруты
logger.debug("Подключение маршрутов...")
app.include_router(business.router)
app.include_router(business_registration.router)
app.include_router(situation_center.router)
logger.debug("Маршруты успешно подключены")

# Middleware для логирования всех запросов
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"Получен запрос: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.debug(f"Отправлен ответ: {response.status_code}")
    return response

# Корневой маршрут
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """
    Главная страница с модульным интерфейсом
    """
    logger.debug("Обработка запроса к корневому маршруту /")
    try:
        return templates.TemplateResponse(
            "cafe_example.html", 
            {
                "request": request,
                "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
            }
        )
    except Exception as e:
        logger.error(f"Ошибка при рендеринге шаблона cafe_example.html: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Ошибка при рендеринге шаблона: {str(e)}"}
        )

# Маршрут для предварительного просмотра страницы бизнеса без переменных
@app.get("/preview", response_class=HTMLResponse)
async def preview_business_page(request: Request):
    logger.debug("Обработка запроса к маршруту /preview")
    # Тестовые данные для предварительного просмотра
    test_business = {
        "name": "Тестовый бизнес",
        "logo": "/static/images/placeholder-logo.png",
        "description": "Это тестовое описание бизнеса для предварительного просмотра страницы.",
        "highlights": [
            "Высокое качество обслуживания",
            "Удобное расположение",
            "Профессиональный персонал"
        ],
        "address": "ул. Примерная, д. 123",
        "working_hours": {
            "понедельник": "9:00 - 18:00",
            "вторник": "9:00 - 18:00",
            "среда": "9:00 - 18:00",
            "четверг": "9:00 - 18:00",
            "пятница": "9:00 - 18:00",
            "суббота": "10:00 - 16:00",
            "воскресенье": "выходной"
        },
        "contacts": {
            "phone": "+7 (999) 123-45-67",
            "email": "test@example.com",
            "social": {
                "facebook": "https://facebook.com",
                "instagram": "https://instagram.com",
                "vk": "https://vk.com"
            }
        },
        "menu": {
            "categories": [
                {
                    "id": "1",
                    "name": "Основные блюда",
                    "items": [
                        {
                            "id": "1",
                            "name": "Тестовое блюдо 1",
                            "price": "500",
                            "description": "Описание тестового блюда 1",
                            "image": "/static/images/placeholder-food.png"
                        },
                        {
                            "id": "2",
                            "name": "Тестовое блюдо 2",
                            "price": "600",
                            "description": "Описание тестового блюда 2",
                            "image": "/static/images/placeholder-food.png"
                        }
                    ]
                }
            ]
        },
        "gallery": [
            {
                "image": "/static/images/placeholder-gallery.png",
                "description": "Тестовое фото 1"
            },
            {
                "image": "/static/images/placeholder-gallery.png",
                "description": "Тестовое фото 2"
            }
        ]
    }
    try:
        return templates.TemplateResponse("business.html", {"request": request, "business": test_business})
    except Exception as e:
        logger.error(f"Ошибка при рендеринге шаблона business.html: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Ошибка при рендеринге шаблона: {str(e)}"}
        )

@app.get("/test", response_class=HTMLResponse)
async def test_page(request: Request):
    """
    Тестовая страница с данными из JSON
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
                
            # Берем данные бизнеса "Тестов"
            test_business_id = "30f4e51e-f701-473e-8620-89059021bd17"
            if test_business_id in businesses_data:
                business = businesses_data[test_business_id]
                logger.info(f"Загружены данные бизнеса: {business['name']}")
            else:
                # Если нет нужного бизнеса, берем первый из списка
                business_id = next(iter(businesses_data))
                business = businesses_data[business_id]
                logger.info(f"Загружены данные первого бизнеса: {business['name']}")
            
            return templates.TemplateResponse(
                "test_page.html",
                {"request": request, "business": business}
            )
        else:
            logger.error(f"Файл с данными не найден: {json_path}")
            # Если файл не найден, вернем страницу с сообщением об ошибке
            return templates.TemplateResponse(
                "test_page.html",
                {"request": request, "error": "Файл данных не найден"}
            )
    except Exception as e:
        logger.error(f"Ошибка при загрузке данных: {e}")
        # В случае ошибки вернем пустой шаблон
        return templates.TemplateResponse(
            "test_page.html",
            {"request": request, "error": str(e)}
        )

# Обработчик ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Необработанная ошибка: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Произошла внутренняя ошибка сервера."},
    )

if __name__ == "__main__":
    # Запуск сервера
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    ) 