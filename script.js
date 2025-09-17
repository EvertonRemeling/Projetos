// Variáveis globais
let projects = []; // Será carregado do localStorage
let flows = []; // Será carregado do localStorage
let technicians = []; // Será carregado do localStorage
let officialChecklists = []; // Armazenará os templates de checklist oficial
let currentEditingOfficialChecklist = { id: null, name: '', items: [] }; // Armazena o checklist sendo editado no officialChecklistManagerModal
let currentProjectToUpdateOfficialChecklist = null; // Armazena o projeto sendo atualizado no modal de checklist oficial
let users = {}; // Será carregado do localStorage
let currentUser = null; // Será carregado do localStorage
let currentProjectToUpdateProcesses = null; // Armazena o projeto sendo atualizado no modal de processo
let currentEditingProject = null; // Armazena o projeto sendo editado no projectModal para seleção de fluxo
let currentEditingFlow = { id: null, name: '', groups: [] }; // Armazena o fluxo sendo editado no flowManagerModal
let currentEditingTechnician = null; // Armazena o técnico sendo editado no technicianManagerModal
let currentEditingUser = null; // Armazena o usuário sendo editado no userManagerModal

// Configuração da API de clientes (DO SCRIPT clientApi.js)
const CLIENT_API_CONFIG = {
    url: '',
    username: 'cadastros', // Substitua pelo seu usuário real
    password: 'eWH$isRh#Fu70n' // Substitua pela sua senha real
};

// Cache para a lista de clientes
let clientsCache = null;

// Define os tipos de anexos disponíveis
const ATTACHMENT_TYPES = [
    "Documento de Conversão",
    "Laudo de Conversão",
    "Levantamento de Processo",
    "Projeto de Implantação",
    "Termo de Encerramento"
];

// --- Funções de Persistência (localStorage) ---
function saveData() {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('flows', JSON.stringify(flows));
    localStorage.setItem('technicians', JSON.stringify(technicians));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('officialChecklists', JSON.stringify(officialChecklists));
    if (currentUser && currentUser.username) {
        localStorage.setItem('currentUserUsername', currentUser.username);
    } else {
        localStorage.removeItem('currentUserUsername');
    }
    console.log('Dados salvos no localStorage.');
}

function loadData() {
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
        projects = JSON.parse(storedProjects);
    } else {
        // Dados de exemplo iniciais se não houver dados no localStorage
        projects = [
            {
                id: 1,
                name: "Implantação ERP - TechCorp",
                client: "TechCorp Solutions",
                description: "Implementação completa do sistema ERP para a TechCorp, incluindo módulos de finanças, estoque e RH.",
                status: "Em Execução",
                progress: 65, // Progresso geral do projeto - será recalculado
                startDate: "2025-01-15",
                endDate: "2025-03-15",
                projectLeadId: 4, // Link para ID do técnico (Ana Paula)
                responsiblePersonId: 1, // Link para ID do técnico (João Silva)
                implementerId: 6, // Link para ID do técnico (Fernanda Lima)
                biLink: "https://app.powerbi.com/view/techcorp-dashboard", // Exemplo de link BI
                attachments: [
                    { name: "Documento de Conversão", fileName: "doc_conversao_techcorp.pdf", url: "#" },
                    { name: "Levantamento de Processo", fileName: "levantamento_techcorp.docx", url: "#" }
                ],
                flowId: 1, // Link para ID do fluxo
                processes: [
                    {
                        groupName: "Fase 1: Início",
                        items: [
                            { name: "Análise de Requisitos", status: "Implantado", progress: 100 },
                            { name: "Design e Prototipagem", status: "Em Andamento", progress: 70 }
                        ]
                    },
                    {
                        groupName: "Fase 2: Desenvolvimento",
                        items: [
                            { name: "Desenvolvimento do Core", status: "Em Andamento", progress: 50 },
                            { name: "Integração de Módulos", status: "Não Implantado", progress: 0 }
                        ]
                    },
                    {
                        groupName: "Fase 3: Implantação",
                        items: [
                            { name: "Testes de Aceitação (UAT)", status: "Não Implantado", progress: 0 },
                            { name: "Homologação com Cliente", status: "Não Implantado", progress: 0 },
                            { name: "Treinamento de Usuários", status: "Não Implantado", progress: 0 },
                            { name: "Go-Live", status: "Não Implantado", progress: 0 },
                            { name: "Suporte Pós-Implantação", status: "Não Implantado", progress: 0 }
                        ]
                    }
                ],
                officialChecklistId: 1, // Link para ID do checklist oficial
                officialChecklistItems: [
                    { text: "Reunião de Kick-off agendada", completed: true, description: "Confirmar data e hora com o cliente e equipe." },
                    { text: "Documento de Escopo assinado", completed: false, description: "Garantir que o escopo do projeto esteja formalmente aprovado." },
                    { text: "Ambiente de Desenvolvimento configurado", completed: false, description: "Verificar acesso e ferramentas necessárias." },
                    { text: "Acesso ao cliente concedido", completed: false, description: "Credenciais de acesso a sistemas do cliente (se aplicável)." },
                    { text: "Cronograma inicial aprovado", completed: false, description: "Validar marcos e datas com as partes interessadas." },
                    { text: "Equipe alocada e informada", completed: false, description: "Todos os membros da equipe cientes de suas responsabilidades." }
                ],
                todoLists: [
                    { id: 1, name: "A fazer", cards: [{ id: 1, name: "Revisar documentação de requisitos", description: "Verificar se todos os requisitos levantados estão cobertos.", completed: false, checklistItems: [{ text: "Ler doc", completed: false }, { text: "Anotar dúvidas", completed: false }] }] },
                    { id: 2, name: "Em andamento", cards: [{ id: 2, name: "Configurar ambiente de homologação", description: "Preparar servidores e banco de dados para a fase de testes.", completed: false, checklistItems: [{ text: "Instalar DB", completed: true }, { text: "Configurar app", completed: false }] }] },
                    { id: 3, name: "Concluído", cards: [{ id: 3, name: "Entrevista inicial com stakeholders", description: "Reunião para alinhamento de expectativas e escopo.", completed: true, checklistItems: [{ text: "Agendar", completed: true }, { text: "Realizar", completed: true }] }] }
                ]
            },
            {
                id: 2,
                name: "Upgrade Sistema Contábil - AlphaFin",
                client: "AlphaFin Consultoria",
                description: "Atualização da versão do sistema contábil para a mais recente, com novas funcionalidades fiscais.",
                status: "Concluído",
                progress: 100,
                startDate: "2024-11-01",
                endDate: "2024-12-20",
                projectLeadId: 5, // Link para ID do técnico (Carlos Eduardo)
                responsiblePersonId: 2, // Link para ID do técnico (Maria Oliveira)
                implementerId: 3, // Link para ID do técnico (Pedro Costa)
                biLink: "",
                attachments: [
                    { name: "Termo de Encerramento", fileName: "termo_encerramento_alphafin.pdf", url: "#" }
                ],
                flowId: 2,
                processes: [
                    {
                        groupName: "Fase 1: Início",
                        items: [
                            { name: "Análise de Impacto", status: "Implantado", progress: 100 },
                            { name: "Planejamento da Migração", status: "Implantado", progress: 100 }
                        ]
                    },
                    {
                        groupName: "Fase 2: Execução",
                        items: [
                            { name: "Backup de Dados", status: "Implantado", progress: 100 },
                            { name: "Instalação da Nova Versão", status: "Implantado", progress: 100 },
                            { name: "Migração de Dados", status: "Implantado", progress: 100 }
                        ]
                    },
                    {
                        groupName: "Fase 3: Finalização",
                        items: [
                            { name: "Testes de Validação", status: "Implantado", progress: 100 },
                            { name: "Treinamento de Equipe", status: "Implantado", progress: 100 },
                            { name: "Homologação Final", status: "Implantado", progress: 100 },
                            { name: "Go-Live", status: "Implantado", progress: 100 }
                        ]
                    }
                ],
                officialChecklistId: null, // Nenhum checklist para este projeto inicialmente
                officialChecklistItems: [],
                todoLists: [
                    { id: 1, name: "Verificar", cards: [] },
                    { id: 2, name: "Feito", cards: [{ id: 1, name: "Gerar relatório de auditoria", description: "Relatório final de conformidade após o upgrade.", completed: true, checklistItems: [{ text: "Coletar dados", completed: true }, { text: "Gerar PDF", completed: true }] }] }
                ]
            }
        ];
    }

    const storedFlows = localStorage.getItem('flows');
    if (storedFlows) {
        flows = JSON.parse(storedFlows);
    } else {
        flows = [
            {
                id: 1,
                name: "Fluxo Padrão ERP",
                groups: [
                    { name: "Fase 1: Início", processes: ["Análise de Requisitos", "Design e Prototipagem", "Planejamento Detalhado"] },
                    { name: "Fase 2: Desenvolvimento", processes: ["Desenvolvimento do Core", "Integração de Módulos", "Testes Unitários"] },
                    { name: "Fase 3: Implantação", processes: ["Testes de Aceitação (UAT)", "Homologação com Cliente", "Treinamento de Usuários", "Go-Live", "Suporte Pós-Implantação"] }
                ]
            },
            {
                id: 2,
                name: "Fluxo de Upgrade",
                groups: [
                    { name: "Fase 1: Preparação", processes: ["Análise de Impacto", "Planejamento da Migração", "Backup de Dados"] },
                    { name: "Fase 2: Execução", processes: ["Instalação da Nova Versão", "Migração de Dados", "Testes de Validação"] },
                    { name: "Fase 3: Pós-Upgrade", processes: ["Treinamento de Equipe", "Homologação Final", "Go-Live", "Monitoramento Inicial"] }
                ]
            }
        ];
    }

    const storedTechnicians = localStorage.getItem('technicians');
    if (storedTechnicians) {
        technicians = JSON.parse(storedTechnicians);
    } else {
        technicians = [
            { id: 1, name: "João Silva", role: "Responsável pela Equipe" },
            { id: 2, name: "Maria Oliveira", role: "Responsável pela Equipe" },
            { id: 3, name: "Pedro Costa", role: "Implantador" },
            { id: 4, name: "Ana Paula", role: "Gerente do Projeto" },
            { id: 5, name: "Carlos Eduardo", role: "Gerente do Projeto" },
            { id: 6, name: "Fernanda Lima", role: "Implantador" }
        ];
    }

    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    } else {
        users = {
            admin: { password: 'senha123', name: 'Administrador Geral', role: 'admin', notes: [{ id: 1, name: "Minhas Tarefas", cards: [] }, { id: 2, name: "Ideias", cards: [] }] },
            implantador: { password: 'impl123', name: 'Implantador Rech', role: 'implantador', notes: [{ id: 1, name: "Minhas Tarefas", cards: [] }, { id: 2, name: "Ideias", cards: [] }] },
            cliente: { password: 'cli123', name: 'Cliente Teste', role: 'cliente', notes: [{ id: 1, name: "Minhas Tarefas", cards: [] }, { id: 2, name: "Ideias", cards: [] }] }
        };
    }

    const storedOfficialChecklists = localStorage.getItem('officialChecklists');
    if (storedOfficialChecklists) {
        officialChecklists = JSON.parse(storedOfficialChecklists);
    } else {
        officialChecklists = [
            {
                id: 1,
                name: "Checklist de Início de Projeto Padrão",
                items: [
                    { text: "Reunião de Kick-off agendada", completed: false, description: "Confirmar data e hora com o cliente e equipe." },
                    { text: "Documento de Escopo assinado", completed: false, description: "Garantir que o escopo do projeto esteja formalmente aprovado." },
                    { text: "Ambiente de Desenvolvimento configurado", completed: false, description: "Verificar acesso e ferramentas necessárias." },
                    { text: "Acesso ao cliente concedido", completed: false, description: "Credenciais de acesso a sistemas do cliente (se aplicável)." },
                    { text: "Cronograma inicial aprovado", completed: false, description: "Validar marcos e datas com as partes interessadas." },
                    { text: "Equipe alocada e informada", completed: false, description: "Todos os membros da equipe cientes de suas responsabilidades." }
                ]
            },
            {
                id: 2,
                name: "Checklist de Início de Projeto Pequeno Porte",
                items: [
                    { text: "Definição de objetivos claros", completed: false },
                    { text: "Recursos essenciais identificados", completed: false },
                    { text: "Comunicação inicial com cliente", completed: false }
                ]
            }
        ];
    }

    const storedCurrentUserUsername = localStorage.getItem('currentUserUsername');
    if (storedCurrentUserUsername && users[storedCurrentUserUsername]) {
        currentUser = users[storedCurrentUserUsername];
        currentUser.username = storedCurrentUserUsername; // Re-adiciona a propriedade username ao objeto currentUser
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('currentUser').textContent = currentUser.name;
        updateUIForRole();
        loadProjects();
        updateDashboardStats();
        renderGanttChart();
    }
}

// --- Funções Utilitárias ---
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para garantir interpretação UTC para análise consistente da data
    if (isNaN(date.getTime())) return 'Data Inválida';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-text">${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Reseta a posição de rolagem para modais que podem ter transbordado
    const modalContent = document.getElementById(modalId).querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

// Função debounce para busca de clientes
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// --- Funções de Login/Logout e Gerenciamento de Papel da UI ---
function doLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = usernameInput.value;
    const password = passwordInput.value;

    const user = users[username];

    if (user && user.password === password) {
        currentUser = { username: username, ...user };
        localStorage.setItem('currentUserUsername', username); // Persiste o login

        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('currentUser').textContent = currentUser.name;

        updateUIForRole();
        loadProjects();
        updateDashboardStats();
        renderGanttChart();
        showNotification(`Bem-vindo, ${currentUser.name}!`, 'success');
        saveData(); // Salva os dados após o login (caso as anotações tenham sido inicializadas para um novo usuário)
    } else {
        showNotification('Usuário ou senha inválidos!', 'error');
    }
}

function doLogout() {
    currentUser = null;
    localStorage.removeItem('currentUserUsername'); // Limpa o login persistente

    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showNotification('Você foi desconectado.', 'info');
    saveData(); // Salva os dados após o logout
}

function updateUIForRole() {
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isImplantador = currentUser && currentUser.role === 'implantador';
    const isClient = currentUser && currentUser.role === 'cliente';

    // Botões de Admin
    document.getElementById('manageFlowsBtn').classList.toggle('hidden', !isAdmin);
    document.getElementById('manageTechniciansBtn').classList.toggle('hidden', !isAdmin);
    document.getElementById('manageUsersBtn').classList.toggle('hidden', !isAdmin);
    document.getElementById('manageOfficialChecklistsBtn').classList.toggle('hidden', !isAdmin); // NOVO: Botão de Checklist Oficial

    // Botões de Admin/Implantador
    document.getElementById('newProjectBtn').classList.toggle('hidden', !(isAdmin || isImplantador));

    // Botão Minhas Anotações (disponível para todos os usuários logados)
    document.getElementById('myNotesBtn').classList.toggle('hidden', !currentUser);

    // Botão de Busca Geral (disponível para todos os usuários logados)
    document.getElementById('generalSearchBtn').classList.toggle('hidden', !currentUser);

    // Visibilidade das abas
    document.querySelector('.tab-nav').classList.toggle('hidden', !currentUser);
    document.getElementById('reports-tab').classList.toggle('hidden', isClient); // Clientes não veem relatórios
    document.getElementById('client-tab').classList.toggle('hidden', !isClient); // Apenas clientes veem a aba do cliente
    document.getElementById('projects-tab').classList.toggle('hidden', isClient); // Clientes usam a aba do cliente para projetos

    // Mudar para a aba apropriada no login
    if (isClient) {
        switchTab('client');
    } else if (currentUser) {
        switchTab('projects');
    }
}

