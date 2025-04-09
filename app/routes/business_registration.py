from typing import Optional
from fastapi import APIRouter, Request, Form, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import uuid
from pathlib import Path
from app.utils.ai_utils import FusionBrainAPI
import json
import os

from sqlalchemy import insert, select

from app.database.session import async_session_maker
from app.database.models import Company, BusinessType


# Настройка шаблонов
templates_dir = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))

# Путь к файлу с данными о бизнесах
businesses_file = Path(__file__).resolve().parent.parent / "data" / "businesses.json"

# Создаем роутер для регистрации бизнеса
router = APIRouter(
    prefix="/business",
    tags=["business_registration"],
    responses={404: {"description": "Not found"}},
)

class LogoGenerationRequest(BaseModel):
    description: str
    business_type: str

@router.get("/register", response_class=HTMLResponse)
async def business_registration_page(request: Request):
    """
    Страница регистрации бизнеса
    """
    return templates.TemplateResponse(
        "business_registration.html", 
        {
            "request": request,
            "title": "Регистрация бизнеса"
        }
    )

@router.post("/register")
async def register_business(
    business_name: str = Form(...),
    business_type: str = Form(...),
    address: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    description: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None)
):  
    try:
        print(business_type)
        print(dict(
            name=business_name,
            business_type=BusinessType[business_type],
            address=address,
            phone=phone,
            email=email,
            description=description,
            logo="logo"
        ))
        
        # Сохраняем бизнес в базе данных
        async with async_session_maker() as session:
            stmt = insert(Company).values(
                name=business_name,
                business_type=BusinessType[business_type],
                address=address,
                phone=phone,
                email=email,
                description=description,
                logo="logo"
            ).returning(Company)
            result = await session.execute(stmt)
            await session.commit()
            new_business = result.scalar()
            
            # Получаем ID нового бизнеса
            business_id = new_business.id
            
        # Сохраняем также в JSON для совместимости
        try:
            # Генерируем UUID для бизнеса в JSON
            json_business_id = str(uuid.uuid4())
            
            # Путь к файлу с данными о бизнесах
            businesses_path = os.path.join("app", "data", "businesses.json")
            
            # Загружаем существующие данные, если файл существует
            businesses_data = {}
            if os.path.exists(businesses_path):
                with open(businesses_path, "r", encoding="utf-8") as f:
                    businesses_data = json.load(f)
            
            # Создаем данные о новом бизнесе
            logo_path = "/static/uploads/logos/" + json_business_id + ".png"
            if logo:
                # Сохраняем загруженный логотип
                upload_dir = os.path.join("app", "static", "uploads", "logos")
                os.makedirs(upload_dir, exist_ok=True)
                
                file_path = os.path.join(upload_dir, json_business_id + ".png")
                with open(file_path, "wb") as f:
                    f.write(await logo.read())
            
            # Создаем данные о бизнесе для JSON
            new_business_data = {
                "id": json_business_id,
                "name": business_name,
                "type": business_type,
                "logo": logo_path,
                "description": description or "",
                "highlights": ["Новый бизнес", "Открыт для клиентов"],
                "address": address,
                "working_hours": {
                    "monday": "09:00 - 18:00",
                    "tuesday": "09:00 - 18:00",
                    "wednesday": "09:00 - 18:00",
                    "thursday": "09:00 - 18:00",
                    "friday": "09:00 - 18:00",
                    "saturday": "10:00 - 16:00",
                    "sunday": "Закрыто"
                },
                "contacts": {
                    "phone": phone,
                    "email": email,
                    "social": {
                        "instagram": "",
                        "facebook": "",
                        "vk": ""
                    }
                },
                "menu": {
                    "categories": []
                },
                "gallery": []
            }
            
            # Добавляем новый бизнес в данные
            businesses_data[json_business_id] = new_business_data
            
            # Сохраняем обновленные данные
            with open(businesses_path, "w", encoding="utf-8") as f:
                json.dump(businesses_data, f, ensure_ascii=False, indent=2)
            
            print(f"Бизнес успешно добавлен в JSON: {json_business_id}")
            
            # Создаем конфигурационный файл для нового бизнеса
            config_dir = os.path.join("app", "data", "configs")
            os.makedirs(config_dir, exist_ok=True)
            
            config_path = os.path.join(config_dir, f"{json_business_id}.json")
            config_data = {
                "business_id": json_business_id,
                "panels": {
                    "business-info": True,
                    "menu": True,
                    "map": True,
                    "contacts": True,
                    "gallery": True
                },
                "order": None,
                "menu": {
                    "menu_title": "Наше меню",
                    "categories": []
                }
            }
            
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(config_data, f, ensure_ascii=False, indent=2)
            
            # Возвращаем JSON ID для перенаправления
            return {"business_id": json_business_id}
            
        except Exception as e:
            import traceback
            print(f"Ошибка при сохранении бизнеса в JSON: {e}")
            print(traceback.format_exc())
            # Если не удалось сохранить в JSON, возвращаем ID из базы данных
            return {"business_id": business_id}
    
    except Exception as e:
        import traceback
        print(f"Ошибка при регистрации бизнеса: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/{business_id}")
