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

let center = [54.70805096669561,20.50560278768957]

// Получаем адрес бизнеса из данных или из DOM
function getBusinessAddress() {
    console.log("==== ОТЛАДКА: Начало функции getBusinessAddress() ====");
    
    // Попытка получить адрес из элемента с id business-address
    const addressElement = document.getElementById('business-address');
    if (addressElement) {
        console.log("ОТЛАДКА: Найден элемент #business-address", addressElement);
        if (addressElement.value) {
            console.log("ОТЛАДКА: В #business-address найдено значение:", addressElement.value);
            return addressElement.value;
        } else {
            console.log("ОТЛАДКА: #business-address не содержит значения");
        }
    } else {
        console.log("ОТЛАДКА: Элемент #business-address не найден в DOM");
    }
    
    // Поиск в глобальных данных
    if (window.businessData) {
        console.log("ОТЛАДКА: Найден объект window.businessData:", window.businessData);
        if (window.businessData.address) {
            console.log("ОТЛАДКА: В window.businessData найден адрес:", window.businessData.address);
            return window.businessData.address;
        } else {
            console.log("ОТЛАДКА: window.businessData не содержит свойства address");
        }
    } else {
        console.log("ОТЛАДКА: window.businessData не определен");
    }
    
    // Поиск по селектору CSS
    const addressTextElements = document.querySelectorAll('.address-info p.text-light-50');
    if (addressTextElements.length > 0) {
        const text = addressTextElements[0].textContent.trim();
        console.log("ОТЛАДКА: Найден элемент с адресом в .address-info:", text);
        return text;
    } else {
        console.log("ОТЛАДКА: Не найдены элементы с селектором .address-info p.text-light-50");
    }
    
    // Поиск в DOM по другим селекторам
    const addressText = document.querySelector('.business-address-text');
    if (addressText) {
        console.log("ОТЛАДКА: Найден элемент .business-address-text:", addressText.textContent);
        return addressText.textContent;
    } else {
        console.log("ОТЛАДКА: Элемент .business-address-text не найден");
    }
    
    // Поиск информации об адресе из других элементов страницы
    const possibleAddressContainers = [
        ...document.querySelectorAll('p'), 
        ...document.querySelectorAll('.address'),
        ...document.querySelectorAll('[data-address]')
    ];
    
    for (const container of possibleAddressContainers) {
        const text = container.textContent.trim();
        if (text.includes('Калининград') && text.length < 100) {
            console.log("ОТЛАДКА: Найден возможный адрес в:", container, text);
            return text;
        }
        
        const dataAddress = container.getAttribute('data-address');
        if (dataAddress) {
            console.log("ОТЛАДКА: Найден адрес в атрибуте data-address:", dataAddress);
            return dataAddress;
        }
    }
    
    // Извлечение из явного HTML-элемента на странице business.html
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
        const addressParagraph = mapSection.querySelector('p.text-light-50');
        if (addressParagraph) {
            console.log("ОТЛАДКА: Найден адрес в #map-section:", addressParagraph.textContent);
            return addressParagraph.textContent;
        } else {
            console.log("ОТЛАДКА: В #map-section не найден элемент p.text-light-50");
        }
    } else {
        console.log("ОТЛАДКА: Секция #map-section не найдена");
    }
    
    // Запасной вариант по умолчанию
    console.log("ОТЛАДКА: Не удалось найти адрес, возвращаем значение по умолчанию");
    return "г. Калининград, центр";
}

function init() {
    console.log("==== ОТЛАДКА: Начало функции init() ====");
    console.log("ОТЛАДКА: Проверка состояния ymaps:", ymaps ? "ymaps определен" : "ymaps не определен");
    
    // Получаем адрес бизнеса
    const businessAddress = getBusinessAddress();
    console.log("ОТЛАДКА: Получен адрес бизнеса:", businessAddress);
    
    // Проверяем наличие контейнера карты
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error("ОТЛАДКА: ОШИБКА - Контейнер карты #map не найден на странице");
        
        // Проверяем другие возможные ID
        const demoMapContainer = document.getElementById('demo-map');
        if (demoMapContainer) {
            console.log("ОТЛАДКА: Найден контейнер #demo-map вместо #map");
            demoMapContainer.id = 'map';
            console.log("ОТЛАДКА: ID контейнера изменен на 'map'");
        } else {
            console.error("ОТЛАДКА: ОШИБКА - Контейнер #demo-map также не найден");
            return; // Прерываем выполнение, если нет контейнера
        }
    } else {
        console.log("ОТЛАДКА: Контейнер карты #map найден:", mapContainer);
    }
    
    // Первым делом геокодируем адрес бизнеса для правильной установки на карте
    console.log("ОТЛАДКА: Геокодирование адреса бизнеса перед инициализацией:", businessAddress);
    
    ymaps.geocode(businessAddress, { results: 1 }).then(function(res) {
        const firstGeoObject = res.geoObjects.get(0);
        
        if (!firstGeoObject) {
            console.error("ОТЛАДКА: Не удалось геокодировать адрес бизнеса:", businessAddress);
            // Используем координаты Калининграда по умолчанию
            initMap([54.70805096669561, 20.50560278768957], businessAddress);
            return;
        }
        
        const businessCoords = firstGeoObject.geometry.getCoordinates();
        console.log("ОТЛАДКА: Получены координаты бизнеса:", businessCoords);
        
        // Инициализируем карту с точными координатами
        initMap(businessCoords, businessAddress);
    }).catch(function(error) {
        console.error("ОТЛАДКА: Ошибка при геокодировании:", error);
        // Используем координаты Калининграда по умолчанию
        initMap([54.70805096669561, 20.50560278768957], businessAddress);
    });
}

