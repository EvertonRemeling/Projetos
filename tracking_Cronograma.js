document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM para os detalhes
    const detailId = document.getElementById('detail-id');
    const detailOriginalId = document.getElementById('detail-original-id');
    const detailModule = document.getElementById('detail-module');
    const detailDescription = document.getElementById('detail-description');
    const detailTecnicos = document.getElementById('detail-tecnicos');
    const detailDate = document.getElementById('detail-date');
    const detailShift = document.getElementById('detail-shift');
    const detailIsChecked = document.getElementById('detail-is-checked');
    const backButton = document.getElementById('back-button');

    // Função para obter parâmetros da URL
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\[').replace(/[\]]/, '\]');
        var regex = new RegExp('[\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    const activityId = getUrlParameter('activityId');
    const originalId = getUrlParameter('originalId');
    const module = getUrlParameter('module');
    const description = getUrlParameter('description');
    const technicians = getUrlParameter('technicians');
    const date = getUrlParameter('date');
    const shift = getUrlParameter('shift');
    const isChecked = getUrlParameter('isChecked');

    if (activityId) {
        // Popula os detalhes na página
        detailId.textContent = activityId;
        detailOriginalId.textContent = originalId || 'N/A';
        detailModule.textContent = module || 'N/A';
        detailDescription.textContent = description || 'N/A';
        detailTecnicos.textContent = technicians || 'Nenhum';
        detailDate.textContent = date ? new Date(date).toLocaleDateString('pt-BR') : 'N/A';
        detailShift.textContent = shift || 'N/A';
        detailIsChecked.textContent = isChecked === 'true' ? 'Sim' : 'Não';

        // Em um cenário real, você faria uma requisição AJAX para o seu backend
        // para buscar detalhes mais completos da visita com base no `activityId` ou `originalId`.
        console.log(`Detalhes carregados para a atividade: ${activityId}`);

    } else {
        // Exibe mensagem se nenhum ID de atividade for encontrado
        document.getElementById('visit-details').innerHTML = `
            <p><strong>Nenhuma visita selecionada.</strong></p>
            <p>Por favor, clique em um evento no cronograma para ver os detalhes.</p>
        `;
    }

    // Botão de voltar
    backButton.addEventListener('click', function() {
        window.history.back(); // Volta para a página anterior (cronograma)
    });
});