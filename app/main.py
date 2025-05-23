from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
import logging
import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv
import json
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

# Определение моделей данных для работы с конфигурацией
class MenuItem(BaseModel):
    """Модель для позиции меню"""
    id: str
    name: str
    price: float
    description: Optional[str] = None
    image: Optional[str] = None

class MenuCategory(BaseModel):
    """Модель для категории меню"""
    id: str
    name: str
    items: List[MenuItem] = Field(default_factory=list)

class MenuConfig(BaseModel):
    """Модель конфигурации меню"""
    menu_title: Optional[str] = "Наше меню"  # Добавляем поле menu_title со значением по умолчанию
    categories: List[MenuCategory] = Field(default_factory=list)

class PanelConfig(BaseModel):
    """Модель конфигурации панелей интерфейса"""
    business_id: str
    panels: Dict[str, bool]  # ID панели -> активна/неактивна
    order: Optional[Dict[str, int]] = None  # ID панели -> порядок отображения
    menu: Optional[MenuConfig] = None  # Конфигурация меню

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения из .env файла
load_dotenv()

# Определяем корневую директорию приложения
BASE_DIR = Path(__file__).resolve().parent
logger.debug(f"Корневая директория приложения: {BASE_DIR}")

# Импортируем маршруты после настройки логирования и загрузки переменных окружения
try:
    from app.routes import business, business_registration, situation_center
    logger.debug("Маршруты успешно импортированы из app.routes")
except ImportError as e:
    logger.error(f"Ошибка при импорте маршрутов из app.routes: {e}")
    # Используем относительные импорты как запасной вариант
    try:
        import sys
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from routes import business, business_registration, situation_center
        logger.debug("Маршруты успешно импортированы из routes")
    except ImportError as e:
        logger.error(f"Ошибка при импорте маршрутов из routes: {e}")
        raise ImportError("Не удалось импортировать необходимые маршруты")

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
async def test(request: Request):
    """
    Маршрут для тестирования шаблона business.html
    """
    try:
        # Проверяем наличие файла с данными бизнеса
        business_file = os.path.join(BASE_DIR, "data", "businesses.json")
        logger.debug(f"Пытаемся загрузить данные бизнеса из {business_file}")
        
        if os.path.exists(business_file):
            with open(business_file, "r", encoding="utf-8") as f:
                businesses_data = json.load(f)
                
            if businesses_data:
                # Получаем последний добавленный бизнес (последний ключ в словаре)
                last_business_id = list(businesses_data.keys())[-1]
                # Перенаправляем на страницу бизнеса с его ID
                return RedirectResponse(url=f"/business/view/{last_business_id}", status_code=303)
        
        # Если не найден бизнес, перенаправляем на главную
        return RedirectResponse(url="/", status_code=303)
    
    except Exception as e:
        logger.error(f"Ошибка при перенаправлении: {e}")
        # В случае ошибки также перенаправляем на главную
        return RedirectResponse(url="/", status_code=303)

@app.get("/test/constructor", response_class=HTMLResponse)
async def test_constructor_page(request: Request):
    """
    Конструктор для тестовой страницы бизнеса
    """
    logger.debug("Обработка запроса к маршруту /test/constructor")
    try:
        # Проверяем наличие файла с данными бизнеса
        business_file = os.path.join(BASE_DIR, "data", "businesses.json")
        logger.debug(f"Пытаемся загрузить данные бизнеса из {business_file}")
        
        if os.path.exists(business_file):
            with open(business_file, "r", encoding="utf-8") as f:
                businesses_data = json.load(f)
                
            if businesses_data:
                # Получаем последний добавленный бизнес (последний ключ в словаре)
                last_business_id = list(businesses_data.keys())[-1]
                # Перенаправляем на страницу конструктора бизнеса с его ID
                return RedirectResponse(url=f"/business/view/{last_business_id}/constructor", status_code=303)
        
        # Если не найден бизнес, перенаправляем на главную
        return RedirectResponse(url="/", status_code=303)
    
    except Exception as e:
        logger.error(f"Ошибка при перенаправлении: {e}")
        # В случае ошибки также перенаправляем на главную
        return RedirectResponse(url="/", status_code=303)

