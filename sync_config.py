#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

def sync_config_to_business():
    """
    Синхронизирует данные из файлов конфигурации с файлом businesses.json
    """
    try:
        # Определяем корневую директорию проекта
        base_dir = Path(__file__).resolve().parent
        
        # Путь к файлу businesses.json
        businesses_path = os.path.join(base_dir, "app", "data", "businesses.json")
        
        # Путь к директории с конфигурациями
        configs_dir = os.path.join(base_dir, "app", "data", "configs")
        
        logger.info(f"Путь к файлу businesses.json: {businesses_path}")
        logger.info(f"Путь к директории с конфигурациями: {configs_dir}")
        
        # Проверяем существование файла businesses.json
        if not os.path.exists(businesses_path):
            logger.error(f"Файл businesses.json не найден по пути: {businesses_path}")
            return False
        
        # Проверяем существование директории с конфигурациями
        if not os.path.exists(configs_dir):
            logger.error(f"Директория с конфигурациями не найдена по пути: {configs_dir}")
            return False
        
        # Загружаем данные о бизнесах
        with open(businesses_path, "r", encoding="utf-8") as f:
            businesses = json.load(f)
        
        logger.info(f"Загружено бизнесов: {len(businesses)}")
        
        # Получаем список всех файлов конфигураций
        config_files = [f for f in os.listdir(configs_dir) if f.endswith(".json")]
        
        logger.info(f"Найдено {len(config_files)} файлов конфигураций")
        
        # Счетчики для статистики
        updated_count = 0
        skipped_count = 0
        
        # Обрабатываем каждый файл конфигурации
        for config_file in config_files:
            # Получаем ID бизнеса из имени файла
            business_id = config_file.split(".")[0]
            
            logger.info(f"Обработка файла конфигурации для бизнеса {business_id}")
            
            # Проверяем, существует ли бизнес с таким ID
            if business_id not in businesses:
                logger.warning(f"Бизнес с ID {business_id} не найден в файле businesses.json")
                skipped_count += 1
                continue
            
            # Загружаем конфигурацию
            config_path = os.path.join(configs_dir, config_file)
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
            
            # Проверяем наличие меню в конфигурации
            if "menu" in config and config["menu"] is not None:
                logger.info(f"Найдено меню в конфигурации для бизнеса {business_id}")
                
                # Проверяем наличие категорий в меню
                categories = config["menu"].get("categories", [])
                if categories:
                    logger.info(f"В меню найдено {len(categories)} категорий")
                    
                    for idx, category in enumerate(categories):
                        logger.info(f"Категория {idx+1}: {category.get('name', 'Без имени')}, элементов: {len(category.get('items', []))}")
                
                # Сравниваем с текущим меню
                current_menu = businesses[business_id].get("menu", {})
                current_categories = current_menu.get("categories", [])
                
                if current_categories != categories:
                    logger.info(f"Меню для бизнеса {business_id} отличается от текущего, обновляем")
                    
                    # Создаем данные меню включая menu_title
                    menu_data = {
                        "categories": categories
                    }
                    
                    # Добавляем menu_title, если он есть в конфигурации
                    if "menu_title" in config["menu"]:
                        menu_title = config["menu"]["menu_title"]
                        menu_data["menu_title"] = menu_title
                        logger.info(f"Заголовок меню: '{menu_title}'")
                    else:
                        menu_data["menu_title"] = "Наше меню"
                        logger.info(f"Заголовок меню не найден в конфигурации, используем значение по умолчанию: 'Наше меню'")
                    
                    # Обновляем меню в данных бизнеса
                    businesses[business_id]["menu"] = menu_data
                    updated_count += 1
                else:
                    # Проверяем, изменился ли заголовок меню
                    current_menu_title = current_menu.get("menu_title", "Наше меню")
                    config_menu_title = config["menu"].get("menu_title", "Наше меню")
                    
                    if current_menu_title != config_menu_title:
                        logger.info(f"Заголовок меню для бизнеса {business_id} изменился, обновляем")
                        logger.info(f"Старый заголовок: '{current_menu_title}', новый заголовок: '{config_menu_title}'")
                        
                        # Обновляем только заголовок меню
                        businesses[business_id]["menu"]["menu_title"] = config_menu_title
                        updated_count += 1
                    else:
                        logger.info(f"Меню для бизнеса {business_id} уже актуально, пропускаем")
                        skipped_count += 1
        
        # Сохраняем обновленные данные о бизнесах
        with open(businesses_path, "w", encoding="utf-8") as f:
            json.dump(businesses, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Синхронизация завершена успешно. Обновлено: {updated_count}, пропущено: {skipped_count}")
        return True
    
    except Exception as e:
        logger.error(f"Ошибка при синхронизации: {e}")
        return False

if __name__ == "__main__":
    sync_config_to_business() 