// --- Funções de Estatísticas do Dashboard ---
function updateDashboardStats() {
    const active = projects.filter(p => p.status !== 'Concluído').length;
    const running = projects.filter(p => p.status === 'Em Execução').length;
    const completed = projects.filter(p => p.status === 'Concluído').length;
    const total = projects.length;
    const successRate = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

    document.getElementById('activeProjects').textContent = active;
    document.getElementById('runningProjects').textContent = running;
    document.getElementById('completedProjects').textContent = completed;
    document.getElementById('successRate').textContent = `${successRate}%`;
}

// --- Troca de Abas ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');

    if (tabName === 'gantt') {
        renderGanttChart();
    } else if (tabName === 'projects') {
        loadProjects();
    } else if (tabName === 'client') {
        loadClientProjects();
    }
}

// --- Funções de Gerenciamento de Projeto ---
function getTechnicianNameById(id) {
    const tech = technicians.find(t => t.id === id);
    return tech ? tech.name : 'Não Atribuído';
}

function calculateProjectProgress(project) {
    if (!project.processes || project.processes.length === 0) {
        project.progress = 0;
        project.status = 'Planejamento';
        return;
    }

    let totalProcessItems = 0;
    let completedProcessItems = 0;

    project.processes.forEach(group => {
        group.items.forEach(item => {
            totalProcessItems++;
            if (item.status === 'Implantado') {
                completedProcessItems++;
            }
        });
    });

    const overallProgress = totalProcessItems > 0 ? (completedProcessItems / totalProcessItems) * 100 : 0;
    project.progress = Math.round(overallProgress);

    if (project.progress === 100) {
        project.status = 'Concluído';
    } else if (project.progress > 0) {
        project.status = 'Em Execução';
    } else {
        project.status = 'Planejamento';
    }
}

function loadProjects() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';

    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filteredProjects = projects.filter(project => {
        const matchesStatus = statusFilter === '' || project.status === statusFilter;
        const matchesSearch = searchTerm === '' ||
                              project.name.toLowerCase().includes(searchTerm) ||
                              project.client.toLowerCase().includes(searchTerm) ||
                              project.description.toLowerCase().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    // Ordena os projetos: 'Em Execução' primeiro, depois 'Planejamento', depois 'Concluído'
    filteredProjects.sort((a, b) => {
        const statusOrder = { 'Em Execução': 1, 'Planejamento': 2, 'Concluído': 3 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    if (filteredProjects.length === 0) {
        projectsList.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum projeto encontrado.</p>';
        return;
    }

    filteredProjects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <div class="project-header">
                <div>
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-client">${project.client}</p>
                    <p class="project-description">${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
                </div>
                <span class="status-badge status-${project.status.replace(/\s/g, '-').toLowerCase()}">${project.status}</span>
            </div>
            <div class="project-stats">
                <div><span class="project-stat-label">Início:</span> <span class="project-stat-value">${formatDate(project.startDate)}</span></div>
                <div><span class="project-stat-label">Término:</span> <span class="project-stat-value">${formatDate(project.endDate)}</span></div>
                <div><span class="project-stat-label">Gerente:</span> <span class="project-stat-value">${getTechnicianNameById(project.projectLeadId)}</span></div>
                <div><span class="project-stat-label">Implantador:</span> <span class="project-stat-value">${getTechnicianNameById(project.implementerId)}</span></div>
            </div>
            <div class="progress-bar">
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${project.progress}%;"></div>
                </div>
                <span class="progress-text">${project.progress}%</span>
            </div>
            <div class="project-footer">
                <div class="team-info">
                    <span>Responsável: ${getTechnicianNameById(project.responsiblePersonId)}</span>
                </div>
                <div class="project-actions">
                
                
                <button class="btn btn-sm btn-secondary" 
        onclick="window.location.href='Index.html'" 
        aria-label="Protocolo">
  Registrar Protocolo
</button>



                    <button class="btn btn-sm btn-secondary" onclick="openProjectViewModal(${project.id})" aria-label="Ver Detalhes">👁️ Ver</button>
                    ${(currentUser.role === 'admin' || currentUser.role === 'implantador') ? `
                        <button class="btn btn-sm btn-secondary" onclick="openProjectModal(${project.id})" aria-label="Editar Projeto">✏️ Editar</button>
                        <button class="btn btn-sm btn-secondary" onclick="openUpdateProcessModal(${project.id})" aria-label="Atualizar Processos">🔄 Processos</button>
                        <button class="btn btn-sm btn-secondary" onclick="openUpdateOfficialChecklistModal(${project.id})" aria-label="Atualizar Checklist">✅ Checklist</button>
                        <button class="btn btn-sm btn-secondary" onclick="openTodoModal(${project.id})" aria-label="Pendências do Projeto">📝 Pendências</button>
                        ${project.biLink ? `<button class="btn btn-sm btn-secondary" onclick="openBiDashboardModal('${project.biLink}', '${project.name}')" aria-label="Abrir Dashboard BI">📊 BI</button>` : ''}
                        <button class="btn btn-sm btn-danger" onclick="deleteProject(${project.id})" aria-label="Excluir Projeto">🗑️ Excluir</button>
                    ` : ''}
                </div>
            </div>
        `;
        projectsList.appendChild(projectCard);
    });
}

function loadClientProjects() {
    const clientProjectsList = document.getElementById('clientProjectsList');
    clientProjectsList.innerHTML = '';

    if (!currentUser || currentUser.role !== 'cliente') {
        clientProjectsList.innerHTML = '<p style="text-align: center; color: #ef4444;">Acesso negado. Esta seção é apenas para clientes.</p>';
        return;
    }

    const clientName = currentUser.name; // Assumindo que o nome do cliente no projeto é o mesmo do nome completo do usuário
    const filteredProjects = projects.filter(p => p.client === clientName);

    if (filteredProjects.length === 0) {
        clientProjectsList.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum projeto encontrado para você.</p>';
        return;
    }

    filteredProjects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <div class="project-header">
                <div>
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-client">${project.client}</p>
                    <p class="project-description">${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
                </div>
                <span class="status-badge status-${project.status.replace(/\s/g, '-').toLowerCase()}">${project.status}</span>
            </div>
            <div class="project-stats">
                <div><span class="project-stat-label">Início:</span> <span class="project-stat-value">${formatDate(project.startDate)}</span></div>
                <div><span class="project-stat-label">Término:</span> <span class="project-stat-value">${formatDate(project.endDate)}</span></div>
                <div><span class="project-stat-label">Gerente:</span> <span class="project-stat-value">${getTechnicianNameById(project.projectLeadId)}</span></div>
            </div>
            <div class="progress-bar">
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${project.progress}%;"></div>
                </div>
                <span class="progress-text">${project.progress}%</span>
            </div>
            <div class="project-footer">
                <div class="team-info">
                    <span>Responsável: ${getTechnicianNameById(project.responsiblePersonId)}</span>
                </div>
                <div class="project-actions">
                    <button class="btn btn-sm btn-secondary" onclick="openProjectViewModal(${project.id})" aria-label="Ver Detalhes">👁️ Ver</button>
                    ${project.biLink ? `<button class="btn btn-sm btn-secondary" onclick="openBiDashboardModal('${project.biLink}', '${project.name}')" aria-label="Abrir Dashboard BI">📊 BI</button>` : ''}
                </div>
            </div>
        `;
        clientProjectsList.appendChild(projectCard);
    });
}

function openNewProjectModal() {
    if (currentUser.role !== 'admin' && currentUser.role !== 'implantador') {
        showNotification('Permissão negada. Apenas administradores e implantadores podem criar projetos.', 'error');
        return;
    }
    currentEditingProject = null; // Reset para um novo projeto
    document.getElementById('projectModalTitle').textContent = 'Novo Projeto';
    document.getElementById('projectName').value = '';
    document.getElementById('projectClient').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectStartDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('projectEndDate').value = '';
    document.getElementById('projectLeadId').value = '';
    document.getElementById('responsiblePersonId').value = '';
    document.getElementById('projectImplementerId').value = '';
    document.getElementById('projectBiLink').value = ''; // Limpa o campo do link BI
    document.getElementById('projectFlow').value = ''; // Limpa a seleção de fluxo
    document.getElementById('editProjectFlowBtn').disabled = true; // Desabilita o botão de edição de fluxo
    document.getElementById('projectOfficialChecklist').value = ''; // Limpa a seleção de checklist oficial
    document.getElementById('editProjectOfficialChecklistBtn').disabled = true; // Desabilita o botão de edição de checklist oficial

    populateTechnicianDropdowns();
    populateFlowDropdown();
    populateOfficialChecklistDropdown();
    populateAttachmentInputs([]); // Limpa os anexos para novo projeto

    document.getElementById('projectModal').classList.add('active');
    document.getElementById('projectName').focus();
}

function openProjectModal(id) {
    if (currentUser.role !== 'admin' && currentUser.role !== 'implantador') {
        showNotification('Permissão negada. Apenas administradores e implantadores podem editar projetos.', 'error');
        return;
    }
    const project = projects.find(p => p.id === id);
    if (project) {
        currentEditingProject = project; // Define o projeto que está sendo editado
        document.getElementById('projectModalTitle').textContent = `Editar Projeto: ${project.name}`;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectClient').value = project.client;
        document.getElementById('projectDescription').value = project.description;
        document.getElementById('projectStartDate').value = project.startDate;
        document.getElementById('projectEndDate').value = project.endDate;
        document.getElementById('projectBiLink').value = project.biLink || ''; // Preenche o campo do link BI

        populateTechnicianDropdowns();
        document.getElementById('projectLeadId').value = project.projectLeadId || '';
        document.getElementById('responsiblePersonId').value = project.responsiblePersonId || '';
        document.getElementById('projectImplementerId').value = project.implementerId || '';

        populateFlowDropdown();
        document.getElementById('projectFlow').value = project.flowId || '';
        document.getElementById('editProjectFlowBtn').disabled = !project.flowId; // Habilita se houver fluxo

        populateOfficialChecklistDropdown();
        document.getElementById('projectOfficialChecklist').value = project.officialChecklistId || '';
        document.getElementById('editProjectOfficialChecklistBtn').disabled = !project.officialChecklistId; // Habilita se houver checklist oficial

        populateAttachmentInputs(project.attachments || []); // Preenche os anexos do projeto

        document.getElementById('projectModal').classList.add('active');
        document.getElementById('projectName').focus();
    }
}

function saveProject() {
    if (currentUser.role !== 'admin' && currentUser.role !== 'implantador') {
        showNotification('Permissão negada. Apenas administradores e implantadores podem salvar projetos.', 'error');
        return;
    }
    const projectName = document.getElementById('projectName').value.trim();
    const projectClient = document.getElementById('projectClient').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    const projectStartDate = document.getElementById('projectStartDate').value;
    const projectEndDate = document.getElementById('projectEndDate').value;
    const projectLeadId = parseInt(document.getElementById('projectLeadId').value) || null;
    const responsiblePersonId = parseInt(document.getElementById('responsiblePersonId').value) || null;
    const projectImplementerId = parseInt(document.getElementById('projectImplementerId').value) || null;
    const projectFlowId = parseInt(document.getElementById('projectFlow').value) || null;
    const projectOfficialChecklistId = parseInt(document.getElementById('projectOfficialChecklist').value) || null;
    const projectBiLink = document.getElementById('projectBiLink').value.trim();

    if (!projectName || !projectClient || !projectStartDate || !projectEndDate) {
        showNotification('Nome do projeto, cliente, data de início e data de término são obrigatórios!', 'error');
        return;
    }

    if (new Date(projectStartDate) > new Date(projectEndDate)) {
        showNotification('A data de término não pode ser anterior à data de início!', 'error');
        return;
    }

    // Coleta os dados dos anexos
    const projectAttachments = [];
    ATTACHMENT_TYPES.forEach(type => {
        const fileInputId = `attachment-file-${type.replace(/\s/g, '')}`;
        const fileInput = document.getElementById(fileInputId);
        if (fileInput && fileInput.files.length > 0) {
            // Em um ambiente real, você faria o upload do arquivo para um servidor
            // Aqui, apenas simulamos o armazenamento do nome do arquivo.
            projectAttachments.push({
                name: type,
                fileName: fileInput.files[0].name,
                url: URL.createObjectURL(fileInput.files[0]) // URL temporária para demonstração
            });
        } else if (currentEditingProject) {
            // Se estiver editando, mantenha os anexos existentes que não foram alterados
            const existingAttachment = currentEditingProject.attachments.find(att => att.name === type);
            if (existingAttachment) {
                projectAttachments.push(existingAttachment);
            }
        }
    });

    if (currentEditingProject) {
        // Atualiza projeto existente
        currentEditingProject.name = projectName;
        currentEditingProject.client = projectClient;
        currentEditingProject.description = projectDescription;
        currentEditingProject.startDate = projectStartDate;
        currentEditingProject.endDate = projectEndDate;
        currentEditingProject.projectLeadId = projectLeadId;
        currentEditingProject.responsiblePersonId = responsiblePersonId;
        currentEditingProject.implementerId = projectImplementerId;
        currentEditingProject.biLink = projectBiLink;
        currentEditingProject.attachments = projectAttachments;

        // Se o fluxo foi alterado, redefina os processos
        if (currentEditingProject.flowId !== projectFlowId) {
            currentEditingProject.flowId = projectFlowId;
            if (projectFlowId) {
                const selectedFlow = flows.find(f => f.id === projectFlowId);
                if (selectedFlow) {
                    // Inicializa os processos com base no fluxo selecionado
                    currentEditingProject.processes = selectedFlow.groups.map(group => ({
                        groupName: group.name,
                        items: group.processes.map(pName => ({ name: pName, status: "Não Implantado", progress: 0 }))
                    }));
                }
            } else {
                currentEditingProject.processes = [];
            }
        }

        // Se o checklist oficial foi alterado, redefina os itens do checklist
        if (currentEditingProject.officialChecklistId !== projectOfficialChecklistId) {
            currentEditingProject.officialChecklistId = projectOfficialChecklistId;
            if (projectOfficialChecklistId) {
                const selectedChecklist = officialChecklists.find(c => c.id === projectOfficialChecklistId);
                if (selectedChecklist) {
                    // Inicializa os itens do checklist com base no checklist selecionado
                    currentEditingProject.officialChecklistItems = selectedChecklist.items.map(item => ({ ...item, completed: false }));
                }
            } else {
                currentEditingProject.officialChecklistItems = [];
            }
        }

        calculateProjectProgress(currentEditingProject); // Recalcula o progresso e status
        showNotification('Projeto atualizado com sucesso!', 'success');
    } else {
        // Cria novo projeto
        const newProjectId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
        const newProject = {
            id: newProjectId,
            name: projectName,
            client: projectClient,
            description: projectDescription,
            status: "Planejamento", // Status inicial
            progress: 0, // Progresso inicial
            startDate: projectStartDate,
            endDate: projectEndDate,
            projectLeadId: projectLeadId,
            responsiblePersonId: responsiblePersonId,
            implementerId: projectImplementerId,
            biLink: projectBiLink,
            attachments: projectAttachments,
            flowId: projectFlowId,
            processes: [],
            officialChecklistId: projectOfficialChecklistId,
            officialChecklistItems: [],
            todoLists: [ // Inicializa com listas padrão
                { id: 1, name: "A fazer", cards: [] },
                { id: 2, name: "Em andamento", cards: [] },
                { id: 3, name: "Concluído", cards: [] }
            ]
        };

        // Se um fluxo foi selecionado, inicializa os processos do projeto
        if (projectFlowId) {
            const selectedFlow = flows.find(f => f.id === projectFlowId);
            if (selectedFlow) {
                newProject.processes = selectedFlow.groups.map(group => ({
                    groupName: group.name,
                    items: group.processes.map(pName => ({ name: pName, status: "Não Implantado", progress: 0 }))
                }));
            }
        }

        // Se um checklist oficial foi selecionado, inicializa os itens do checklist do projeto
        if (projectOfficialChecklistId) {
            const selectedChecklist = officialChecklists.find(c => c.id === projectOfficialChecklistId);
            if (selectedChecklist) {
                newProject.officialChecklistItems = selectedChecklist.items.map(item => ({ ...item, completed: false }));
            }
        }

        projects.push(newProject);
        calculateProjectProgress(newProject); // Recalcula o progresso e status
        showNotification('Projeto criado com sucesso!', 'success');
    }

    saveData();
    closeModal('projectModal');
    loadProjects(); // Recarrega a lista de projetos
    updateDashboardStats(); // Atualiza as estatísticas do dashboard
    renderGanttChart(); // Atualiza o gráfico de Gantt
}

function deleteProject(id) {
    if (currentUser.role !== 'admin' && currentUser.role !== 'implantador') {
        showNotification('Permissão negada. Apenas administradores e implantadores podem excluir projetos.', 'error');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este projeto? Esta ação é irreversível.')) {
        projects = projects.filter(p => p.id !== id);
        saveData();
        loadProjects();
        updateDashboardStats();
        renderGanttChart();
        showNotification('Projeto excluído com sucesso!', 'success');
    }
}

function openProjectViewModal(id) {
    const project = projects.find(p => p.id === id);
    if (project) {
        // Verifica permissão do cliente
        if (currentUser.role === 'cliente' && project.client !== currentUser.name) {
            showNotification('Você não tem permissão para visualizar este projeto.', 'error');
            return;
        }

        document.getElementById('projectViewTitle').textContent = `Detalhes do Projeto: ${project.name}`;
        document.getElementById('viewProjectName').textContent = project.name;
        document.getElementById('viewProjectClient').textContent = project.client;
        document.getElementById('viewProjectDescription').textContent = project.description;
        document.getElementById('viewProjectStartDate').textContent = formatDate(project.startDate);
        document.getElementById('viewProjectEndDate').textContent = formatDate(project.endDate);
        document.getElementById('viewProjectLead').textContent = getTechnicianNameById(project.projectLeadId);
        document.getElementById('viewResponsiblePerson').textContent = getTechnicianNameById(project.responsiblePersonId);
        document.getElementById('viewProjectImplementer').textContent = getTechnicianNameById(project.implementerId);
        document.getElementById('viewProjectStatus').textContent = project.status;
        document.getElementById('viewProjectProgress').textContent = `${project.progress}%`;

        // Exibe o link do BI como texto clicável
        const biLinkTextElement = document.getElementById('viewProjectBiLinkText');
        if (project.biLink) {
            biLinkTextElement.innerHTML = `<a href="${project.biLink}" target="_blank" rel="noopener noreferrer" class="action-btn">Abrir Dashboard BI</a>`;
        } else {
            biLinkTextElement.textContent = 'Nenhum link de BI.';
            biLinkTextElement.innerHTML = '<span style="color: #6b7280;">Nenhum link de BI.</span>';
        }


        // Renderiza os processos do fluxo
        const viewProjectProcessesList = document.getElementById('viewProjectProcessesList');
        viewProjectProcessesList.innerHTML = '';
        const viewProjectFlowName = document.getElementById('viewProjectFlowName');

        if (project.flowId && project.processes && project.processes.length > 0) {
            const flow = flows.find(f => f.id === project.flowId);
            viewProjectFlowName.textContent = flow ? flow.name : 'Fluxo Personalizado';

            project.processes.forEach(group => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'process-group-item';
                groupDiv.innerHTML = `<div class="process-group-title">${group.groupName}</div><ul></ul>`;
                const ul = groupDiv.querySelector('ul');

                group.items.forEach(process => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${process.name}</span>
                        <div class="process-progress-bar">
                            <div class="process-progress-fill" style="width: ${process.progress}%;"></div>
                        </div>
                        <span class="process-progress-text">${process.progress}% (${process.status})</span>
                    `;
                    ul.appendChild(li);
                });
                viewProjectProcessesList.appendChild(groupDiv);
            });
        } else {
            viewProjectFlowName.textContent = 'Nenhum';
            viewProjectProcessesList.innerHTML = '<p style="color: #6b7280;">Nenhum fluxo/processo vinculado a este projeto.</p>';
        }

        // Renderiza os itens do checklist oficial
        updateProjectOfficialChecklistView(project);

        // Renderiza os anexos
        const viewProjectAttachmentsList = document.getElementById('viewProjectAttachmentsList');
        viewProjectAttachmentsList.innerHTML = '';
        if (project.attachments && project.attachments.length > 0) {
            project.attachments.forEach(attachment => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="status-icon">📎</span>
                    <a href="${attachment.url}" target="_blank" rel="noopener noreferrer">${attachment.name}: ${attachment.fileName}</a>
                `;
                viewProjectAttachmentsList.appendChild(li);
            });
        } else {
            viewProjectAttachmentsList.innerHTML = '<li style="color: #6b7280;">Nenhum anexo.</li>';
        }

        document.getElementById('projectViewModal').classList.add('active');
    }
}

function openBiDashboardModal(biLink, projectName) {
    if (!biLink) {
        showNotification('Nenhum link de BI disponível para este projeto.', 'error');
        return;
    }
    document.getElementById('biDashboardTitle').textContent = `Dashboard de BI: ${projectName}`;
    document.getElementById('biIframe').src = biLink;
    document.getElementById('biDashboardModal').classList.add('active');
}

function openUpdateProcessModal(projectId) {
    if (currentUser.role !== 'admin' && currentUser.role !== 'implantador') {
        showNotification('Permissão negada. Apenas administradores e implantadores podem atualizar processos.', 'error');
        return;
    }
    const project = projects.find(p => p.id === projectId);
    if (project) {
        currentProjectToUpdateProcesses = project;
        document.getElementById('updateProcessModalTitle').textContent = `Atualizar Processos: ${project.name}`;
        document.getElementById('updateProcessProjectName').textContent = project.name;
        renderProcessUpdateList();
        document.getElementById('updateProcessModal').classList.add('active');
    }
}

function renderProcessUpdateList() {
    const listContainer = document.getElementById('processUpdateList');
    listContainer.innerHTML = '';
    const project = currentProjectToUpdateProcesses;

    if (!project || !project.processes || project.processes.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum processo configurado para este projeto.</p>';
        return;
    }

    project.processes.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'process-update-list-group';
        groupDiv.innerHTML = `<h4 class="process-update-list-group-title">${group.groupName}</h4>`;

        group.items.forEach(process => {
            const processDiv = document.createElement('div');
            processDiv.className = 'process-update-item';
            processDiv.innerHTML = `
                        <span class="process-name">${process.name}</span>
                        <span class="current-status">Atual: ${process.status}</span>
                        <select class="status-select" onchange="updateProcessStatusAndProgress(${project.id}, '${group.groupName}', '${process.name}', this.value)">
                            <option value="Planejamento Implantação" ${process.status === 'Planejamento Implantação' ? 'selected' : ''}>Planejamento Implantação</option>
                            <option value="Em Andamento" ${process.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                            <option value="Implantado" ${process.status === 'Implantado' ? 'selected' : ''}>Implantado</option>
                            <option value="Aguardando" ${process.status === 'Aguardando' ? 'selected' : ''}>Aguardando</option>
                            <option value="Simulação" ${process.status === 'Simulação' ? 'selected' : ''}>Simulação</option>
                            <option value="Produção" ${process.status === 'Produção' ? 'selected' : ''}>Produção</option>
                            <option value="Final do projeto" ${process.status === 'Final do projeto' ? 'selected' : ''}>Final do projeto</option>
                        </select>
                        <span class="process-update-progress">${process.progress}%</span>
                    `;
            groupDiv.appendChild(processDiv);
        });
        listContainer.appendChild(groupDiv);
    });
}

function updateProcessStatusAndProgress(projectId, groupName, processName, newStatus) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const group = project.processes.find(g => g.groupName === groupName);
    if (!group) return;

    const process = group.items.find(item => item.name === processName);
    if (process) {
        process.status = newStatus;
        if (newStatus === 'Implantado') {
            process.progress = 100;
        } else if (newStatus === 'Em Andamento') {
            if (process.progress === 100) process.progress = 50; // Redefine para 50 se estava 100
            if (process.progress === 0) process.progress = 50; // Define para 50 se estava 0
        } else { // Não Implantado
            process.progress = 0;
        }
        calculateProjectProgress(project); // Recalcula o progresso e status geral do projeto
        renderProcessUpdateList(); // Re-renderiza a lista para mostrar o progresso atualizado
        saveData();
        loadProjects(); // Atualiza a lista principal de projetos
        updateDashboardStats(); // Atualiza as estatísticas do dashboard
    }
}

