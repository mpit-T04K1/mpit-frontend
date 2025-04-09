import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.database.models import Base
from app.settings import settings
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    """
    Инициализирует базу данных и создает необходимые таблицы
    """
    logger.info("Инициализация базы данных...")
    
    try:
        # Создаем engine
        engine = create_async_engine(settings.DATABASE_URL)
        
        # Создаем таблицы
        async with engine.begin() as conn:
            logger.info("Создание таблиц...")
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("База данных успешно инициализирована!")
    except Exception as e:
        logger.error(f"Ошибка при инициализации базы данных: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_db()) 