/**
 * Основной JavaScript-файл для Qwerty.town
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Qwerty.town - Бизнес-модуль загружен');
    
    // Установка текущего года в футере
    setCurrentYear();
    
    // Активация всех подсказок Bootstrap
    activateTooltips();
    
    // Добавление эффекта для карточек
    animateCards();
    
    // Инициализация модуля карты
    initMapModule();
    
    // Обработчик для выпадающих меню
    const dropdownToggles = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Получаем соответствующее дропдаун-меню
            const dropdownMenu = this.nextElementSibling;
            if (!dropdownMenu) return;
            
            // Устанавливаем правильные стили при открытии
            setTimeout(() => {
                if (dropdownMenu.classList.contains('show')) {
                    dropdownMenu.style.zIndex = '9999';
                    dropdownMenu.style.position = 'absolute';
                    
                    // Проверяем, не выходит ли меню за пределы экрана
                    const menuRect = dropdownMenu.getBoundingClientRect();
                    const windowWidth = window.innerWidth;
                    
                    if (menuRect.right > windowWidth) {
                        dropdownMenu.style.left = 'auto';
                        dropdownMenu.style.right = '0';
                    }
                }
            }, 0);
        });
    });
    
    // Инициализация всех тултипов
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltipTriggerList.length) {
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
    
    // Инициализация всех поповеров
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    if (popoverTriggerList.length) {
        [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }
    
    // Обработчик для нажатий на кнопки с выпадающими меню
    document.addEventListener('click', function(event) {
        // Найдем все открытые выпадающие меню
        const openMenus = document.querySelectorAll('.dropdown-menu.show');
        
        if (openMenus.length) {
            openMenus.forEach(menu => {
                // Проверим, был ли клик внутри выпадающего меню или по переключателю
                const toggle = menu.previousElementSibling;
                if (!menu.contains(event.target) && !toggle.contains(event.target)) {
                    const dropdownInstance = bootstrap.Dropdown.getInstance(toggle);
                    if (dropdownInstance) {
                        dropdownInstance.hide();
                    }
                }
            });
        }
    });
});

/**
 * Установка текущего года в футере
 */
function setCurrentYear() {
    const year = new Date().getFullYear();
    const yearElements = document.querySelectorAll('.current-year');
    yearElements.forEach(el => {
        el.textContent = year;
    });
}

/**
 * Активация подсказок Bootstrap
 */
function activateTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Добавление анимации для карточек
 */
function animateCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

/**
 * Отправка AJAX-запроса
 * @param {string} url - URL для запроса
 * @param {string} method - Метод запроса (GET, POST, PUT, DELETE)
 * @param {Object} data - Данные для отправки
 * @param {Function} callback - Функция обратного вызова
 */
function sendRequest(url, method, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    
    xhr.onload = function() {
        if (this.status >= 200 && this.status < 300) {
            callback(null, JSON.parse(this.responseText));
        } else {
            callback(new Error(`${this.status}: ${this.statusText}`), null);
        }
    };
    
    xhr.onerror = function() {
        callback(new Error('Ошибка сети'), null);
    };
    
    xhr.send(data ? JSON.stringify(data) : null);
}

/**
 * Отображение уведомления
 * @param {string} message - Сообщение для отображения
 * @param {string} type - Тип уведомления (success, error, warning, info)
 * @param {number} duration - Длительность отображения в мс
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} fade-in`;
    notification.textContent = message;
    
    const container = document.querySelector('.notification-container');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.className = 'notification-container';
        document.body.appendChild(newContainer);
        newContainer.appendChild(notification);
    } else {
        container.appendChild(notification);
    }
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Инициализация модуля карты
 */
function initMapModule() {
    // Находим кнопку активации модуля карты
    const mapButton = document.querySelector('.activate-map-module');
    
    if (mapButton) {
        mapButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Создаем модальное окно для карты
            createMapModal();
            
            // Загружаем и инициализируем карту
            loadYandexMapsScript().then(() => {
                initializeYandexMap();
            }).catch(error => {
                console.error('Ошибка при загрузке Яндекс.Карт:', error);
                showNotification('Не удалось загрузить карту. Пожалуйста, попробуйте позже.', 'error');
            });
        });
    }
}

/**
 * Создание модального окна для карты
 */
