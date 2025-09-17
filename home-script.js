document.addEventListener('DOMContentLoaded', () => {
    const iniciarAtendimentoBtn = document.getElementById('iniciarAtendimentoBtn');
    const sairBtn = document.getElementById('sairBtn');
    const attendancesListContainer = document.getElementById('attendancesListContainer');
    const noAttendancesMessage = document.getElementById('noAttendancesMessage');

    // Função para carregar e exibir os atendimentos do localStorage
    const loadAndRenderAttendances = () => {
        const storedAttendances = JSON.parse(localStorage.getItem('attendances')) || [];
        attendancesListContainer.innerHTML = '';

        if (storedAttendances.length === 0) {
            noAttendancesMessage.style.display = 'block';
            attendancesListContainer.appendChild(noAttendancesMessage);
        } else {
            noAttendancesMessage.style.display = 'none';
            storedAttendances.forEach((attendance, index) => {
                const attendanceItem = document.createElement('div');
                attendanceItem.classList.add('atendimento-item');

                const currentId = attendance.id || (index + 1).toString(); // Usar o ID real ou um índice para fallback

                // Formatando as datas e horas para exibição
                const arrivalClientDateFormatted = attendance.displacement && attendance.displacement.arrivalClientDate ? attendance.displacement.arrivalClientDate.split('-').reverse().join('/') : 'N/A';
                const arrivalClientTimeFormatted = attendance.displacement && attendance.displacement.arrivalClientTime ? attendance.displacement.arrivalClientTime : 'N/A';
                const departureClientDateFormatted = attendance.displacement && attendance.displacement.departureClientDate ? attendance.displacement.departureClientDate.split('-').reverse().join('/') : 'N/A';
                const departureClientTimeFormatted = attendance.displacement && attendance.displacement.departureClientTime ? attendance.displacement.departureClientTime : 'N/A';

                attendanceItem.innerHTML = `
                    <div class="actions">
                        <i class="fas fa-search icon-button" title="Visualizar" data-id="${currentId}"></i>
                        <i class="fas fa-pencil-alt icon-button" title="Editar" data-id="${currentId}"></i>
                        <i class="fas fa-trash-alt icon-button" title="Excluir" data-id="${currentId}"></i>
                    </div>
                    <div class="id-and-status">
                        <i class="fas fa-chevron-right arrow-icon"></i>
                        <span class="id">N° ${currentId}</span>
                    </div>
                    <div class="details">
                        <span class="client-name-display">${attendance.client.name || 'Nome do Cliente Indefinido'}</span>
                        <span class="client-arrival-time">Chegada: ${arrivalClientDateFormatted} ${arrivalClientTimeFormatted}</span>
                        <span class="client-departure-time">Saída: ${departureClientDateFormatted} ${departureClientTimeFormatted}</span>
                    </div>
                `;
                attendancesListContainer.appendChild(attendanceItem);
            });

            addActionListenerToIcons();
        }
    };

    // Função auxiliar para adicionar listeners aos ícones (Visualizar, Editar, Excluir)
    const addActionListenerToIcons = () => {
        document.querySelectorAll('.icon-button').forEach(icon => {
            icon.addEventListener('click', (event) => {
                const action = event.target.title; // Visualizar, Editar, Excluir
                const itemId = event.target.dataset.id; // ID do atendimento
                
                console.log(`Ação: ${action} no item: ${itemId}`); // Este console.log deve aparecer

                if (action === 'Visualizar') {
                    window.location.href = `novo_atendimento.html?id=${itemId}&mode=view`;
                } else if (action === 'Editar') {
                    window.location.href = `novo_atendimento.html?id=${itemId}&mode=edit`;
                } else if (action === 'Excluir') {
                    if (confirm(`Tem certeza que deseja excluir o atendimento N° ${itemId}?`)) {
                        let storedAttendances = JSON.parse(localStorage.getItem('attendances')) || [];
                        storedAttendances = storedAttendances.filter(att => att.id !== itemId);
                        localStorage.setItem('attendances', JSON.stringify(storedAttendances));
                        loadAndRenderAttendances(); // Recarrega a lista
                    }
                }
            });
        });
    };

    // Lógica para o botão "Iniciar Atendimento"
    iniciarAtendimentoBtn.addEventListener('click', () => {
        window.location.href = 'novo_atendimento.html';
    });

       // Lógica para o botão "Sair"
    sairBtn.addEventListener('click', () => {
        // Redireciona para a página index_Projeto.html
        window.location.href = 'index_Projeto.html';
    });

    // Inicializa a página carregando os atendimentos
    loadAndRenderAttendances();
});