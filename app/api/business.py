from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List, Dict, Any
import os
import uuid
import json
from datetime import datetime
from pathlib import Path

router = APIRouter()

# Путь к файлу с данными о бизнесах
BUSINESSES_FILE = Path(__file__).resolve().parent.parent / "data" / "businesses.json"

def load_businesses() -> Dict[str, Any]:
    """Загрузка данных о бизнесах из JSON-файла"""
    if not BUSINESSES_FILE.exists():
        return {"businesses": []}
    
    with open(BUSINESSES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_businesses(data: Dict[str, Any]) -> None:
    """Сохранение данных о бизнесах в JSON-файл"""
    os.makedirs(os.path.dirname(BUSINESSES_FILE), exist_ok=True)
    with open(BUSINESSES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@router.post("/business/register")
async def register_business(
    businessName: str = Form(...),
    businessType: str = Form(...),
    address: str = Form(...),
    contactPhone: str = Form(...),
    email: str = Form(...),
    description: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None)
):
    """
    Регистрация нового бизнеса
    """
    try:
        # Генерируем уникальный ID для бизнеса
        business_id = str(uuid.uuid4())
        
        # Создаем директорию для логотипа если он был загружен
        logo_path = None
        if logo:
            upload_dir = "app/static/uploads/logos"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Генерируем уникальное имя файла
            file_extension = os.path.splitext(logo.filename)[1]
            logo_filename = f"{business_id}{file_extension}"
            logo_path = f"/static/uploads/logos/{logo_filename}"
            
            # Сохраняем файл
            with open(f"app{logo_path}", "wb") as buffer:
                content = await logo.read()
                buffer.write(content)
        else:
            # Используем стандартный логотип, если не загружен
            logo_path = "/static/images/qwertytown-logo.png"
        
        # Загружаем текущие данные о бизнесах
        businesses_data = load_businesses()
        
        # Создаем новую запись о бизнесе
        new_business = {
            "id": business_id,
            "name": businessName,
            "type": businessType,
            "address": address,
            "phone": contactPhone,
            "email": email,
            "description": description or f"Добро пожаловать в {businessName}!",
            "logo_path": logo_path,
            "working_hours": {
                "monday_thursday": "10:00 - 22:00",
                "friday_saturday": "10:00 - 23:00",
                "sunday": "11:00 - 22:00"
            },
            "social_media": {
                "instagram": f"@{businessName.lower().replace(' ', '_')}",
                "facebook": businessName,
                "telegram": f"@{businessName.lower().replace(' ', '_')}"
            },
            "created_at": datetime.now().isoformat()
        }
        
        # Добавляем новую запись в список бизнесов
        businesses_data["businesses"].append(new_business)
        
        # Сохраняем обновленные данные
        save_businesses(businesses_data)
        
        return {
            "status": "success",
            "message": "Бизнес успешно зарегистрирован",
            "business_id": business_id
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@router.get("/business/{business_id}")
async def get_business(business_id: str):
    """
    Получение информации о бизнесе по ID
    """
    businesses_data = load_businesses()
    
    for business in businesses_data["businesses"]:
        if business["id"] == business_id:
            return business
    
    raise HTTPException(status_code=404, detail="Бизнес не найден")

@router.get("/businesses")
async def get_all_businesses():
    """
    Получение списка всех бизнесов
    """
    businesses_data = load_businesses()
    return businesses_data 