async def get_business(business_id: str):
    async with async_session_maker() as session:
        # Пытаемся преобразовать ID в целое число для поиска в БД
        try:
            business_id_int = int(business_id)
            stmt = select(Company).where(Company.id == business_id_int)
            res = await session.execute(stmt)
            res: Company = res.scalar()
            if res:
                record = {
                    "businessName": res.name,
                    "businessType": res.business_type,
                    "address": res.address,
                    "contactPhone": res.phone,
                    "email": res.phone,
                    "description": res.description,
                    "logo": res.logo
                }
                return record
        except (ValueError, TypeError):
            # Если ID не числовой, пытаемся найти его в JSON файле
            try:
                with open("app/data/businesses.json", "r", encoding="utf-8") as f:
                    businesses = json.load(f)
                
                business = businesses.get(business_id)
                if business:
                    return {
                        "businessName": business.get("name", ""),
                        "businessType": business.get("type", ""),
                        "address": business.get("address", ""),
                        "contactPhone": business.get("contacts", {}).get("phone", ""),
                        "email": business.get("contacts", {}).get("email", ""),
                        "description": business.get("description", ""),
                        "logo": business.get("logo", "")
                    }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Ошибка при поиске бизнеса в JSON: {str(e)}")
        
        # Если бизнес не найден ни в БД, ни в JSON
        raise HTTPException(status_code=404, detail="Бизнес не найден")

@router.get("/view/{business_id}", response_class=HTMLResponse)
async def view_business_page(request: Request, business_id: str):
    """
    Страница просмотра бизнеса по ID
    """
    try:
        # Загружаем данные о бизнесе из JSON файла
        businesses_path = os.path.join("app", "data", "businesses.json")
        
        if os.path.exists(businesses_path):
            with open(businesses_path, "r", encoding="utf-8") as f:
                businesses_data = json.load(f)
            
            # Ищем бизнес по ID
            business = businesses_data.get(business_id)
            
            if business:
                # Пытаемся загрузить конфигурацию для бизнеса
                config_path = os.path.join("app", "data", "configs", f"{business_id}.json")
                config = None
                
                if os.path.exists(config_path):
                    try:
                        with open(config_path, "r", encoding="utf-8") as f:
                            config = json.load(f)
                    except Exception as e:
                        print(f"Ошибка при загрузке конфигурации: {e}")
                
                # Возвращаем шаблон с данными о бизнесе
                return templates.TemplateResponse(
                    "business.html",
                    {
                        "request": request, 
                        "business": business,
                        "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", ""),
                        "config": config
                    }
                )
            else:
                return templates.TemplateResponse(
                    "business.html",
                    {
                        "request": request,
                        "error": f"Бизнес с ID {business_id} не найден",
                        "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                    }
                )
        else:
            return templates.TemplateResponse(
                "business.html",
                {
                    "request": request,
                    "error": "Файл данных не найден",
                    "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                }
            )
    except Exception as e:
        import traceback
        print(f"Ошибка при загрузке страницы бизнеса: {e}")
        print(traceback.format_exc())
        return templates.TemplateResponse(
            "business.html",
            {
                "request": request,
                "error": str(e),
                "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
            }
        )

@router.get("/view/{business_id}/constructor", response_class=HTMLResponse)
async def view_business_constructor(request: Request, business_id: str):
    """
    Страница конструктора для конкретного бизнеса по ID
    """
    try:
        # Загружаем данные о бизнесе из JSON файла
        businesses_path = os.path.join("app", "data", "businesses.json")
        
        if os.path.exists(businesses_path):
            with open(businesses_path, "r", encoding="utf-8") as f:
                businesses_data = json.load(f)
            
            # Ищем бизнес по ID
            business = businesses_data.get(business_id)
            
            if business:
                # Пытаемся загрузить конфигурацию для бизнеса
                config_path = os.path.join("app", "data", "configs", f"{business_id}.json")
                config = None
                
                if os.path.exists(config_path):
                    try:
                        with open(config_path, "r", encoding="utf-8") as f:
                            config = json.load(f)
                    except Exception as e:
                        print(f"Ошибка при загрузке конфигурации: {e}")
                
                # Возвращаем шаблон конструктора с данными о бизнесе
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
                return templates.TemplateResponse(
                    "constructor.html",
                    {
                        "request": request,
                        "error": f"Бизнес с ID {business_id} не найден",
                        "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                    }
                )
        else:
            return templates.TemplateResponse(
                "constructor.html",
                {
                    "request": request,
                    "error": "Файл данных не найден",
                    "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
                }
            )
    except Exception as e:
        import traceback
        print(f"Ошибка при загрузке страницы конструктора бизнеса: {e}")
        print(traceback.format_exc())
        return templates.TemplateResponse(
            "constructor.html",
            {
                "request": request,
                "error": str(e),
                "yandex_maps_api_key": os.getenv("YANDEX_MAPS_API_KEY", "")
            }
        )

@router.post("/generate-logo")
async def generate_logo(request: LogoGenerationRequest):
    """
    Генерация логотипа с помощью Fusion Brain API
    """
    try:
        # Инициализируем API
        api = FusionBrainAPI()
        
        # Получаем ID пайплайна
        pipeline_id = api.get_pipeline()
        
        # Создаем промпт для логотипа
        prompt = api.create_logo_prompt(request.description, request.business_type)
        
        # Генерируем изображение
        uuid_str = api.generate(prompt, pipeline_id)
        
        # Получаем результат
        files = api.check_generation(uuid_str)
        
        if not files:
            raise HTTPException(status_code=500, detail="Не удалось сгенерировать логотип")
        
        # Генерируем временный ID для сохранения
        temp_id = str(uuid.uuid4())
        
        # Сохраняем логотип
        logo_path = api.save_generated_image(files[0], temp_id, "logo")
        
        if not logo_path:
            raise HTTPException(status_code=500, detail="Не удалось сохранить логотип")
        
        return JSONResponse(content={"logo_path": logo_path})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 