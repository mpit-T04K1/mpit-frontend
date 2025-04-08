from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import json
import os

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/business/{business_id}", response_class=HTMLResponse)
async def get_business_page(request: Request, business_id: str):
    try:
        # Загружаем данные о бизнесах из JSON файла
        with open("app/data/businesses.json", "r", encoding="utf-8") as f:
            businesses = json.load(f)
        
        # Ищем бизнес по ID
        business = businesses.get(business_id)
        
        if not business:
            raise HTTPException(status_code=404, detail="Бизнес не найден")
        
        # Возвращаем шаблон с данными о бизнесе
        return templates.TemplateResponse(
            "business.html",
            {"request": request, "business": business}
        )
        
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Файл с данными не найден")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Ошибка при чтении данных")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 