function saveProcessUpdates() {
    // Todas as atualizações já são salvas por `updateProcessStatusAndProgress`
    showNotification('Alterações nos processos salvas com sucesso!', 'success');
    closeModal('updateProcessModal');
}

// --- Funções de Gerenciamento de Fluxo ---
function openFlowManagerModal() {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem gerenciar fluxos.', 'error');
        return;
    }
    currentEditingFlow = { id: null, name: '', groups: [] }; // Reseta para novo fluxo
    document.getElementById('newFlowName').value = '';
    document.getElementById('newFlowGroupName').value = '';
    document.getElementById('newProcessName').value = '';
    renderCurrentFlowProcesses();
    populateGroupSelectForProcesses();
    loadExistingFlows();
    document.getElementById('flowManagerModal').classList.add('active');
    document.getElementById('newFlowName').focus();
}

function addGroupToCurrentFlow() {
    const groupNameInput = document.getElementById('newFlowGroupName');
    const groupName = groupNameInput.value.trim();
    if (!groupName) {
        showNotification('O nome do grupo é obrigatório!', 'error');
        return;
    }
    if (currentEditingFlow.groups.some(g => g.name === groupName)) {
        showNotification('Já existe um grupo com este nome neste fluxo.', 'error');
        return;
    }
    currentEditingFlow.groups.push({ name: groupName, processes: [] });
    groupNameInput.value = '';
    renderCurrentFlowProcesses();
    populateGroupSelectForProcesses();
}

function addProcessToCurrentFlow() {
    const selectGroup = document.getElementById('selectGroupForProcess');
    const processNameInput = document.getElementById('newProcessName');
    const groupName = selectGroup.value;
    const processName = processNameInput.value.trim();

    if (!groupName) {
        showNotification('Selecione um grupo para adicionar o processo.', 'error');
        return;
    }
    if (!processName) {
        showNotification('O nome do processo é obrigatório!', 'error');
        return;
    }

    const group = currentEditingFlow.groups.find(g => g.name === groupName);
    if (group) {
        if (group.processes.some(p => p === processName)) {
            showNotification('Já existe um processo com este nome neste grupo.', 'error');
            return;
        }
        group.processes.push(processName);
        processNameInput.value = '';
        renderCurrentFlowProcesses();
    }
}

function removeGroupFromCurrentFlow(groupName) {
    currentEditingFlow.groups = currentEditingFlow.groups.filter(g => g.name !== groupName);
    renderCurrentFlowProcesses();
    populateGroupSelectForProcesses();
}

function removeProcessFromCurrentFlow(groupName, processName) {
    const group = currentEditingFlow.groups.find(g => g.name === groupName);
    if (group) {
        group.processes = group.processes.filter(p => p !== processName);
        renderCurrentFlowProcesses();
    }
}

function editGroupInCurrentFlow(oldGroupName) {
    const newGroupName = prompt('Novo nome para o grupo:', oldGroupName);
    if (newGroupName !== null && newGroupName.trim() !== '') {
        const trimmedNewName = newGroupName.trim();
        if (currentEditingFlow.groups.some(g => g.name === trimmedNewName && g.name !== oldGroupName)) {
            showNotification('Já existe um grupo com este nome.', 'error');
            return;
        }
        const group = currentEditingFlow.groups.find(g => g.name === oldGroupName);
        if (group) {
            group.name = trimmedNewName;
            renderCurrentFlowProcesses();
            populateGroupSelectForProcesses();
        }
    }
}

function editProcessInCurrentFlow(groupName, oldProcessName) {
    const newProcessName = prompt('Novo nome para o processo:', oldProcessName);
    if (newProcessName !== null && newProcessName.trim() !== '') {
        const trimmedNewName = newProcessName.trim();
        const group = currentEditingFlow.groups.find(g => g.name === groupName);
        if (group) {
            if (group.processes.some(p => p === trimmedNewName && p !== oldProcessName)) {
                showNotification('Já existe um processo com este nome neste grupo.', 'error');
                return;
            }
            const index = group.processes.indexOf(oldProcessName);
            if (index !== -1) {
                group.processes[index] = trimmedNewName;
                renderCurrentFlowProcesses();
            }
        }
    }
}

