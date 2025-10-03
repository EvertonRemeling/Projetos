document.addEventListener('DOMContentLoaded', () => {
    console.log("script_Cronograma.js started.");

    // Elementos do DOM
    const boardsContainer = document.getElementById('boardsContainer'); // Contêiner do acordeão
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const printScheduleBtn = document.getElementById('printScheduleBtn');
    const integrateSiclaBtn = document.getElementById('integrateSiclaBtn');
    const boardDragGhost = document.getElementById('boardDragGhost');
    const moduleFilter = document.getElementById('moduleFilter');
    const technicianSelector = document.getElementById('technicianSelector');
    const spreadsheetFileInput = document.getElementById('spreadsheetFileInput');
    const importSpreadsheetBtn = document.getElementById('importSpreadsheetBtn');

    // Variáveis de Estado
    let allAvailableBoards = [];
    let currentBoardsToDisplay = []; // Usado para filtrar e renderizar as boards no acordeão
    let displayDate = new Date();
    let displayMonth = displayDate.getMonth();
    let displayYear = displayDate.getFullYear();
    let calendarAllocations = {}; // Armazena atividades alocadas no calendário
    const availableTechnicians = ['João Silva', 'Maria Souza', 'Carlos Oliveira', 'Ana Costa', 'Pedro Almeida'];
    const shifts = ['Manhã (08h-12h)', 'Tarde (13h-17h)'];

    // --- Funções de Processamento de Dados ---
    function processDataToBoards(headers, records) {
        console.log("processDataToBoards: Iniciando processamento de dados para boards.");
        const headerMap = {
            'Modulo': headers.indexOf('Modulo'),
            'Menu': headers.indexOf('Menu'),
            'Item': headers.indexOf('Item'),
            'Sequencia': headers.indexOf('Sequencia')
        };
        const essentialColumns = ['Modulo', 'Menu', 'Item', 'Sequencia'];
        const missingColumns = essentialColumns.filter(col => headerMap[col] === -1 || headerMap[col] === undefined);
        if (missingColumns.length > 0) {
            const errorMessage = `O arquivo não contém as colunas essenciais: ${missingColumns.join(', ')}.`;
            console.error("processDataToBoards: ERRO de validação de cabeçalho:", errorMessage);
            throw new Error(errorMessage);
        }
        let groupedByModuleAndSequence = {};
        let uniqueModules = new Set();
        let initialBoards = [];
        records.forEach((values, index) => {
            if (values.every(val => val === '')) { // Ignorar linhas completamente vazias
                return;
            }
            // Verifica se a linha tem colunas suficientes para os cabeçalhos mapeados
            if (values.length <= Math.max(headerMap.Modulo, headerMap.Menu, headerMap.Item, headerMap.Sequencia)) {
                console.warn(`processDataToBoards: Linha ${index + 2} ignorada: número insuficiente de colunas. Valores: [${values.join(', ')}]`);
                return;
            }
            const modulo = values[headerMap.Modulo];
            const menu = values[headerMap.Menu];
            const item = values[headerMap.Item];
            const sequencia = values[headerMap.Sequencia];
            if (!modulo || !sequencia) {
                console.warn(`processDataToBoards: Linha ${index + 2} ignorada: Módulo ou Sequência ausente. Valores: [${values.join(', ')}]`);
                return;
            }
            uniqueModules.add(modulo);
            if (!groupedByModuleAndSequence[modulo]) {
                groupedByModuleAndSequence[modulo] = {};
            }
            if (!groupedByModuleAndSequence[modulo][sequencia]) {
                const boardId = `${modulo}-seq${sequencia}`;
                groupedByModuleAndSequence[modulo][sequencia] = {
                    id: boardId,
                    title: `Visita ${sequencia} (${modulo})`,
                    activities: []
                };
            }
            groupedByModuleAndSequence[modulo][sequencia].activities.push({
                id: `card-${modulo}-${sequencia}-${groupedByModuleAndSequence[modulo][sequencia].activities.length + 1}`,
                description: `${menu} - ${item}`,
                module: modulo,
                isChecked: false,
                isCopied: false // Default para cards originais
            });
        });
        initialBoards = Object.values(groupedByModuleAndSequence)
                              .flatMap(moduleBoards => Object.values(moduleBoards));
        initialBoards.sort((a, b) => {
            const moduloA = a.id.split('-')[0];
            const moduloB = b.id.split('-')[0];
            if (moduloA !== moduloB) {
                return moduloA.localeCompare(moduloB);
            }
            const seqA = parseInt(a.id.split('-')[1].replace('seq', ''));
            const seqB = parseInt(b.id.split('-')[1].replace('seq', ''));
            return seqA - seqB;
        });
        console.log("processDataToBoards: Boards iniciais geradas e ordenadas:", initialBoards);
        return { initialBoards, uniqueModules: Array.from(uniqueModules).sort() };
    }

    function parseCSVData(csvString) {
        console.log("parseCSVData: Iniciando parsing dos dados CSV.");
        const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
            console.warn("parseCSVData: CSV vazio ou sem linhas de dados válidas.");
            return { initialBoards: [], uniqueModules: [] };
        }
        const headers = lines[0].split('|').map(h => h.trim());
        const records = lines.slice(1).map(line => line.split('|').map(v => v.trim()));
        return processDataToBoards(headers, records);
    }

    function parseXLSXData(arrayBuffer) {
        console.log("parseXLSXData: Iniciando parsing dos dados XLSX.");
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
        if (jsonRows.length <= 1) {
            console.warn("parseXLSXData: XLSX vazio ou sem linhas de dados válidas.");
            return { initialBoards: [], uniqueModules: [] };
        }
        const headers = jsonRows[0].map(h => String(h).trim());
        const records = jsonRows.slice(1).map(row => row.map(v => String(v || '').trim()));
        return processDataToBoards(headers, records);
    }

    // --- Funções de Renderização e Criação de Elementos ---

    function createBaseCardElement(activity) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-id', activity.id);
        card.setAttribute('data-description', activity.description);
        if (activity.module) card.setAttribute('data-module', activity.module);
        if (activity.technicians) card.setAttribute('data-technicians', activity.technicians.join(','));
        if (activity.shift) card.setAttribute('data-shift', activity.shift);
        card.setAttribute('data-is-copied', activity.isCopied ? 'true' : 'false'); // Adiciona o atributo isCopied

        const moduleTag = document.createElement('span');
        moduleTag.classList.add('card-module-tag');
        moduleTag.textContent = `[${activity.module || 'N/A'}]`;
        card.appendChild(moduleTag);

        const textContentContainer = document.createElement('div'); // Container for description + small
        textContentContainer.classList.add('card-text-content'); // New class for this container
        
        textContentContainer.innerHTML = activity.description;
        if (activity.technicians && activity.technicians.length > 0) {
            textContentContainer.innerHTML += ` <br><small>${activity.technicians.join(', ')}</small>`;
        }
        card.appendChild(textContentContainer);
        
        return card;
    }

    function decorateCalendarCard(cardElement, activity) {
        cardElement.innerHTML = '';
        cardElement.setAttribute('data-is-checked', activity.isChecked ? 'true' : 'false');
        cardElement.setAttribute('data-is-copied', activity.isCopied ? 'true' : 'false'); // Garante que o atributo isCopied esteja no DOM
        
        if (activity.isCopied) {
            cardElement.classList.add('card-copied'); // Adiciona classe para estilização
            const copyIcon = document.createElement('i');
            copyIcon.classList.add('fas', 'fa-copy', 'copy-indicator-icon'); // Ícone de cópia
            cardElement.appendChild(copyIcon);
        }

        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.classList.add('card-checkbox-wrapper');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('card-checkbox');
        checkbox.checked = activity.isChecked || false;
        checkboxWrapper.appendChild(checkbox);
        
        const contentContainer = document.createElement('div'); 
        contentContainer.classList.add('card-content-container');

        const moduleTag = document.createElement('span');
        moduleTag.classList.add('card-module-tag');
        moduleTag.textContent = `[${activity.module || 'N/A'}]`;
        contentContainer.appendChild(moduleTag);

        const descriptionTextContainer = document.createElement('div'); // Container for description + small
        descriptionTextContainer.classList.add('card-text-content');
        let cardContent = activity.description;
        if (activity.technicians && activity.technicians.length > 0) {
            cardContent += ` <br><small>${activity.technicians.join(', ')}</small>`;
        }
        descriptionTextContainer.innerHTML = cardContent;
        contentContainer.appendChild(descriptionTextContainer);

        checkboxWrapper.appendChild(contentContainer);
        cardElement.appendChild(checkboxWrapper);

        checkbox.removeEventListener('change', handleCardCheckboxChange);
        checkbox.addEventListener('change', handleCardCheckboxChange);
        
        cardElement.setAttribute('data-technicians', activity.technicians ? activity.technicians.join(',') : '');
        cardElement.setAttribute('data-shift', activity.shift || '');
        cardElement.setAttribute('data-original-id', activity.originalId || activity.id); 
    }

    function handleCardCheckboxChange(e) {
        const checkbox = e.target;
        const cardElement = checkbox.closest('.card');
        if (!cardElement) {
            console.error("handleCardCheckboxChange: Card element not found for checkbox:", checkbox);
            return;
        }
        const currentActivityId = cardElement.getAttribute('data-id');
        const calendarDayElement = cardElement.closest('.calendar-day');
        if (!calendarDayElement) {
            console.error("handleCardCheckboxChange: Calendar day element not found for card:", cardElement);
            return;
        }
        const currentActivityDate = calendarDayElement.getAttribute('data-date');
        if (calendarAllocations[currentActivityDate]) {
            const actIndex = calendarAllocations[currentActivityDate].findIndex(a => a.id === currentActivityId);
            if (actIndex > -1) {
                calendarAllocations[currentActivityDate][actIndex].isChecked = checkbox.checked;
                cardElement.setAttribute('data-is-checked', checkbox.checked ? 'true' : 'false');
                saveScheduleToLocalStorage();
            }
        }
    }

    function renderBoards() {
        console.log("renderBoards: Iniciando renderização das boards no acordeão. currentBoardsToDisplay:", currentBoardsToDisplay);
        if (!boardsContainer) {
            console.error("renderBoards: Elemento #boardsContainer não encontrado no DOM.");
            return;
        }
        boardsContainer.innerHTML = '';
        if (currentBoardsToDisplay.length === 0) {
            boardsContainer.innerHTML = '<p class="no-boards-message">Nenhuma visita disponível para o filtro selecionado ou não importada.</p>';
            console.log("renderBoards: Nenhuma board para exibir.");
            return;
        }
        currentBoardsToDisplay.forEach(board => {
            console.log("renderBoards: Renderizando board:", board.id);
            const boardAccordionItem = document.createElement('div');
            boardAccordionItem.classList.add('board-accordion-item');

            const boardTitle = document.createElement('h3');
            boardTitle.classList.add('accordion-title');
            boardTitle.textContent = board.title;
            boardTitle.draggable = true; // Permite arrastar o título inteiro do board
            boardTitle.setAttribute('data-board-id', board.id);
            boardTitle.innerHTML += ' <i class="fas fa-chevron-right accordion-icon"></i>'; // Ícone de seta
            boardTitle.addEventListener('click', () => toggleAccordionItem(boardAccordionItem)); // Adiciona evento de clique
            boardAccordionItem.appendChild(boardTitle);

            const boardItems = document.createElement('div');
            boardItems.classList.add('board-items');
            boardAccordionItem.appendChild(boardItems);

            if (board.activities && board.activities.length > 0) {
                board.activities.forEach(activity => {
                    const card = createBaseCardElement(activity);
                    boardItems.appendChild(card);
                });
            } else {
                // Se a board estiver vazia, ainda assim cria o item, mas sem atividades
                const emptyMessage = document.createElement('p');
                emptyMessage.classList.add('no-boards-message');
                emptyMessage.textContent = 'Nenhuma atividade restante nesta visita.';
                boardItems.appendChild(emptyMessage);
            }
            boardsContainer.appendChild(boardAccordionItem);
        });
        initSortableForBoards();
        addBoardDragListeners(); // Garante que listeners para drag de boards sejam adicionados/atualizados
        console.log("renderBoards: Renderização das boards concluída.");
    }

    function toggleAccordionItem(accordionItem) {
        const accordionContent = accordionItem.querySelector('.board-items');
        const accordionTitle = accordionItem.querySelector('.accordion-title');
        
        if (accordionContent.classList.contains('expanded')) {
            accordionContent.classList.remove('expanded');
            accordionTitle.classList.remove('active');
            accordionContent.style.maxHeight = '0'; // Fecha
        } else {
            accordionContent.classList.remove('expanded'); // Remove para recalcular scrollHeight
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px'; 
            // Adiciona a classe expanded após o maxHeight ser definido para a transição
            accordionContent.classList.add('expanded');
            accordionTitle.classList.add('active');
        }
    }


    function renderCalendar() {
        console.log("renderCalendar: Iniciando renderização do calendário.");
        if (!calendarMonthYear) {
            console.error("renderCalendar: Elemento #calendarMonthYear não encontrado no DOM.");
            return;
        }
        calendarMonthYear.textContent = new Date(displayYear, displayMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        if (!calendarGrid) {
            console.error("renderCalendar: Elemento #calendarGrid não encontrado no DOM.");
            return;
        }
        calendarGrid.innerHTML = ''; // Limpa o grid antes de renderizar novamente

        const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay(); // 0 = Domingo, 1 = Segunda
        const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

        // Adiciona células vazias para o preenchimento inicial do grid (dias do mês anterior)
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyDay);
        }

        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const date = new Date(displayYear, displayMonth, dayNum);
            const dateString = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            const calendarDay = document.createElement('div');
            calendarDay.classList.add('calendar-day');
            calendarDay.setAttribute('data-date', dateString);
            calendarDay.id = `day-${dateString}`;

            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = dayNum;
            calendarDay.appendChild(dayNumberSpan);

            shifts.forEach(shiftName => {
                const shiftSlot = document.createElement('div');
                shiftSlot.classList.add('shift-slot');
                shiftSlot.setAttribute('data-shift', shiftName);

                const shiftHeader = document.createElement('div');
                shiftHeader.classList.add('shift-header');
                const shiftTitle = document.createElement('h4');
                shiftTitle.textContent = shiftName.split(' ')[0]; // Ex: "Manhã"
                shiftHeader.appendChild(shiftTitle);

                const newAttendanceBtn = document.createElement('a');
                newAttendanceBtn.classList.add('new-attendance-btn');
                newAttendanceBtn.textContent = '+ Registro Protocolo';
                const encodedShift = encodeURIComponent(shiftName);
                const encodedDate = encodeURIComponent(dateString);
                newAttendanceBtn.href = `novo_atendimento.html?date=${encodedDate}&shift=${encodedShift}`; // Corrigido para tracking_Cronograma.html
                newAttendanceBtn.target = '_blank';
                shiftHeader.appendChild(newAttendanceBtn);

                shiftSlot.appendChild(shiftHeader);
                calendarDay.appendChild(shiftSlot);
            });

            // Adiciona atividades alocadas a este dia e turno
            if (calendarAllocations[dateString]) {
                // Filtra atividades para o dia atual e as organiza por turno
                const activitiesByShift = {};
                shifts.forEach(shift => activitiesByShift[shift] = []);

                calendarAllocations[dateString].forEach(activity => {
                    if (activity.shift && activitiesByShift[activity.shift]) {
                        activitiesByShift[activity.shift].push(activity);
                    } else {
                        console.warn(`renderCalendar: Atividade sem turno ou turno inválido para o dia ${dateString}:`, activity);
                        // Fallback, adicionar ao primeiro turno se o turno não for válido/existente
                        activitiesByShift[shifts[0]].push(activity); 
                    }
                });

                // Renderiza as atividades em seus respectivos slots de turno
                for (const shiftName of shifts) {
                    const targetShiftSlot = calendarDay.querySelector(`[data-shift="${shiftName}"]`);
                    if (targetShiftSlot) {
                        activitiesByShift[shiftName].forEach(activity => {
                            const card = createBaseCardElement(activity);
                            decorateCalendarCard(card, activity);
                            targetShiftSlot.appendChild(card);
                        });
                    }
                }
            }
            calendarGrid.appendChild(calendarDay);
        }

        // Adiciona células vazias para o preenchimento final do grid (dias do mês seguinte)
        const allDayCells = calendarGrid.querySelectorAll('.calendar-day');
        const numCellsAdded = allDayCells.length;
        // Assume um grid de 6 semanas (6 * 7 = 42 células)
        const totalCells = 42; 
        const remainingEmptyCells = totalCells - numCellsAdded;

        for (let i = 0; i < remainingEmptyCells; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(emptyDay);
        }

        initSortableForCalendarSlots(); // Re-inicializa o Sortable para os novos slots
        console.log("renderCalendar: Renderização do calendário concluída.");
    }

    function navigateMonth(direction) {
        displayDate.setMonth(displayDate.getMonth() + direction);
        displayMonth = displayDate.getMonth();
        displayYear = displayDate.getFullYear();
        renderCalendar();
    }

    // --- Drag and Drop com Sortable.js e Custom Logic ---

    function initSortableForBoards() {
        // Inicializa Sortable para cada container de atividades dentro dos acordeões
        document.querySelectorAll('.accordion-boards .board-items').forEach(boardItems => {
            if (Sortable.get(boardItems)) {
                Sortable.get(boardItems).destroy();
            }
            new Sortable(boardItems, {
                group: {
                    name: 'activities-group',
                    pull: function (to, from, item, dragEvent) {
                        // Se estiver arrastando um cartão individual para o calendário
                        if (to && to.el && to.el.classList.contains('shift-slot')) {
                            const selectedTechs = getSelectedTechnicians();
                            if (selectedTechs.length === 0) {
                                alert('Por favor, selecione um ou mais técnicos antes de alocar uma visita ao calendário.');
                                return false; // Impede o arrasto
                            }
                            return 'clone'; // Copia o cartão para o calendário
                        }
                        return true; // Permite mover dentro da lista ou para outras listas de board
                    },
                    put: true
                },
                animation: 150,
                filter: '.card-checkbox', // Impede que o checkbox seja o alvo do drag
                preventOnFilter: false,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                onEnd: function (evt) {
                    // Atualiza os dados após um arrasto de cartão individual dentro ou para fora do board
                    updateBoardDataFromDOM();
                    updateCalendarDataFromDOM();
                    saveScheduleToLocalStorage();
                    filterAndRenderBoards(moduleFilter.value);
                    renderCalendar();
                },
                onAdd: function (evt) {
                    // Quando um cartão é adicionado de volta a um board (vindo do calendário, por exemplo)
                    const addedCard = evt.item;
                    const activity = {
                        id: addedCard.getAttribute('data-original-id') || addedCard.getAttribute('data-id'),
                        description: addedCard.getAttribute('data-description'),
                        module: addedCard.getAttribute('data-module'),
                        // Revertemos para um array vazio para técnicos, pois no board eles não são 'alocados' ainda
                        technicians: [], 
                        shift: '',
                        isChecked: false,
                        isCopied: false // Cards voltam ao estado original (não copiados)
                    };
                    // Ensure the card ID is set back to its original if it was a scheduled one
                    addedCard.setAttribute('data-id', activity.id); 
                    // Remova as decorações específicas do calendário e os listeners do checkbox
                    undecorateCalendarCard(addedCard, activity); 
                }
            });
        });
    }

    // Função auxiliar para remover decorações de calendário
    function undecorateCalendarCard(cardElement, activity) {
        cardElement.removeAttribute('data-is-checked');
        cardElement.removeAttribute('data-is-copied'); // Remove o atributo de cópia
        cardElement.classList.remove('card-copied'); // Remove a classe de cópia
        cardElement.removeAttribute('data-technicians'); 
        cardElement.removeAttribute('data-shift'); 
        
        cardElement.innerHTML = ''; 
        
        const moduleTag = document.createElement('span');
        moduleTag.classList.add('card-module-tag');
        moduleTag.textContent = `[${activity.module || 'N/A'}]`;
        cardElement.appendChild(moduleTag);

        const textContentContainer = document.createElement('div');
        textContentContainer.classList.add('card-text-content');
        textContentContainer.innerHTML = activity.description;
        // No technicians here for unallocated board cards
        
        cardElement.appendChild(textContentContainer);

        const checkbox = cardElement.querySelector('.card-checkbox');
        if (checkbox) {
            checkbox.removeEventListener('change', handleCardCheckboxChange);
        }
        // Remove o ícone de cópia se existir
        const copyIcon = cardElement.querySelector('.copy-indicator-icon');
        if (copyIcon) {
            copyIcon.remove();
        }
    }


    function initSortableForCalendarSlots() {
        document.querySelectorAll('.shift-slot').forEach(shiftSlot => {
            if (Sortable.get(shiftSlot)) {
                Sortable.get(shiftSlot).destroy();
            }
            new Sortable(shiftSlot, {
                group: {
                    name: 'activities-group',
                    pull: function (to, from, item, dragEvent) {
                        // --- INÍCIO: NOVAS MENSAGENS DE DEBUG ---
                        console.log("DEBUG: Sortable pull function called.");
                        console.log("DEBUG: Item sendo arrastado:", item);
                        console.log("DEBUG: dragEvent.altKey (ALT pressionado?):", dragEvent.altKey);
                        console.log("DEBUG: item.getAttribute('data-is-checked') (Cartão concluído?):", item.getAttribute('data-is-checked'));
                        // --- FIM: NOVAS MENSAGENS DE DEBUG ---

                        // Impede arrasto se o cartão estiver marcado como concluído no calendário
                        if (item.getAttribute('data-is-checked') === 'true') {
                            alert('Este cartão está marcado como concluído e não pode ser movido ou copiado.');
                            console.log("DEBUG: Cartão marcado como concluído. Bloqueando arrasto.");
                            return false;
                        }
                        // Se ALT for pressionado, copia o cartão
                        if (dragEvent.altKey) {
                            console.log("DEBUG: ALT key detectado. Retornando 'clone'.");
                            return 'clone';
                        }
                        console.log("DEBUG: ALT key NÃO detectado. Retornando true (mover).");
                        return true; // Move o cartão
                    },
                    put: function (to, from, item) {
                        // Ao soltar um cartão (individual) no calendário
                        // Se vem de outro slot do calendário, ele já possui técnicos
                        if (from && from.el && from.el.classList.contains('shift-slot')) {
                            return true;
                        }
                        const selectedTechs = getSelectedTechnicians();
                        if (selectedTechs.length === 0) {
                            alert('Por favor, selecione um ou mais técnicos antes de alocar uma visita ao calendário.');
                            return false; // Impede o drop
                        }
                        return true; // Permite o drop
                    }
                },
                animation: 150,
                filter: '.card-checkbox',
                preventOnFilter: false,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                onAdd: function (evt) {
                    // Quando um cartão individual é adicionado a um slot do calendário (vindo de um board ou outro slot)
                    const addedCard = evt.item;
                    
                    // Se o card vem de outro slot do calendário, ele já está decorado e tem ID agendado
                    const isFromCalendar = evt.from && evt.from.classList.contains('shift-slot');

                    let activityData = {
                        originalId: addedCard.getAttribute('data-original-id') || addedCard.getAttribute('data-id'), 
                        description: addedCard.getAttribute('data-description'),
                        module: addedCard.getAttribute('data-module'),
                        technicians: isFromCalendar ? (addedCard.getAttribute('data-technicians') ? addedCard.getAttribute('data-technicians').split(',') : []) : getSelectedTechnicians(),
                        shift: evt.to.getAttribute('data-shift'),
                        isChecked: addedCard.getAttribute('data-is-checked') === 'true', // Preserva estado se já agendado
                        isCopied: evt.pullMode === 'clone' || addedCard.getAttribute('data-is-copied') === 'true' // Marca como cópia se foi clonado agora ou já era uma cópia
                    };

                    const newCalendarCard = createBaseCardElement(activityData);
                    decorateCalendarCard(newCalendarCard, activityData);
                    
                    if (!isFromCalendar || evt.pullMode === 'clone') { // Se é novo no calendário ou uma cópia
                        // Gera um novo ID único para a instância no calendário
                        newCalendarCard.setAttribute('data-id', `scheduled-${activityData.originalId}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`);
                    } else { // Se está sendo movido dentro do calendário, mantém o ID original de agendamento
                        newCalendarCard.setAttribute('data-id', addedCard.getAttribute('data-id'));
                    }
                    
                    // Substitui o ghost/clone pelo cartão decorado
                    evt.to.replaceChild(newCalendarCard, addedCard);
                    evt.item = newCalendarCard; // Atualiza evt.item para o Sortable.js
                },
                onEnd: function (evt) {
                    // Atualiza dados e UI após qualquer operação de arrastar/soltar no calendário
                    updateCalendarDataFromDOM();
                    updateBoardDataFromDOM(); // Garante que as boards também sejam atualizadas se um card foi movido para/de lá
                    saveScheduleToLocalStorage();
                    filterAndRenderBoards(moduleFilter.value); // Re-renderiza boards para refletir cards movidos
                    renderCalendar(); // Re-renderiza o calendário
                }
            });
        });
    }

    function handleBoardDragStart(event) {
        const boardId = event.target.getAttribute('data-board-id');
        if (!boardId) {
            event.preventDefault();
            console.error("DRAGSTART: boardId não encontrado no elemento arrastado.");
            return;
        }

        const sourceBoard = allAvailableBoards.find(b => b.id === boardId);
        if (!sourceBoard || !sourceBoard.activities || sourceBoard.activities.length === 0) {
            event.preventDefault();
            alert('Não é possível arrastar uma lista vazia ou inexistente.');
            return;
        }

        // Verifica se alguma atividade na lista já está "concluída"
        const hasCheckedActivities = sourceBoard.activities.some(activity => activity.isChecked);
        if (hasCheckedActivities) {
            event.preventDefault();
            alert('Não é possível arrastar uma lista que contenha atividades marcadas como "concluídas".');
            return;
        }

        // Verifica se há técnicos selecionados para alocação
        const selectedTechs = getSelectedTechnicians();
        if (selectedTechs.length === 0) {
            event.preventDefault();
            alert('Por favor, selecione um ou mais técnicos antes de alocar uma lista de visitas.');
            return;
        }

        // Prepara os dados para o drop
        const dataToTransfer = {
            type: 'board-drag',
            boardId: boardId,
            activities: sourceBoard.activities.map(activity => ({
                id: activity.id,
                description: activity.description,
                module: activity.module,
                isCopied: activity.isCopied // Inclui o status de cópia para o drag da board
            }))
        };
        event.dataTransfer.setData('application/json', JSON.stringify(dataToTransfer));
        event.dataTransfer.setData('text/plain', JSON.stringify(dataToTransfer)); // Fallback

        // Cria o "ghost" visual para o drag
        const numActivities = sourceBoard.activities.length;
        event.dataTransfer.setDragImage(createBoardDragImage(numActivities), 10, 10);
        console.log("DRAGSTART: Board-drag iniciado com sucesso.", dataToTransfer);
    }

    function updateBoardDataFromDOM() {
        // Itera sobre todos os boards disponíveis para atualizar suas atividades
        allAvailableBoards.forEach(board => {
            // No novo layout, o container de atividades é dentro de .board-accordion-item
            const boardItemsElement = document.querySelector(`.board-accordion-item:has(h3[data-board-id="${board.id}"]) .board-items`);
            if (boardItemsElement) {
                const activitiesInDOM = [];
                Array.from(boardItemsElement.children).forEach(cardElement => {
                    if (cardElement.classList.contains('card')) {
                        activitiesInDOM.push({
                            id: cardElement.getAttribute('data-id'),
                            description: cardElement.getAttribute('data-description'),
                            module: cardElement.getAttribute('data-module'),
                            // Certifica-se de que o estado checked e copied é preservado se for um card vindo do calendário
                            isChecked: cardElement.getAttribute('data-is-checked') === 'true',
                            isCopied: cardElement.getAttribute('data-is-copied') === 'true'
                        });
                    }
                });
                board.activities = activitiesInDOM;
            }
        });
        console.log("updateBoardDataFromDOM: allAvailableBoards atualizadas a partir do DOM.");
    }

    function updateCalendarDataFromDOM() {
        calendarAllocations = {}; // Limpa as alocações existentes para reconstruir
        document.querySelectorAll('.calendar-day:not(.empty)').forEach(calendarDayElement => {
            const dateString = calendarDayElement.getAttribute('data-date');
            if (dateString) {
                calendarDayElement.querySelectorAll('.shift-slot').forEach(shiftSlot => {
                    const shiftName = shiftSlot.getAttribute('data-shift');
                    // Filtra para pegar apenas os cards de atividade, ignorando o cabeçalho do turno
                    Array.from(shiftSlot.children).filter(child => child.classList.contains('card')).forEach(cardElement => {
                        if (!calendarAllocations[dateString]) {
                            calendarAllocations[dateString] = [];
                        }
                        const techs = cardElement.getAttribute('data-technicians');
                        calendarAllocations[dateString].push({
                            id: cardElement.getAttribute('data-id'),
                            originalId: cardElement.getAttribute('data-original-id') || cardElement.getAttribute('data-id'), // Adiciona originalId para rastreamento
                            description: cardElement.getAttribute('data-description'),
                            module: cardElement.getAttribute('data-module'),
                            date: dateString,
                            shift: shiftName,
                            technicians: techs ? techs.split(',') : [],
                            isChecked: cardElement.getAttribute('data-is-checked') === 'true',
                            isCopied: cardElement.getAttribute('data-is-copied') === 'true' // Salva o status de cópia
                        });
                    });
                });
            }
        });
        console.log("updateCalendarDataFromDOM: calendarAllocations atualizadas a partir do DOM.");
    }

    function createBoardDragImage(numActivities) {
        boardDragGhost.textContent = `Arrastando ${numActivities} Visita${numActivities !== 1 ? 's' : ''}`;
        boardDragGhost.style.display = 'block';
        return boardDragGhost;
    }

    function handleCalendarGridDragOver(event) {
        event.preventDefault(); // Permite o drop no elemento
        event.dataTransfer.dropEffect = 'move'; // Define o efeito visual para "mover"
        
        const types = Array.from(event.dataTransfer.types);
        const isBoardDrag = types.includes('application/json') || types.includes('text/plain');
        
        const calendarDayElement = event.target.closest('.calendar-day:not(.empty)');
        const targetShiftSlot = event.target.closest('.shift-slot');
        
        // Limpa highlights anteriores
        calendarGrid.querySelectorAll('.calendar-day.drag-over, .shift-slot.drag-over-slot')
            .forEach(el => el.classList.remove('drag-over', 'drag-over-slot'));
        
        if (isBoardDrag && calendarDayElement) {
            calendarDayElement.classList.add('drag-over');
            if (targetShiftSlot) {
                targetShiftSlot.classList.add('drag-over-slot');
            }
        }
    }

    function handleCalendarGridDragLeave(event) {
        // Só remove highlights se o mouse realmente saiu da área do calendário
        // Isso pode ser complexo com eventos de "dragleave" borbulhantes.
        // Uma abordagem mais robusta é limpar os highlights no "dragend" ou no "drop".
        // Por enquanto, esta lógica simples pode funcionar se os elementos não forem aninhados de forma muito complexa.
        const relatedTarget = event.relatedTarget;
        if (!relatedTarget || (!calendarGrid.contains(relatedTarget) && relatedTarget !== calendarGrid)) {
            calendarGrid.querySelectorAll('.calendar-day.drag-over').forEach(day => day.classList.remove('drag-over'));
            calendarGrid.querySelectorAll('.shift-slot.drag-over-slot').forEach(slot => slot.classList.remove('drag-over-slot'));
        }
    }

    function handleCalendarGridDrop(event) {
        event.preventDefault(); // Impede o comportamento padrão do browser (e.g., abrir arquivo)
        event.stopPropagation(); // Impede que o evento se propague para Sortable.js
        
        // Remove highlights visuais imediatamente
        calendarGrid.querySelectorAll('.calendar-day.drag-over, .shift-slot.drag-over-slot')
            .forEach(el => el.classList.remove('drag-over', 'drag-over-slot'));
        
        let transferData = null;
        try {
            transferData = event.dataTransfer.getData('application/json');
            if (!transferData) { // Fallback para text/plain
                transferData = event.dataTransfer.getData('text/plain');
            }
            
            if (transferData) {
                const data = JSON.parse(transferData);
                
                if (data && data.type === 'board-drag') {
                    console.log("DROP: Board-drag detectado. Chamando processBoardDrop.");
                    processBoardDrop(event, data);
                    return; // Finaliza o manipulador de drop
                }
            }
        } catch (e) {
            console.error("DROP: Erro ao parsear dataTransfer ou dados não são um board-drag:", e);
            // Se houver um erro ou não for um board-drag, o Sortable.js poderá tentar lidar com isso (se não houvesse stopPropagation)
        }
        
        // Se este ponto for atingido, significa que não foi um "board-drag" tratado por aqui.
        // O Sortable.js lida com arrastos de cartões individuais para slots de turno.
    }

    function processBoardDrop(event, data) {
        const calendarDayElement = event.target.closest('.calendar-day:not(.empty)');
        if (!calendarDayElement) {
            alert('Erro: Solte a lista sobre um dia válido do calendário.');
            return;
        }
        
        const selectedTechs = getSelectedTechnicians();
        if (selectedTechs.length === 0) {
            alert('Por favor, selecione um ou mais técnicos antes de alocar a lista de visitas.');
            return;
        }
        
        let targetShiftSlot = event.target.closest('.shift-slot');
        // Se o drop não foi em um shift-slot específico, tenta encontrar o primeiro (Manhã)
        if (!targetShiftSlot) {
            targetShiftSlot = calendarDayElement.querySelector('.shift-slot[data-shift="Manhã (08h-12h)"]') ||
                               calendarDayElement.querySelector('.shift-slot'); // Ou qualquer outro shift-slot
        }
        
        if (!targetShiftSlot) {
            alert('Erro: Nenhum slot de turno disponível neste dia.');
            return;
        }
        
        const sourceBoardId = data.boardId;
        const activitiesToMove = data.activities; // As atividades que foram arrastadas
        const targetDateString = calendarDayElement.getAttribute('data-date');
        const targetShift = targetShiftSlot.getAttribute('data-shift');
        
        // 1. ATUALIZA O MODELO DE DADOS NA MEMÓRIA
        
        // Remove atividades da board de origem (no modelo allAvailableBoards)
        const sourceBoardInAll = allAvailableBoards.find(b => b.id === sourceBoardId);
        if (sourceBoardInAll) {
            sourceBoardInAll.activities = []; // Esvazia o board de origem
            console.log(`processBoardDrop: Board de origem ${sourceBoardId} esvaziada.`);
        }
        
        // Adiciona as atividades ao calendário (no modelo calendarAllocations)
        if (!calendarAllocations[targetDateString]) {
            calendarAllocations[targetDateString] = [];
        }
        
        activitiesToMove.forEach(activity => {
            // Cria um novo ID único para cada atividade agendada no calendário
            calendarAllocations[targetDateString].push({
                id: `scheduled-${activity.id}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
                originalId: activity.id, // Mantém uma referência ao ID original
                description: activity.description,
                module: activity.module,
                date: targetDateString,
                shift: targetShift,
                technicians: selectedTechs,
                isChecked: false, 
                isCopied: false // Atividades arrastadas de um board não são consideradas "copiadas"
            });
        });
        console.log(`processBoardDrop: ${activitiesToMove.length} atividades alocadas para ${targetDateString} - ${targetShift}.`);
        
        // 2. SALVA O ESTADO ATUALIZADO DO MODELO NO LOCALSTORAGE
        saveScheduleToLocalStorage();

        // 3. ATUALIZA A INTERFACE BASEADA NO MODELO DE DADOS ATUALIZADO
        filterAndRenderBoards(moduleFilter.value); 
        renderCalendar();
        
        console.log("DROP: Board-drag processado com sucesso");
    }

    function addBoardDragListeners() {
        // Remove listeners existentes para evitar duplicação em renderizações futuras
        document.querySelectorAll('.accordion-title').forEach(boardTitle => {
            boardTitle.removeEventListener('dragstart', handleBoardDragStart);
            boardTitle.addEventListener('dragstart', handleBoardDragStart);
        });
    }

    function initCalendarDragListeners() {
        // Remove listeners existentes para evitar duplicação em renderizações futuras
        calendarGrid.removeEventListener('dragover', handleCalendarGridDragOver);
        calendarGrid.removeEventListener('dragleave', handleCalendarGridDragLeave);
        calendarGrid.removeEventListener('drop', handleCalendarGridDrop);
        
        // Adiciona novos listeners
        calendarGrid.addEventListener('dragover', handleCalendarGridDragOver);
        calendarGrid.addEventListener('dragleave', handleCalendarGridDragLeave);
        calendarGrid.addEventListener('drop', handleCalendarGridDrop);
    }

    // --- Funções de Utilitário e Estado ---

    function populateModuleFilter(uniqueModules) {
        moduleFilter.innerHTML = '<option value="all">Todos os Módulos</option>';
        uniqueModules.forEach(moduleName => {
            const option = document.createElement('option');
            option.value = moduleName;
            option.textContent = moduleName;
            moduleFilter.appendChild(option);
        });
    }

    function populateTechnicianSelector() {
        technicianSelector.innerHTML = '';
        availableTechnicians.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech;
            option.textContent = tech;
            technicianSelector.appendChild(option);
        });
        // Para selects múltiplos, o valor inicial pode ser vazio ou o primeiro item não selecionado
        // Não é necessário um "Selecione um técnico" desabilitado se múltiplos são permitidos
        // O valor padrão para `select multiple` é uma array vazia se nada for selecionado
    }

    function getSelectedTechnicians() {
        return Array.from(technicianSelector.selectedOptions).map(option => option.value);
    }

    function filterAndRenderBoards(filterValue = 'all') {
        console.log("filterAndRenderBoards: Filtrando boards com valor:", filterValue);
        if (filterValue === 'all') {
            // Mostra boards que ainda possuem atividades
            currentBoardsToDisplay = allAvailableBoards.filter(board => board.activities.length > 0);
        } else {
            // Mostra boards filtradas que ainda possuem atividades
            currentBoardsToDisplay = allAvailableBoards.filter(board =>
                board.id.startsWith(`${filterValue}-`) && board.activities.length > 0
            );
        }
        console.log("filterAndRenderBoards: Boards para exibir após filtro:", currentBoardsToDisplay);
        renderBoards();
    }

    function saveScheduleToLocalStorage() {
        try {
            localStorage.setItem('scheduledVisitsData', JSON.stringify(calendarAllocations));
            localStorage.setItem('allAvailableBoardsData', JSON.stringify(allAvailableBoards));
            console.log("saveScheduleToLocalStorage: Dados salvos no localStorage.");
        } catch (e) {
            console.error("Failed to save to localStorage:", e);
            alert("Não foi possível salvar o cronograma. Pode ser que o armazenamento esteja cheio.");
        }
    }

    function loadScheduleFromLocalStorage() {
        console.log("loadScheduleFromLocalStorage: Carregando dados do localStorage.");
        try {
            const storedCalendar = localStorage.getItem('scheduledVisitsData');
            const storedBoards = localStorage.getItem('allAvailableBoardsData');
            if (storedCalendar) {
                calendarAllocations = JSON.parse(storedCalendar);
                console.log("loadScheduleFromLocalStorage: Agendas carregadas do localStorage:", calendarAllocations);
                for (const date in calendarAllocations) {
                    calendarAllocations[date] = calendarAllocations[date].map(activity => ({
                        ...activity,
                        technicians: activity.technicians || [],
                        shift: activity.shift || shifts[0], // Garante um turno padrão
                        module: activity.module || 'N/A',
                        isChecked: activity.isChecked === true,
                        isCopied: activity.isCopied === true, // Carrega o status de cópia
                        originalId: activity.originalId || activity.id // Garante originalId
                    }));
                }
            } else {
                calendarAllocations = {};
                console.log("loadScheduleFromLocalStorage: Nenhuma agenda encontrada no localStorage.");
            }
            if (storedBoards) {
                allAvailableBoards = JSON.parse(storedBoards);
                console.log("loadScheduleFromLocalStorage: Boards carregadas do localStorage:", allAvailableBoards);
                allAvailableBoards.forEach(board => {
                    board.activities = board.activities.map(activity => ({
                        ...activity,
                        module: activity.module || (board.id ? board.id.split('-')[0] : 'N/A'),
                        isChecked: activity.isChecked === true,
                        isCopied: activity.isCopied === true // Carrega o status de cópia
                    }));
                });
            } else {
                console.log("loadScheduleFromLocalStorage: Nenhuma board encontrada no localStorage. Início vazio.");
                allAvailableBoards = [];
            }
        } catch (error) {
            console.error("Error loading schedule from localStorage:", error);
            alert("Ocorreu um erro ao carregar dados salvos. O cronograma será iniciado vazio.");
            calendarAllocations = {};
            allAvailableBoards = [];
        }
        console.log("loadScheduleFromLocalStorage: allAvailableBoards final após carregamento:", allAvailableBoards);
    }

    // --- Funções de Relatório de Impressão ---
    function generateAndPrintScheduleReport() {
        const activitiesForReport = [];

        // Coleta todas as atividades alocadas no calendário
        for (const date in calendarAllocations) {
            calendarAllocations[date].forEach(activity => {
                activitiesForReport.push({
                    date: date,
                    shift: activity.shift,
                    module: activity.module,
                    description: activity.description,
                    technicians: activity.technicians,
                    isChecked: activity.isChecked,
                    isCopied: activity.isCopied // Inclui o status de cópia
                });
            });
        }

        if (activitiesForReport.length === 0) {
            alert('Não há atividades alocadas no calendário para gerar o relatório.');
            return;
        }

        // Ordena as atividades por data e depois por turno
        activitiesForReport.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime();
            }
            // Se as datas são iguais, ordena por turno (Manhã < Tarde)
            const shiftOrder = { 'Manhã (08h-12h)': 1, 'Tarde (13h-17h)': 2 };
            return (shiftOrder[a.shift] || 99) - (shiftOrder[b.shift] || 99);
        });

        let tableRows = activitiesForReport.map(activity => {
            const displayDate = new Date(activity.date).toLocaleDateString('pt-BR');
            const displayShift = activity.shift.split(' ')[0]; // Pega só "Manhã" ou "Tarde"
            const displayTechnicians = activity.technicians && activity.technicians.length > 0
                ? activity.technicians.join(', ')
                : 'N/A';
            const displayIsCompleted = activity.isChecked ? 'Sim' : 'Não';
            const displayIsCopied = activity.isCopied ? 'Sim' : 'Não'; // Novo campo

            return `
                <tr>
                    <td>${displayDate}</td>
                    <td>${displayShift}</td>
                    <td>${activity.module}</td>
                    <td>${activity.description}</td>
                    <td>${displayTechnicians}</td>
                    <td class="center-text">${displayIsCompleted}</td>
                    <td class="center-text">${displayIsCopied}</td>
                </tr>
            `;
        }).join('');

        const reportHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Acompanhamento do Cronograma Online</title>
                <link rel="stylesheet" href="style_Cronograma.css"> <!-- Reutiliza o CSS principal para estilos básicos -->
                <style>
                    body { margin: 20px; }
                    h1 { text-align: center; color: #333; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .center-text { text-align: center; }
                    /* Estilo para impressão */
                    @media print {
                        body { margin: 0; padding: 0; }
                        table { page-break-after: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        td, th { page-break-inside: avoid; }
                        /* Ajustes para a nova coluna */
                        .cronograma-table th:last-child,
                        .cronograma-table td:last-child {
                            text-align: center;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>Acompanhamento do Cronograma Online</h1>
                <table class="cronograma-table"> <!-- Adiciona a classe para usar estilos de tabela -->
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Turno</th>
                            <th>Módulo</th>
                            <th>Assunto</th>
                            <th>Técnicos Envolvidos</th>
                            <th>Realizada?</th>
                            <th>Cópia?</th> <!-- NOVA COLUNA -->
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }


    // --- Event Listeners Globais ---
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    moduleFilter.addEventListener('change', (event) => {
        filterAndRenderBoards(event.target.value);
    });
    printScheduleBtn.addEventListener('click', generateAndPrintScheduleReport); // Chama a nova função
    integrateSiclaBtn.addEventListener('click', () => {
        updateCalendarDataFromDOM();
        updateBoardDataFromDOM();
        saveScheduleToLocalStorage();
        filterAndRenderBoards(moduleFilter.value);
        renderCalendar();
        console.log('INTEGRAÇÃO SICLA: Botão "Integrar SICLA" clicado!');
        console.log('INTEGRAÇÃO SICLA: Dados das agendas (calendarAllocations) para integração/salvamento:', calendarAllocations);
        console.log('INTEGRAÇÃO SICLA: Dados das boards de atividades (allAvailableBoards) para integração/salvamento (incluindo as vazias):', allAvailableBoards);
        alert('Agendas salvas no navegador e prontas para integração com SICLA! (Verifique o console do navegador para os dados que seriam enviados)');
    });
    importSpreadsheetBtn.addEventListener('click', () => {
        spreadsheetFileInput.click();
    });
    spreadsheetFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const reader = new FileReader();
        reader.onload = (e) => {
            let processedData;
            try {
                if (fileExtension === 'csv') {
                    processedData = parseCSVData(e.target.result);
                } else if (fileExtension === 'xlsx') {
                    processedData = parseXLSXData(e.target.result);
                } else {
                    alert('Formato de arquivo não suportado. Por favor, importe um arquivo CSV ou XLSX.');
                    return;
                }
            } catch (error) {
                console.error("Erro ao processar o arquivo:", error);
                alert(`Ocorreu um erro ao processar o arquivo: ${error.message || 'Verifique o formato e as colunas.'}`);
                return;
            }
            const { initialBoards, uniqueModules } = processedData;
            if (initialBoards.length > 0) {
                allAvailableBoards = initialBoards;
                populateModuleFilter(uniqueModules);
                filterAndRenderBoards('all');
                saveScheduleToLocalStorage();
                alert('Planilha importada com sucesso!');
            } else {
                alert('Nenhum dado válido encontrado na planilha importada.');
            }
        };
        reader.onerror = (e) => {
            console.error("Erro ao ler o arquivo:", e);
            alert("Erro ao ler o arquivo. Verifique se é um arquivo CSV ou XLSX válido.");
        };
        if (fileExtension === 'csv') {
            reader.readAsText(file);
        } else if (fileExtension === 'xlsx') {
            reader.readAsArrayBuffer(file);
        }
    });

    // --- Inicialização da Aplicação ---
    try {
        loadScheduleFromLocalStorage();
        if (allAvailableBoards.length > 0) {
            const uniqueModulesFromStorage = new Set(allAvailableBoards.flatMap(board => 
                board.id && board.id.includes('-') ? [board.id.split('-')[0]] : []
            ));
            populateModuleFilter(Array.from(uniqueModulesFromStorage).sort());
        } else {
            populateModuleFilter([]);
        }
        populateTechnicianSelector();
        filterAndRenderBoards(moduleFilter.value);
        renderCalendar();
        console.log("Initial rendering complete.");
    } catch (error) {
        console.error("Error during initial page setup:", error);
        alert("Ocorreu um erro crítico ao carregar o cronograma. Verifique o console para detalhes.");
    }

    // Inicializa listeners de drag para calendário (devem ser os últimos a serem adicionados)
    initCalendarDragListeners();
});