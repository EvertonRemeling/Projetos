document.addEventListener('DOMContentLoaded', () => {
    const attendanceForm = document.getElementById('attendanceForm');
    const addActivityBtn = document.getElementById('addActivityBtn');
    const activitiesIncluded = document.getElementById('activitiesIncluded');
    const noActivitiesMessage = document.getElementById('noActivitiesMessage');

    const activityModuleInput = document.getElementById('activityModule');
    const activityContactInput = document.getElementById('activityContact');
    const activityDescriptionInput = document.getElementById('activityDescription');

    const clientResponsibleSearchInput = document.getElementById('clientResponsibleSearch');
    const responsibleSelection = document.getElementById('responsibleSelection');
    const searchResponsibleButton = document.querySelector('.search-button');
    const backButton = document.querySelector('.button-tertiary');
    const submitButton = document.querySelector('button[type="submit"]'); // Seleciona o botão de submit

    let activities = []; // Array para armazenar as atividades do atendimento atual
    let currentAttendanceId = null; // ID do atendimento sendo visualizado/editado
    let formMode = 'new'; // 'new', 'view', 'edit'

    // --- Dados Iniciais de Responsáveis para Teste ---
    const initialResponsibles = [
        { id: '', name: 'Selecione um responsável' }, // Opção padrão
        { id: 'joao_silva', name: 'João Silva (Gerente)' },
        { id: 'maria_souza', name: 'Maria Souza (Coordenadora de Vendas)' },
        { id: 'carlos_mendes', name: 'Carlos Eduardo Mendes (Diretor Comercial)' },
        { id: 'ana_costa', name: 'Ana Lúcia Costa (Analista Sênior)' },
        { id: 'pedro_almeida', name: 'Pedro Henrique Almeida (Especialista Técnico)' },
        { id: 'julia_ferreira', name: 'Júlia Ferreira (Consultora de TI)' },
        { id: 'rafael_pereira', name: 'Rafael Pereira (Suporte Técnico)' }
    ];

    // --- Funções de Renderização e Lógica das Atividades ---

    // Função para popular o dropdown de responsáveis
    const populateResponsibleSelection = (data, selectedId = '') => {
        responsibleSelection.innerHTML = ''; // Limpa as opções existentes
        data.forEach(resp => {
            const option = document.createElement('option');
            option.value = resp.id;
            option.textContent = resp.name;
            if (resp.id === selectedId) { // Seleciona o responsável se houver um ID
                option.selected = true;
            }
            responsibleSelection.appendChild(option);
        });
    };

    // Renderiza as atividades na lista
    const renderActivities = () => {
        activitiesIncluded.innerHTML = ''; // Limpa a lista atual
        if (activities.length === 0) {
            noActivitiesMessage.style.display = 'block';
        } else {
            noActivitiesMessage.style.display = 'none';
            activities.forEach((activity, index) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div class="activity-details">
                        <p><strong>Módulo:</strong> ${activity.module}</p>
                        <p><strong>Contato:</strong> ${activity.contact}</p>
                        <p><strong>Descrição:</strong> ${activity.description}</p>
                    </div>
                    <div class="activity-actions">
                        ${formMode !== 'view' ? `<button type="button" class="edit-activity-btn" data-index="${index}" title="Editar Atividade"><i class="fas fa-edit"></i></button>` : ''}
                        ${formMode !== 'view' ? `<button type="button" class="remove-activity-btn" data-index="${index}" title="Remover Atividade"><i class="fas fa-trash-alt"></i></button>` : ''}
                    </div>
                `;
                activitiesIncluded.appendChild(listItem);
            });
        }
    };

    // Adicionar Atividade
    addActivityBtn.addEventListener('click', () => {
        const module = activityModuleInput.value.trim();
        const contact = activityContactInput.value.trim();
        const description = activityDescriptionInput.value.trim();

        if (module && contact && description) {
            activities.push({ module, contact, description });
            renderActivities();
            // Limpa os campos após adicionar
            activityModuleInput.value = '';
            activityContactInput.value = '';
            activityDescriptionInput.value = '';
        } else {
            alert('Por favor, preencha todos os campos da atividade antes de incluir.');
        }
    });

    // Delegar eventos para botões de editar/remover
    activitiesIncluded.addEventListener('click', (e) => {
        if (formMode === 'view') return; // Não permitir edição/remoção em modo de visualização

        if (e.target.closest('.remove-activity-btn')) {
            const index = parseInt(e.target.closest('.remove-activity-btn').dataset.index);
            activities.splice(index, 1); // Remove a atividade do array
            renderActivities();
        }
        if (e.target.closest('.edit-activity-btn')) {
            const index = parseInt(e.target.closest('.edit-activity-btn').dataset.index);
            const activityToEdit = activities[index];
            
            // Preenche os campos de input com os dados da atividade para edição
            activityModuleInput.value = activityToEdit.module;
            activityContactInput.value = activityToEdit.contact;
            activityDescriptionInput.value = activityToEdit.description;

            // Remove a atividade do array para que seja adicionada novamente com as edições
            activities.splice(index, 1);
            renderActivities(); 
        }
    });

    // --- Lógica de Busca de Responsável ---
    searchResponsibleButton.addEventListener('click', async () => {
        const searchTerm = clientResponsibleSearchInput.value.trim();
        if (searchTerm.length === 0) {
            alert('Digite um termo para buscar responsáveis.');
            return;
        }
        
        console.log(`Buscando responsáveis por: ${searchTerm}...`);
        
        const filteredResponsibles = initialResponsibles.filter(r => 
            r.id !== '' && r.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const optionsToDisplay = [{ id: '', name: 'Selecione um responsável' }].concat(filteredResponsibles);
        
        populateResponsibleSelection(optionsToDisplay);

        if (filteredResponsibles.length === 0) {
            responsibleSelection.innerHTML = '<option value="">Nenhum responsável encontrado.</option>';
        }
    });

    // Se o campo de busca for limpo, repopula com a lista inicial
    clientResponsibleSearchInput.addEventListener('input', () => {
        if (clientResponsibleSearchInput.value.trim() === '') {
            populateResponsibleSelection(initialResponsibles);
        }
    });

    // --- Nova Função: Carregar dados do Atendimento no Formulário ---
    const loadAttendanceData = (attendance) => {
        document.getElementById('clientCode').value = attendance.client.code;
        document.getElementById('clientName').value = attendance.client.name;
        populateResponsibleSelection(initialResponsibles, attendance.client.responsibleId); // Popula e seleciona

        document.getElementById('departureCompanyDate').value = attendance.displacement.departureCompanyDate;
        document.getElementById('departureCompanyTime').value = attendance.displacement.departureCompanyTime;
        document.getElementById('arrivalClientDate').value = attendance.displacement.arrivalClientDate;
        document.getElementById('arrivalClientTime').value = attendance.displacement.arrivalClientTime;
        document.getElementById('departureClientDate').value = attendance.displacement.departureClientDate;
        document.getElementById('departureClientTime').value = attendance.displacement.departureClientTime;
        document.getElementById('arrivalCompanyDate').value = attendance.displacement.arrivalCompanyDate;
        document.getElementById('arrivalCompanyTime').value = attendance.displacement.arrivalCompanyTime;
        document.getElementById('kmInitial').value = attendance.displacement.kmInitial;
        document.getElementById('kmFinal').value = attendance.displacement.kmFinal;

        document.getElementById('tollCost').value = attendance.expenses.toll;
        document.getElementById('foodCost').value = attendance.expenses.food;
        document.getElementById('lodgingCost').value = attendance.expenses.lodging;
        document.getElementById('parkingCost').value = attendance.expenses.parking;

        activities = attendance.activities || []; // Carrega as atividades
        renderActivities(); // Renderiza as atividades carregadas
    };

    // --- Inicialização do Formulário: Verifica URL para modo de visualização/edição ---
    const urlParams = new URLSearchParams(window.location.search);
    const attendanceId = urlParams.get('id');
    const mode = urlParams.get('mode');

    if (attendanceId && (mode === 'view' || mode === 'edit')) {
        const storedAttendances = JSON.parse(localStorage.getItem('attendances')) || [];
        const attendanceToLoad = storedAttendances.find(att => att.id === attendanceId);

        if (attendanceToLoad) {
            currentAttendanceId = attendanceId;
            formMode = mode;
            loadAttendanceData(attendanceToLoad);

            if (formMode === 'view') {
                document.title = 'Visualizar Atendimento';
                attendanceForm.querySelectorAll('input, select, textarea, button:not(.button-tertiary)').forEach(el => {
                    el.setAttribute('readonly', 'readonly');
                    el.setAttribute('disabled', 'disabled');
                });
                // Esconde botões de submit e adicionar atividade
                submitButton.style.display = 'none';
                addActivityBtn.style.display = 'none';
                searchResponsibleButton.style.display = 'none'; // Esconde botão de busca
                attendanceForm.querySelector('header h1').textContent = 'Visualização de Atendimento';
            } else if (formMode === 'edit') {
                document.title = 'Editar Atendimento';
                submitButton.textContent = 'Atualizar Atendimento';
                submitButton.classList.remove('button-primary'); // Remove classe primária se precisar mudar o estilo
                submitButton.classList.add('button-secondary'); // Adiciona uma classe secundária para diferenciar
                attendanceForm.querySelector('header h1').textContent = 'Edição de Atendimento';
            }
        } else {
            alert('Atendimento não encontrado.');
            window.location.href = 'index.html'; // Redireciona de volta
        }
    } else {
        // Modo "Novo Atendimento" padrão
        populateResponsibleSelection(initialResponsibles); // Preenche a lista de responsáveis ao carregar
        renderActivities(); // Renderiza as atividades (mostra a mensagem de "nenhuma atividade" inicialmente)
    }

    // --- Submissão do Formulário Principal (Incluir/Atualizar) ---
    attendanceForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário

        if (formMode === 'view') return; // Não permitir submissão em modo de visualização

        // Validação básica do formulário HTML5 (required)
        if (!attendanceForm.checkValidity()) {
            attendanceForm.reportValidity();
            return;
        }

        // Validação adicional para responsável selecionado
        if (responsibleSelection.value === '') {
            alert('Por favor, selecione um responsável.');
            responsibleSelection.focus();
            return;
        }

        // Coletar todos os dados do formulário principal
        const attendanceData = {
            id: currentAttendanceId || Date.now().toString(), // Mantém o ID existente ou cria um novo
            client: {
                code: document.getElementById('clientCode').value,
                name: document.getElementById('clientName').value,
                responsibleId: document.getElementById('responsibleSelection').value,
                responsibleName: responsibleSelection.options[responsibleSelection.selectedIndex].text 
            },
            displacement: {
                departureCompanyDate: document.getElementById('departureCompanyDate').value,
                departureCompanyTime: document.getElementById('departureCompanyTime').value,
                arrivalClientDate: document.getElementById('arrivalClientDate').value,
                arrivalClientTime: document.getElementById('arrivalClientTime').value,
                departureClientDate: document.getElementById('departureClientDate').value,
                departureClientTime: document.getElementById('departureClientTime').value,
                arrivalCompanyDate: document.getElementById('arrivalCompanyDate').value,
                arrivalCompanyTime: document.getElementById('arrivalCompanyTime').value,
                kmInitial: parseFloat(document.getElementById('kmInitial').value),
                kmFinal: parseFloat(document.getElementById('kmFinal').value)
            },
            expenses: {
                toll: parseFloat(document.getElementById('tollCost').value) || 0,
                food: parseFloat(document.getElementById('foodCost').value) || 0,
                lodging: parseFloat(document.getElementById('lodgingCost').value) || 0,
                parking: parseFloat(document.getElementById('parkingCost').value) || 0
            },
            activities: activities // As atividades já estão no array 'activities'
        };

        // --- Lógica para SALVAR/ATUALIZAR no localStorage ---
        let storedAttendances = JSON.parse(localStorage.getItem('attendances')) || [];

        if (formMode === 'edit' && currentAttendanceId) {
            // Encontra e atualiza o atendimento existente
            const index = storedAttendances.findIndex(att => att.id === currentAttendanceId);
            if (index !== -1) {
                storedAttendances[index] = attendanceData;
                alert('Atendimento atualizado e salvo localmente! Redirecionando para a página inicial.');
            }
        } else {
            // Adiciona um novo atendimento
            storedAttendances.push(attendanceData);
            alert('Atendimento registrado e salvo localmente! Redirecionando para a página inicial.'); 
        }
        
        localStorage.setItem('attendances', JSON.stringify(storedAttendances));

        console.log('Dados do Atendimento Salvos:', attendanceData);
        
        // Redireciona para a página inicial APÓS salvar
        window.location.href = 'index.html'; 
    });

    // --- Lógica para o botão "Voltar" ---
    backButton.addEventListener('click', () => {
        // Redireciona para a página inicial
        window.location.href = 'index.html'; 
    });
});