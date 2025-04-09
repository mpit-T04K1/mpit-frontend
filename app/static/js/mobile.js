/**
 * Модуль для управления мобильным интерфейсом
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Мобильный интерфейс инициализируется...');
    
    // Инициализация модуля для мобильного интерфейса
    if (window.innerWidth <= 991) {
        initMobileInterface();
    }
    
    // Переинициализация при изменении размера окна
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 991) {
            initMobileInterface();
        } else {
            // Если вернулись к десктопному размеру, сбрасываем мобильные элементы
            resetMobileInterface();
        }
    });
});

/**
 * Инициализация мобильного интерфейса
 */
function initMobileInterface() {
    console.log('Инициализация мобильного интерфейса...');
    
    // Проверяем, не инициализирован ли уже интерфейс
    if (document.querySelector('.main-toggle')) {
        return;
    }
    
    // Создаем кнопку открытия основной панели
    const toggleButton = document.createElement('div');
    toggleButton.className = 'main-toggle';
    toggleButton.innerHTML = '<i class="bi bi-view-list"></i>';
    document.body.appendChild(toggleButton);
    
    // Создаем области для свайпов
    const swipeAreaLeft = document.createElement('div');
    swipeAreaLeft.className = 'swipe-area-left';
    document.body.appendChild(swipeAreaLeft);
    
    // Добавляем обработчики событий
    toggleButton.addEventListener('click', toggleMainPanel);
    
    // Добавляем обработку свайпов для открытия/закрытия панели
    initSwipeDetection();
    
    console.log('Мобильный интерфейс инициализирован');
}

/**
 * Сброс мобильного интерфейса при переходе к десктопному размеру
 */
function resetMobileInterface() {
    // Удаляем кнопку и области свайпов
    const toggleButton = document.querySelector('.main-toggle');
    const swipeAreaLeft = document.querySelector('.swipe-area-left');
    
    if (toggleButton) {
        toggleButton.remove();
    }
    
    if (swipeAreaLeft) {
        swipeAreaLeft.remove();
    }
    
    // Сбрасываем классы основной панели
    const mainPanel = document.querySelector('.main-panel');
    if (mainPanel) {
        mainPanel.classList.remove('active');
    }
}

/**
 * Открытие/закрытие основной панели
 */
function toggleMainPanel() {
    console.log('Переключение основной панели');
    const mainPanel = document.querySelector('.main-panel');
    
    if (mainPanel) {
        mainPanel.classList.toggle('active');
        
        // Добавляем запись в историю при открытии панели
        if (mainPanel.classList.contains('active')) {
            history.pushState({ mobilePanel: 'open' }, null, window.location.pathname);
        }
    }
}

/**
 * Закрытие основной панели
 */
function closeMainPanel() {
    console.log('Закрытие основной панели');
    const mainPanel = document.querySelector('.main-panel');
    
    if (mainPanel) {
        mainPanel.classList.remove('active');
    }
}

/**
 * Инициализация обнаружения свайпов
 */
function initSwipeDetection() {
    console.log('Инициализация обнаружения свайпов');
    
    // Объявляем переменные для определения свайпов
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let isSwiping = false;
    
    // Вспомогательная функция для определения, является ли событие свайпом
    function isSwipe(startX, endX, startY, endY) {
        // Горизонтальное расстояние свайпа
        const horizontalDistance = Math.abs(startX - endX);
        // Вертикальное расстояние (для определения диагонального свайпа)
        const verticalDistance = Math.abs(startY - endY);
        
        // Признаем за свайп, если горизонтальное движение более 50px и оно в 1.5 раза больше вертикального
        return horizontalDistance > 50 && horizontalDistance > verticalDistance * 1.5;
    }
    
    // Функция обработки свайпа слева направо (открытие панели)
    function handleLeftToRightSwipe() {
        console.log('Свайп слева направо - открытие панели');
        const mainPanel = document.querySelector('.main-panel');
        
        if (mainPanel && !mainPanel.classList.contains('active')) {
            // Добавляем классы для открытия панели
            mainPanel.classList.add('active');
            
            // Добавляем запись в историю
            history.pushState({ mobilePanel: 'open' }, null, window.location.pathname);
        }
    }
    
    // Функция обработки свайпа справа налево (закрытие панели)
    function handleRightToLeftSwipe() {
        console.log('Свайп справа налево - закрытие панели');
        const mainPanel = document.querySelector('.main-panel');
        
        if (mainPanel && mainPanel.classList.contains('active')) {
            // Удаляем классы для закрытия панели
            mainPanel.classList.remove('active');
        }
    }
    
    // Отдельная обработка событий для области свайпа слева
    const swipeAreaLeft = document.querySelector('.swipe-area-left');
    if (swipeAreaLeft) {
        swipeAreaLeft.addEventListener('touchstart', function(e) {
            // Запоминаем начальные координаты
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = false;
        }, { passive: true });
        
        swipeAreaLeft.addEventListener('touchmove', function(e) {
            // Если уже свайпим, пропускаем
            if (isSwiping) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            // Если движение вправо, открываем панель
            if (currentX - touchStartX > 30) {
                isSwiping = true;
                handleLeftToRightSwipe();
            }
        }, { passive: true });
    }
    
    // Обработка начала касания для всего документа
    document.addEventListener('touchstart', function(e) {
        // Запоминаем начальные координаты
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = false;
    }, { passive: true });
    
    // Отслеживаем движение пальца для всего документа
    document.addEventListener('touchmove', function(e) {
        // Если уже свайпим, пропускаем
        if (isSwiping) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        // Проверяем, можно ли считать это движение свайпом
        if (isSwipe(touchStartX, currentX, touchStartY, currentY)) {
            isSwiping = true;
            
            // Определяем направление свайпа
            if (touchStartX > currentX) {
                // Если свайп справа налево при открытой панели, закрываем её
                const mainPanel = document.querySelector('.main-panel');
                if (mainPanel && mainPanel.classList.contains('active')) {
                    handleRightToLeftSwipe();
                }
            } else {
                // Если панель не открыта и это свайп из крайней левой области экрана
                if (touchStartX < 50) {
                    handleLeftToRightSwipe();
                }
            }
        }
    }, { passive: true });
    
    // Добавляем обработчик для кнопки "назад" в браузере
    window.addEventListener('popstate', function(e) {
        const mainPanel = document.querySelector('.main-panel');
        if (mainPanel && mainPanel.classList.contains('active')) {
            closeMainPanel();
        }
    });
    
    // Добавляем специальный обработчик для кнопки меню
    const mainToggle = document.querySelector('.main-toggle');
    if (mainToggle) {
        mainToggle.addEventListener('touchstart', function(e) {
            e.stopPropagation(); // Предотвращаем обработку другими обработчиками
        }, { passive: false });
    }
} 