function initMap(coords, businessAddress) {
    console.log("ОТЛАДКА: Инициализация карты с координатами:", coords);
    console.log("ОТЛАДКА: Адрес бизнеса для отображения:", businessAddress);
    
    try {
        // Инициализация карты
        var map = new ymaps.Map('map', {
            center: coords,
            zoom: 15,
            controls: ['routePanelControl']
        });
        
        console.log("ОТЛАДКА: Карта успешно создана:", map);
        
        // Создаем метку с адресом бизнеса
        console.log("ОТЛАДКА: Создание метки с координатами:", coords);
        var placemark1 = new ymaps.Placemark(
            coords, 
            {
                balloonContentHeader: "Наш адрес",
                balloonContentBody: businessAddress,
                hintContent: "Мы находимся здесь!"
            }, 
            {
                preset: 'islands#redDotIcon',
                openBalloonOnClick: false
            }
        );
        
        console.log("ОТЛАДКА: Метка создана:", placemark1);
        
        // Добавляем метку на карту
        map.geoObjects.add(placemark1);
        console.log("ОТЛАДКА: Метка добавлена на карту");
        
        // Настройка панели маршрута
        console.log("ОТЛАДКА: Получение контрола routePanelControl");
        var control = map.controls.get('routePanelControl');
        
        if (control) {
            console.log("ОТЛАДКА: Контрол routePanelControl получен:", control);
            console.log("ОТЛАДКА: Конфигурация панели маршрута с to =", businessAddress);
            
            // Настройка панели маршрута с детальным логированием
            try {
                // Важно: используем точные координаты вместо адреса
                control.routePanel.state.set({
                    type: 'masstransit',
                    to: coords,
                    fromEnabled: true,
                    toEnabled: false
                });
                console.log("ОТЛАДКА: Панель маршрута успешно настроена с координатами");
                
                // Проверка текущего состояния панели маршрута
                setTimeout(() => {
                    console.log("ОТЛАДКА: Текущее состояние панели маршрута:", 
                        control.routePanel.state.get('from'), 
                        control.routePanel.state.get('to'),
                        control.routePanel.state.get('type'));
                }, 1000);
            } catch (error) {
                console.error("ОТЛАДКА: ОШИБКА при настройке панели маршрута:", error);
            }
        } else {
            console.error("ОТЛАДКА: ОШИБКА - Контрол routePanelControl не найден");
        }
        
        // Получение текущего местоположения пользователя
        console.log("ОТЛАДКА: Настройка параметров геолокации");
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        
        // Функция успешного получения геолокации
        function success(pos) {
            console.log("ОТЛАДКА: Успешное получение геолокации пользователя");
            var crd = pos.coords;
            console.log('ОТЛАДКА: Координаты пользователя:', crd.latitude, crd.longitude);
            
            // Обновляем маршрут с текущим положением пользователя
            console.log("ОТЛАДКА: Геокодирование координат пользователя");
            ymaps.geocode([crd.latitude, crd.longitude], { results: 1 }).then(function(res) {
                var firstGeoObject = res.geoObjects.get(0);
                var address = firstGeoObject.getAddressLine();
                console.log("ОТЛАДКА: Получен адрес пользователя:", address);
                
                console.log("ОТЛАДКА: Обновление маршрута от", address, "до", businessAddress);
                try {
                    control.routePanel.state.set({
                        from: address,
                        to: coords
                    });
                    console.log("ОТЛАДКА: Маршрут успешно обновлен");
                } catch (error) {
                    console.error("ОТЛАДКА: ОШИБКА при обновлении маршрута:", error);
                }
            }).catch(function(error) {
                console.error("ОТЛАДКА: ОШИБКА при геокодировании:", error);
            });
        }
        
        // Функция обработки ошибок геолокации
        function error(err) {
            console.warn(`ОТЛАДКА: ОШИБКА геолокации (${err.code}): ${err.message}`);
            
            // В случае ошибки используем центр города в качестве начальной точки
            console.log("ОТЛАДКА: Установка Калининграда в качестве начальной точки");
            try {
                control.routePanel.state.set({
                    from: 'Калининград',
                    to: coords
                });
                console.log("ОТЛАДКА: Маршрут успешно настроен с фиксированной начальной точкой");
            } catch (error) {
                console.error("ОТЛАДКА: ОШИБКА при настройке маршрута с фиксированной точкой:", error);
            }
        }
        
        // Запрашиваем текущую геолокацию
        console.log("ОТЛАДКА: Запрос геолокации пользователя");
        navigator.geolocation.getCurrentPosition(success, error, options);
        
        // Открываем балун только после того, как карта полностью загружена
        console.log("ОТЛАДКА: Настройка обработчика события 'ready' карты");
        map.events.add('ready', function() {
            console.log("ОТЛАДКА: Событие 'ready' карты сработало");
            
            if (placemark1) {
                console.log("ОТЛАДКА: Метка существует, устанавливаем таймаут для открытия балуна");
                setTimeout(() => {
                    try {
                        console.log("ОТЛАДКА: Попытка открыть балун");
                        placemark1.balloon.open();
                        console.log("ОТЛАДКА: Балун успешно открыт");
                    } catch (e) {
                        console.error("ОТЛАДКА: ОШИБКА при открытии балуна:", e);
                    }
                }, 500);
            } else {
                console.error("ОТЛАДКА: ОШИБКА - Метка не существует при попытке открыть балун");
            }
        });
        
    } catch (error) {
        console.error("ОТЛАДКА: ОШИБКА при инициализации карты:", error);
    }
}