function createMapModal() {
    // Проверяем, существует ли уже модальное окно
    let mapModal = document.getElementById('mapModal');
    
    if (!mapModal) {
        // Создаем элементы модального окна
        mapModal = document.createElement('div');
        mapModal.className = 'modal fade';
        mapModal.id = 'mapModal';
        mapModal.tabIndex = '-1';
        mapModal.setAttribute('aria-labelledby', 'mapModalLabel');
        mapModal.setAttribute('aria-hidden', 'true');
        
        mapModal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="mapModalLabel">Карта компаний</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="map-filter-container">
                                    <h5 class="mb-3">Фильтры</h5>
                                    
                                    <div class="mb-3">
                                        <label for="business-type-filter" class="form-label">Тип бизнеса</label>
                                        <select class="form-select" id="business-type-filter">
                                            <option value="">Все типы</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="city-filter" class="form-label">Город</label>
                                        <select class="form-select" id="city-filter">
                                            <option value="">Все города</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <label for="search-filter" class="form-label">Поиск по названию</label>
                                        <input type="text" class="form-control" id="search-filter" placeholder="Введите название компании">
                                    </div>
                                    
                                    <button id="apply-filters" class="btn btn-primary w-100">Применить</button>
                                    <button id="reset-filters" class="btn btn-outline-secondary w-100 mt-2">Сбросить</button>
                                    
                                    <div class="company-count mt-3">
                                        Найдено компаний: <span id="company-count">0</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-9">
                                <div class="map-container" style="height: 600px;">
                                    <div id="yandexMap" style="width: 100%; height: 100%; border-radius: 8px;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем модальное окно в DOM
        document.body.appendChild(mapModal);
    }
    
    // Показываем модальное окно
    const bsModal = new bootstrap.Modal(mapModal);
    bsModal.show();
}

/**
 * Загрузка скрипта Яндекс.Карт
 */
function loadYandexMapsScript() {
    return new Promise((resolve, reject) => {
        // Проверяем, загружен ли уже скрипт
        if (window.ymaps) {
            resolve();
            return;
        }
        
        // Получаем API ключ из страницы
        const apiKey = document.documentElement.getAttribute('data-yandex-maps-api-key');
        
        // Создаем элемент скрипта
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
        script.async = true;
        
        // Добавляем обработчики событий
        script.onload = resolve;
        script.onerror = reject;
        
        // Добавляем скрипт в DOM
        document.head.appendChild(script);
    });
}

/**
 * Инициализация карты Яндекс.Карт
 */
function initializeYandexMap() {
    // Ждем, пока API Яндекс.Карт полностью загрузится
    ymaps.ready(function() {
        // Создаем карту
        const map = new ymaps.Map('yandexMap', {
            center: [55.76, 37.64], // Москва
            zoom: 10,
            controls: ['zoomControl', 'searchControl', 'fullscreenControl']
        });
        
        // Создаем менеджер объектов для эффективного отображения большого количества меток
        const objectManager = new ymaps.ObjectManager({
            clusterize: true,
            gridSize: 32,
            clusterDisableClickZoom: false
        });
        
        // Добавляем менеджер объектов на карту
        map.geoObjects.add(objectManager);
        
        // Загружаем компании для отображения на карте
        loadCompaniesForMap(objectManager);
        
        // Загружаем города и типы бизнеса для фильтров
        loadCitiesForFilter();
        loadBusinessTypesForFilter();
        
        // Настраиваем обработчики событий для фильтров
        setupMapFilters(objectManager);
    });
}

/**
 * Загрузка компаний для отображения на карте
 */