function renderCurrentFlowProcesses() {
    const listContainer = document.getElementById('currentFlowProcessesList');
    listContainer.innerHTML = '';

    if (currentEditingFlow.groups && currentEditingFlow.groups.length > 0) {
        currentEditingFlow.groups.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'process-group';
            groupDiv.innerHTML = `
                <div class="process-group-header">
                    <span>${group.name}</span>
                    <div class="group-actions">
                        <button onclick="editGroupInCurrentFlow('${group.name}')" aria-label="Editar Grupo">Editar</button>
                        <button onclick="removeGroupFromCurrentFlow('${group.name}')" aria-label="Excluir Grupo">Excluir</button>
                    </div>
                </div>
                <ul></ul>
            `;
            const ul = groupDiv.querySelector('ul');
            group.processes.forEach(process => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>- ${process}</span>
                    <div>
                        <button onclick="editProcessInCurrentFlow('${group.name}', '${process}')" aria-label="Editar Processo">Editar</button>
                        <button onclick="removeProcessFromCurrentFlow('${group.name}', '${process}')" aria-label="Remover Processo">Remover</button>
                    </div>
                `;
                ul.appendChild(li);
            });
            listContainer.appendChild(groupDiv);
        });
    } else {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center;">Nenhum grupo ou processo adicionado.</p>';
    }
}

function populateGroupSelectForProcesses() {
    const select = document.getElementById('selectGroupForProcess');
    select.innerHTML = '<option value="">Selecione um Grupo</option>'; // Opção padrão
    if (currentEditingFlow && currentEditingFlow.groups) {
        currentEditingFlow.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.name;
            option.textContent = group.name;
            select.appendChild(option);
        });
    }
}

function saveFlow() {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem salvar fluxos.', 'error');
        return;
    }
    const flowNameInput = document.getElementById('newFlowName');
    const flowName = flowNameInput.value.trim();

    if (!flowName) {
        showNotification('O nome do fluxo é obrigatório!', 'error');
        return;
    }
    if (currentEditingFlow.groups.length === 0) {
        showNotification('Adicione pelo menos um grupo de processos ao fluxo.', 'error');
        return;
    }

    // Verifica nomes de fluxo duplicados (insensível a maiúsculas/minúsculas)
    const existingFlowWithName = flows.find(f => f.name.toLowerCase() === flowName.toLowerCase() && f.id !== currentEditingFlow.id);
    if (existingFlowWithName) {
        showNotification('Já existe um fluxo com este nome. Por favor, escolha outro.', 'error');
        return;
    }

    if (currentEditingFlow.id) {
        // Atualiza fluxo existente
        const existingFlowIndex = flows.findIndex(f => f.id === currentEditingFlow.id);
        if (existingFlowIndex !== -1) {
            flows[existingFlowIndex].name = flowName;
            flows[existingFlowIndex].groups = JSON.parse(JSON.stringify(currentEditingFlow.groups)); // Cópia profunda
            showNotification('Fluxo atualizado com sucesso!', 'success');
        }
    } else {
        // Cria novo fluxo
        const newFlow = {
            id: flows.length > 0 ? Math.max(...flows.map(f => f.id)) + 1 : 1,
            name: flowName,
            groups: JSON.parse(JSON.stringify(currentEditingFlow.groups)) // Cópia profunda
        };
        flows.push(newFlow);
        showNotification('Fluxo criado com sucesso!', 'success');
    }

    // Reseta o formulário e recarrega as listas
    flowNameInput.value = '';
    currentEditingFlow = { id: null, name: '', groups: [] };
    renderCurrentFlowProcesses();
    populateGroupSelectForProcesses();
    loadExistingFlows();
    populateFlowDropdown(); // Atualiza o dropdown no modal de projeto
    saveData();
}

function loadExistingFlows() {
    const list = document.getElementById('existingFlowsList');
    list.innerHTML = '';

    if (flows.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum fluxo cadastrado.</p>';
        return;
    }

    flows.forEach(flow => {
        const div = document.createElement('div');
        div.className = 'flow-item';
        let processesSummary = flow.groups.map(g => `${g.name} (${g.processes.length})`).join(', ');
        if (processesSummary.length > 100) processesSummary = processesSummary.substring(0, 97) + '...';

        div.innerHTML = `
            <div class="flow-item-details">
                <div class="flow-item-name">${flow.name}</div>
                <div class="flow-item-processes">Grupos: ${processesSummary || 'Nenhum'}</div>
            </div>
            <div class="flow-item-actions">
                <button class="btn btn-secondary" onclick="editFlow(${flow.id})" aria-label="Editar Fluxo">Editar</button>
                <button class="btn btn-danger" onclick="deleteFlow(${flow.id})" aria-label="Excluir Fluxo">Excluir</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function editFlow(id) {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem editar fluxos.', 'error');
        return;
    }
    const flowToEdit = flows.find(f => f.id === id);
    if (flowToEdit) {
        currentEditingFlow = JSON.parse(JSON.stringify(flowToEdit)); // Cópia profunda
        document.getElementById('newFlowName').value = currentEditingFlow.name;
        renderCurrentFlowProcesses();
        populateGroupSelectForProcesses();
        showNotification(`Editando fluxo: ${flowToEdit.name}`, 'info');
    }
}

function deleteFlow(id) {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem excluir fluxos.', 'error');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este fluxo? Projetos vinculados perderão a referência e seus processos serão removidos.')) {
        flows = flows.filter(f => f.id !== id);

        // Também atualiza projetos que estavam vinculados a este fluxo
        projects.forEach(p => {
            if (p.flowId === id) {
                p.flowId = null;
                p.processes = []; // Limpa os processos se o fluxo for removido
                calculateProjectProgress(p); // Recalcula o progresso do projeto
            }
        });

        loadExistingFlows();
        populateFlowDropdown(); // Atualiza o dropdown
        loadProjects(); // Atualiza a lista principal de projetos caso um projeto tenha perdido seu fluxo
        showNotification('Fluxo excluído com sucesso!', 'success');
        saveData();
    }
}

function populateFlowDropdown() {
    const select = document.getElementById('projectFlow');
    select.innerHTML = '<option value="">Nenhum Fluxo</option>'; // Opção padrão
    flows.forEach(flow => {
        const option = document.createElement('option');
        option.value = flow.id;
        option.textContent = flow.name;
        select.appendChild(option);
    });
}

// --- Função de Importação de Fluxo ---
function importFlowData() {
    const textarea = document.getElementById('flowImportTextarea');
    const text = textarea.value.trim();

    if (!text) {
        showNotification('Cole o texto do fluxo na área de texto primeiro.', 'error');
        return;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const importedGroups = [];
    let currentGroup = null;

    for (const line of lines) {
        if (line.endsWith(':')) {
            const groupName = line.substring(0, line.length - 1).trim();
            if (groupName) {
                currentGroup = { name: groupName, processes: [] };
                importedGroups.push(currentGroup);
            } else {
                showNotification('Formato inválido: Nome de grupo vazio.', 'error');
                return;
            }
        } else if (line.startsWith('-')) {
            if (currentGroup) {
                const processName = line.substring(1).trim();
                if (processName) {
                    currentGroup.processes.push(processName);
                } else {
                    showNotification('Formato inválido: Nome de processo vazio.', 'error');
                    return;
                }
            } else {
                showNotification('Formato inválido: Processo encontrado sem um grupo definido acima.', 'error');
                return;
            }
        } else {
            showNotification(`Formato inválido na linha: "${line}". Use "Nome do Grupo:" ou "- Nome do Processo".`, 'error');
            return;
        }
    }

    if (importedGroups.length === 0) {
        showNotification('Nenhum grupo ou processo válido encontrado no texto importado.', 'error');
        return;
    }

    // Atualiza currentEditingFlow com os dados importados
    currentEditingFlow.groups = importedGroups;
    renderCurrentFlowProcesses();
    populateGroupSelectForProcesses();
    showNotification('Fluxo importado com sucesso! Lembre-se de salvar o fluxo.', 'success');
    textarea.value = ''; // Limpa a área de texto após a importação bem-sucedida
}

// --- Funções de Gerenciamento de Técnicos ---
function openTechnicianManagerModal() {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem cadastrar técnicos.', 'error');
        return;
    }
    currentEditingTechnician = { id: null, name: '', role: '' }; // Reseta para novo técnico
    document.getElementById('technicianName').value = '';
    document.getElementById('technicianRole').value = '';
    loadExistingTechnicians();
    document.getElementById('technicianManagerModal').classList.add('active');
    document.getElementById('technicianName').focus();
}

function saveTechnician() {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem salvar técnicos.', 'error');
        return;
    }
    const nameInput = document.getElementById('technicianName');
    const roleInput = document.getElementById('technicianRole');
    const name = nameInput.value.trim();
    const role = roleInput.value;

    if (!name || !role) {
        showNotification('Nome e Hierarquia do técnico são obrigatórios!', 'error');
        return;
    }

    // Verifica nomes de técnicos duplicados (insensível a maiúsculas/minúsculas)
    const existingTechWithName = technicians.find(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== currentEditingTechnician?.id);
    if (existingTechWithName) {
        showNotification('Já existe um técnico com este nome. Por favor, escolha outro.', 'error');
        return;
    }

    if (currentEditingTechnician && currentEditingTechnician.id) {
        // Atualiza técnico existente
        const existingTechIndex = technicians.findIndex(t => t.id === currentEditingTechnician.id);
        if (existingTechIndex !== -1) {
            technicians[existingTechIndex].name = name;
            technicians[existingTechIndex].role = role;
            showNotification('Técnico atualizado com sucesso!', 'success');
        }
    } else {
        // Cria novo técnico
        const newTechnician = {
            id: technicians.length > 0 ? Math.max(...technicians.map(t => t.id)) + 1 : 1,
            name: name,
            role: role
        };
        technicians.push(newTechnician);
        showNotification('Técnico cadastrado com sucesso!', 'success');
    }

    // Reseta o formulário e recarrega as listas
    nameInput.value = '';
    roleInput.value = '';
    currentEditingTechnician = null;
    loadExistingTechnicians();
    populateTechnicianDropdowns(); // Atualiza os dropdowns no modal de projeto
    saveData();
}

function loadExistingTechnicians() {
    const list = document.getElementById('existingTechniciansList');
    list.innerHTML = '';

    if (technicians.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum técnico cadastrado.</p>';
        return;
    }

    technicians.forEach(tech => {
        const div = document.createElement('div');
        div.className = 'technician-item';
        div.innerHTML = `
            <div class="technician-item-details">
                <div class="technician-item-name">${tech.name}</div>
                <div class="technician-item-role">Hierarquia: ${tech.role}</div>
            </div>
            <div class="technician-item-actions">
                <button class="btn btn-secondary" onclick="editTechnician(${tech.id})" aria-label="Editar Técnico">Editar</button>
                <button class="btn btn-danger" onclick="deleteTechnician(${tech.id})" aria-label="Excluir Técnico">Excluir</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function editTechnician(id) {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem editar técnicos.', 'error');
        return;
    }
    const techToEdit = technicians.find(t => t.id === id);
    if (techToEdit) {
        currentEditingTechnician = { ...techToEdit }; // Cria uma cópia
        document.getElementById('technicianName').value = currentEditingTechnician.name;
        document.getElementById('technicianRole').value = currentEditingTechnician.role;
        showNotification(`Editando técnico: ${techToEdit.name}`, 'info');
    }
}

function deleteTechnician(id) {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem excluir técnicos.', 'error');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este técnico? Projetos vinculados a ele podem ficar sem responsável.')) {
        technicians = technicians.filter(t => t.id !== id);

        // Também atualiza projetos que estavam vinculados a este técnico
        projects.forEach(p => {
            if (p.projectLeadId === id) p.projectLeadId = null;
            if (p.responsiblePersonId === id) p.responsiblePersonId = null;
            if (p.implementerId === id) p.implementerId = null;
        });

        loadExistingTechnicians();
        populateTechnicianDropdowns(); // Atualiza os dropdowns
        loadProjects(); // Atualiza a lista de projetos
        showNotification('Técnico excluído com sucesso!', 'success');
        saveData();
    }
}

function populateTechnicianDropdowns() {
    const projectLeadSelect = document.getElementById('projectLeadId');
    const responsiblePersonSelect = document.getElementById('responsiblePersonId');
    const projectImplementerSelect = document.getElementById('projectImplementerId');

    // Limpa e adiciona opção padrão para todos os selects
    projectLeadSelect.innerHTML = '<option value="">Selecione um Gerente</option>';
    responsiblePersonSelect.innerHTML = '<option value="">Selecione um Responsável</option>';
    projectImplementerSelect.innerHTML = '<option value="">Selecione um Implantador</option>';

    technicians.forEach(tech => {
        if (tech.role === 'Gerente do Projeto') {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.name;
            projectLeadSelect.appendChild(option);
        }
        if (tech.role === 'Responsável pela Equipe') {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.name;
            responsiblePersonSelect.appendChild(option);
        }
        if (tech.role === 'Implantador') {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.name;
            projectImplementerSelect.appendChild(option);
        }
    });
}

// --- Funções de Gerenciamento de Usuários ---
function openUserManagerModal() {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem gerenciar usuários.', 'error');
        return;
    }
    currentEditingUser = null; // Reseta para novo usuário
    document.getElementById('newUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserNameFull').value = '';
    document.getElementById('newUserRole').value = '';
    loadExistingUsers();
    document.getElementById('userManagerModal').classList.add('active');
    document.getElementById('newUsername').focus();
}

function saveUser() {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem salvar usuários.', 'error');
        return;
    }
    const usernameInput = document.getElementById('newUsername');
    const passwordInput = document.getElementById('newUserPassword');
    const nameFullInput = document.getElementById('newUserNameFull');
    const roleInput = document.getElementById('newUserRole');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const nameFull = nameFullInput.value.trim();
    const role = roleInput.value;

    if (!username || !password || !nameFull || !role) {
        showNotification('Todos os campos do usuário são obrigatórios!', 'error');
        return;
    }

    if (currentEditingUser && currentEditingUser.username) {
        // Atualiza usuário existente
        if (users[username] && users[username].username !== currentEditingUser.username) {
            showNotification('Nome de usuário já existe para outro usuário!', 'error');
            return;
        }
        // Se o nome de usuário mudou, exclui a entrada antiga e cria uma nova
        if (username !== currentEditingUser.username) {
            // Preserva as anotações se o nome de usuário mudar
            users[username] = { ...users[currentEditingUser.username], password: password, name: nameFull, role: role };
            delete users[currentEditingUser.username];
        } else {
            users[username].password = password;
            users[username].name = nameFull;
            users[username].role = role;
        }
        showNotification('Usuário atualizado com sucesso!', 'success');
    } else {
        // Cria novo usuário
        if (users[username]) {
            showNotification('Nome de usuário já existe!', 'error');
            return;
        }
        users[username] = {
            password: password,
            name: nameFull,
            role: role,
            notes: [ // Inicializa anotações padrão para novo usuário
                { id: 1, name: "Minhas Tarefas", cards: [] },
                { id: 2, name: "Ideias", cards: [] }
            ]
        };
        showNotification('Usuário cadastrado com sucesso!', 'success');
    }

    // Reseta o formulário e recarrega as listas
    usernameInput.value = '';
    passwordInput.value = '';
    nameFullInput.value = '';
    roleInput.value = '';
    currentEditingUser = null;
    loadExistingUsers();
    saveData();
}

function loadExistingUsers() {
    const list = document.getElementById('existingUsersList');
    list.innerHTML = '';

    const userKeys = Object.keys(users);

    if (userKeys.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum usuário cadastrado.</p>';
        return;
    }

    userKeys.forEach(username => {
        const user = users[username];
        const div = document.createElement('div');
        div.className = 'user-item-manage';
        div.innerHTML = `
            <div class="user-item-details">
                <div class="user-item-name"><strong>${username}</strong> (${user.name})</div>
                <div class="user-item-role">Hierarquia: ${user.role}</div>
            </div>
            <div class="user-item-actions">
                <button class="btn btn-secondary" onclick="editUser('${username}')" aria-label="Editar Usuário">Editar</button>
                <button class="btn btn-danger" onclick="deleteUser('${username}')" aria-label="Excluir Usuário">Excluir</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function editUser(username) {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem editar usuários.', 'error');
        return;
    }
    const userToEdit = users[username];
    if (userToEdit) {
        currentEditingUser = { username: username, ...userToEdit }; // Armazena o nome de usuário para edição
        document.getElementById('newUsername').value = username;
        document.getElementById('newUserPassword').value = userToEdit.password;
        document.getElementById('newUserNameFull').value = userToEdit.name;
        document.getElementById('newUserRole').value = userToEdit.role;
        showNotification(`Editando usuário: ${username}`, 'info');
    }
}

function deleteUser(username) {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem excluir usuários.', 'error');
        return;
    }
    if (username === currentUser.username) {
        showNotification('Você não pode excluir o seu próprio usuário!', 'error');
        return;
    }
    if (confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) {
        delete users[username];
        loadExistingUsers();
        showNotification('Usuário excluído com sucesso!', 'success');
        saveData();
    }
}

// --- Preenchimento de Entradas de Arquivo de Anexo ---
function populateAttachmentInputs(projectAttachments = []) {
    const container = document.getElementById('projectAttachmentsInputs');
    container.innerHTML = ''; // Limpa as entradas anteriores

    ATTACHMENT_TYPES.forEach(type => {
        const attachment = projectAttachments.find(att => att.name === type);
        const fileName = attachment ? attachment.fileName : '';
        const fileInputId = `attachment-file-${type.replace(/\s/g, '')}`;
        const fileNameDisplayId = `file-name-display-${type.replace(/\s/g, '')}`;

        const div = document.createElement('div');
        div.className = 'attachment-file-group';
        div.innerHTML = `
            <label>${type}</label>
            <span class="file-name-display" id="${fileNameDisplayId}">${fileName || 'Nenhum arquivo selecionado'}</span>
            <input type="file" id="${fileInputId}" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png">
            <button type="button" class="btn btn-secondary btn-attach" onclick="document.getElementById('${fileInputId}').click()" aria-label="Anexar arquivo para ${type}">Anexar</button>
            <button type="button" class="btn btn-danger btn-clear" onclick="clearAttachment('${fileInputId}', '${fileNameDisplayId}')" ${fileName ? '' : 'disabled'} aria-label="Remover arquivo para ${type}">Remover</button>
        `;
        container.appendChild(div);

        // Adiciona um listener de evento para atualizar a exibição do nome do arquivo
        document.getElementById(fileInputId).addEventListener('change', function() {
            const display = document.getElementById(fileNameDisplayId);
            const clearBtn = this.nextElementSibling.nextElementSibling; // Pega o botão de limpar
            if (this.files.length > 0) {
                display.textContent = this.files[0].name;
                clearBtn.disabled = false;
            } else {
                display.textContent = 'Nenhum arquivo selecionado';
                clearBtn.disabled = true;
            }
        });
    });
}

function clearAttachment(fileInputId, fileNameDisplayId) {
    const fileInput = document.getElementById(fileInputId);
    const fileNameDisplay = document.getElementById(fileNameDisplayId);
    const clearBtn = fileInput.nextElementSibling.nextElementSibling; // Pega o botão de limpar

    fileInput.value = ''; // Limpa o arquivo selecionado
    fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
    clearBtn.disabled = true;
}

// --- Funções do Gráfico de Gantt (Adaptadas para Grupos) ---
function renderGanttChart() {
    const ganttContainer = document.getElementById('ganttChartContainer');
    ganttContainer.innerHTML = ''; // Limpa o gráfico anterior

    let projectsToRender = projects;
    // Se for cliente, mostra apenas seus projetos no Gantt
    if (currentUser.role === 'cliente') {
        projectsToRender = projects.filter(p => p.client === currentUser.name);
    }

    if (projectsToRender.length === 0) {
        ganttContainer.innerHTML = '<p class="gantt-no-projects">Nenhum projeto para exibir no cronograma.</p>';
        return;
    }

    // Determina o intervalo geral de datas para o gráfico
    let allDates = [];
    projectsToRender.forEach(p => {
        if (p.startDate) allDates.push(new Date(p.startDate + 'T00:00:00'));
        if (p.endDate) allDates.push(new Date(p.endDate + 'T00:00:00'));
    });

    if (allDates.length === 0) {
        ganttContainer.innerHTML = '<p class="gantt-no-projects">Nenhum projeto com datas definidas para exibir no cronograma.</p>';
        return;
    }

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Adiciona algum preenchimento às datas mín/máx para melhor visualização
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    const totalDaysOverall = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    // Adiciona linha de cabeçalho para o gráfico
    const headerRow = document.createElement('div');
    headerRow.className = 'gantt-chart-header';
    headerRow.innerHTML = `
        <div class="gantt-col-name">Projeto</div>
        <div class="gantt-col-bar">Progresso Geral</div>
        <div class="gantt-col-status">Status</div>
        <div class="gantt-col-dates">Período</div>
    `;
    ganttContainer.appendChild(headerRow);

    projectsToRender.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)); // Ordena por data de início

    projectsToRender.forEach(project => {
        const projectStartDate = new Date(project.startDate + 'T00:00:00');
        const projectEndDate = new Date(project.endDate + 'T00:00:00');

        if (isNaN(projectStartDate) || isNaN(projectEndDate)) {
            console.warn(`Projeto "${project.name}" tem datas inválidas e será ignorado no Gantt.`);
            return; // Ignora projetos com datas inválidas
        }

        const startOffsetDays = (projectStartDate - minDate) / (1000 * 60 * 60 * 24);
        const durationDays = (projectEndDate - projectStartDate) / (1000 * 60 * 60 * 24);

        const barLeft = (startOffsetDays / totalDaysOverall) * 100;
        const barWidth = (durationDays / totalDaysOverall) * 100;
        const progressWidth = project.progress; // Já é uma porcentagem

        const projectRow = document.createElement('div');
        projectRow.className = 'gantt-project-row';

        const mainProjectBarHtml = `
            <div class="gantt-project-main">
                <div class="gantt-project-name">${project.name}</div>
                <div class="gantt-bar-container">
                    <div class="gantt-bar" style="left: ${barLeft}%; width: ${barWidth}%;">
                        <div class="gantt-progress-overlay" style="width: ${progressWidth}%;"></div>
                    </div>
                </div>
                <div class="gantt-status-text">${project.status}</div>
                <div class="gantt-date-range">${formatDate(project.startDate)} - ${formatDate(project.endDate)}</div>
            </div>
        `;
        projectRow.innerHTML += mainProjectBarHtml;

        // Adiciona processos se disponíveis (adaptado para grupos)
        if (project.processes && project.processes.length > 0) {
            let processesHtml = '<div class="gantt-process-list">';
            project.processes.forEach(group => {
                processesHtml += `<div class="gantt-process-group">${group.groupName}</div><ul>`;
                group.items.forEach(process => {
                    processesHtml += `
                        <li>
                            <span class="process-name">${process.name}</span>
                            <div class="process-bar-container">
                                <div class="process-bar-fill" style="width: ${process.progress}%;"></div>
                            </div>
                            <span class="process-status-text">${process.progress}% (${process.status})</span>
                        </li>
                    `;
                });
                processesHtml += '</ul>';
            });
            processesHtml += '</div>';
            projectRow.innerHTML += processesHtml;
        } else {
            projectRow.innerHTML += `<div class="gantt-process-list" style="padding-left: 25%; font-size: 0.8rem; color: #9ca3af;">Nenhum fluxo/processo vinculado.</div>`;
        }

        ganttContainer.appendChild(projectRow);
    });
}

