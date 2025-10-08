document.addEventListener('DOMContentLoaded', () => {
    console.log("maintenance_Cronograma.js loaded and DOMContentLoaded event fired.");

    // --- Elementos do DOM ---
    const elements = {
        maintenanceTableBody: document.getElementById('maintenanceTableBody'),
        selectAllActivitiesCheckbox: document.getElementById('selectAllActivities'),
        backToMainBtn: document.getElementById('backToMainBtn'),
        technicianFilter: document.getElementById('technicianFilter'),
        moduleFilter: document.getElementById('moduleFilter'),
        occupancyCalendarMonthYear: document.getElementById('occupancyCalendarMonthYear'),
        occupancyCalendarGrid: document.getElementById('occupancyCalendarGrid'),
        prevMonthCalendarBtn: document.getElementById('prevMonthCalendarBtn'),
        nextMonthCalendarBtn: document.getElementById('nextMonthCalendarBtn'),
        suggestDatesBtn: document.getElementById('suggestDatesBtn'), 
        applyAllReschedulesBtn: document.getElementById('applyAllReschedulesBtn'),
        // Info panel elements
        selectedActivityDesc: document.getElementById('selectedActivityDesc'),
        selectedActivityTechs: document.getElementById('selectedActivityTechs'),
        selectedActivityCurrent: document.getElementById('selectedActivityCurrent'),
        manualNewDateInput: document.getElementById('manualNewDate'), 
        manualNewShiftSelect: document.getElementById('manualNewShift'), 
        selectedActivityNewStatus: document.getElementById('selectedActivityNewStatus'),
    };

    // Verify all essential elements are found
    for (const key in elements) {
        if (elements[key] === null && !['manualNewDateInput', 'manualNewShiftSelect', 'selectedActivityNewStatus'].includes(key)) { 
             console.error(`DOM element "${key}" not found! Check your HTML IDs.`);
        }
    }
    console.log("DOM elements check complete.");

    // --- Variáveis de Estado ---
    let maintenanceActivities = []; // Fonte de verdade: Todas as atividades carregadas do localStorage.
    let filteredActivities = [];    // Atividades atualmente exibidas na tabela (subconjunto de maintenanceActivities).
    let displayOccupancyDate = new Date(); // Mês atual exibido no calendário de ocupação.
    const availableTechnicians = ['João Silva', 'Maria Souza', 'Carlos Oliveira', 'Ana Costa', 'Pedro Almeida']; 
    const shifts = ['Manhã (08h-12h)', 'Tarde (13h-17h)'];
    let lastSelectedActivityIndex = -1; // Índice da atividade dentro de `filteredActivities` que está sendo exibida no painel de detalhes/edição.

    // --- Funções de Utilitário ---
    function getDayOfWeek(dateString) {
        try {
            const date = new Date(dateString + 'T00:00:00'); 
            return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        } catch (e) {
            console.error("Erro ao obter dia da semana para:", dateString, e);
            return 'Inválido';
        }
    }

    // Formata YYYY-MM-DD para DD/MM/YYYY para exibição
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString + 'T00:00:00'); 
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); 
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            console.error("Erro ao formatar data:", dateString, e);
            return dateString; 
        }
    }

    function getShiftDisplay(shift) {
        return shift ? shift.split(' ')[0] : 'N/A';
    }

    // --- População de Filtros ---
    function populateFilters() {
        if (elements.technicianFilter) {
            elements.technicianFilter.innerHTML = '<option value="">Todos os Técnicos</option>'; 
            availableTechnicians.forEach(tech => {
                const option = document.createElement('option');
                option.value = tech;
                option.textContent = tech;
                elements.technicianFilter.appendChild(option);
            });
        }

        if (elements.moduleFilter) {
            elements.moduleFilter.innerHTML = '<option value="all">Todos os Módulos</option>';
            const uniqueModules = new Set();
            maintenanceActivities.forEach(activity => {
                if (activity.module) uniqueModules.add(activity.module);
            });
            Array.from(uniqueModules).sort().forEach(moduleName => {
                const option = document.createElement('option');
                option.value = moduleName;
                option.textContent = moduleName;
                elements.moduleFilter.appendChild(option);
            });
        }
    }

    // --- Carregamento de Dados ---
    function loadAllocatedSchedules() {
        console.log("Tentando carregar agendas do localStorage...");
        const storedCalendar = localStorage.getItem('scheduledVisitsData');
        
        if (!storedCalendar || storedCalendar === '{}' || storedCalendar === '[]') {
            maintenanceActivities = [];
            console.log("Manutenção: Nenhuma agenda encontrada no localStorage ou está vazia/inválida.");
        } else {
            try {
                const calendarAllocations = JSON.parse(storedCalendar);
                let tempActivities = [];
                let idCounter = 0; 
                for (const date in calendarAllocations) {
                    if (calendarAllocations.hasOwnProperty(date) && Array.isArray(calendarAllocations[date])) {
                        calendarAllocations[date].forEach(activity => {
                            if (!activity.id) {
                                activity.id = `gen-${Date.now()}-${idCounter++}`;
                                console.warn("Atividade sem ID encontrada, gerando novo ID:", activity.id, activity);
                            }

                            const enrichedActivity = {
                                ...activity,
                                currentDate: date,        
                                currentShift: activity.shift, 
                                displayDate: activity.displayDate || '',          // Preserve if already set
                                displayShift: activity.displayShift || '',         // Preserve if already set
                                displaySlotStatus: activity.displaySlotStatus || '',    // Preserve if already set
                                isUserManuallySet: activity.isUserManuallySet || false, // Preserve if already set
                                isSelected: activity.isSelected || false         // Preserve if already set
                            };
                            tempActivities.push(enrichedActivity);
                        });
                    }
                }
                tempActivities.sort((a, b) => {
                    const dateA = new Date(a.currentDate + 'T00:00:00'); 
                    const dateB = new Date(b.currentDate + 'T00:00:00'); 
                    return dateA.getTime() - dateB.getTime();
                });

                maintenanceActivities = tempActivities;
                console.log("Manutenção: Atividades carregadas e processadas:", maintenanceActivities.length, maintenanceActivities);
            } catch (e) {
                console.error("Erro ao fazer parse do localStorage 'scheduledVisitsData':", e);
                maintenanceActivities = []; 
                alert("Erro ao carregar dados do cronograma. O localStorage pode estar corrompido. Tente limpar o cache e o localStorage do navegador.");
            }
        }
        
        populateFilters(); 
        applyFilters();    
    }

    // --- Renderização da Tabela de Manutenção ---
    function renderMaintenanceTable() {
        if (!elements.maintenanceTableBody) return; 

        elements.maintenanceTableBody.innerHTML = '';
        if (filteredActivities.length === 0) {
            const row = elements.maintenanceTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 10;
            cell.textContent = 'Nenhuma atividade encontrada com os filtros selecionados.';
            cell.classList.add('no-activities-message');
            if (elements.selectAllActivitiesCheckbox) { 
                elements.selectAllActivitiesCheckbox.disabled = true;
                elements.selectAllActivitiesCheckbox.checked = false; 
            }
            lastSelectedActivityIndex = -1; 
            updateInfoPanel(); 
            updateActionButtons();
            return;
        }

        if (elements.selectAllActivitiesCheckbox) {
            elements.selectAllActivitiesCheckbox.disabled = false;
            elements.selectAllActivitiesCheckbox.checked = filteredActivities.every(act => act.isSelected);
        }

        filteredActivities.forEach((activity, index) => {
            const row = elements.maintenanceTableBody.insertRow();
            row.setAttribute('data-activity-index', index);
            
            // Highlight the row if it's the one currently selected for the info panel
            if (index === lastSelectedActivityIndex) {
                row.classList.add('selected-row');
            }

            // Click listener for the entire row (to select for info panel)
            row.addEventListener('click', (event) => {
                console.log(`[EVENT] Row click triggered for index ${index}. Target:`, event.target);
                
                // If the click was directly on the checkbox, let its own change event handle 'isSelected'.
                // If it's the same row, just ensure the info panel is updated with its current state.
                if (event.target.type === 'checkbox') {
                    if (lastSelectedActivityIndex === index) {
                        console.log("[EVENT] Click on checkbox for currently displayed activity. Updating info panel.");
                        updateInfoPanel(); // Re-render info panel to reflect potential changes
                    }
                    return; // Let the checkbox's own change event listener handle `isSelected` state.
                }

                // If click is not on the checkbox, this row becomes the one for the info panel
                elements.maintenanceTableBody.querySelectorAll('tr.selected-row').forEach(tr => tr.classList.remove('selected-row'));
                row.classList.add('selected-row');

                lastSelectedActivityIndex = index; // Set this row as the current info panel selection
                console.log(`[EVENT] lastSelectedActivityIndex updated to: ${lastSelectedActivityIndex}`);
                updateInfoPanel(); // Update the info panel immediately
            });

            const selectCell = row.insertCell();
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'activitySelection';
            checkbox.checked = activity.isSelected;
            // The change event for the checkbox handles the `isSelected` state
            checkbox.addEventListener('change', (event) => {
                console.log(`[EVENT] Checkbox change event for index ${index}, checked: ${event.target.checked}`);
                toggleActivitySelection(index, event.target.checked);
            });
            selectCell.appendChild(checkbox);

            row.insertCell().textContent = formatDate(activity.currentDate);
            row.insertCell().textContent = getDayOfWeek(activity.currentDate);
            row.insertCell().textContent = getShiftDisplay(activity.currentShift);
            row.insertCell().textContent = activity.technicians && activity.technicians.length > 0 ? activity.technicians.join(', ') : 'N/A';
            row.insertCell().textContent = activity.module || 'N/A';
            row.insertCell().textContent = activity.description;
            
            const newDateCell = row.insertCell();
            newDateCell.textContent = formatDate(activity.displayDate);

            const newShiftCell = row.insertCell();
            newShiftCell.textContent = getShiftDisplay(activity.displayShift);

            const statusCell = row.insertCell();
            statusCell.textContent = activity.displaySlotStatus;
            statusCell.classList.add('new-status-cell');
            statusCell.classList.toggle('status-occupied', activity.displaySlotStatus === 'Ocupado');
            statusCell.classList.toggle('status-free', activity.displaySlotStatus === 'Livre');
        });
        
        console.log("renderMaintenanceTable finished. Calling updateInfoPanel and updateActionButtons.");
        updateInfoPanel(); 
        updateActionButtons();
    }

    // Gerencia o estado `isSelected` de uma atividade e limpa seus dados de sugestão se desmarcada
    function toggleActivitySelection(index, isSelected) {
        const activityInFiltered = filteredActivities[index];
        const originalActivity = maintenanceActivities.find(act => act.id === activityInFiltered.id);
        
        if (originalActivity) {
            originalActivity.isSelected = isSelected;
            activityInFiltered.isSelected = isSelected; 

            if (!isSelected) { // If activity is deselected, clear its suggested/manual data
                console.log(`[ACTION] Activity ${originalActivity.id} deselected via checkbox. Clearing display data.`);
                originalActivity.displayDate = '';
                originalActivity.displayShift = '';
                originalActivity.displaySlotStatus = '';
                originalActivity.isUserManuallySet = false;
                activityInFiltered.displayDate = '';
                activityInFiltered.displayShift = '';
                activityInFiltered.displaySlotStatus = '';
                activityInFiltered.isUserManuallySet = false;
            }
        }
        
        renderMaintenanceTable(); 
        renderOccupancyCalendar(); 
        updateInfoPanel(); // Crucial para refletir o estado da seleção no painel
    }

    // Gerencia o checkbox "Marcar Todos"
    function selectAllActivities(isChecked) {
        console.log(`[ACTION] Select All Checkbox changed to: ${isChecked}`);
        filteredActivities.forEach(activity => {
            const originalActivity = maintenanceActivities.find(act => act.id === activity.id);
            if (originalActivity) {
                originalActivity.isSelected = isChecked;
                activity.isSelected = isChecked; 

                if (!isChecked) { 
                    originalActivity.displayDate = ''; originalActivity.displayShift = ''; originalActivity.displaySlotStatus = ''; originalActivity.isUserManuallySet = false;
                    activity.displayDate = ''; activity.displayShift = ''; activity.displaySlotStatus = ''; activity.isUserManuallySet = false;
                }
            }
        });

        renderMaintenanceTable();
        renderOccupancyCalendar();
        updateInfoPanel(); // Crucial para refletir o estado da seleção no painel
    }

    // Atualiza o painel de informações da "Atividade Selecionada"
    function updateInfoPanel() {
        console.log(`[INFO PANEL] updateInfoPanel called. Current lastSelectedActivityIndex: ${lastSelectedActivityIndex}`);
        
        // Defensive check if info panel elements are actually found
        if (!elements.selectedActivityDesc || !elements.selectedActivityTechs || !elements.selectedActivityCurrent || 
            !elements.manualNewDateInput || !elements.manualNewShiftSelect || !elements.selectedActivityNewStatus) {
            console.error("Alguns elementos do info panel não foram encontrados no DOM.");
            return;
        }

        const hasAnyActivitySelectedByCheckbox = maintenanceActivities.some(act => act.isSelected);
        let activityToDisplay = null;

        if (lastSelectedActivityIndex !== -1 && filteredActivities[lastSelectedActivityIndex]) {
            activityToDisplay = filteredActivities[lastSelectedActivityIndex];
            console.log("[INFO PANEL] Displaying details for activity (clicked row):", activityToDisplay.id);
        } else if (hasAnyActivitySelectedByCheckbox) {
            // If no specific row is clicked but checkboxes are selected, show generic info
            elements.selectedActivityDesc.textContent = 'Múltiplas atividades marcadas';
            elements.selectedActivityTechs.textContent = 'N/A';
            elements.selectedActivityCurrent.textContent = 'N/A';
            console.log("[INFO PANEL] Displaying generic info for multiple selected activities.");
        } else {
            // No activity selected at all for display
            elements.selectedActivityDesc.textContent = 'N/A';
            elements.selectedActivityTechs.textContent = 'N/A';
            elements.selectedActivityCurrent.textContent = 'N/A';
            console.log("[INFO PANEL] No activity selected for display.");
        }

        if (activityToDisplay) { // Specific activity is clicked for display
            elements.selectedActivityDesc.textContent = activityToDisplay.description;
            elements.selectedActivityTechs.textContent = activityToDisplay.technicians && activityToDisplay.technicians.length > 0 ? activityToDisplay.technicians.join(', ') : 'N/A';
            elements.selectedActivityCurrent.textContent = `${formatDate(activityToDisplay.currentDate)} (${activityToDisplay.currentShift ? activityToDisplay.currentShift.split(' ')[0] : 'N/A'})`;
        }

        // Determine if manual inputs should be enabled
        const enableManualInputs = hasAnyActivitySelectedByCheckbox || (lastSelectedActivityIndex !== -1 && filteredActivities[lastSelectedActivityIndex]);
        elements.manualNewDateInput.disabled = !enableManualInputs; 
        elements.manualNewShiftSelect.disabled = !enableManualInputs; 
        console.log(`[INFO PANEL] Manual inputs enabled: ${enableManualInputs}`);
        // DEBUG: Explicitly log the disabled status after setting
        console.log(`[INFO PANEL] manualNewDateInput.disabled (after update): ${elements.manualNewDateInput.disabled}`);
        console.log(`[INFO PANEL] manualNewShiftSelect.disabled (after update): ${elements.manualNewShiftSelect.disabled}`);

        if (enableManualInputs) {
            // Sempre preencher os inputs manuais se uma linha foi clicada
            if (activityToDisplay) { 
                elements.manualNewDateInput.value = activityToDisplay.displayDate || ''; 
                elements.manualNewShiftSelect.value = activityToDisplay.displayShift || '';
                console.log(`[INFO PANEL] Manual inputs pre-filled for ${activityToDisplay.id}: Date='${elements.manualNewDateInput.value}', Shift='${elements.manualNewShiftSelect.value}'`);
            } else { 
                // Este bloco só será executado se `enableManualInputs` for true (i.e., há checkboxes marcados),
                // mas `activityToDisplay` é null (nenhuma linha foi clicada especificamente).
                // Neste caso, limpamos para evitar ambiguidade.
                elements.manualNewDateInput.value = ''; 
                elements.manualNewShiftSelect.value = '';
                console.log("[INFO PANEL] Manual inputs cleared (no specific row clicked for pre-fill, only checkboxes). ");
            }

            // Recalcula o status para o painel de informações (baseado na atividade clicada, se houver)
            if (activityToDisplay && activityToDisplay.displayDate && activityToDisplay.displayShift) {
                // Ao verificar o status para o painel de info, ignora APENAS a atividade atualmente selecionada (displaying)
                const currentStatus = checkSlotAvailability(activityToDisplay.displayDate, activityToDisplay.displayShift, activityToDisplay.technicians, [activityToDisplay.id]); 
                elements.selectedActivityNewStatus.textContent = currentStatus;
                elements.selectedActivityNewStatus.classList.toggle('status-occupied', currentStatus === 'Ocupado');
                elements.selectedActivityNewStatus.classList.toggle('status-free', currentStatus === 'Livre');
                elements.selectedActivityNewStatus.classList.remove('hidden'); 
                console.log(`[INFO PANEL] Slot status for ${activityToDisplay.id}: ${currentStatus}`);
            } else {
                elements.selectedActivityNewStatus.textContent = '';
                elements.selectedActivityNewStatus.classList.remove('status-occupied', 'status-free');
                elements.selectedActivityNewStatus.classList.add('hidden'); 
                console.log("[INFO PANEL] Slot status cleared.");
            }
        } else { // Clear and disable if no relevant activity is selected
            elements.manualNewDateInput.value = '';
            elements.manualNewShiftSelect.value = '';
            elements.selectedActivityNewStatus.textContent = '';
            elements.selectedActivityNewStatus.classList.remove('status-occupied', 'status-free');
            elements.selectedActivityNewStatus.classList.add('hidden');
            console.log("[INFO PANEL] Manual inputs and status cleared and disabled.");
        }
    }

    // Habilita/desabilita botões de ação
    function updateActionButtons() {
        const hasAnySelectedForBatch = maintenanceActivities.some(act => act.isSelected); 
        if (elements.suggestDatesBtn) {
             elements.suggestDatesBtn.disabled = !hasAnySelectedForBatch; 
        }

        const hasPendingReschedules = maintenanceActivities.some(activity => 
            activity.displayDate && 
            (activity.currentDate !== activity.displayDate || activity.currentShift !== activity.currentShift) 
        );
        if (elements.applyAllReschedulesBtn) {
            elements.applyAllReschedulesBtn.disabled = !hasPendingReschedules;
        }
    }

    // --- Renderização do Calendário de Ocupação ---
    function renderOccupancyCalendar() {
        if (!elements.occupancyCalendarMonthYear || !elements.occupancyCalendarGrid) {
            console.warn("Elementos do calendário não encontrados. Calendário não será renderizado.");
            return;
        }

        elements.occupancyCalendarMonthYear.textContent = new Date(displayOccupancyDate.getFullYear(), displayOccupancyDate.getMonth()).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        elements.occupancyCalendarGrid.innerHTML = '';

        const firstDayOfMonth = new Date(displayOccupancyDate.getFullYear(), displayOccupancyDate.getMonth(), 1).getDay();
        const daysInMonth = new Date(displayOccupancyDate.getFullYear(), displayOccupancyDate.getMonth() + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('occupancy-calendar-day', 'empty');
            elements.occupancyCalendarGrid.appendChild(emptyDay);
        }

        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const date = new Date(displayOccupancyDate.getFullYear(), displayOccupancyDate.getMonth(), dayNum);
            const dateString = date.toISOString().split('T')[0];

            const calendarDay = document.createElement('div');
            calendarDay.classList.add('occupancy-calendar-day');
            calendarDay.setAttribute('data-date', dateString);

            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = dayNum;
            calendarDay.appendChild(dayNumberSpan);

            shifts.forEach(shiftName => {
                const shiftSlot = document.createElement('div');
                shiftSlot.classList.add('occupancy-shift-slot');
                shiftSlot.setAttribute('data-shift', shiftName);
                shiftSlot.setAttribute('data-date', dateString);

                const shiftHeader = document.createElement('div');
                shiftHeader.classList.add('occupancy-shift-header');
                shiftHeader.textContent = shiftName.split(' ')[0]; 
                shiftSlot.appendChild(shiftHeader);

                let techsToConsider = [];
                let activityIdsToIgnoreForOccupancy = []; // Array de IDs
                
                if (lastSelectedActivityIndex !== -1 && filteredActivities[lastSelectedActivityIndex]) {
                    const selectedActivity = filteredActivities[lastSelectedActivityIndex];
                    techsToConsider = selectedActivity.technicians;
                    activityIdsToIgnoreForOccupancy = [selectedActivity.id]; // Passa como array
                } else {
                    const currentTechnicianFilter = Array.from(elements.technicianFilter ? elements.technicianFilter.selectedOptions : []).map(option => option.value).filter(val => val !== '');
                    techsToConsider = currentTechnicianFilter.length > 0 ? currentTechnicianFilter : availableTechnicians;
                    // Nenhuma atividade específica para ignorar se nada estiver selecionado para o painel de info
                    activityIdsToIgnoreForOccupancy = []; 
                }
                
                const slotStatus = checkSlotAvailability(dateString, shiftName, techsToConsider, activityIdsToIgnoreForOccupancy);

                if (slotStatus === 'Ocupado') {
                    shiftSlot.classList.add('occupied');
                } else {
                    shiftSlot.classList.add('free');
                }

                shiftSlot.addEventListener('click', () => handleOccupancySlotClick(dateString, shiftName, slotStatus));
                calendarDay.appendChild(shiftSlot);
            });
            elements.occupancyCalendarGrid.appendChild(calendarDay);
        }

        const totalCalendarSlots = 42; 
        const currentSlots = elements.occupancyCalendarGrid.children.length;
        for (let i = 0; i < totalCalendarSlots - currentSlots; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('occupancy-calendar-day', 'empty');
            elements.occupancyCalendarGrid.appendChild(emptyDay);
        }

        elements.occupancyCalendarGrid.querySelectorAll('.selected-occupancy-slot').forEach(el => el.classList.remove('selected-occupancy-slot'));
        if (lastSelectedActivityIndex !== -1 && filteredActivities[lastSelectedActivityIndex]) {
            const selectedActivity = filteredActivities[lastSelectedActivityIndex];
            if (selectedActivity.displayDate && selectedActivity.displayShift) {
                const selectedSlot = elements.occupancyCalendarGrid.querySelector(`.occupancy-shift-slot[data-date="${selectedActivity.displayDate}"][data-shift="${selectedActivity.displayShift}"]`);
                if (selectedSlot) {
                    selectedSlot.classList.add('selected-occupancy-slot');
                }
            }
        }
    }

    /**
     * Verifica a disponibilidade de um slot (data + turno) para um conjunto de técnicos.
     * Considera tanto 'currentDate' (compromissos existentes) quanto 'displayDate' (sugestões pendentes).
     * @param {string} dateString - Data no formato YYYY-MM-DD.
     * @param {string} shiftName - Nome do turno (Manhã, Tarde).
     * @param {string[]} targetTechnicians - Array de técnicos para verificar a disponibilidade.
     * @param {string[]} [activityIdsToIgnore=[]] - IDs das atividades a serem ignoradas na verificação de conflitos (são as que estamos tentando realocar).
     * @returns {'Livre'|'Ocupado'}
     */
    function checkSlotAvailability(dateString, shiftName, targetTechnicians, activityIdsToIgnore = []) {
        console.log(`[checkSlotAvailability] Verificando slot: ${dateString} ${shiftName} para técnicos: [${targetTechnicians.join(', ')}] (Ignorando IDs: [${activityIdsToIgnore.join(', ')}])`);

        if (!targetTechnicians || targetTechnicians.length === 0) {
            console.log(`[checkSlotAvailability] Nenhum técnico alvo. Slot é Livre.`);
            return 'Livre'; 
        }

        let isOccupied = false;
        for (const otherActivity of maintenanceActivities) { 
            // console.log(`[checkSlotAvailability]   - Analisando atividade ${otherActivity.id}: CurrentDate=${otherActivity.currentDate}, CurrentShift=${otherActivity.currentShift}, DisplayDate=${otherActivity.displayDate}, DisplayShift=${otherActivity.displayShift}, Técnicos: [${otherActivity.technicians.join(', ')}]`);
            
            if (activityIdsToIgnore.includes(otherActivity.id)) {
                // console.log(`[checkSlotAvailability]     - Ignorando ${otherActivity.id} conforme solicitado.`);
                continue; 
            }
            
            // Verifica se 'otherActivity' compartilha algum técnico com 'targetTechnicians'
            const techniciansOverlap = otherActivity.technicians.some(tech => targetTechnicians.includes(tech));
            if (techniciansOverlap) {
                // console.log(`[checkSlotAvailability]     - Sobreposição de técnico(s) com ${otherActivity.id}.`);
                // 1. Verificar conflito com agendamentos *atuais* (originais) de outras atividades.
                if (otherActivity.currentDate === dateString && otherActivity.currentShift === shiftName) {
                    console.log(`[checkSlotAvailability]     - CONFLITO: Técnico(s) ocupado(s) por agendamento ATUAL de ${otherActivity.id} em ${otherActivity.currentDate} ${otherActivity.currentShift}`);
                    isOccupied = true;
                    break; 
                }

                // 2. Verificar conflito com *sugestões pendentes* (displayDate) de outras atividades.
                if (otherActivity.displayDate === dateString && otherActivity.displayShift === shiftName) {
                    console.log(`[checkSlotAvailability]     - CONFLITO: Técnico(s) ocupado(s) por SUGESTÃO PENDENTE de ${otherActivity.id} em ${otherActivity.displayDate} ${otherActivity.displayShift}`);
                    isOccupied = true;
                    break; 
                }
            }
        }
        console.log(`[checkSlotAvailability] Resultado para ${dateString} ${shiftName}: ${isOccupied ? 'Ocupado' : 'Livre'}`);
        return isOccupied ? 'Ocupado' : 'Livre';
    }

    /**
     * Verifica se um técnico está ocupado em um determinado dia (QUALQUER turno).
     * Considera tanto 'currentDate' (compromissos existentes) quanto 'displayDate' (sugestões pendentes).
     * @param {string} dateString - Data no formato YYYY-MM-DD.
     * @param {string} technician - O técnico a ser verificado.
     * @param {string[]} [activityIdsToIgnore=[]] - IDs das atividades a serem ignoradas na verificação (são as que estamos tentando realocar).
     * @returns {boolean} True se o técnico estiver ocupado no dia, False caso contrário.
     */
    function isDayOccupiedForTechnician(dateString, technician, activityIdsToIgnore = []) {
        console.log(`[isDayOccupiedForTechnician] Verificando dia ${dateString} para técnico: ${technician} (Ignorando IDs: [${activityIdsToIgnore.join(', ')}])`);
        for (const otherActivity of maintenanceActivities) {
            // console.log(`[isDayOccupiedForTechnician]   - Considerando outra atividade: ${otherActivity.id}, CurrentDate: ${otherActivity.currentDate}, DisplayDate: ${otherActivity.displayDate}, Técnicos: [${otherActivity.technicians.join(', ')}]`);
            if (activityIdsToIgnore.includes(otherActivity.id)) {
                // console.log(`[isDayOccupiedForTechnician]     - Ignorando ${otherActivity.id} conforme solicitado.`);
                continue;
            }

            if (otherActivity.technicians.includes(technician)) {
                // console.log(`[isDayOccupiedForTechnician]     - Técnico ${technician} é parte de ${otherActivity.id}.`);
                // Conflito com agendamento atual (ignora o turno, só o dia)
                if (otherActivity.currentDate === dateString) {
                    console.log(`[isDayOccupiedForTechnician]     - CONFLITO DIA: Técnico ${technician} ocupado por agendamento ATUAL de ${otherActivity.id} em ${dateString}`);
                    return true;
                }
                // Conflito com sugestão pendente (ignora o turno, só o dia)
                if (otherActivity.displayDate === dateString) {
                    console.log(`[isDayOccupiedForTechnician]     - CONFLITO DIA: Técnico ${technician} ocupado por SUGESTÃO PENDENTE de ${otherActivity.id} em ${dateString}`);
                    return true;
                }
            }
        }
        console.log(`[isDayOccupiedForTechnician]   Técnico ${technician} está LIVRE no dia ${dateString}`);
        return false;
    }


    // Handler para cliques nos slots do calendário
    function handleOccupancySlotClick(dateString, shiftName, slotStatus) {
        if (lastSelectedActivityIndex === -1 || !filteredActivities[lastSelectedActivityIndex]) {
            alert('Por favor, selecione uma atividade na tabela à esquerda (clicando na linha) para remarcar manualmente.');
            return;
        }
        
        const activity = filteredActivities[lastSelectedActivityIndex];
        const originalActivity = maintenanceActivities.find(act => act.id === activity.id);
        if (!originalActivity) return;

        originalActivity.displayDate = dateString;
        originalActivity.displayShift = shiftName;
        originalActivity.isUserManuallySet = true; 
        // Passa o ID da atividade como array, conforme a nova assinatura de checkSlotAvailability
        originalActivity.displaySlotStatus = checkSlotAvailability(dateString, shiftName, originalActivity.technicians, [originalActivity.id]); 

        console.log(`[ACTION] Calendar slot clicked. New displayDate for ${originalActivity.id}: ${originalActivity.displayDate}, Shift: ${originalActivity.displayShift}`);

        renderMaintenanceTable(); 
        renderOccupancyCalendar(); 
        updateInfoPanel(); // Garante que o painel de info reflita a mudança
    }

    // Handler para alterações nos campos manuais do painel de informações
    function handleManualRescheduleChange() {
        console.trace("[MANUAL_CHANGE_DEBUG] handleManualRescheduleChange called."); // Added trace for call stack

        const newDate = elements.manualNewDateInput ? elements.manualNewDateInput.value : ''; 
        const newShift = elements.manualNewShiftSelect ? elements.manualNewShiftSelect.value : '';

        console.log(`[MANUAL_CHANGE_DEBUG] Raw date input value: '${elements.manualNewDateInput?.value}'`);
        console.log(`[MANUAL_CHANGE_DEBUG] Raw shift select value: '${elements.manualNewShiftSelect?.value}'`);
        console.log(`[MANUAL_CHANGE_DEBUG] Processed newDate variable: '${newDate}', Processed newShift variable: '${newShift}'`);

        let activitiesToUpdate = [];

        // 1. Coleta todas as atividades explicitamente selecionadas por checkbox
        const selectedByCheckbox = maintenanceActivities.filter(act => act.isSelected);
        activitiesToUpdate.push(...selectedByCheckbox);
        console.log(`[MANUAL_CHANGE_DEBUG] Initial activitiesToUpdate (from checkboxes): ${activitiesToUpdate.length}`);

        // 2. Se uma linha específica está clicada (para exibição no painel de detalhes)
        // E essa atividade ainda não está na lista (i.e., seu checkbox não está marcado), adicione-a.
        if (lastSelectedActivityIndex !== -1 && filteredActivities[lastSelectedActivityIndex]) {
            const activityFromClickedRow = maintenanceActivities.find(act => act.id === filteredActivities[lastSelectedActivityIndex].id);
            if (activityFromClickedRow && !activitiesToUpdate.some(act => act.id === activityFromClickedRow.id)) {
                activitiesToUpdate.push(activityFromClickedRow);
                console.log(`[MANUAL_CHANGE_DEBUG] Added activity from clicked row (${activityFromClickedRow.id}) to activitiesToUpdate.`);
            }
        }
        
        // Remove duplicatas se houver (garante que cada atividade seja processada uma vez)
        activitiesToUpdate = Array.from(new Set(activitiesToUpdate.map(act => act.id))).map(id => maintenanceActivities.find(act => act.id === id));
        console.log(`[MANUAL_CHANGE_DEBUG] Final activitiesToUpdate count: ${activitiesToUpdate.length}`);

        if (activitiesToUpdate.length === 0) {
            console.warn("[MANUAL_CHANGE_DEBUG] No activities targeted for manual reschedule. Neither row clicked nor checkboxes selected.");
            updateInfoPanel(); // Garante que o painel reflita o estado atual (vazio)
            return;
        }

        // --- NOVA LÓGICA DE VALIDAÇÃO DE DATA ORIGINAL ÚNICA ---
        if (activitiesToUpdate.length > 1) { // Só valida se mais de uma atividade está sendo atualizada
            const firstCurrentDate = activitiesToUpdate[0].currentDate;
            const allSameOriginalDate = activitiesToUpdate.every(activity => activity.currentDate === firstCurrentDate);

            if (!allSameOriginalDate) {
                const uniqueOriginalDates = new Set(activitiesToUpdate.map(act => formatDate(act.currentDate)));
                alert(
                    'Erro na remarcação manual:\n\n' +
                    'Para agrupar compromissos manualmente para uma nova data e turno, ' +
                    'TODOS os compromissos selecionados devem ter a MESMA DATA ORIGINAL.\n\n' +
                    `As datas originais dos compromissos selecionados são: ${Array.from(uniqueOriginalDates).join(', ')}.\n` +
                    'Por favor, selecione apenas compromissos que partem da mesma data original para esta operação.'
                );
                // Limpa os campos manuais para resetar o estado, já que a operação é inválida
                if (elements.manualNewDateInput) elements.manualNewDateInput.value = '';
                if (elements.manualNewShiftSelect) elements.manualNewShiftSelect.value = '';
                
                // Limpa quaisquer displayDate/displayShift que possam ter sido parcialmente definidos para as atividades
                activitiesToUpdate.forEach(activity => {
                    // Só limpa se foi definido manualmente (para não afetar sugestões automáticas)
                    if (activity.isUserManuallySet) { 
                        activity.displayDate = '';
                        activity.displayShift = '';
                        activity.displaySlotStatus = '';
                        activity.isUserManuallySet = false;
                    }
                });
                renderMaintenanceTable();
                renderOccupancyCalendar();
                updateInfoPanel();
                return; // Interrompe a função aqui
            }
        }
        // --- FIM DA NOVA LÓGICA DE VALIDAÇÃO ---

        // Get all IDs of activities currently being manually rescheduled in this batch.
        const allMovingActivityIdsForManualBatch = activitiesToUpdate.map(a => a.id);
        console.log(`[MANUAL_CHANGE_DEBUG] IDs of all activities in this manual batch (to ignore in conflict check): [${allMovingActivityIdsForManualBatch.join(', ')}]`);


        activitiesToUpdate.forEach(activity => {
            console.log(`[MANUAL_CHANGE_DEBUG] Processing activity ${activity.id} for manual reschedule. Current display: ${activity.displayDate}, ${activity.displayShift}.`);

            if (newDate && newShift) {
                activity.displayDate = newDate;
                activity.displayShift = newShift;
                activity.isUserManuallySet = true;
                activity.displaySlotStatus = checkSlotAvailability(newDate, newShift, activity.technicians, allMovingActivityIdsForManualBatch);
                console.log(`[MANUAL_CHANGE_DEBUG] Successfully set manual reschedule for ${activity.id} to Date=${activity.displayDate}, Shift=${activity.displayShift}, Status=${activity.displaySlotStatus}`);
            } else {
                // Este 'else' é para situações onde a data OU o turno (ou ambos) foram limpos/não preenchidos.
                // Limpamos apenas se a atividade já estava marcada como manualmente definida para evitar limpar sugestões automáticas.
                if (activity.isUserManuallySet) { 
                    activity.displayDate = '';
                    activity.displayShift = '';
                    activity.displaySlotStatus = '';
                    activity.isUserManuallySet = false;
                    console.log(`[MANUAL_CHANGE_DEBUG] Cleared manual reschedule for ${activity.id} due to incomplete date/shift input. Previous was manually set.`);
                } else {
                    console.log(`[MANUAL_CHANGE_DEBUG] No new manual reschedule applied to ${activity.id}, and no previous manual data (auto-suggested or empty) to clear.`);
                }
            }
        });

        // After processing, re-render everything to reflect changes
        renderMaintenanceTable();
        renderOccupancyCalendar();
        updateInfoPanel();
    }

    // Navegação do calendário
    function navigateOccupancyCalendar(direction) {
        displayOccupancyDate.setMonth(displayOccupancyDate.getMonth() + direction);
        renderOccupancyCalendar(); 
    }

    // --- Lógica de Filtros ---
    function applyFilters() {
        console.log("[FILTER] Aplicando filtros...");
        const selectedTechnicians = Array.from(elements.technicianFilter ? elements.technicianFilter.selectedOptions : []).map(option => option.value).filter(val => val !== '');
        const selectedModule = elements.moduleFilter ? elements.moduleFilter.value : 'all';

        filteredActivities = maintenanceActivities.filter(activity => {
            let matchesTechnician = true;
            if (selectedTechnicians.length > 0) {
                matchesTechnician = activity.technicians.some(tech => selectedTechnicians.includes(tech));
            }

            let matchesModule = true;
            if (selectedModule !== 'all') {
                matchesModule = activity.module === selectedModule;
            }
            return matchesTechnician && matchesModule;
        });

        // After filtering, check if the currently selected activity for the info panel is still in the filtered list
        let newLastSelectedActivityIndex = -1;
        if (lastSelectedActivityIndex !== -1 && filteredActivities.length > 0) {
            // Find the ID of the previously selected activity
            // Check if filteredActivities[lastSelectedActivityIndex] exists before accessing its id
            const previouslySelectedActivityId = (filteredActivities[lastSelectedActivityIndex]) ? filteredActivities[lastSelectedActivityIndex].id : null;
            if (previouslySelectedActivityId) {
                newLastSelectedActivityIndex = filteredActivities.findIndex(act => act.id === previouslySelectedActivityId);
            }
        }
        lastSelectedActivityIndex = newLastSelectedActivityIndex;
        
        console.log("[FILTER] Filtros aplicados. Atividades filtradas:", filteredActivities.length, "lastSelectedActivityIndex set to:", lastSelectedActivityIndex);
        renderMaintenanceTable();
        renderOccupancyCalendar();
    }

    // Sugestão de Datas (Botão Unificado)
    function suggestDatesForMarkedActivities() {
        console.log("[SUGGEST] Iniciando sugestão de datas para atividades marcadas.");
        // Log do estado inicial de todas as atividades para depuração
        console.log("[SUGGEST] Estado inicial de maintenanceActivities:", JSON.parse(JSON.stringify(maintenanceActivities.map(a => ({ id: a.id, currentDate: a.currentDate, currentShift: a.currentShift, displayDate: a.displayDate, displayShift: a.displayShift, technicians: a.technicians, isSelected: a.isSelected })))));

        const markedActivities = maintenanceActivities.filter(act => act.isSelected && !act.isUserManuallySet); // Only auto-suggest for non-manual ones

        if (markedActivities.length === 0) {
            alert('Por favor, marque uma ou mais atividades na tabela (usando o checkbox) para sugerir novas datas, ou desmarque as sugestões manuais.');
            return;
        }

        // Group activities by their current date
        const activitiesGroupedByCurrentDate = {};
        markedActivities.forEach(activity => {
            if (!activitiesGroupedByCurrentDate[activity.currentDate]) {
                activitiesGroupedByCurrentDate[activity.currentDate] = [];
            }
            activitiesGroupedByCurrentDate[activity.currentDate].push(activity);
        });
        console.log("[SUGGEST] Atividades agrupadas por data atual:", activitiesGroupedByCurrentDate);

        let suggestionsMadeCount = 0;
        let groupsWithNoSuggestion = [];

        // Order groups by date to ensure consistent processing order (oldest dates first)
        const sortedCurrentDates = Object.keys(activitiesGroupedByCurrentDate).sort();

        for (const currentDate of sortedCurrentDates) { // Use sorted dates for predictable behavior
            const activitiesInGroup = activitiesGroupedByCurrentDate[currentDate];
            
            // Collect all unique technicians from this group
            const allGroupTechnicians = new Set();
            activitiesInGroup.forEach(activity => {
                activity.technicians.forEach(tech => allGroupTechnicians.add(tech));
            });
            const groupTechniciansArray = Array.from(allGroupTechnicians);
            
            // Collect all activity IDs from this group to be ignored during availability check for the new slot
            // These are the activities *within this group* that we are trying to move.
            const groupActivityIds = activitiesInGroup.map(activity => activity.id);

            let commonSuggestedSlot = null;
            let searchDate = new Date();
            searchDate.setHours(0, 0, 0, 0); 
            
            // Start search from the day *after* the latest current date from the group, or tomorrow, whichever is later.
            const maxCurrentDateInGroup = new Date(Math.max(...activitiesInGroup.map(a => new Date(a.currentDate + 'T00:00:00'))));
            if (maxCurrentDateInGroup.getTime() >= searchDate.getTime()) {
                searchDate = new Date(maxCurrentDateInGroup);
                searchDate.setDate(searchDate.getDate() + 1); 
            } else {
                searchDate.setDate(searchDate.getDate() + 1); 
            }

            console.log(`\n[SUGGEST] --- Processando Grupo da Data Original: ${currentDate} ---`);
            console.log(`[SUGGEST] Técnicos do Grupo: [${groupTechniciansArray.join(', ')}]`);
            console.log(`[SUGGEST] IDs das Atividades no grupo (a serem ignoradas): [${groupActivityIds.join(', ')}]`);
            console.log(`[SUGGEST] Iniciando busca por slot comum a partir de: ${searchDate.toISOString().split('T')[0]}`);

            // Search up to 2 years in the future to find a slot
            for (let i = 0; i < 365 * 2; i++) { 
                const dayOfWeek = searchDate.getDay(); 
                const candidateDateString = searchDate.toISOString().split('T')[0];
                
                console.log(`[SUGGEST.LOOP] Processando data candidata: ${candidateDateString} (Dia da Semana: ${dayOfWeek})`);

                if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = Domingo, 6 = Sábado
                    console.log(`[SUGGEST.LOOP]   Pulando fim de semana: ${candidateDateString}`);
                    searchDate.setDate(searchDate.getDate() + 1);
                    continue; // Pula o resto da iteração e vai para o próximo dia
                }

                // Check if ALL technicians in the group are available for this candidate day (any shift on this day)
                let allGroupTechniciansAvailableForDay = true;
                for (const tech of groupTechniciansArray) {
                    if (isDayOccupiedForTechnician(candidateDateString, tech, groupActivityIds)) {
                        console.log(`[SUGGEST.LOOP]   Técnico ${tech} está ocupado em ${candidateDateString} (por agenda existente ou sugestão de outro grupo). Pulando o dia.`);
                        allGroupTechniciansAvailableForDay = false;
                        break; // Se um técnico já está ocupado no dia, este dia não serve para o grupo
                    }
                }

                if (!allGroupTechniciansAvailableForDay) {
                    searchDate.setDate(searchDate.getDate() + 1);
                    continue; // Se o dia está ocupado para algum técnico do grupo, pula para o próximo dia
                }

                // If all group technicians are available for the day, then find the first free shift on this day
                for (const shift of shifts) {
                    // checkSlotAvailability will check if THIS specific date+shift is free for ALL technicians in the group
                    const availability = checkSlotAvailability(candidateDateString, shift, groupTechniciansArray, groupActivityIds); 
                    if (availability === 'Livre') {
                        commonSuggestedSlot = { date: candidateDateString, shift: shift, status: availability };
                        console.log(`[SUGGEST.LOOP]   Slot livre específico encontrado para o grupo: ${candidateDateString} ${shift}`);
                        break; // Encontrou um slot (data + turno) específico para o grupo
                    } else {
                        console.log(`[SUGGEST.LOOP]   Slot ${candidateDateString} ${shift} está ocupado para o grupo. Tentando próximo turno no mesmo dia.`);
                    }
                }

                if (commonSuggestedSlot) break; // Se um slot foi encontrado para este grupo, pare de procurar por este grupo
                searchDate.setDate(searchDate.getDate() + 1); 
            }

            if (commonSuggestedSlot) {
                activitiesInGroup.forEach(activity => {
                    activity.displayDate = commonSuggestedSlot.date;
                    activity.displayShift = commonSuggestedSlot.shift;
                    activity.displaySlotStatus = commonSuggestedSlot.status;
                    activity.isUserManuallySet = false; // Ensure it's marked as auto-suggested
                    suggestionsMadeCount++;
                    console.log(`[SUGGEST] Sugestão aplicada a ${activity.id}: ${commonSuggestedSlot.date} ${commonSuggestedSlot.shift}`);
                });
            } else {
                // No common slot found for this group
                groupsWithNoSuggestion.push(currentDate);
                activitiesInGroup.forEach(activity => {
                    activity.displayDate = '';
                    activity.displayShift = '';
                    activity.displaySlotStatus = '';
                    console.log(`[SUGGEST] Nenhuma sugestão comum encontrada para a atividade ${activity.id} (de ${currentDate}). Limpando dados de exibição.`);
                });
            }
        }

        if (suggestionsMadeCount > 0) {
            let alertMessage = `${suggestionsMadeCount} atividades marcadas tiveram sugestões de novas datas.`;
            if (groupsWithNoSuggestion.length > 0) {
                alertMessage += `\nNão foi possível encontrar uma sugestão comum para as atividades originárias das seguintes datas: ${groupsWithNoSuggestion.join(', ')}.`;
            }
            alert(alertMessage);
        } else {
            alert('Nenhuma sugestão de nova data foi encontrada para as atividades marcadas ou já havia sugestões manuais.');
        }

        renderMaintenanceTable(); 
        renderOccupancyCalendar();
        updateInfoPanel(); // Garante que o painel de info reflita a mudança
        updateActionButtons(); // Garante que os botões de ação reflitam o estado atual
    }

    // Aplica as remarcações salvas no localStorage
    function applyAllReschedules() {
        console.log("[APPLY] Iniciando aplicação de remarcações.");
        const pendingReschedules = maintenanceActivities.filter(activity => 
            activity.displayDate && 
            (activity.currentDate !== activity.displayDate || activity.currentShift !== activity.currentShift)
        );

        if (pendingReschedules.length === 0) {
            alert('Nenhuma remarcação pendente para aplicar.');
            return;
        }

        // Criar uma lista de IDs de TODAS as atividades que serão movidas nesta operação
        const allMovingActivityIds = pendingReschedules.map(activity => activity.id);

        const conflicts = pendingReschedules.filter(activity => {
            console.log(`[APPLY] Verificando conflito para aplicar atividade ${activity.id} para ${activity.displayDate} ${activity.displayShift}`);
            // Passa a lista COMPLETA de IDs das atividades que estão sendo movidas
            // Isso evita que atividades do mesmo lote de remarcação "conflitem" entre si.
            return checkSlotAvailability(activity.displayDate, activity.displayShift, activity.technicians, allMovingActivityIds) === 'Ocupado';
        });

        if (conflicts.length > 0) {
            let conflictDescriptions = conflicts.map(c => 
                `${c.description} para ${formatDate(c.displayDate)} (${c.displayShift ? c.displayShift.split(' ')[0] : 'N/A'})`
            ).join('\n');
            alert(`Conflitos encontrados! As seguintes remarcações não podem ser aplicadas pois o slot está ocupado:\n${conflictDescriptions}\nPor favor, ajuste-as manualmente.`);
            console.error("[APPLY] Conflitos encontrados ao tentar aplicar remarcações:", conflicts);
            return;
        }

        if (!confirm(`Tem certeza que deseja aplicar ${pendingReschedules.length} remarcações? Esta ação é irreversível.`)) {
            return;
        }

        let calendarAllocations = JSON.parse(localStorage.getItem('scheduledVisitsData') || '{}');
        
        pendingReschedules.forEach(activity => {
            // 1. Remove a atividade do slot ANTIGO (currentDate/currentShift)
            if (calendarAllocations[activity.currentDate]) {
                calendarAllocations[activity.currentDate] = calendarAllocations[activity.currentDate].filter(
                    act => act.id !== activity.id
                );
                if (calendarAllocations[activity.currentDate].length === 0) {
                    delete calendarAllocations[activity.currentDate];
                }
            }

            // 2. Adiciona a atividade ao NOVO slot (displayDate/displayShift)
            const newActivityEntry = { ...activity }; 
            newActivityEntry.date = newActivityEntry.displayDate;     
            newActivityEntry.shift = newActivityEntry.displayShift;   
            
            // Clean up temporary maintenance fields before saving back
            delete newActivityEntry.currentDate;
            delete newActivityEntry.currentShift;
            delete newActivityEntry.displayDate;
            delete newActivityEntry.displayShift;
            delete newActivityEntry.displaySlotStatus;
            delete newActivityEntry.isUserManuallySet;
            delete newActivityEntry.isSelected;

            if (!calendarAllocations[newActivityEntry.date]) { 
                calendarAllocations[newActivityEntry.date] = [];
            }
            calendarAllocations[newActivityEntry.date].push(newActivityEntry);
            console.log(`[APPLY] Atividade ${activity.id} movida de ${activity.currentDate} para ${newActivityEntry.date}`);
        });

        localStorage.setItem('scheduledVisitsData', JSON.stringify(calendarAllocations));
        alert('Remarcações aplicadas com sucesso! O cronograma principal foi atualizado.');

        lastSelectedActivityIndex = -1; // Reset selection after applying
        loadAllocatedSchedules(); // Reload all data to reflect actual changes from localStorage
    }

    // --- Inicialização ---
    function initializeMaintenancePage() {
        console.log("Inicializando página de manutenção...");
        loadAllocatedSchedules(); 

        if (elements.backToMainBtn) elements.backToMainBtn.addEventListener('click', () => { window.location.href = 'index_Cronograma.html'; });
        if (elements.selectAllActivitiesCheckbox) elements.selectAllActivitiesCheckbox.addEventListener('change', (event) => selectAllActivities(event.target.checked));
        if (elements.technicianFilter) elements.technicianFilter.addEventListener('change', applyFilters);
        if (elements.moduleFilter) elements.moduleFilter.addEventListener('change', applyFilters);
        if (elements.prevMonthCalendarBtn) elements.prevMonthCalendarBtn.addEventListener('click', () => navigateOccupancyCalendar(-1));
        if (elements.nextMonthCalendarBtn) elements.nextMonthCalendarBtn.addEventListener('click', () => navigateOccupancyCalendar(1));
        if (elements.suggestDatesBtn) elements.suggestDatesBtn.addEventListener('click', suggestDatesForMarkedActivities);
        if (elements.applyAllReschedulesBtn) elements.applyAllReschedulesBtn.addEventListener('click', applyAllReschedules);
        
        // Populate the shift select for manual reschedule
        if (elements.manualNewShiftSelect) {
            elements.manualNewShiftSelect.innerHTML = '<option value="">Selecione um Turno</option>'; // Default empty option
            shifts.forEach(shift => {
                const option = document.createElement('option');
                option.value = shift; // Example: "Manhã (08h-12h)"
                option.textContent = shift.split(' ')[0]; // Example: "Manhã" for display
                elements.manualNewShiftSelect.appendChild(option);
            });
            console.log("[INIT] manualNewShiftSelect populated with options. Options count: " + elements.manualNewShiftSelect.options.length);
            // DEBUG: Log the options values to ensure they are correctly set
            Array.from(elements.manualNewShiftSelect.options).forEach((opt, idx) => console.log(`[INIT] Shift option ${idx}: value='${opt.value}', text='${opt.textContent}'`));
        }

        // Attach main change listeners for manual reschedule
        if (elements.manualNewDateInput) {
            elements.manualNewDateInput.addEventListener('change', handleManualRescheduleChange);
            // DEBUG: Additional input listener to catch any change event on the date field
            elements.manualNewDateInput.addEventListener('input', (event) => {
                console.log(`[MANUAL_INPUT_DEBUG] manualNewDateInput 'input' event - value: ${event.target.value}, disabled: ${event.target.disabled}`);
            });
            elements.manualNewDateInput.addEventListener('focus', (event) => {
                console.log(`[MANUAL_INPUT_DEBUG] manualNewDateInput 'focus' event - value: ${event.target.value}, disabled: ${event.target.disabled}`);
            });
            console.log(`[INIT] manualNewDateInput listeners attached. Initial disabled state: ${elements.manualNewDateInput.disabled}`);
        }
        if (elements.manualNewShiftSelect) {
            elements.manualNewShiftSelect.addEventListener('change', handleManualRescheduleChange);
            // DEBUG: Additional input listener to catch any change event on the shift field
            elements.manualNewShiftSelect.addEventListener('click', (event) => { // Using click for select as well for better debug visibility
                console.log(`[MANUAL_INPUT_DEBUG] manualNewShiftSelect 'click' event - value: ${event.target.value}, disabled: ${event.target.disabled}`);
            });
             elements.manualNewShiftSelect.addEventListener('focus', (event) => { // Using focus for select as well for better debug visibility
                console.log(`[MANUAL_INPUT_DEBUG] manualNewShiftSelect 'focus' event - value: ${event.target.value}, disabled: ${event.target.disabled}`);
            });
            console.log(`[INIT] manualNewShiftSelect listeners attached. Initial disabled state: ${elements.manualNewShiftSelect.disabled}`);
        }

        console.log("Página de manutenção inicializada.");
    }

    initializeMaintenancePage();
});