function loadCompaniesForMap(objectManager) {
    // Получаем значения фильтров
    const typeFilter = document.getElementById('business-type-filter')?.value || '';
    const cityFilter = document.getElementById('city-filter')?.value || '';
    const searchFilter = document.getElementById('search-filter')?.value || '';
    
    // Формируем URL с параметрами
    let url = '/api/map/locations';
    const params = [];
    
    if (typeFilter) params.push(`type=${encodeURIComponent(typeFilter)}`);
    if (cityFilter) params.push(`city=${encodeURIComponent(cityFilter)}`);
    if (searchFilter) params.push(`search=${encodeURIComponent(searchFilter)}`);
    
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    // Отправляем запрос на получение компаний
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Преобразуем данные в формат для ObjectManager
            const features = [];
            
            data.forEach(company => {
                if (company.latitude && company.longitude) {
                    features.push({
                        type: 'Feature',
                        id: company.id,
                        geometry: {
                            type: 'Point',
                            coordinates: [company.latitude, company.longitude]
                        },
                        properties: {
                            balloonContentHeader: company.name,
                            balloonContentBody: `
                                <p><strong>Тип:</strong> ${company.business_type_display}</p>
                                <p><strong>Адрес:</strong> ${company.address}</p>
                                ${company.phone ? `<p><strong>Телефон:</strong> <a href="tel:${company.phone}">${company.phone}</a></p>` : ''}
                                ${company.email ? `<p><strong>Email:</strong> <a href="mailto:${company.email}">${company.email}</a></p>` : ''}
                                <a href="/business/${company.id}" class="btn btn-primary btn-sm">Подробнее</a>
                            `,
                            clusterCaption: company.name,
                            iconCaption: company.name
                        },
                        options: {
                            preset: getPresetByBusinessType(company.business_type)
                        }
                    });
                }
            });
            
            // Очищаем и добавляем новые объекты
            objectManager.removeAll();
            objectManager.add({
                type: 'FeatureCollection',
                features: features
            });
            
            // Обновляем счетчик компаний
            document.getElementById('company-count').textContent = features.length;
            
            // Масштабируем карту, чтобы видеть все объекты
            if (features.length > 0) {
                const yandexMap = objectManager.getMap();
                yandexMap.setBounds(yandexMap.geoObjects.getBounds(), {
                    checkZoomRange: true,
                    zoomMargin: 30
                });
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке компаний:', error);
            showNotification('Не удалось загрузить данные компаний', 'error');
        });
}

/**
 * Получение пресета иконки в зависимости от типа бизнеса
 */
function getPresetByBusinessType(type) {
    const presets = {
        'restaurant': 'islands#redFoodIcon',
        'beauty': 'islands#pinkBeautyIcon',
        'medical': 'islands#darkBlueHospitalIcon',
        'fitness': 'islands#greenSportIcon',
        'service': 'islands#orangeAutoIcon',
        'education': 'islands#blueEducationIcon',
        'entertainment': 'islands#violetTheaterIcon',
        'retail': 'islands#yellowShoppingIcon',
        'other': 'islands#blueCircleDotIcon'
    };
    
    return presets[type] || 'islands#blueCircleDotIcon';
}

/**
 * Загрузка городов для фильтра
 */
function loadCitiesForFilter() {
    fetch('/api/map/cities')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('city-filter');
            if (!select) return;
            
            // Очищаем селект, оставляя только первый элемент "Все города"
            select.innerHTML = '<option value="">Все города</option>';
            
            // Добавляем города в селект
            data.forEach(city => {
                const option = document.createElement('option');
                option.value = city.value;
                option.textContent = city.label;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке городов:', error);
        });
}

/**
 * Загрузка типов бизнеса для фильтра
 */
function loadBusinessTypesForFilter() {
    fetch('/api/map/business-types')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('business-type-filter');
            if (!select) return;
            
            // Очищаем селект, оставляя только первый элемент "Все типы"
            select.innerHTML = '<option value="">Все типы</option>';
            
            // Добавляем типы бизнеса в селект
            data.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.label;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Ошибка при загрузке типов бизнеса:', error);
        });
}

/**
 * Настройка обработчиков событий для фильтров карты
 */
function setupMapFilters(objectManager) {
    // Кнопка применения фильтров
    const applyButton = document.getElementById('apply-filters');
    if (applyButton) {
        applyButton.addEventListener('click', function() {
            loadCompaniesForMap(objectManager);
        });
    }
    
    // Кнопка сброса фильтров
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            // Сбрасываем значения фильтров
            document.getElementById('business-type-filter').value = '';
            document.getElementById('city-filter').value = '';
            document.getElementById('search-filter').value = '';
            
            // Загружаем компании без фильтров
            loadCompaniesForMap(objectManager);
        });
    }
    
    // Обработка нажатия Enter в поле поиска
    const searchInput = document.getElementById('search-filter');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                loadCompaniesForMap(objectManager);
            }
        });
    }
} 