// --- Funções de Board Genérico (Pendências/Anotações) ---
let currentBoardData = null; // Contém currentTodoProject ou users[currentUser.username]
let currentBoardType = null; // 'todo' ou 'notes'
let currentCardDetail = null; // Contém o cartão atualmente sendo visualizado/editado no modal de detalhes
let currentCardDetailList = null; // Contém a lista do cartão sendo visualizado/editado

const boardConfigs = {
    todo: {
        boardId: 'todoBoard',
        modalId: 'todoModal',
        modalTitleId: 'todoModalTitle',
        cardDetailModalId: 'todoCardDetailModal',
        cardDetailTitleId: 'todoCardDetailTitle',
        cardDetailNameId: 'todoCardDetailName',
        cardDetailDescriptionId: 'todoCardDetailDescription',
        cardDetailChecklistItemsId: 'todoCardDetailChecklistItems',
        cardDetailProgressId: 'todoCardDetailProgress',
        cardDetailNewItemId: 'todoCardDetailNewItem',
        cardCompletedClass: 'card-completed',
        listPrefix: 'todo',
        cardPrefix: 'todo',
        formPrefix: 'todo',
        dataAccessor: () => currentBoardData.todoLists,
        setData: (data) => { if (currentBoardData) currentBoardData.todoLists = data; },
        titlePrefix: 'Pendências',
        addCardText: '+ Adicionar cartão',
        addListText: '+ Adicionar Lista',
        dragType: 'todo',
        canDrag: () => currentUser.role === 'admin' || currentUser.role === 'implantador'
    },
    notes: {
        boardId: 'notesBoard',
        modalId: 'notesModal',
        modalTitleId: 'notesModalTitle',
        cardDetailModalId: 'notesCardDetailModal',
        cardDetailTitleId: 'notesCardDetailTitle',
        cardDetailNameId: 'notesCardDetailName',
        cardDetailDescriptionId: 'notesCardDetailDescription',
        cardDetailChecklistItemsId: 'notesCardDetailChecklistItems',
        cardDetailProgressId: 'notesCardDetailProgress',
        cardDetailNewItemId: 'notesCardDetailNewItem',
        cardCompletedClass: 'card-completed',
        listPrefix: 'notes',
        cardPrefix: 'note',
        formPrefix: 'notes',
        dataAccessor: () => users[currentUser.username].notes,
        setData: (data) => { if (currentUser && users[currentUser.username]) users[currentUser.username].notes = data; },
        titlePrefix: 'Minhas Anotações',
        addCardText: '+ Adicionar anotação',
        addListText: '+ Adicionar Lista',
        dragType: 'note',
        canDrag: () => true // Todos os usuários podem arrastar suas próprias anotações
    }
};

function openBoardModal(type, projectId = null) {
    if (!currentUser) {
        showNotification('Você precisa estar logado para acessar.', 'error');
        return;
    }
    const config = boardConfigs[type];
    if (!config) return;

    currentBoardType = type;
    currentCardDetail = null;
    currentCardDetailList = null;

    if (type === 'todo') {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        // Verificação de permissão do cliente
        if (currentUser.role === 'cliente' && project.client !== currentUser.name) {
            showNotification('Você não tem permissão para visualizar as pendências deste projeto.', 'error');
            return;
        }

        // Garante que as listas de pendências existam para o projeto
        if (!project.todoLists) {
            project.todoLists = [
                { id: 1, name: "A fazer", cards: [] },
                { id: 2, name: "Em andamento", cards: [] },
                { id: 3, name: "Concluído", cards: [] }
            ];
        }
        currentBoardData = project;
        document.getElementById(config.modalTitleId).textContent = `${config.titlePrefix}: ${project.name}`;
    } else if (type === 'notes') {
        // Garante que as anotações existam para o usuário atual
        if (!users[currentUser.username].notes) {
            users[currentUser.username].notes = [
                { id: 1, name: "Minhas Tarefas", cards: [] },
                { id: 2, name: "Ideias", cards: [] }
            ];
        }
        currentBoardData = users[currentUser.username];
        document.getElementById(config.modalTitleId).textContent = `${config.titlePrefix} (${currentUser.name})`;
    }

    renderBoard(config);
    document.getElementById(config.modalId).classList.add('active');
}

function renderBoard(config) {
    const board = document.getElementById(config.boardId);
    board.innerHTML = '';
    const lists = config.dataAccessor();
    if (!lists) return;

    lists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = 'board-list';
        listElement.innerHTML = `
            <div class="board-list-header">
                <span class="board-list-title">${list.name}</span>
                <button class="btn btn-sm btn-secondary" onclick="editListName(${list.id}, '${config.listPrefix}')" aria-label="Editar nome da lista">✏️</button>
            </div>
            <div class="board-list-content"
                    id="${config.listPrefix}-list-content-${list.id}"
                    ondragover="handleDragOver(event)"
                    ondragenter="handleDragEnter(event, ${list.id}, '${config.listPrefix}')"
                    ondragleave="handleDragLeave(event, ${list.id}, '${config.listPrefix}')"
                    ondrop="handleDrop(event, ${list.id}, '${config.listPrefix}')">
                ${list.cards.map(card => createCardHTML(card, list.id, config.cardPrefix, config.cardCompletedClass)).join('')}
            </div>
            <div class="board-add-card" onclick="showAddCardForm(${list.id}, '${config.listPrefix}')">${config.addCardText}</div>
        `;
        board.appendChild(listElement);
    });

    const addListElement = document.createElement('div');
    addListElement.className = 'board-add-list';
    addListElement.innerHTML = config.addListText;
    addListElement.onclick = () => showAddListForm(config.listPrefix);
    board.appendChild(addListElement);
}

function createCardHTML(card, listId, cardPrefix, completedClass) {
    let completedCount = 0;
    let totalItems = 0;
    if (card.checklistItems && card.checklistItems.length > 0) {
        totalItems = card.checklistItems.length;
        completedCount = card.checklistItems.filter(item => item.completed).length;
    }
    const progressPercent = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    return `
        <div class="board-card"
                    draggable="true"
                    id="${cardPrefix}-card-${card.id}"
                    ondragstart="handleDragStart(event, ${card.id}, ${listId}, '${cardPrefix}')"
                    onclick="openCardDetail(${card.id}, '${cardPrefix}')">
            <div class="board-card-title">
                ${card.name}
                ${card.completed ? '<span style="color: #10b981;">✓</span>' : ''}
            </div>
            ${card.description ? `<div class="board-card-description">${card.description.substring(0, 100)}${card.description.length > 100 ? '...' : ''}</div>` : ''}
            ${totalItems > 0 ? `
                <div class="board-card-progress">
                    <div class="board-card-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div style="text-align: right; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
                    ${completedCount}/${totalItems} tarefas
                </div>
            ` : ''}
        </div>
    `;
}

// --- Manipuladores de Drag and Drop para Cartões Genéricos ---
let draggedCardId = null;
let draggedCardSourceListId = null;
let draggedCardType = null;

function handleDragStart(event, cardId, listId, type) {
    const config = boardConfigs[type === 'todo' ? 'todo' : 'notes'];
    if (!config.canDrag()) {
        event.preventDefault(); // Previne o arrasto se não autorizado
        showNotification('Permissão negada. Você não pode mover cartões.', 'error');
        return;
    }
    draggedCardId = cardId;
    draggedCardSourceListId = listId;
    draggedCardType = type;
    event.dataTransfer.setData('text/plain', JSON.stringify({ type: type, cardId: cardId, listId: listId }));
    event.currentTarget.classList.add('dragging');
}

function handleDragOver(event) {
    event.preventDefault(); // Permite o drop
}

function handleDragEnter(event, listId, listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    if (!config.canDrag()) {
        return;
    }
    event.preventDefault(); // Necessário para o drop funcionar
    const dataTransferType = event.dataTransfer.types.includes('text/plain') ? JSON.parse(event.dataTransfer.getData('text/plain')).type : null;
    if (dataTransferType === config.dragType) {
        document.getElementById(`${listPrefix}-list-content-${listId}`).classList.add('drag-over');
    }
}

function handleDragLeave(event, listId, listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    if (!config.canDrag()) {
        return;
    }
    document.getElementById(`${listPrefix}-list-content-${listId}`).classList.remove('drag-over');
}

function handleDrop(event, targetListId, listPrefix) {
    event.preventDefault();
    document.getElementById(`${listPrefix}-list-content-${targetListId}`).classList.remove('drag-over');

    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    if (!config.canDrag()) {
        showNotification('Permissão negada. Você não pode mover cartões.', 'error');
        return;
    }

    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    if (data.type !== config.dragType) return; // Garante que é o tipo correto de cartão sendo solto

    const cardId = data.cardId;
    const sourceListId = data.listId;

    if (sourceListId === targetListId) {
        showNotification('Cartão já está nesta lista. Para reordenar, arraste e solte em uma posição específica (funcionalidade não implementada).', 'info');
        const draggedElement = document.getElementById(`${listPrefix}-card-${cardId}`);
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
        }
        draggedCardId = null;
        draggedCardSourceListId = null;
        draggedCardType = null;
        return;
    }

    const lists = config.dataAccessor();
    const sourceList = lists.find(l => l.id === sourceListId);
    const targetList = lists.find(l => l.id === targetListId);

    if (sourceList && targetList) {
        const cardIndex = sourceList.cards.findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
            const [movedCard] = sourceList.cards.splice(cardIndex, 1);
            targetList.cards.push(movedCard); // Adiciona ao final da lista de destino
            renderBoard(config); // Re-renderiza o board inteiro para refletir as mudanças
            showNotification(`Cartão "${movedCard.name}" movido para "${targetList.name}"!`, 'success');
            saveData();
        }
    }

    // Limpa os estilos de arrasto
    const draggedElement = document.getElementById(`${listPrefix}-card-${cardId}`);
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    draggedCardId = null;
    draggedCardSourceListId = null;
    draggedCardType = null;
}

function showAddCardForm(listId, listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    const listContent = document.getElementById(`${listPrefix}-list-content-${listId}`);

    // Remove qualquer formulário de adição de cartão existente antes de adicionar um novo
    const existingForm = listContent.querySelector(`.${config.formPrefix}-form`);
    if (existingForm) {
        existingForm.remove();
    }

    const formHtml = `
        <div class="${config.formPrefix}-form">
            <div class="${config.formPrefix}-form-group">
                <label class="${config.formPrefix}-form-label">Título do cartão</label>
                <input type="text" id="new-${config.cardPrefix}-card-name-${listId}" class="${config.formPrefix}-form-input">
            </div>
            <div class="${config.formPrefix}-form-actions">
                <button class="btn btn-secondary btn-sm" onclick="cancelAddCard(${listId}, '${listPrefix}')">Cancelar</button>
                <button class="btn btn-primary btn-sm" onclick="addNewCard(${listId}, '${listPrefix}')">Adicionar</button>
            </div>
        </div>
    `;
    listContent.insertAdjacentHTML('beforeend', formHtml);
    document.getElementById(`new-${config.cardPrefix}-card-name-${listId}`).focus();
}

