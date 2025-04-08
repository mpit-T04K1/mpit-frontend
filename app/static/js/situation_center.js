/**
 * JavaScript для управления ситуационным центром с динамическими панелями
 */

class SituationCenter {
    /**
     * Конструктор класса SituationCenter
     * @param {string} containerId - ID контейнера ситуационного центра
     * @param {Object} options - Дополнительные параметры
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = Object.assign({
            leftPanelTitle: 'Список',
            mainPanelTitle: 'Содержание',
            rightPanelTitle: 'Детали',
            enableTabs: true,
            tabs: [],
            mobileNavigation: true,
            collapsiblePanels: true,
            leftPanelWidth: '25%',
            rightPanelWidth: '25%',
            initialActiveItem: null,
            onItemSelect: null,
            onTabChange: null,
            loadItemsCallback: null
        }, options);
        
        this.currentState = {
            activeItem: null,
            activeTab: null,
            leftPanelVisible: true,
            rightPanelVisible: true
        };
        
        if (!this.container) {
            console.error(`Контейнер с ID "${containerId}" не найден`);
            return;
        }
        
        this.render();
        this.setupEventListeners();
        
        // Загружаем элементы, если указан callback
        if (typeof this.options.loadItemsCallback === 'function') {
            this.loadItems();
        }
    }
    
    /**
     * Отрисовка каркаса ситуационного центра
     */
    render() {
        this.container.innerHTML = '';
        this.container.className = 'situation-center';
        
        // Создаем левую панель
        this.leftPanel = document.createElement('div');
        this.leftPanel.className = 'situation-panel situation-panel-left';
        this.leftPanel.innerHTML = `
            <div class="situation-panel-header">
                <h3>${this.options.leftPanelTitle}</h3>
                <div class="panel-controls">
                    <button class="panel-control-btn panel-refresh" title="Обновить">
                        <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="panel-control-btn panel-collapse" title="Свернуть">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                </div>
            </div>
            <div class="situation-panel-content">
                <div class="add-item-btn">
                    <i class="bi bi-plus-circle"></i> Добавить
                </div>
                <ul class="situation-item-list"></ul>
                <div class="situation-loader" style="display: none;">
                    <div class="situation-loader-spinner"></div>
                    <div>Загрузка...</div>
                </div>
                <div class="situation-empty-state" style="display: none;">
                    <div class="situation-empty-state-icon">
                        <i class="bi bi-inbox"></i>
                    </div>
                    <div class="situation-empty-state-text">Нет доступных элементов</div>
                    <button class="btn btn-outline-primary">Создать новый</button>
                </div>
            </div>
        `;
        
        // Создаем главную панель
        this.mainPanel = document.createElement('div');
        this.mainPanel.className = 'situation-panel situation-panel-main';
        
        let tabsHtml = '';
        if (this.options.enableTabs && this.options.tabs.length > 0) {
            tabsHtml = `
                <div class="situation-tabs">
                    ${this.options.tabs.map((tab, index) => `
                        <div class="situation-tab${index === 0 ? ' active' : ''}" data-tab="${tab.id}">
                            ${tab.icon ? `<i class="bi bi-${tab.icon}"></i> ` : ''}${tab.title}
                        </div>
                    `).join('')}
                </div>
                ${this.options.tabs.map((tab, index) => `
                    <div class="situation-tab-content${index === 0 ? ' active' : ''}" data-tab-content="${tab.id}">
                        <div class="situation-tab-inner-content"></div>
                    </div>
                `).join('')}
            `;
            
            if (this.options.tabs.length > 0) {
                this.currentState.activeTab = this.options.tabs[0].id;
            }
        }
        
        this.mainPanel.innerHTML = `
            <div class="situation-panel-header">
                <h3>${this.options.mainPanelTitle}</h3>
                <div class="panel-controls">
                    <button class="panel-control-btn panel-expand-left" title="Показать список">
                        <i class="bi bi-layout-sidebar"></i>
                    </button>
                    <button class="panel-control-btn panel-expand-right" title="Показать детали">
                        <i class="bi bi-layout-sidebar-reverse"></i>
                    </button>
                </div>
            </div>
            <div class="situation-panel-content">
                ${tabsHtml}
                ${!this.options.enableTabs || this.options.tabs.length === 0 ? `
                    <div class="situation-content-main"></div>
                ` : ''}
                <div class="situation-loader" style="display: none;">
                    <div class="situation-loader-spinner"></div>
                    <div>Загрузка данных...</div>
                </div>
            </div>
        `;
        
        // Создаем правую панель
        this.rightPanel = document.createElement('div');
        this.rightPanel.className = 'situation-panel situation-panel-right';
        this.rightPanel.innerHTML = `
            <div class="situation-panel-header">
                <h3>${this.options.rightPanelTitle}</h3>
                <div class="panel-controls">
                    <button class="panel-control-btn panel-collapse" title="Свернуть">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
            <div class="situation-panel-content">
                <div class="situation-detail-content"></div>
                <div class="situation-empty-state" style="display: none;">
                    <div class="situation-empty-state-icon">
                        <i class="bi bi-info-circle"></i>
                    </div>
                    <div class="situation-empty-state-text">Выберите элемент для просмотра деталей</div>
                </div>
            </div>
        `;
        
        // Добавляем панели в контейнер
        this.container.appendChild(this.leftPanel);
        this.container.appendChild(this.mainPanel);
        this.container.appendChild(this.rightPanel);
        
        // Настраиваем ширину панелей
        this.leftPanel.style.flex = `0 0 ${this.options.leftPanelWidth}`;
        this.rightPanel.style.flex = `0 0 ${this.options.rightPanelWidth}`;
        
        // Мобильная навигация
        if (this.options.mobileNavigation && window.innerWidth <= 767) {
            this.mobileNav = document.createElement('div');
            this.mobileNav.className = 'mobile-nav';
            this.mobileNav.innerHTML = `
                <div class="mobile-nav-btn active" data-panel="left">
                    <i class="bi bi-list"></i> ${this.options.leftPanelTitle}
                </div>
                <div class="mobile-nav-btn" data-panel="main">
                    <i class="bi bi-grid"></i> ${this.options.mainPanelTitle}
                </div>
                <div class="mobile-nav-btn" data-panel="right">
                    <i class="bi bi-info-circle"></i> ${this.options.rightPanelTitle}
                </div>
            `;
            this.container.parentNode.appendChild(this.mobileNav);
        }
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Обработка кликов на элементах
        const itemList = this.leftPanel.querySelector('.situation-item-list');
        itemList.addEventListener('click', (event) => {
            const item = event.target.closest('.situation-item');
            if (item) {
                this.selectItem(item.dataset.id);
            }
        });
        
        // Обработка кликов на вкладках
        if (this.options.enableTabs) {
            const tabs = this.mainPanel.querySelectorAll('.situation-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.selectTab(tab.dataset.tab);
                });
            });
        }
        
        // Обработка кнопок управления панелями
        this.leftPanel.querySelector('.panel-collapse').addEventListener('click', () => {
            this.toggleLeftPanel(false);
        });
        
        this.rightPanel.querySelector('.panel-collapse').addEventListener('click', () => {
            this.toggleRightPanel(false);
        });
        
        this.mainPanel.querySelector('.panel-expand-left').addEventListener('click', () => {
            this.toggleLeftPanel(true);
        });
        
        this.mainPanel.querySelector('.panel-expand-right').addEventListener('click', () => {
            this.toggleRightPanel(true);
        });
        
        // Обработка кнопки обновления
        this.leftPanel.querySelector('.panel-refresh').addEventListener('click', () => {
            this.loadItems();
        });
        
        // Обработка кнопки добавления
        this.leftPanel.querySelector('.add-item-btn').addEventListener('click', () => {
            this.createNewItem();
        });
        
        // Мобильная навигация
        if (this.mobileNav) {
            const buttons = this.mobileNav.querySelectorAll('.mobile-nav-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const panel = btn.dataset.panel;
                    this.scrollToPanel(panel);
                    
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
        }
        
        // Адаптивность при изменении размера окна
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Обработка изменения размера окна
     */
    handleResize() {
        if (window.innerWidth <= 1199) {
            // Планшетный режим
            if (this.currentState.leftPanelVisible && this.currentState.rightPanelVisible) {
                // Если открыты обе боковые панели, скрываем их
                this.toggleLeftPanel(false);
                this.toggleRightPanel(false);
            }
        }
    }
    
    /**
     * Прокрутка к панели (для мобильных устройств)
     * @param {string} panel - Идентификатор панели (left, main, right)
     */
    scrollToPanel(panel) {
        const panelElement = this.container.querySelector(`.situation-panel-${panel}`);
        if (panelElement) {
            this.container.scrollLeft = panelElement.offsetLeft - this.container.offsetLeft;
        }
    }
    
    /**
     * Переключение видимости левой панели
     * @param {boolean} visible - Флаг видимости
     */
    toggleLeftPanel(visible) {
        this.currentState.leftPanelVisible = visible;
        
        if (window.innerWidth <= 1199) {
            // Для планшетов
            if (visible) {
                this.container.classList.add('show-left');
                this.container.classList.remove('show-right');
            } else {
                this.container.classList.remove('show-left');
            }
        } else {
            // Для десктопов
            this.leftPanel.style.display = visible ? 'flex' : 'none';
            // Если левая панель скрыта, увеличиваем ширину главной панели
            this.mainPanel.style.flex = visible ? '1 1 50%' : '1 1 75%';
        }
        
        // Обновляем видимость кнопок
        this.mainPanel.querySelector('.panel-expand-left').style.display = visible ? 'none' : 'flex';
    }
    
    /**
     * Переключение видимости правой панели
     * @param {boolean} visible - Флаг видимости
     */
    toggleRightPanel(visible) {
        this.currentState.rightPanelVisible = visible;
        
        if (window.innerWidth <= 1199) {
            // Для планшетов
            if (visible) {
                this.container.classList.add('show-right');
                this.container.classList.remove('show-left');
            } else {
                this.container.classList.remove('show-right');
            }
        } else {
            // Для десктопов
            this.rightPanel.style.display = visible ? 'flex' : 'none';
            // Если правая панель скрыта, увеличиваем ширину главной панели
            this.mainPanel.style.flex = visible ? '1 1 50%' : '1 1 75%';
        }
        
        // Обновляем видимость кнопок
        this.mainPanel.querySelector('.panel-expand-right').style.display = visible ? 'none' : 'flex';
    }
    
    /**
     * Загрузка элементов
     */
    loadItems() {
        if (!this.options.loadItemsCallback) return;
        
        const itemList = this.leftPanel.querySelector('.situation-item-list');
        const loader = this.leftPanel.querySelector('.situation-loader');
        const emptyState = this.leftPanel.querySelector('.situation-empty-state');
        
        // Показываем загрузчик
        itemList.style.display = 'none';
        loader.style.display = 'flex';
        emptyState.style.display = 'none';
        
        this.options.loadItemsCallback()
            .then(items => {
                itemList.innerHTML = '';
                
                if (items && items.length > 0) {
                    items.forEach(item => {
                        const itemElement = document.createElement('li');
                        itemElement.className = 'situation-item';
                        itemElement.dataset.id = item.id;
                        
                        itemElement.innerHTML = `
                            ${item.icon ? `<span class="situation-item-icon"><i class="bi bi-${item.icon}"></i></span>` : ''}
                            <span class="situation-item-title">${item.title}</span>
                            ${item.status ? `<span class="status-indicator status-${item.status.type} ms-auto">${item.status.text}</span>` : ''}
                        `;
                        
                        itemList.appendChild(itemElement);
                    });
                    
                    itemList.style.display = 'block';
                    emptyState.style.display = 'none';
                    
                    // Если есть начальный активный элемент, выбираем его
                    if (this.options.initialActiveItem) {
                        this.selectItem(this.options.initialActiveItem);
                    } else if (items.length > 0) {
                        this.selectItem(items[0].id);
                    }
                } else {
                    itemList.style.display = 'none';
                    emptyState.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки элементов:', error);
                itemList.style.display = 'none';
                emptyState.style.display = 'block';
                const errorText = emptyState.querySelector('.situation-empty-state-text');
                errorText.textContent = 'Ошибка загрузки данных. Попробуйте обновить страницу.';
                emptyState.querySelector('.btn').textContent = 'Обновить';
            })
            .finally(() => {
                loader.style.display = 'none';
            });
    }
    
    /**
     * Выбор элемента
     * @param {string} itemId - Идентификатор элемента
     */
    selectItem(itemId) {
        if (this.currentState.activeItem === itemId) return;
        
        this.currentState.activeItem = itemId;
        
        // Обновляем активный элемент в списке
        const items = this.leftPanel.querySelectorAll('.situation-item');
        items.forEach(item => {
            item.classList.toggle('active', item.dataset.id === itemId);
        });
        
        // Показываем загрузчик в основной панели
        const mainLoader = this.mainPanel.querySelector('.situation-loader');
        const mainContent = this.options.enableTabs 
            ? this.mainPanel.querySelector(`.situation-tab-content[data-tab-content="${this.currentState.activeTab}"] .situation-tab-inner-content`)
            : this.mainPanel.querySelector('.situation-content-main');
        
        if (mainContent) {
            mainContent.style.opacity = '0.5';
        }
        mainLoader.style.display = 'flex';
        
        // Показываем загрузчик в панели деталей
        const detailContent = this.rightPanel.querySelector('.situation-detail-content');
        const emptyDetail = this.rightPanel.querySelector('.situation-empty-state');
        detailContent.style.opacity = '0.5';
        emptyDetail.style.display = 'none';
        
        // Вызываем callback для получения данных
        if (typeof this.options.onItemSelect === 'function') {
            this.options.onItemSelect(itemId)
                .then(data => {
                    // Обновляем содержимое основной панели
                    if (mainContent) {
                        if (data.mainContent) {
                            mainContent.innerHTML = data.mainContent;
                            mainContent.style.opacity = '1';
                        }
                    }
                    
                    // Обновляем содержимое панели деталей
                    if (data.detailContent) {
                        detailContent.innerHTML = data.detailContent;
                        detailContent.style.opacity = '1';
                        emptyDetail.style.display = 'none';
                    } else {
                        detailContent.innerHTML = '';
                        emptyDetail.style.display = 'block';
                    }
                    
                    // На мобильных устройствах прокручиваем к основной панели
                    if (window.innerWidth <= 767) {
                        this.scrollToPanel('main');
                        if (this.mobileNav) {
                            const buttons = this.mobileNav.querySelectorAll('.mobile-nav-btn');
                            buttons.forEach(btn => {
                                btn.classList.toggle('active', btn.dataset.panel === 'main');
                            });
                        }
                    }
                })
                .catch(error => {
                    console.error('Ошибка загрузки данных элемента:', error);
                    // Обработка ошибки
                    if (mainContent) {
                        mainContent.innerHTML = `<div class="alert alert-danger">Ошибка загрузки данных. Попробуйте выбрать элемент снова.</div>`;
                        mainContent.style.opacity = '1';
                    }
                    
                    detailContent.innerHTML = '';
                    emptyDetail.style.display = 'block';
                    const errorText = emptyDetail.querySelector('.situation-empty-state-text');
                    errorText.textContent = 'Ошибка загрузки деталей. Попробуйте выбрать элемент снова.';
                })
                .finally(() => {
                    mainLoader.style.display = 'none';
                });
        }
    }
    
    /**
     * Выбор вкладки
     * @param {string} tabId - Идентификатор вкладки
     */
    selectTab(tabId) {
        if (this.currentState.activeTab === tabId) return;
        
        this.currentState.activeTab = tabId;
        
        // Обновляем активную вкладку
        const tabs = this.mainPanel.querySelectorAll('.situation-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Обновляем активный контент
        const tabContents = this.mainPanel.querySelectorAll('.situation-tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent === tabId);
        });
        
        // Если есть активный элемент и callback для смены вкладки
        if (this.currentState.activeItem && typeof this.options.onTabChange === 'function') {
            const tabContent = this.mainPanel.querySelector(`.situation-tab-content[data-tab-content="${tabId}"] .situation-tab-inner-content`);
            const mainLoader = this.mainPanel.querySelector('.situation-loader');
            
            if (tabContent) {
                tabContent.style.opacity = '0.5';
            }
            mainLoader.style.display = 'flex';
            
            this.options.onTabChange(this.currentState.activeItem, tabId)
                .then(content => {
                    if (tabContent && content) {
                        tabContent.innerHTML = content;
                    }
                })
                .catch(error => {
                    console.error('Ошибка загрузки данных вкладки:', error);
                    if (tabContent) {
                        tabContent.innerHTML = `<div class="alert alert-danger">Ошибка загрузки данных вкладки.</div>`;
                    }
                })
                .finally(() => {
                    if (tabContent) {
                        tabContent.style.opacity = '1';
                    }
                    mainLoader.style.display = 'none';
                });
        }
    }
    
    /**
     * Создание нового элемента
     */
    createNewItem() {
        console.log('Создание нового элемента');
        // Здесь должна быть логика создания нового элемента
        // Например, открытие модального окна с формой
    }
    
    /**
     * Обновление содержимого основной панели
     * @param {string} html - HTML-содержимое
     */
    updateMainContent(html) {
        const mainContent = this.options.enableTabs 
            ? this.mainPanel.querySelector(`.situation-tab-content[data-tab-content="${this.currentState.activeTab}"] .situation-tab-inner-content`)
            : this.mainPanel.querySelector('.situation-content-main');
            
        if (mainContent) {
            mainContent.innerHTML = html;
        }
    }
    
    /**
     * Обновление содержимого панели деталей
     * @param {string} html - HTML-содержимое
     */
    updateDetailContent(html) {
        const detailContent = this.rightPanel.querySelector('.situation-detail-content');
        const emptyDetail = this.rightPanel.querySelector('.situation-empty-state');
        
        if (html) {
            detailContent.innerHTML = html;
            detailContent.style.display = 'block';
            emptyDetail.style.display = 'none';
        } else {
            detailContent.innerHTML = '';
            detailContent.style.display = 'none';
            emptyDetail.style.display = 'block';
        }
    }
    
    /**
     * Показать сообщение о загрузке
     * @param {string} panel - Идентификатор панели (main, detail)
     * @param {boolean} show - Показать/скрыть загрузчик
     */
    showLoader(panel, show) {
        if (panel === 'main') {
            this.mainPanel.querySelector('.situation-loader').style.display = show ? 'flex' : 'none';
        } else if (panel === 'left') {
            this.leftPanel.querySelector('.situation-loader').style.display = show ? 'flex' : 'none';
        } else if (panel === 'detail' || panel === 'right') {
            // Для правой панели нет отдельного загрузчика, можно реализовать при необходимости
        }
    }
}

/**
 * Инициализация ситуационного центра с базовыми настройками
 * @param {string} containerId - ID контейнера
 * @param {Object} options - Дополнительные параметры
 * @returns {SituationCenter} - Экземпляр ситуационного центра
 */
function initSituationCenter(containerId, options = {}) {
    // Добавляем примерные данные для демонстрации, если не указаны настройки загрузки
    if (!options.loadItemsCallback) {
        options.loadItemsCallback = () => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve([
                        { 
                            id: '1', 
                            title: 'Элемент 1', 
                            icon: 'building', 
                            status: { type: 'success', text: 'Активен' } 
                        },
                        { 
                            id: '2', 
                            title: 'Элемент 2', 
                            icon: 'geo-alt', 
                            status: { type: 'warning', text: 'В обработке' } 
                        },
                        { 
                            id: '3', 
                            title: 'Элемент 3', 
                            icon: 'person', 
                            status: { type: 'danger', text: 'Ошибка' } 
                        },
                        { 
                            id: '4', 
                            title: 'Элемент 4', 
                            icon: 'calendar', 
                            status: { type: 'info', text: 'Информация' } 
                        }
                    ]);
                }, 1000);
            });
        };
    }
    
    // Добавляем примерную обработку выбора элемента, если не указана
    if (!options.onItemSelect) {
        options.onItemSelect = (itemId) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        mainContent: `
                            <div class="situation-card">
                                <div class="situation-card-header">
                                    <h4>Детальная информация об элементе ${itemId}</h4>
                                </div>
                                <div class="situation-card-body">
                                    <p>Здесь будет размещена основная информация о выбранном элементе.</p>
                                    <p>Вы можете заполнить эту область любым содержимым, включая формы, таблицы, диаграммы и т.д.</p>
                                </div>
                                <div class="situation-card-footer">
                                    <div>Последнее обновление: ${new Date().toLocaleString()}</div>
                                    <div>
                                        <button class="btn btn-sm btn-outline-primary me-2">Редактировать</button>
                                        <button class="btn btn-sm btn-outline-danger">Удалить</button>
                                    </div>
                                </div>
                            </div>
                        `,
                        detailContent: `
                            <div class="situation-card">
                                <div class="situation-card-header">
                                    <h4>Параметры элемента</h4>
                                </div>
                                <div class="situation-card-body">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Идентификатор:</label>
                                        <div>${itemId}</div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Название:</label>
                                        <div>Элемент ${itemId}</div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Описание:</label>
                                        <div>Детальное описание элемента ${itemId}.</div>
                                    </div>
                                    <div>
                                        <label class="form-label fw-bold">Статус:</label>
                                        <div>
                                            <span class="status-indicator ${
                                                itemId === '1' ? 'status-success' :
                                                itemId === '2' ? 'status-warning' :
                                                itemId === '3' ? 'status-danger' : 'status-info'
                                            }">
                                                ${
                                                    itemId === '1' ? 'Активен' :
                                                    itemId === '2' ? 'В обработке' :
                                                    itemId === '3' ? 'Ошибка' : 'Информация'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="situation-card">
                                <div class="situation-card-header">
                                    <h4>Дополнительная информация</h4>
                                </div>
                                <div class="situation-card-body">
                                    <p>Здесь можно разместить дополнительные сведения, относящиеся к этому элементу.</p>
                                </div>
                            </div>
                        `
                    });
                }, 1000);
            });
        };
    }
    
    // Создаем экземпляр ситуационного центра
    const situationCenter = new SituationCenter(containerId, options);
    
    // Сохраняем ссылку на экземпляр для доступа из других скриптов
    window.situationCenter = situationCenter;
    
    return situationCenter;
} 