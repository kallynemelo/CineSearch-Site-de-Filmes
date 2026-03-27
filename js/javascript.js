// Chave da API do TMDb (usada para autenticação nas requisições)
const apiKey = "b60207357c6481808a65eb983b969fd1";

// Salva o conteúdo inicial da tela (para restaurar quando clicar em "Home")
const conteudoInicial = document.getElementById("resultado")?.innerHTML || "";

// BUSCAR FILMES NA API TMDb
async function buscarFilmes() {

    // Pega o valor digitado no input e remove espaços extras
    const input = document.querySelector(".botaopesquisa input")?.value.trim();

    // Se o campo estiver vazio, mostra alerta e para execução
    if (!input) {
        alert("Digite o nome de um filme!");
        return;
    }

    // Monta a URL da API com o termo pesquisado
    // encodeURIComponent evita erros com espaços e caracteres especiais
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(input)}&language=pt-BR`;

    try {
        // Faz a requisição para a API
        const resposta = await fetch(url);

        // Verifica se a resposta foi bem-sucedida
        if (!resposta.ok) {
            throw new Error("Erro na requisição: " + resposta.status);
        }

        // Converte a resposta para JSON
        const dados = await resposta.json();

        // Mostra os filmes na tela
        mostrarFilmes(dados.results);

    } catch (erro) {
        // Caso ocorra erro (API, internet, etc)
        console.error("Erro ao buscar filmes:", erro);

        // Exibe mensagem de erro na tela
        document.getElementById("resultado").innerHTML =
            "<p>Erro ao buscar filmes. Verifique sua conexão ou API key.</p>";
    }
}

// SISTEMA DE CLASSIFICAÇÃO (LocalStorage)

// Salva a nota do usuário no navegador
function salvarClassificacao(filmeId, nota) {
    // Recupera classificações existentes ou cria objeto vazio
    const classificacoes = JSON.parse(localStorage.getItem("classificacoes")) || {};

    // Salva a nota do filme pelo ID
    classificacoes[filmeId] = nota;

    // Atualiza o localStorage
    localStorage.setItem("classificacoes", JSON.stringify(classificacoes));
}

// Carrega a nota salva de um filme
function carregarClassificacao(filmeId) {
    const classificacoes = JSON.parse(localStorage.getItem("classificacoes")) || {};

    // Retorna a nota ou 0 se não existir
    return classificacoes[filmeId] || 0;
}

// Cria as estrelas de avaliação dinamicamente
function criarEstrelas(filmeId, notaSalva = 0) {

    // Container das estrelas
    let estrelasHTML = '<div class="estrelas" data-filme-id="' + filmeId + '">';

    // Loop para criar 5 estrelas
    for (let i = 1; i <= 5; i++) {

        // Verifica se a estrela deve estar preenchida
        const preenchida = i <= notaSalva ? 'preenchida' : '';

        // Cria cada estrela com evento de clique
        estrelasHTML += `
            <span class="estrela ${preenchida}" data-nota="${i}" onclick="classificarFilme(${filmeId}, ${i}); event.stopPropagation();">
                ★
            </span>
        `;
    }

    estrelasHTML += '</div>';

    return estrelasHTML;
}

// Função que salva e atualiza a classificação do filme
function classificarFilme(filmeId, nota) {

    // Salva no localStorage
    salvarClassificacao(filmeId, nota);

    // Atualiza visual das estrelas na tela
    const containerEstrelas = document.querySelector(`.estrelas[data-filme-id="${filmeId}"]`);

    if (containerEstrelas) {
        const estrelas = containerEstrelas.querySelectorAll('.estrela');

        // Marca as estrelas conforme a nota
        estrelas.forEach((estrela, index) => {
            estrela.classList.toggle('preenchida', index < nota);
        });
    }

    // Cria feedback visual (mensagem temporária)
    const feedback = document.createElement('div');
    feedback.className = 'feedback-classificacao';
    feedback.textContent = `⭐ ${nota} estrela(s) salva(s)!`;

    document.body.appendChild(feedback);

    // Remove após 2 segundos
    setTimeout(() => feedback.remove(), 2000);
}

// MOSTRAR FILMES NA TELA

function mostrarFilmes(filmes) {

    const container = document.getElementById("resultado");
    if (!container) return;

    // Limpa conteúdo anterior
    container.innerHTML = "";

    // Caso não tenha resultados
    if (!filmes || filmes.length === 0) {
        container.innerHTML = "<p>Nenhum filme encontrado.</p>";
        return;
    }

    // Cria contador de resultados
    const contador = document.createElement("div");
    contador.className = "contador-resultados";
    contador.textContent = `${filmes.length} filme(s) encontrado(s)`;
    container.appendChild(contador);

    // Percorre lista de filmes
    filmes.forEach(filme => {

        const div = document.createElement("div");
        div.className = "filme-card";
        div.style.cursor = "pointer";

        // Evento de clique para abrir modal (exceto nas estrelas)
        div.addEventListener("click", (e) => {
            if (!e.target.closest('.estrela') && !e.target.closest('.estrelas')) {
                abrirModalFilme(filme);
            }
        });

        // Define imagem do filme ou placeholder
        const imagem = filme.poster_path
            ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
            : "https://via.placeholder.com/250x375?text=Sem+Imagem";

        // Pega o ano de lançamento
        const data = filme.release_date
            ? new Date(filme.release_date).getFullYear()
            : 'N/A';

        // Nota da API formatada
        const notaAPI = filme.vote_average
            ? filme.vote_average.toFixed(1)
            : 'N/A';

        // Nota salva pelo usuário
        const classificacaoSalva = carregarClassificacao(filme.id);

        // HTML do card
        div.innerHTML = `
            <img src="${imagem}" alt="${filme.title}" onerror="this.src='https://via.placeholder.com/250x375?text=Sem+Imagem'">
            <div class="filme-info">
                <h3>${filme.title}</h3>
                <p class="filme-meta"><strong>Ano:</strong> ${data} | <strong>Nota TMDB:</strong> ⭐ ${notaAPI}</p>
                <p class="filme-sinopse">${filme.overview || "Sem descrição disponível."}</p>
                
                <div class="classificacao-usuario">
                    <p>Sua classificação:</p>
                    ${criarEstrelas(filme.id, classificacaoSalva)}
                </div>
            </div>
        `;

        // Adiciona o card na tela
        container.appendChild(div);
    });
}

// 🪟 MODAL DE DETALHES DO FILME

function abrirModalFilme(filme) {

    // Remove modal anterior se existir
    const modalExistente = document.getElementById("modalFilme");
    if (modalExistente) modalExistente.remove();

    // Cria overlay do modal
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "modalFilme";

    // Define imagem
    const imagem = filme.poster_path
        ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
        : "https://via.placeholder.com/250x375?text=Sem+Imagem";

    // Data formatada
    const data = filme.release_date
        ? new Date(filme.release_date).toLocaleDateString('pt-BR')
        : 'N/A';

    const notaAPI = filme.vote_average
        ? filme.vote_average.toFixed(1)
        : 'N/A';

    // HTML do modal
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="fecharModalFilme()" aria-label="Fechar">&times;</button>
            
            <div class="modal-header">
                <img src="${imagem}" alt="${filme.title}" class="modal-poster">
                <div class="modal-info">
                    <h2>${filme.title}</h2>
                    <p class="modal-meta">
                        <strong>Lançamento:</strong> ${data} | 
                        <strong>Nota TMDB:</strong> ⭐ ${notaAPI}
                    </p>
                </div>
            </div>
            
            <div class="modal-body">
                <h3>Sinopse Completa</h3>
                <p class="modal-sinopse">${filme.overview || "Sinopse não disponível."}</p>
            </div>
        </div>
    `;

    // Adiciona modal na página
    document.body.appendChild(modal);

    // Impede rolagem da página
    document.body.style.overflow = "hidden";

    // Fecha ao clicar fora
    modal.addEventListener("click", (e) => {
        if (e.target === modal) fecharModalFilme();
    });
}

// FECHAR MODAL

function fecharModalFilme() {
    const modal = document.getElementById("modalFilme");

    if (modal) {
        modal.remove();
        document.body.style.overflow = "auto"; // Restaura scroll
    }
}

// EVENTOS

document.addEventListener("DOMContentLoaded", () => {

    // Botão buscar
    const btnBuscar = document.getElementById("btnBuscar");
    if (btnBuscar) {
        btnBuscar.addEventListener("click", buscarFilmes);
    }

    // Enter no input
    const inputPesquisa = document.getElementById("pesquisa");
    if (inputPesquisa) {
        inputPesquisa.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                buscarFilmes();
            }
        });
    }
});