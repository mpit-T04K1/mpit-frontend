from fastapi import APIRouter, Request, Form, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import os
import uuid
import json
from pathlib import Path
from app.utils.ai_utils import FusionBrainAPI

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
    request: Request,
    business_name: str = Form(...),
    business_type: str = Form(...),
    address: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    description: str = Form(...),
    logo: UploadFile = File(None)
):
    """
    Обработка формы регистрации бизнеса
    """
    try:
        # Генерируем уникальный ID для бизнеса
        business_id = str(uuid.uuid4())
        
        # Путь для сохранения логотипа
        logo_path = None
        if logo:
            # Создаем уникальное имя файла
            file_extension = os.path.splitext(logo.filename)[1]
            unique_filename = f"{business_id}{file_extension}"
            
            # Путь для сохранения
            upload_dir = Path(__file__).resolve().parent.parent / "static" / "uploads" / "logos"
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = upload_dir / unique_filename
            
            # Сохраняем файл
            with open(file_path, "wb") as buffer:
                content = await logo.read()
                buffer.write(content)
            
            logo_path = f"/static/uploads/logos/{unique_filename}"
        else:
            # Используем стандартный логотип, если не загружен
            logo_path = "/static/images/default-logo.png"
        
        # Создаем данные о бизнесе
        business_data = {
            "id": business_id,
            "name": business_name,
            "type": business_type,
            "logo": logo_path,
            "description": description,
            "highlights": [
                "Новый бизнес",
                "Открыт для клиентов"
            ],
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
        
        # Загружаем текущие данные о бизнесах
        try:
            with open(businesses_file, "r", encoding="utf-8") as f:
                businesses = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            businesses = {}
        
        # Добавляем новый бизнес
        businesses[business_id] = business_data
        
        # Сохраняем обновленные данные
        with open(businesses_file, "w", encoding="utf-8") as f:
            json.dump(businesses, f, ensure_ascii=False, indent=2)
        
        # Возвращаем JSON-ответ с ID бизнеса
        return JSONResponse(content={
            "status": "success",
            "message": "Бизнес успешно зарегистрирован",
            "business_id": business_id
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/business/register", response_class=HTMLResponse)
async def register_business(request: Request):
    """
    Страница регистрации нового бизнеса
    """
    return templates.TemplateResponse(
        "business_registration.html",
        {"request": request}
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