@app.get("/constructor", response_class=HTMLResponse)
async def constructor_page(request: Request):
    """
    Страница конструктора меню с данными последнего зарегистрированного бизнеса из JSON
    """
    logger.debug("Обработка запроса к маршруту /constructor")
    try:
        # Загружаем данные о бизнесах из JSON файла
        json_path = os.path.join(BASE_DIR, "data", "businesses.json")
        
        # Проверяем существование файла
        if os.path.exists(json_path):
            # Загружаем данные
            with open(json_path, "r", encoding="utf-8") as f:
                businesses_data = json.load(f)
                
            if businesses_data:
                # Получаем последний добавленный бизнес (последний ключ в словаре)
                last_business_id = list(businesses_data.keys())[-1]
                business = businesses_data[last_business_id]
                logger.info(f"Загружены данные последнего бизнеса: {business['name']}")
                
                # Проверяем наличие конфигурации
                config_path = os.path.join(BASE_DIR, "data", "configs", f"{business['id']}.json")
                config = None
                
                if os.path.exists(config_path):
                    try:
                        with open(config_path, "r", encoding="utf-8") as f:
                            config = json.load(f)
                        logger.info(f"Загружена конфигурация для бизнеса: {business['name']}")
                        logger.debug(f"Содержимое конфигурации: {json.dumps(config, ensure_ascii=False)}")
                    except Exception as e:
                        logger.error(f"Ошибка при загрузке конфигурации: {e}")
                else:
                    logger.debug(f"Файл конфигурации не найден: {config_path}")
                
                return templates.TemplateResponse(
                    "constructor.html",
                    {
                        "request": request, 
                        "business": business,
                        "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", ""),
                        "config": config
                    }
                )
            else:
                logger.warning("Файл businesses.json пуст")
                return templates.TemplateResponse(
                    "constructor.html",
                    {
                        "request": request,
                        "error": "Нет зарегистрированных бизнесов",
                        "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                    }
                )
        else:
            logger.error(f"Файл с данными не найден: {json_path}")
            return templates.TemplateResponse(
                "constructor.html",
                {
                    "request": request,
                    "error": "Файл данных не найден",
                    "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                }
            )
    except Exception as e:
        logger.error(f"Ошибка при загрузке данных: {e}")
        return templates.TemplateResponse(
            "constructor.html",
            {
                "request": request,
                "error": str(e),
                "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
            }
        )

@app.post("/api/save-config")
async def save_config(config: PanelConfig):
    """
    Сохраняет конфигурацию панелей для бизнеса
    """
    try:
        logger.info(f"Обработка запроса на сохранение конфигурации в main.py для бизнеса {config.business_id}")
        logger.debug(f"Данные конфигурации: {config.dict()}")
        
        # Создаем директорию для конфигураций, если её нет
        config_dir = os.path.join(BASE_DIR, "data", "configs")
        os.makedirs(config_dir, exist_ok=True)
        
        # Путь к файлу конфигурации
        config_path = os.path.join(config_dir, f"{config.business_id}.json")
        
        # Убедимся, что menu_title всегда есть в конфигурации
        if config.menu and not hasattr(config.menu, 'menu_title'):
            config.menu.menu_title = "Наше меню"
        elif config.menu and hasattr(config.menu, 'menu_title') and not config.menu.menu_title:
            config.menu.menu_title = "Наше меню"
            
        # Сохраняем конфигурацию
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config.dict(), f, ensure_ascii=False, indent=2)
        
        logger.info(f"Сохранена конфигурация для бизнеса {config.business_id}")
        
        # Обновляем данные бизнеса, если есть меню в конфигурации
        if config.menu is not None:
            try:
                logger.debug(f"Обновление меню в данных бизнеса. Данные меню: {config.menu.dict() if config.menu else 'None'}")
                
                # Путь к файлу с данными бизнеса
                business_file = os.path.join(BASE_DIR, "data", "businesses.json")
                
                # Загружаем данные о бизнесах
                if os.path.exists(business_file):
                    with open(business_file, "r", encoding="utf-8") as f:
                        businesses = json.load(f)
                    
                    # Обновляем меню бизнеса если он существует
                    if config.business_id in businesses:
                        # Преобразуем категории меню в формат для JSON
                        categories_dict = []
                        if config.menu.categories:
                            for category in config.menu.categories:
                                category_dict = category.dict()
                                categories_dict.append(category_dict)
                        
                        # Получаем заголовок меню из конфигурации или используем значение по умолчанию
                        menu_title = getattr(config.menu, 'menu_title', "Наше меню") or "Наше меню"
                        
                        # Обновляем меню со всеми атрибутами, включая menu_title
                        menu_data = {
                            "categories": categories_dict,
                            "menu_title": menu_title
                        }
                        
                        logger.debug(f"Обновление меню бизнеса с данными: {menu_data}")
                        
                        # Обновляем меню в объекте бизнеса
                        businesses[config.business_id]["menu"] = menu_data
                        
                        # Сохраняем обновленные данные
                        with open(business_file, "w", encoding="utf-8") as f:
                            json.dump(businesses, f, ensure_ascii=False, indent=2)
                        
                        logger.info(f"Обновлены данные меню в файле бизнеса для {config.business_id}")
                    else:
                        logger.warning(f"Бизнес с ID {config.business_id} не найден в файле бизнесов")
                else:
                    logger.error(f"Файл бизнесов не найден: {business_file}")
            except Exception as e:
                logger.error(f"Ошибка при обновлении данных бизнеса: {e}")
        else:
            logger.debug("Меню отсутствует в конфигурации, данные бизнеса не обновляются")
        
        return {"status": "success", "message": "Конфигурация успешно сохранена"}
    except Exception as e:
        logger.error(f"Ошибка при сохранении конфигурации: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
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