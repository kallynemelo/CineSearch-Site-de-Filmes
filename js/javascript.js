// Chave da API do TMDb (usada para autenticação nas requisições)
const apiKey = "b60207357c6481808a65eb983b969fd1";

// Acidionando o hardware de vibração (se disponível) para feedback tátil
let patterns = [
    [200], // vibração padrão (sucesso)
    [400, 200, 400] // vibração de erro
];

function vibrationPattern(index){
    if (navigator.vibrate){
        navigator.vibrate(patterns[index]);
    }
}

// Salva o conteúdo inicial da tela (para restaurar quando clicar em "Home")
const conteudoInicial = document.getElementById("resultado")?.innerHTML || "";

// BUSCAR FILMES NA API TMDb
async function buscarFilmes() {

    // Pega o valor digitado no input e remove espaços extras
    const input = document.getElementById("pesquisa")?.value.trim();

    // Se o campo estiver vazio, mostra alerta e para execução
    if (!input) {
        vibrationPattern(1); // vibração de erro
        alert("Digite o nome de um filme!");
        return;
    }

    // Monta a URL da API com o termo pesquisado
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(input)}&language=pt-BR`;

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error("Erro na requisição: " + resposta.status);
        }

        const dados = await resposta.json();

        mostrarFilmes(dados.results);

    } catch (erro) {
        console.error("Erro ao buscar filmes:", erro);

        document.getElementById("resultado").innerHTML =
            "<p>Erro ao buscar filmes. Verifique sua conexão ou API key.</p>";
    }
}

// SISTEMA DE CLASSIFICAÇÃO (LocalStorage)

function salvarClassificacao(filmeId, nota) {
    const classificacoes = JSON.parse(localStorage.getItem("classificacoes")) || {};
    classificacoes[filmeId] = nota;
    localStorage.setItem("classificacoes", JSON.stringify(classificacoes));
}

function carregarClassificacao(filmeId) {
    const classificacoes = JSON.parse(localStorage.getItem("classificacoes")) || {};
    return classificacoes[filmeId] || 0;
}

function criarEstrelas(filmeId, notaSalva = 0) {

    let estrelasHTML = '<div class="estrelas" data-filme-id="' + filmeId + '">';

    for (let i = 1; i <= 5; i++) {
        const preenchida = i <= notaSalva ? 'preenchida' : '';

        estrelasHTML += `
            <span class="estrela ${preenchida}" data-nota="${i}" onclick="classificarFilme(${filmeId}, ${i}); event.stopPropagation();">
                ★
            </span>
        `;
    }

    estrelasHTML += '</div>';

    return estrelasHTML;
}

function classificarFilme(filmeId, nota) {

    salvarClassificacao(filmeId, nota);

    vibrationPattern(0); // vibração padrão

    const containerEstrelas = document.querySelector(`.estrelas[data-filme-id="${filmeId}"]`);

    if (containerEstrelas) {
        const estrelas = containerEstrelas.querySelectorAll('.estrela');

        estrelas.forEach((estrela, index) => {
            estrela.classList.toggle('preenchida', index < nota);
        });
    }

    const feedback = document.createElement('div');
    feedback.className = 'feedback-classificacao';
    feedback.textContent = `⭐ ${nota} estrela(s) salva(s)!`;

    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
}

// MOSTRAR FILMES NA TELA

function mostrarFilmes(filmes) {

    const container = document.getElementById("resultado");
    if (!container) return;

    container.innerHTML = "";

    container.classList.add("grid-filmes");

    if (!filmes || filmes.length === 0) {
        container.innerHTML = "<p>Nenhum filme encontrado.</p>";
        return;
    }

    const contador = document.createElement("div");
    contador.className = "contador-resultados";
    contador.textContent = `${filmes.length} filme(s) encontrado(s)`;
    container.appendChild(contador);

    filmes.forEach(filme => {

        const div = document.createElement("div");
        div.className = "filme-card";
        div.style.cursor = "pointer";

        div.addEventListener("click", (e) => {
            if (!e.target.closest('.estrela') && !e.target.closest('.estrelas')) {
                abrirModalFilme(filme);
            }
        });

        const imagem = filme.poster_path
            ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
            : "https://via.placeholder.com/250x375?text=Sem+Imagem";

        const data = filme.release_date
            ? new Date(filme.release_date).getFullYear()
            : 'N/A';

        const notaAPI = filme.vote_average
            ? filme.vote_average.toFixed(1)
            : 'N/A';

        const classificacaoSalva = carregarClassificacao(filme.id);

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

        container.appendChild(div);
    });
}

// MODAL

function abrirModalFilme(filme) {

    const modalExistente = document.getElementById("modalFilme");
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "modalFilme";

    const imagem = filme.poster_path
        ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
        : "https://via.placeholder.com/250x375?text=Sem+Imagem";

    const data = filme.release_date
        ? new Date(filme.release_date).toLocaleDateString('pt-BR')
        : 'N/A';

    const notaAPI = filme.vote_average
        ? filme.vote_average.toFixed(1)
        : 'N/A';

    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="fecharModalFilme()">&times;</button>
            
            <div class="modal-header">
                <img src="${imagem}">
                <div>
                    <h2>${filme.title}</h2>
                    <p>${data} | ⭐ ${notaAPI}</p>
                </div>
            </div>
            
            <p>${filme.overview || "Sem sinopse."}</p>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

    modal.addEventListener("click", (e) => {
        if (e.target === modal) fecharModalFilme();
    });
}

function fecharModalFilme() {
    const modal = document.getElementById("modalFilme");
    if (modal) {
        modal.remove();
        document.body.style.overflow = "auto";
    }
}

// EVENTOS

document.addEventListener("DOMContentLoaded", () => {

    const btnBuscar = document.getElementById("btnBuscar");
    if (btnBuscar) {
        btnBuscar.addEventListener("click", buscarFilmes);
    }

    const inputPesquisa = document.getElementById("pesquisa");
    if (inputPesquisa) {
        inputPesquisa.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                buscarFilmes();
            }
        });
    }
});