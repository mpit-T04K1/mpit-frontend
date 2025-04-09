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
    
    // Создаем overlay для взаимодействия с основной панелью
    const overlay = document.createElement('div');
    overlay.className = 'main-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    
    // Создаем области для свайпов (активна вся ширина экрана)
    const swipeAreaLeft = document.createElement('div');
    swipeAreaLeft.className = 'swipe-area-left';
    document.body.appendChild(swipeAreaLeft);
    
    // Добавляем обработчики событий
    toggleButton.addEventListener('click', toggleMainPanel);
    overlay.addEventListener('click', closeMainPanel);
    
    // Добавляем обработку свайпов для открытия/закрытия панели
    initSwipeDetection();
    
    // Находим все формы и добавляем для них блокировку свайпов
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        });
    });
    
    console.log('Мобильный интерфейс инициализирован');
}

/**
 * Сброс мобильного интерфейса при переходе к десктопному размеру
 */
function resetMobileInterface() {
    // Удаляем кнопку и области свайпов
    const toggleButton = document.querySelector('.main-toggle');
    const swipeAreaLeft = document.querySelector('.swipe-area-left');
    const overlay = document.querySelector('.main-overlay');
    
    if (toggleButton) {
        toggleButton.remove();
    }
    
    if (swipeAreaLeft) {
        swipeAreaLeft.remove();
    }
    
    if (overlay) {
        overlay.remove();
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
    const overlay = document.querySelector('.main-overlay');
    
    if (mainPanel) {
        mainPanel.classList.toggle('active');
        
        // Показываем/скрываем оверлей
        if (mainPanel.classList.contains('active')) {
            if (overlay) overlay.style.display = 'block';
            history.pushState({ mobilePanel: 'open' }, null, window.location.pathname);
        } else {
            if (overlay) overlay.style.display = 'none';
        }
    }
}

/**
 * Закрытие основной панели
 */
function closeMainPanel() {
    console.log('Закрытие основной панели');
    const mainPanel = document.querySelector('.main-panel');
    const overlay = document.querySelector('.main-overlay');
    
    if (mainPanel) {
        mainPanel.classList.remove('active');
        if (overlay) overlay.style.display = 'none';
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
    
    // Проверяем, находимся ли мы внутри формы или элемента ввода
    function isFormElement(element) {
        if (!element) return false;
        
        // Проверяем тип элемента или его родителей
        const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
        if (formElements.includes(element.tagName)) return true;
        
        // Проверяем родителей до 3 уровня вверх
        let parent = element.parentElement;
        for (let i = 0; i < 3; i++) {
            if (!parent) break;
            if (parent.tagName === 'FORM') return true;
            parent = parent.parentElement;
        }
        
        return false;
    }
    
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
        const overlay = document.querySelector('.main-overlay');
        
        if (mainPanel && !mainPanel.classList.contains('active')) {
            // Добавляем классы для открытия панели
            mainPanel.classList.add('active');
            if (overlay) overlay.style.display = 'block';
            
            // Добавляем запись в историю
            history.pushState({ mobilePanel: 'open' }, null, window.location.pathname);
        }
    }
    
    // Функция обработки свайпа справа налево (закрытие панели)
    function handleRightToLeftSwipe() {
        console.log('Свайп справа налево - закрытие панели');
        const mainPanel = document.querySelector('.main-panel');
        const overlay = document.querySelector('.main-overlay');
        
        if (mainPanel && mainPanel.classList.contains('active')) {
            // Удаляем классы для закрытия панели
            mainPanel.classList.remove('active');
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    // Обработка начала касания для всего документа
    document.addEventListener('touchstart', function(e) {
        // Если мы работаем с формой или полем ввода, не обрабатываем свайп
        if (isFormElement(e.target)) {
            return;
        }
        
        // Запоминаем начальные координаты
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = false;
    }, { passive: true });
    
    // Отслеживаем движение пальца для всего документа
    document.addEventListener('touchmove', function(e) {
        // Если мы работаем с формой или полем ввода, не обрабатываем свайп
        if (isFormElement(e.target)) {
            return;
        }
        
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
                // Для открытия панели теперь разрешаем свайп от любого места экрана
                // Но всё равно проверяем некоторые условия для лучшего UX
                
                // Если панель не открыта и это начало свайпа в левой трети экрана
                if (touchStartX < window.innerWidth / 3) {
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