function cancelAddCard(listId, listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    renderBoard(config); // Rerenderiza para remover o formulário
}

function addNewCard(listId, listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    const nameInput = document.getElementById(`new-${config.cardPrefix}-card-name-${listId}`);
    const name = nameInput.value.trim();

    if (!name) {
        showNotification('O título do cartão é obrigatório.', 'error');
        return;
    }

    const lists = config.dataAccessor();
    const list = lists.find(l => l.id === listId);

    if (list) {
        const newId = list.cards.length > 0
            ? Math.max(...list.cards.map(c => c.id)) + 1
            : 1;
        list.cards.push({
            id: newId,
            name: name,
            description: '',
            completed: false, // Cartão não está completo por padrão
            checklistItems: []
        });
        renderBoard(config);
        showNotification('Cartão adicionado com sucesso!', 'success');
        saveData();
    }
}

function showAddListForm(listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    const board = document.getElementById(config.boardId);

    // Remove o botão "Adicionar lista" temporariamente
    const addListButton = board.querySelector('.board-add-list');
    if (addListButton) {
        addListButton.remove();
    }

    const formElement = document.createElement('div');
    formElement.className = 'board-list';
    formElement.innerHTML = `
        <div class="${config.formPrefix}-form">
            <div class="${config.formPrefix}-form-group">
                <label class="${config.formPrefix}-form-label">Nome da lista</label>
                <input type="text" id="new-${config.listPrefix}-list-name" class="${config.formPrefix}-form-input">
            </div>
            <div class="${config.formPrefix}-form-actions">
                <button class="btn btn-secondary btn-sm" onclick="cancelAddList('${listPrefix}')">Cancelar</button>
                <button class="btn btn-primary btn-sm" onclick="addNewList('${listPrefix}')">Adicionar</button>
            </div>
        </div>
    `;
    board.appendChild(formElement);
    document.getElementById(`new-${config.listPrefix}-list-name`).focus();
}

function cancelAddList(listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    renderBoard(config); // Rerenderiza para voltar ao estado normal
}

function addNewList(listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    const nameInput = document.getElementById(`new-${config.listPrefix}-list-name`);
    const name = nameInput.value.trim();

    if (!name) {
        showNotification('O nome da lista é obrigatório.', 'error');
        return;
    }

    const lists = config.dataAccessor();
    const newId = lists.length > 0
        ? Math.max(...lists.map(l => l.id)) + 1
        : 1;

    lists.push({
        id: newId,
        name: name,
        cards: []
    });
    config.setData(lists); // Atualiza a estrutura de dados principal
    renderBoard(config);
    showNotification('Lista adicionada com sucesso!', 'success');
    saveData();
}

function editListName(listId, listPrefix) {
    const config = boardConfigs[listPrefix === 'todo' ? 'todo' : 'notes'];
    const lists = config.dataAccessor();
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const newName = prompt('Novo nome para a lista:', list.name);
    if (newName !== null && newName.trim() !== '') {
        list.name = newName.trim();
        config.setData(lists); // Atualiza a estrutura de dados principal
        renderBoard(config);
        saveData();
    }
}

function openCardDetail(cardId, cardPrefix) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    const lists = config.dataAccessor();
    let foundCard = null;
    let foundList = null;

    for (const list of lists) {
        const card = list.cards.find(c => c.id === cardId);
        if (card) {
            foundCard = card;
            foundList = list;
            break;
        }
    }

    if (!foundCard) return;

    currentCardDetail = foundCard;
    currentCardDetailList = foundList;

    document.getElementById(config.cardDetailTitleId).textContent = `${config.titlePrefix}: ${foundCard.name}`;
    document.getElementById(config.cardDetailNameId).value = foundCard.name;
    document.getElementById(config.cardDetailDescriptionId).value = foundCard.description || '';

    renderChecklistItems(config);

    document.getElementById(config.cardDetailModalId).classList.add('active');
    document.getElementById(config.cardDetailNameId).focus();
}

function renderChecklistItems(config) {
    const container = document.getElementById(config.cardDetailChecklistItemsId);
    container.innerHTML = '';

    if (!currentCardDetail.checklistItems) {
        currentCardDetail.checklistItems = [];
    }

    if (currentCardDetail.checklistItems.length === 0) {
        container.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 1rem;">Sem itens no check-list. Adicione o primeiro item acima.</div>';
    } else {
        currentCardDetail.checklistItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'card-detail-checklist-item';
            itemElement.innerHTML = `
                <input type="checkbox" class="card-detail-checklist-item-checkbox"
                    id="${config.cardPrefix}-checklist-item-${index}"
                    ${item.completed ? 'checked' : ''}
                    onchange="toggleChecklistItem(${index}, this.checked, '${config.cardPrefix}')">
                <div class="card-detail-checklist-item-content">
                    <div class="card-detail-checklist-item-text ${item.completed ? config.cardCompletedClass : ''}">
                        ${item.text}
                    </div>
                    ${item.description ? `
                        <div class="card-detail-checklist-item-description">
                            ${item.description}
                        </div>
                    ` : ''}
                    <div class="card-detail-checklist-item-actions">
                        <button class="btn btn-sm btn-secondary" onclick="editChecklistItem(${index}, '${config.cardPrefix}')" aria-label="Editar item do checklist">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteChecklistItem(${index}, '${config.cardPrefix}')" aria-label="Excluir item do checklist">Excluir</button>
                    </div>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }

    // Atualiza o contador de progresso
    const completedCount = currentCardDetail.checklistItems.filter(item => item.completed).length;
    const totalCount = currentCardDetail.checklistItems.length;
    document.getElementById(config.cardDetailProgressId).textContent = `${completedCount}/${totalCount}`;
}

function toggleChecklistItem(index, checked, cardPrefix) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    if (index >= 0 && index < currentCardDetail.checklistItems.length) {
        currentCardDetail.checklistItems[index].completed = checked;
        renderChecklistItems(config);
    }
}

function addChecklistItem(cardPrefix) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    const input = document.getElementById(config.cardDetailNewItemId);
    const text = input.value.trim();

    if (!text) {
        showNotification('O texto do item é obrigatório.', 'error');
        return;
    }

    currentCardDetail.checklistItems.push({
        text: text,
        description: '',
        completed: false
    });
    input.value = '';
    renderChecklistItems(config);
}

function editChecklistItem(index, cardPrefix) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    if (index < 0 || index >= currentCardDetail.checklistItems.length) return;

    const item = currentCardDetail.checklistItems[index];

    // Substitui o item no DOM por um formulário
    const itemElement = document.getElementById(config.cardDetailChecklistItemsId).children[index];
    const originalHTML = itemElement.innerHTML; // Armazena o HTML original para restaurar ao cancelar

    itemElement.innerHTML = `
        <div class="${config.formPrefix}-form" style="padding: 0.5rem 0">
            <div class="${config.formPrefix}-form-group" style="margin-bottom: 0.5rem">
                <label class="${config.formPrefix}-form-label">Texto</label>
                <input type="text" id="edit-${config.cardPrefix}-item-text-${index}" class="${config.formPrefix}-form-input" value="${item.text}">
            </div>
            <div class="${config.formPrefix}-form-group">
                <label class="${config.formPrefix}-form-label">Descrição/Observação (opcional)</label>
                <textarea id="edit-${config.cardPrefix}-item-description-${index}" class="${config.formPrefix}-form-textarea">${item.description || ''}</textarea>
            </div>
            <div class="${config.formPrefix}-form-actions">
                <button class="btn btn-secondary btn-sm" onclick="cancelEditChecklistItem(${index}, '${config.cardPrefix}', '${originalHTML.replace(/'/g, "\\'")}')">Cancelar</button>
                <button class="btn btn-primary btn-sm" onclick="saveChecklistItemEdit(${index}, '${config.cardPrefix}')">Salvar</button>
            </div>
        </div>
    `;
    document.getElementById(`edit-${config.cardPrefix}-item-text-${index}`).focus();
}

function cancelEditChecklistItem(index, cardPrefix, originalHTML) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    const itemElement = document.getElementById(config.cardDetailChecklistItemsId).children[index];
    itemElement.innerHTML = originalHTML;
}

function saveChecklistItemEdit(index, cardPrefix) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    if (index < 0 || index >= currentCardDetail.checklistItems.length) return;

    const textInput = document.getElementById(`edit-${config.cardPrefix}-item-text-${index}`);
    const descriptionInput = document.getElementById(`edit-${config.cardPrefix}-item-description-${index}`);

    const text = textInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!text) {
        showNotification('O texto do item é obrigatório.', 'error');
        return;
    }

    currentCardDetail.checklistItems[index].text = text;
    currentCardDetail.checklistItems[index].description = description;

    renderChecklistItems(config);
}

function deleteChecklistItem(index, cardPrefix) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    if (index < 0 || index >= currentCardDetail.checklistItems.length) return;

    if (confirm('Tem certeza que deseja excluir este item?')) {
        currentCardDetail.checklistItems.splice(index, 1);
        renderChecklistItems(config);
    }
}

function saveCardDetail(cardPrefix) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    if (!currentCardDetail) return;

    const name = document.getElementById(config.cardDetailNameId).value.trim();
    const description = document.getElementById(config.cardDetailDescriptionId).value.trim();

    if (!name) {
        showNotification('O título do cartão é obrigatório.', 'error');
        return;
    }

    currentCardDetail.name = name;
    currentCardDetail.description = description;

    // Verifica se todos os itens do checklist estão concluídos
    const allCompleted = currentCardDetail.checklistItems.length > 0 &&
                                 currentCardDetail.checklistItems.every(item => item.completed);
    currentCardDetail.completed = allCompleted; // Atualiza o status geral de conclusão do cartão

    closeModal(config.cardDetailModalId);
    renderBoard(config); // Re-renderiza o board para atualizar a exibição do cartão
    showNotification('Cartão salvo com sucesso!', 'success');
    saveData();
}

function deleteCard(cardPrefix) {
    const config = boardConfigs[cardPrefix === 'todo' ? 'todo' : 'notes'];
    if (!currentCardDetail || !currentCardDetailList) return;

    if (confirm('Tem certeza que deseja excluir este cartão?')) {
        const cardIndex = currentCardDetailList.cards.findIndex(c => c.id === currentCardDetail.id);
        if (cardIndex !== -1) {
            currentCardDetailList.cards.splice(cardIndex, 1);
            closeModal(config.cardDetailModalId);
            renderBoard(config);
            showNotification('Cartão excluído com sucesso!', 'success');
            saveData();
        }
    }
}

function saveChanges(type) {
    // As alterações já são salvas diretamente no objeto do projeto/usuário e depois no localStorage
    showNotification('Alterações salvas com sucesso!', 'success');
    closeModal(boardConfigs[type].modalId);
}

// Wrappers específicos para funções existentes usarem o modal de board genérico
function openTodoModal(projectId) {
    openBoardModal('todo', projectId);
}

function openNotesModal() {
    openBoardModal('notes');
}

// --- Sistema de Busca Geral ---
function openGeneralSearchModal() {
    if (!currentUser) {
        showNotification('Você precisa estar logado para usar a busca geral.', 'error');
        return;
    }
    document.getElementById('generalSearchInput').value = ''; // Limpa o input
    document.getElementById('searchResultsList').innerHTML = '<p style="text-align: center; color: #6b7280;">Digite sua busca e pressione "Pesquisar".</p>';
    document.getElementById('generalSearchModal').classList.add('active');
    document.getElementById('generalSearchInput').focus();
}

function performGeneralSearch() {
    const searchTerm = document.getElementById('generalSearchInput').value.trim().toLowerCase();
    const resultsList = document.getElementById('searchResultsList');
    resultsList.innerHTML = ''; // Limpa os resultados anteriores

    if (!searchTerm) {
        resultsList.innerHTML = '<p style="text-align: center; color: #6b7280;">Digite sua busca e pressione "Pesquisar".</p>';
        return;
    }

    const searchResults = [];

    // 1. Busca nas anotações do usuário atual
    if (currentUser && users[currentUser.username] && users[currentUser.username].notes) {
        users[currentUser.username].notes.forEach(list => {
            list.cards.forEach(card => {
                const cardName = card.name.toLowerCase();
                const cardDescription = card.description ? card.description.toLowerCase() : '';
                if (cardName.includes(searchTerm) || cardDescription.includes(searchTerm)) {
                    searchResults.push({
                        type: 'note',
                        cardId: card.id,
                        listId: list.id,
                        title: card.name,
                        description: card.description,
                        context: `Anotação em: ${list.name}`
                    });
                }
            });
        });
    }

    // 2. Busca nas listas de pendências de todos os projetos
    projects.forEach(project => {
        // Apenas busca em projetos que o usuário atual tem acesso (ex: se cliente, apenas seus projetos)
        let canAccessProject = true;
        if (currentUser.role === 'cliente' && project.client !== currentUser.name) {
            canAccessProject = false;
        }

        if (canAccessProject && project.todoLists) {
            project.todoLists.forEach(list => {
                list.cards.forEach(card => {
                    const cardName = card.name.toLowerCase();
                    const cardDescription = card.description ? card.description.toLowerCase() : '';
                    if (cardName.includes(searchTerm) || cardDescription.includes(searchTerm)) {
                        searchResults.push({
                            type: 'todo',
                            projectId: project.id,
                            cardId: card.id,
                            listId: list.id,
                            title: card.name,
                            description: card.description,
                            context: `Pendência em: ${project.name} - ${list.name}`
                        });
                    }
                });
            });
        }
    });

    renderSearchResults(searchResults);
}

function renderSearchResults(results) {
    const resultsList = document.getElementById('searchResultsList');
    resultsList.innerHTML = '';

    if (results.length === 0) {
        resultsList.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum resultado encontrado para sua busca.</p>';
        return;
    }

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <div class="search-result-item-title">${result.title}</div>
            <div class="search-result-item-context">${result.context}</div>
            ${result.description ? `<div class="search-result-item-description">${result.description.substring(0, 150)}${result.description.length > 150 ? '...' : ''}</div>` : ''}
        `;
        resultItem.onclick = () => openSearchResult(result.type, result.cardId, result.listId, result.projectId);
        resultsList.appendChild(resultItem);
    });
}

function openSearchResult(type, cardId, listId, projectId) {
    closeModal('generalSearchModal'); // Fecha o modal de busca primeiro

    if (type === 'note') {
        // Encontra o cartão de anotação específico e sua lista para o usuário atual
        let foundCard = null;
        let foundList = null;
        const userNotes = users[currentUser.username].notes;
        for (const list of userNotes) {
            const card = list.cards.find(c => c.id === cardId);
            if (card) {
                foundCard = card;
                foundList = list;
                break;
            }
        }

        if (foundCard) {
            currentBoardData = users[currentUser.username]; // Define currentBoardData para anotações
            openBoardModal('notes'); // Abre o board principal de anotações
            setTimeout(() => openCardDetail(cardId, 'note'), 100); // Então abre o cartão específico após um pequeno atraso
        } else {
            showNotification('Anotação não encontrada.', 'error');
        }
    } else if (type === 'todo') {
        // Encontra o cartão de pendência específico, sua lista e seu projeto
        let foundProject = null;
        let foundList = null;
        let foundCard = null;

        foundProject = projects.find(p => p.id === projectId);
        if (foundProject && foundProject.todoLists) {
            foundList = foundProject.todoLists.find(l => l.id === listId);
            if (foundList) {
                foundCard = foundList.cards.find(c => c.id === cardId);
            }
        }

        if (foundProject && foundList && foundCard) {
            currentBoardData = foundProject; // Define currentBoardData para pendências
            openBoardModal('todo', projectId); // Abre o board principal de pendências para o projeto
            setTimeout(() => openCardDetail(cardId, 'todo'), 100); // Então abre o cartão específico após um pequeno atraso
        } else {
            showNotification('Pendência não encontrada.', 'error');
        }
    }
}

