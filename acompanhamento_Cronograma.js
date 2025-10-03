document.addEventListener('DOMContentLoaded', () => {
    console.log("acompanhamento_Cronograma.js loaded.");
    const tableBody = document.getElementById('report-table-body');
    const backButton = document.getElementById('back-to-main-btn');

    function loadAndDisplayTasks() {
        const storedCalendar = localStorage.getItem('scheduledVisitsData');
        
        if (!storedCalendar) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-tasks-message">Nenhuma atividade agendada no cronograma principal.</td></tr>';
            return;
        }

        const calendarAllocations = JSON.parse(storedCalendar);
        let allTasks = [];

        // Achata o objeto calendarAllocations em um array único de tarefas
        for (const date in calendarAllocations) {
            // Filtra para garantir que a data tem alocações
            if (calendarAllocations.hasOwnProperty(date) && Array.isArray(calendarAllocations[date])) {
                calendarAllocations[date].forEach(task => {
                    allTasks.push({
                        date: date, // Mantém a string de data original para ordenação
                        shift: task.shift,
                        module: task.module,
                        description: task.description,
                        technicians: task.technicians,
                        isChecked: task.isChecked,
                        isCopied: task.isCopied // Inclui o status de cópia
                    });
                });
            }
        }

        if (allTasks.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-tasks-message">Nenhuma atividade agendada no cronograma principal.</td></tr>';
            return;
        }

        // Ordena as tarefas por data e depois por turno
        allTasks.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime();
            }
            // Se as datas são iguais, ordena por turno (Manhã < Tarde)
            const shiftOrder = { 'Manhã (08h-12h)': 1, 'Tarde (13h-17h)': 2 };
            return (shiftOrder[a.shift] || 99) - (shiftOrder[b.shift] || 99);
        });

        tableBody.innerHTML = ''; // Limpa o conteúdo existente

        allTasks.forEach(task => {
            const row = tableBody.insertRow();
            
            const displayDate = new Date(task.date).toLocaleDateString('pt-BR');
            const displayShift = task.shift ? task.shift.split(' ')[0] : 'N/A'; // Pega só "Manhã" ou "Tarde"
            const displayTechnicians = task.technicians && task.technicians.length > 0
                ? task.technicians.join(', ')
                : 'N/A';
            const displayIsCompleted = task.isChecked ? 'Sim' : 'Não';
            const displayIsCopied = task.isCopied ? 'Sim' : 'Não'; // Novo campo

            row.insertCell().textContent = displayDate;
            row.insertCell().textContent = displayShift;
            row.insertCell().textContent = task.module || 'N/A';
            row.insertCell().textContent = task.description;
            row.insertCell().textContent = displayTechnicians;
            
            const completedCell = row.insertCell();
            completedCell.textContent = displayIsCompleted;
            completedCell.classList.add('center-text'); 

            const copiedCell = row.insertCell(); // Nova célula para "Cópia?"
            copiedCell.textContent = displayIsCopied;
            copiedCell.classList.add('center-text');
        });
    }

    // Adiciona o event listener para o botão de voltar
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'index_Cronograma.html';
        });
    }

    loadAndDisplayTasks(); // Chama a função para carregar e exibir as tarefas ao carregar a página
});