// --- Autocompletar Cliente e Integração de API ---
// A função fetchClientsList do seu script clientApi.js foi integrada aqui.
// Ela sobrescreve qualquer versão anterior e gerencia o clientsCache.
/**
 * Busca a lista de clientes usando Basic Authentication
 * @returns {Promise<Array>} Promise com array de clientes
 */
async function fetchClientsList() {
    const statusElement = document.getElementById('clientLoadingStatus');
    statusElement.textContent = 'Carregando clientes...';
    try {
        // Criar credenciais para Basic Auth
        const credentials = `${CLIENT_API_CONFIG.username}:${CLIENT_API_CONFIG.password}`;
        const credentials_b64 = btoa(credentials);

        // Criar cabeçalhos da requisição
        const headers = new Headers();
        headers.set('Authorization', `Basic ${credentials_b64}`);
        headers.set('Accept', 'application/json');
        headers.set('Content-Type', 'application/json');

        console.log(`🚀 Fazendo requisição para: ${CLIENT_API_CONFIG.url}`);
        console.log(`👤 Usuário: ${CLIENT_API_CONFIG.username}`);
        console.log('-'.repeat(50));

        // Fazer a requisição
        const response = await fetch(CLIENT_API_CONFIG.url, {
            headers: headers,
            method: 'GET',
            mode: 'cors' // Tenta com CORS explícito
        });

        // Log de resposta
        console.log(`Status da resposta: ${response.status} ${response.statusText}`);
        console.log(`📄 Content-Type: ${response.headers.get('Content-Type')}`);
        console.log('-'.repeat(50));

        if (response.status === 200) {
            // Ler e processar a resposta
            const data = await response.json();
            console.log("📊 Dados JSON recebidos:");
            console.log(data);

            // Verificar se a propriedade 'clientes' existe e é um array
            if (data && Array.isArray(data.clientes)) {
                clientsCache = data.clientes; // Atualiza o cache global
                console.log(`✅ Clientes carregados: ${clientsCache.length}`);
                statusElement.textContent = `Clientes carregados: ${clientsCache.length}`;
                // Se existir uma função de notificação global, usar
                if (typeof showNotification === 'function') {
                    showNotification(`Clientes carregados: ${clientsCache.length}`, 'success');
                }
                return clientsCache;
            } else {
                const errorMessage = 'Formato de dados inesperado: a propriedade "clientes" não é um array ou não existe no JSON';
                console.error(errorMessage, data);
                statusElement.textContent = 'Erro: Formato de dados inesperado.';
                // Se existir uma função de notificação global, usar
                if (typeof showNotification === 'function') {
                    showNotification(errorMessage, 'error');
                }
                clientsCache = []; // Garante que o cache seja limpo em caso de formato inesperado
                return [];
            }
        } else {
            console.error(`⚠️ Resposta não esperada. Status: ${response.status}`);
            // Tentar ler a mensagem de erro do servidor
            const errorDetails = await response.text();
            console.error(`📄 Detalhes do erro: ${errorDetails}`);
            statusElement.textContent = `Erro ${response.status}: ${response.statusText}`;
            if (response.status === 401) {
                console.error("💡 Credenciais inválidas. Verifique usuário e senha.");
                if (typeof showNotification === 'function') {
                    showNotification("Credenciais inválidas. Verifique usuário e senha.", 'error');
                }
            } else if (response.status === 403) {
                console.error("💡 Acesso negado. Você não tem permissão para acessar este recurso.");
                if (typeof showNotification === 'function') {
                    showNotification("Acesso negado. Você não tem permissão para acessar este recurso.", 'error');
                }
            } else if (response.status === 404) {
                console.error("💡 URL não encontrada. Verifique se o endereço está correto.");
                if (typeof showNotification === 'function') {
                    showNotification("URL não encontrada. Verifique se o endereço está correto.", 'error');
                }
            } else if (response.status === 500) {
                console.error("💡 Erro interno do servidor.");
                if (typeof showNotification === 'function') {
                    showNotification("Erro interno do servidor.", 'error');
                }
            }
            return [];
        }
    } catch (error) {
        console.error(`❌ Erro ao carregar a lista de clientes: ${error.message}`);
        statusElement.textContent = 'Erro ao carregar clientes.';
        // Verifica se o erro é de rede (CORS, servidor offline, etc.)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error("💡 Verifique sua conexão de internet e se a URL está correta.");
            console.error("💡 Pode ser um problema de CORS - o servidor precisa permitir requisições do seu domínio.");
            if (typeof showNotification === 'function') {
                showNotification(`Erro de rede ou CORS ao carregar clientes. Verifique a URL e as configurações do servidor.`, 'error');
            }
        } else {
            if (typeof showNotification === 'function') {
                showNotification(`Erro ao carregar a lista de clientes: ${error.message}`, 'error');
            }
        }
        return [];
    }
}

function setupClientAutocomplete() {
    const clientInput = document.getElementById('projectClient');
    const clientDropdown = document.getElementById('clientDropdown');

    const performSearch = debounce(async () => {
        const query = clientInput.value.toLowerCase();
        clientDropdown.innerHTML = '';
        clientDropdown.classList.add('hidden');

        if (query.length < 2) return; // Apenas busca se mais de 1 caractere

        if (!clientsCache) {
            await fetchClientsList(); // Tenta carregar se ainda não foi carregado
            if (!clientsCache) return; // Se ainda não há cache, sai
        }

        const filteredClients = clientsCache.filter(client =>
            client.nome.toLowerCase().includes(query) ||
            (client.cnpj && client.cnpj.includes(query))
        );

        if (filteredClients.length > 0) {
            filteredClients.slice(0, 10).forEach(client => { // Mostra os 10 primeiros resultados
                const div = document.createElement('div');
                div.className = 'client-option';
                div.textContent = client.nome;
                div.onclick = () => {
                    clientInput.value = client.nome;
                    clientDropdown.classList.add('hidden');
                };
                clientDropdown.appendChild(div);
            });
            clientDropdown.classList.remove('hidden');
        }
    }, 300); // 300ms de debounce

    clientInput.addEventListener('input', performSearch);
    clientInput.addEventListener('focus', performSearch); // Mostra o dropdown no foco se o input tiver texto
    clientInput.addEventListener('blur', () => {
        // Atraso para permitir o clique nos itens do dropdown
        setTimeout(() => {
            clientDropdown.classList.add('hidden');
        }, 150);
    });

    document.getElementById('refreshClientsBtn').addEventListener('click', async () => {
        clientsCache = null; // Limpa o cache para forçar uma nova busca
        await fetchClientsList();
        performSearch(); // Re-executa a busca com os novos dados
    });
}

// --- Seleção e Edição de Fluxo do Projeto ---
function handleFlowSelectionChange() {
    const selectElement = document.getElementById('projectFlow');
    const editButton = document.getElementById('editProjectFlowBtn');
    editButton.disabled = !selectElement.value; // Habilita se um fluxo for selecionado
}

function openEditProjectFlowModal() {
    if (currentUser.role !== 'admin' && currentUser.role !== 'implantador') {
        showNotification('Permissão negada. Apenas administradores e implantadores podem editar fluxos de projeto.', 'error');
        return;
    }
    const selectedFlowId = parseInt(document.getElementById('projectFlow').value);

    if (!selectedFlowId || !currentEditingProject) {
        showNotification('Selecione um fluxo e um projeto para editar os processos.', 'error');
        return;
    }

    const flow = flows.find(f => f.id === selectedFlowId);
    if (!flow) {
        showNotification('Fluxo não encontrado.', 'error');
        return;
    }

    document.getElementById('selectedFlowNameForEdit').textContent = flow.name;
    renderProjectFlowProcessSelectionList(flow, currentEditingProject.processes);
    document.getElementById('editProjectFlowModal').classList.add('active');
}

function renderProjectFlowProcessSelectionList(flow, projectProcesses) {
    const listContainer = document.getElementById('projectFlowProcessSelectionList');
    listContainer.innerHTML = '';

    flow.groups.forEach(flowGroup => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'flow-process-group';

        const projectGroup = projectProcesses.find(pg => pg.groupName === flowGroup.name);
        const allGroupProcessesSelected = projectGroup && flowGroup.processes.every(fp => projectGroup.items.some(pi => pi.name === fp));

        groupDiv.innerHTML = `
            <div class="flow-process-group-header">
                <input type="checkbox" id="group-checkbox-${flowGroup.name.replace(/\s/g, '-')}"
                                onchange="toggleGroupProcesses('${flowGroup.name}', this.checked)">
                <span>${flowGroup.name}</span>
            </div>
            <ul></ul>
        `;
        const groupCheckbox = groupDiv.querySelector(`#group-checkbox-${flowGroup.name.replace(/\s/g, '-')}`);
        if (allGroupProcessesSelected) {
            groupCheckbox.checked = true;
        }

        const ul = groupDiv.querySelector('ul');
        flowGroup.processes.forEach(processName => {
            const isSelected = projectGroup && projectGroup.items.some(pi => pi.name === processName);
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox" id="process-checkbox-${flowGroup.name.replace(/\s/g, '-')}-${processName.replace(/\s/g, '-')}"
                               value="${processName}" ${isSelected ? 'checked' : ''}
                               onchange="updateGroupCheckbox('${flowGroup.name}')">
                <span>${processName}</span>
            `;
            ul.appendChild(li);
        });
        listContainer.appendChild(groupDiv);
    });
}

function toggleGroupProcesses(groupName, checked) {
    const groupDiv = document.querySelector(`#projectFlowProcessSelectionList .flow-process-group-header span:contains('${groupName}')`).closest('.flow-process-group');
    if (!groupDiv) return;

    groupDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.id !== `group-checkbox-${groupName.replace(/\s/g, '-')}`) { // Não alterna o próprio checkbox do grupo
            checkbox.checked = checked;
        }
    });
}

function updateGroupCheckbox(groupName) {
    const groupDiv = document.querySelector(`#projectFlowProcessSelectionList .flow-process-group-header span:contains('${groupName}')`).closest('.flow-process-group');
    if (!groupDiv) return;

    const processCheckboxes = groupDiv.querySelectorAll('ul input[type="checkbox"]');
    const groupCheckbox = groupDiv.querySelector(`#group-checkbox-${groupName.replace(/\s/g, '-')}`);

    let allChecked = true;
    let anyChecked = false;

    if (processCheckboxes.length === 0) {
        allChecked = false;
    } else {
        processCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                anyChecked = true;
            } else {
                allChecked = false;
            }
        });
    }

    groupCheckbox.checked = allChecked;
    groupCheckbox.indeterminate = !allChecked && anyChecked;
}

function toggleAllProcesses(checked) {
    document.querySelectorAll('#projectFlowProcessSelectionList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = checked;
        // Atualiza o estado indeterminado para grupos
        const groupIdMatch = checkbox.id.match(/group-checkbox-(.*)/);
        if (groupIdMatch) {
            const groupName = groupIdMatch[1].replace(/-/g, ' ');
            const groupDiv = checkbox.closest('.flow-process-group');
            if (groupDiv) {
                const processCheckboxes = groupDiv.querySelectorAll('ul input[type="checkbox"]');
                if (processCheckboxes.length > 0) {
                    checkbox.indeterminate = false; // Limpa o estado indeterminado
                }
            }
        }
    });

    // Garante que os checkboxes de grupo sejam atualizados após alternar todos os processos individuais
    document.querySelectorAll('#projectFlowProcessSelectionList .flow-process-group-header span').forEach(span => {
        const groupName = span.textContent;
        updateGroupCheckbox(groupName);
    });
}

function saveProjectFlowSelection() {
    if (!currentEditingProject) return;

    const selectedFlowId = parseInt(document.getElementById('projectFlow').value);
    const flow = flows.find(f => f.id === selectedFlowId);

    if (!flow) {
        showNotification('Fluxo selecionado não encontrado.', 'error');
        return;
    }

    const updatedProjectProcesses = [];

    flow.groups.forEach(flowGroup => {
        const selectedItemsInGroup = [];
        flowGroup.processes.forEach(processName => {
            const checkboxId = `process-checkbox-${flowGroup.name.replace(/\s/g, '-')}-${processName.replace(/\s/g, '-')}`;
            const checkbox = document.getElementById(checkboxId);

            if (checkbox && checkbox.checked) {
                // Verifica se este processo já existe no projeto e preserva seu status/progresso
                const existingProcess = currentEditingProject.processes
                    .find(pg => pg.groupName === flowGroup.name)?.items
                    .find(pi => pi.name === processName);

                selectedItemsInGroup.push({
                    name: processName,
                    status: existingProcess ? existingProcess.status : "Planejamento Implantação",
                    progress: existingProcess ? existingProcess.progress : 0
                });
            }
        });

        if (selectedItemsInGroup.length > 0) {
            updatedProjectProcesses.push({
                groupName: flowGroup.name,
                items: selectedItemsInGroup
            });
        }
    });

    currentEditingProject.processes = updatedProjectProcesses;
    calculateProjectProgress(currentEditingProject); // Recalcula o progresso do projeto
    saveData();
    showNotification('Seleção de processos do projeto salva com sucesso!', 'success');
    closeModal('editProjectFlowModal');
    loadProjects(); // Recarrega a lista de projetos para mostrar o progresso atualizado
    updateDashboardStats();
    renderGanttChart();
}

// --- NOVO: Funções de Gerenciamento de Checklist Oficial ---
function openOfficialChecklistManagerModal() {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem gerenciar checklists oficiais.', 'error');
        return;
    }
    currentEditingOfficialChecklist = { id: null, name: '', items: [] }; // Reseta para novo checklist
    document.getElementById('newOfficialChecklistName').value = '';
    document.getElementById('newChecklistItemText').value = '';
    renderCurrentOfficialChecklistItems();
    loadExistingOfficialChecklists();
    document.getElementById('officialChecklistManagerModal').classList.add('active');
    document.getElementById('newOfficialChecklistName').focus();
}

function addChecklistItemToCurrentOfficialChecklist() {
    const itemTextInput = document.getElementById('newChecklistItemText');
    const itemText = itemTextInput.value.trim();

    if (!itemText) {
        showNotification('O texto do item é obrigatório!', 'error');
        return;
    }

    currentEditingOfficialChecklist.items.push({
        text: itemText,
        completed: false,
        description: ""
    });
    itemTextInput.value = '';
    renderCurrentOfficialChecklistItems();
}

function renderCurrentOfficialChecklistItems() {
    const listContainer = document.getElementById('currentOfficialChecklistItemsList');
    listContainer.innerHTML = '';

    if (currentEditingOfficialChecklist.items.length === 0) {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center;">Nenhum item adicionado.</p>';
        return;
    }

    currentEditingOfficialChecklist.items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'project-checklist-item';
        li.innerHTML = `
            <div class="project-checklist-item-text">${item.text}</div>
            <div class="official-checklist-item-actions">
                <button class="btn btn-secondary btn-sm" onclick="editOfficialChecklistItem(${index})" aria-label="Editar Item">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="removeOfficialChecklistItem(${index})" aria-label="Remover Item">Remover</button>
            </div>
        `;
        if (item.description) {
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'project-checklist-item-description';
            descriptionDiv.textContent = item.description;
            li.insertBefore(descriptionDiv, li.querySelector('.official-checklist-item-actions'));
        }
        listContainer.appendChild(li);
    });
}

function removeOfficialChecklistItem(index) {
    if (index >= 0 && index < currentEditingOfficialChecklist.items.length) {
        currentEditingOfficialChecklist.items.splice(index, 1);
        renderCurrentOfficialChecklistItems();
    }
}

function editOfficialChecklistItem(index) {
    if (index < 0 || index >= currentEditingOfficialChecklist.items.length) return;

    const item = currentEditingOfficialChecklist.items[index];
    const newText = prompt('Texto do item:', item.text);

    if (newText !== null && newText.trim() !== '') {
        item.text = newText.trim();
        const newDescription = prompt('Descrição/observação (opcional):', item.description || '');
        if (newDescription !== null) {
            item.description = newDescription.trim();
        }
        renderCurrentOfficialChecklistItems();
    }
}

function saveOfficialChecklist() {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem salvar checklists oficiais.', 'error');
        return;
    }
    const checklistNameInput = document.getElementById('newOfficialChecklistName');
    const checklistName = checklistNameInput.value.trim();

    if (!checklistName) {
        showNotification('O nome do checklist é obrigatório!', 'error');
        return;
    }
    if (currentEditingOfficialChecklist.items.length === 0) {
        showNotification('Adicione pelo menos um item ao checklist.', 'error');
        return;
    }

    // Verifica nomes de checklist duplicados (insensível a maiúsculas/minúsculas)
    const existingChecklistWithName = officialChecklists.find(c =>
        c.name.toLowerCase() === checklistName.toLowerCase() &&
        c.id !== currentEditingOfficialChecklist.id
    );
    if (existingChecklistWithName) {
        showNotification('Já existe um checklist com este nome. Por favor, escolha outro.', 'error');
        return;
    }

    if (currentEditingOfficialChecklist.id) {
        // Atualiza checklist existente
        const existingChecklistIndex = officialChecklists.findIndex(c => c.id === currentEditingOfficialChecklist.id);
        if (existingChecklistIndex !== -1) {
            officialChecklists[existingChecklistIndex].name = checklistName;
            officialChecklists[existingChecklistIndex].items = JSON.parse(JSON.stringify(currentEditingOfficialChecklist.items)); // Cópia profunda
            showNotification('Checklist atualizado com sucesso!', 'success');
        }
    } else {
        // Cria novo checklist
        const newChecklist = {
            id: officialChecklists.length > 0 ? Math.max(...officialChecklists.map(c => c.id)) + 1 : 1,
            name: checklistName,
            items: JSON.parse(JSON.stringify(currentEditingOfficialChecklist.items)) // Cópia profunda
        };
        officialChecklists.push(newChecklist);
        showNotification('Checklist criado com sucesso!', 'success');
    }

    // Reseta o formulário e recarrega as listas
    checklistNameInput.value = '';
    currentEditingOfficialChecklist = { id: null, name: '', items: [] };
    renderCurrentOfficialChecklistItems();
    loadExistingOfficialChecklists();
    populateOfficialChecklistDropdown(); // Atualiza o dropdown no modal de projeto
    saveData();
}

function loadExistingOfficialChecklists() {
    const list = document.getElementById('existingOfficialChecklistsList');
    list.innerHTML = '';

    if (officialChecklists.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum checklist cadastrado.</p>';
        return;
    }

    officialChecklists.forEach(checklist => {
        const div = document.createElement('div');
        div.className = 'official-checklist-item-manage';
        div.innerHTML = `
            <div class="official-checklist-item-details">
                <div class="official-checklist-item-name">${checklist.name}</div>
                <div class="official-checklist-item-count">Itens: ${checklist.items.length}</div>
            </div>
            <div class="official-checklist-item-actions">
                <button class="btn btn-secondary" onclick="editOfficialChecklist(${checklist.id})" aria-label="Editar Checklist">Editar</button>
                <button class="btn btn-danger" onclick="deleteOfficialChecklist(${checklist.id})" aria-label="Excluir Checklist">Excluir</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function editOfficialChecklist(id) {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem editar checklists oficiais.', 'error');
        return;
    }
    const checklistToEdit = officialChecklists.find(c => c.id === id);
    if (checklistToEdit) {
        currentEditingOfficialChecklist = JSON.parse(JSON.stringify(checklistToEdit)); // Cópia profunda
        document.getElementById('newOfficialChecklistName').value = currentEditingOfficialChecklist.name;
        renderCurrentOfficialChecklistItems();
        showNotification(`Editando checklist: ${checklistToEdit.name}`, 'info');
    }
}

function deleteOfficialChecklist(id) {
    if (currentUser.role !== 'admin') {
        showNotification('Permissão negada. Apenas administradores podem excluir checklists oficiais.', 'error');
        return;
    }
    if (confirm('Tem certeza que deseja excluir este checklist? Projetos vinculados perderão a referência.')) {
        officialChecklists = officialChecklists.filter(c => c.id !== id);

        // Também atualiza projetos que estavam vinculados a este checklist
        projects.forEach(p => {
            if (p.officialChecklistId === id) {
                p.officialChecklistId = null;
                p.officialChecklistItems = []; // Limpa os itens do checklist se o checklist for removido
            }
        });

        loadExistingOfficialChecklists();
        populateOfficialChecklistDropdown(); // Atualiza o dropdown
        loadProjects(); // Recarrega a lista de projetos caso um projeto tenha perdido seu checklist
        showNotification('Checklist excluído com sucesso!', 'success');
        saveData();
    }
}

function populateOfficialChecklistDropdown() {
    const select = document.getElementById('projectOfficialChecklist');
    select.innerHTML = '<option value="">Nenhum Checklist</option>'; // Opção padrão
    officialChecklists.forEach(checklist => {
        const option = document.createElement('option');
        option.value = checklist.id;
        option.textContent = checklist.name;
        select.appendChild(option);
    });
}

function handleOfficialChecklistSelectionChange() {
    const selectElement = document.getElementById('projectOfficialChecklist');
    const editButton = document.getElementById('editProjectOfficialChecklistBtn');
    editButton.disabled = !selectElement.value; // Habilita se um checklist for selecionado
}

function openEditProjectOfficialChecklistModal() {
    if (currentUser.role !== 'admin' && currentUser.role !== 'implantador') {
        showNotification('Permissão negada. Apenas administradores e implantadores podem editar checklists de projeto.', 'error');
        return;
    }
    const selectedChecklistId = parseInt(document.getElementById('projectOfficialChecklist').value);

    if (!selectedChecklistId || !currentEditingProject) {
        showNotification('Selecione um checklist e um projeto para editar os itens.', 'error');
        return;
    }

    const checklist = officialChecklists.find(c => c.id === selectedChecklistId);
    if (!checklist) {
        showNotification('Checklist não encontrado.', 'error');
        return;
    }

    document.getElementById('selectedOfficialChecklistNameForEdit').textContent = checklist.name;
    renderProjectOfficialChecklistSelectionList(checklist, currentEditingProject.officialChecklistItems || []);
    document.getElementById('editProjectOfficialChecklistModal').classList.add('active');
}

function renderProjectOfficialChecklistSelectionList(checklist, projectChecklistItems) {
    const listContainer = document.getElementById('projectOfficialChecklistSelectionList');
    listContainer.innerHTML = '';

    checklist.items.forEach((item, index) => {
        // Verifica se este item já está selecionado para o projeto
        const isSelected = projectChecklistItems.some(pi => pi.text === item.text);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'project-checklist-item';
        itemDiv.innerHTML = `
            <input type="checkbox" class="project-checklist-item-checkbox"
                           id="checklist-item-${index}" ${isSelected ? 'checked' : ''}
                           value="${item.text}">
            <div>
                <div class="project-checklist-item-text">${item.text}</div>
                ${item.description ? `<div class="project-checklist-item-description">${item.description}</div>` : ''}
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });

    if (checklist.items.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">Este checklist não possui itens.</p>';
    }
}

function toggleAllProjectChecklistItems(checked) {
    document.querySelectorAll('#projectOfficialChecklistSelectionList input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = checked;
    });
}

function saveProjectOfficialChecklistSelection() {
    if (!currentEditingProject) return;

    const selectedChecklistId = parseInt(document.getElementById('projectOfficialChecklist').value);
    const checklist = officialChecklists.find(c => c.id === selectedChecklistId);

    if (!checklist) {
        showNotification('Checklist selecionado não encontrado.', 'error');
        return;
    }

    // Pega todos os itens selecionados
    const selectedItems = [];
    document.querySelectorAll('#projectOfficialChecklistSelectionList input[type="checkbox"]').forEach((checkbox, index) => {
        if (checkbox.checked && index < checklist.items.length) {
            // Preserva o status de conclusão se o item já existe
            const existingItem = currentEditingProject.officialChecklistItems?.find(item =>
                item.text === checklist.items[index].text
            );
            selectedItems.push({
                text: checklist.items[index].text,
                completed: existingItem ? existingItem.completed : false,
                description: checklist.items[index].description || ''
            });
        }
    });

    currentEditingProject.officialChecklistId = selectedChecklistId;
    currentEditingProject.officialChecklistItems = selectedItems;

    saveData();
    showNotification('Seleção de itens do checklist salva com sucesso!', 'success');
    closeModal('editProjectOfficialChecklistModal');
}

function openUpdateOfficialChecklistModal(projectId) {
    if (currentUser.role !== 'admin' && currentUser.role !== 'implantador') {
        showNotification('Permissão negada. Apenas administradores e implantadores podem atualizar checklists.', 'error');
        return;
    }
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        showNotification('Projeto não encontrado.', 'error');
        return;
    }
    if (!project.officialChecklistId || !project.officialChecklistItems || project.officialChecklistItems.length === 0) {
        showNotification('Este projeto não possui um checklist configurado.', 'error');
        return;
    }

    currentProjectToUpdateOfficialChecklist = project;
    const checklist = officialChecklists.find(c => c.id === project.officialChecklistId);
    const checklistName = checklist ? checklist.name : "Checklist Personalizado";

    document.getElementById('updateOfficialChecklistModalTitle').textContent = `Atualizar Checklist: ${checklistName}`;
    document.getElementById('updateOfficialChecklistProjectName').textContent = project.name;
    renderOfficialChecklistUpdateList();
    document.getElementById('updateOfficialChecklistModal').classList.add('active');
}

function renderOfficialChecklistUpdateList() {
    const listContainer = document.getElementById('officialChecklistUpdateList');
    listContainer.innerHTML = '';
    const project = currentProjectToUpdateOfficialChecklist;

    if (!project || !project.officialChecklistItems || project.officialChecklistItems.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum item no checklist deste projeto.</p>';
        document.getElementById('updateOfficialChecklistProgressSummary').textContent = 'Progresso: 0/0 (0%)';
        return;
    }

    project.officialChecklistItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `project-checklist-item ${item.completed ? 'completed' : ''}`;
        itemDiv.innerHTML = `
            <input type="checkbox" class="project-checklist-item-checkbox"
                           id="update-checklist-item-${index}" ${item.completed ? 'checked' : ''}
                           onchange="toggleOfficialChecklistItemCompletion(${index}, this.checked)">
            <div>
                <div class="project-checklist-item-text">${item.text}</div>
                ${item.description ? `<div class="project-checklist-item-description">${item.description}</div>` : ''}
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });
    updateOfficialChecklistProgressSummary();
}

function toggleOfficialChecklistItemCompletion(index, completed) {
    const project = currentProjectToUpdateOfficialChecklist;
    if (!project || !project.officialChecklistItems || index >= project.officialChecklistItems.length) return;

    project.officialChecklistItems[index].completed = completed;

    // Atualiza o estado visual do item
    const itemElement = document.querySelector(`#officialChecklistUpdateList .project-checklist-item:nth-child(${index + 1})`);
    if (itemElement) {
        if (completed) {
            itemElement.classList.add('completed');
        } else {
            itemElement.classList.remove('completed');
        }
    }
    updateOfficialChecklistProgressSummary();
}

function updateOfficialChecklistProgressSummary() {
    const project = currentProjectToUpdateOfficialChecklist;
    if (!project || !project.officialChecklistItems) return;

    const totalItems = project.officialChecklistItems.length;
    const completedItems = project.officialChecklistItems.filter(item => item.completed).length;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    document.getElementById('updateOfficialChecklistProgressSummary').textContent =
        `Progresso: ${completedItems}/${totalItems} (${progressPercent}%)`;
}

function saveOfficialChecklistUpdates() {
    const project = currentProjectToUpdateOfficialChecklist;
    if (!project) return;

    saveData();
    showNotification('Checklist atualizado com sucesso!', 'success');
    closeModal('updateOfficialChecklistModal');
    loadProjects(); // Recarrega a lista de projetos para mostrar o status do checklist atualizado
}

// Função para mostrar o progresso do checklist na visualização do projeto
function updateProjectOfficialChecklistView(project) {
    const viewChecklistName = document.getElementById('viewProjectOfficialChecklistName');
    const viewChecklistItems = document.getElementById('viewProjectOfficialChecklistItems');
    const progressSummary = document.getElementById('viewProjectOfficialChecklistProgressSummary');

    if (!project.officialChecklistId || !project.officialChecklistItems || project.officialChecklistItems.length === 0) {
        viewChecklistName.textContent = 'Nenhum';
        viewChecklistItems.innerHTML = '<li style="color: #6b7280;">Nenhum checklist associado a este projeto.</li>';
        progressSummary.textContent = '';
        return;
    }

    const checklist = officialChecklists.find(c => c.id === project.officialChecklistId);
    viewChecklistName.textContent = checklist ? checklist.name : 'Checklist Personalizado';
    viewChecklistItems.innerHTML = '';

    project.officialChecklistItems.forEach(item => {
        const li = document.createElement('li');
        li.className = `project-checklist-item ${item.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div>
                <div class="project-checklist-item-text">
                    ${item.completed ? '✓ ' : '◯ '}${item.text}
                </div>
                ${item.description ? `<div class="project-checklist-item-description">${item.description}</div>` : ''}
            </div>
        `;
        viewChecklistItems.appendChild(li);
    });

    const totalItems = project.officialChecklistItems.length;
    const completedItems = project.officialChecklistItems.filter(item => item.completed).length;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    progressSummary.textContent = `Progresso: ${completedItems}/${totalItems} (${progressPercent}%)`;
}

// Inicializa quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    loadData(); // Carrega os dados do localStorage primeiro

    // Lida com a tecla Enter no campo de usuário
    const usernameField = document.getElementById('username');
    if (usernameField) {
        usernameField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('password').focus();
            }
        });
    }

    // Lida com a tecla Enter no campo de senha
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                doLogin();
            }
        });
    }

    // --- NOVO CÓDIGO PARA LOGIN RÁPIDO VIA EVENT LISTENER ---
    const quickLoginButtons = document.querySelectorAll('.quick-login-btn');
    quickLoginButtons.forEach(button => {
        button.addEventListener('click', function() {
            const username = this.dataset.username; // Pega o nome de usuário do atributo data-username
            const password = this.dataset.password; // Pega a senha do atributo data-password
            document.getElementById('username').value = username;
            document.getElementById('password').value = password;
            doLogin(); // Chama a função de login existente
        });
    });
    // --- FIM DO NOVO CÓDIGO ---

    // Define a data de início padrão para novos projetos se nenhum projeto estiver sendo editado
    if (!currentEditingProject) {
        document.getElementById('projectStartDate').value = new Date().toISOString().split('T')[0];
    }

    // Cálculo inicial do progresso e status do projeto com base em seus processos
    // Isso garante que os dados existentes se alinhem com a nova lógica no carregamento
    projects.forEach(project => {
        calculateProjectProgress(project); // Usa a função correta aqui
    });

    console.log('Pré-carregando lista de clientes...');
    fetchClientsList().catch(e => console.error('Erro no pré-carregamento de clientes:', e));
    setupClientAutocomplete(); // Configura a funcionalidade de autocompletar cliente
});
