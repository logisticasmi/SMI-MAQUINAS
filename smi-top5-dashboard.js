
/* =========================================================
   SMI MÁQUINAS — TOP 5 DASHBOARD
   Versão 2026

   TOP 5 MÁQUINAS
   TOP 5 ACESSÓRIOS

   Consulta os dados do Supabase.
   Não altera estoque, reservas ou vendas.
   ========================================================= */

(function () {
    "use strict";

    const ID_ESTILO = "smi-top5-estilos";
    const ID_MAQUINAS = "smiTop5Maquinas";
    const ID_ACESSORIOS = "smiTop5Acessorios";

    const $ = id => document.getElementById(id);

    let carregando = false;
    let ultimaRevisao = null;

    /* =====================================================
       CSS
       ===================================================== */

    function criarEstilos() {
        if ($(ID_ESTILO)) return;

        const estilo = document.createElement("style");
        estilo.id = ID_ESTILO;

        estilo.textContent = `

            /* TRÊS PAINÉIS LADO A LADO */

            .dashboard-smi .dashboard-corpo {
                display: grid !important;

                grid-template-columns:
                    repeat(3, minmax(0, 1fr)) !important;

                gap: 16px !important;
                align-items: stretch !important;
            }

            .dashboard-smi .dashboard-painel {
                min-width: 0 !important;
                padding: 18px !important;
            }

            /* TOP 5 */

            .smi-top5 {
                display: flex;
                flex-direction: column;
                gap: 0;

                width: 100%;
                min-width: 0;
            }

            .smi-top5-cabecalho {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;

                margin-bottom: 12px;
            }

            .smi-top5-cabecalho h3 {
                margin: 0;
                color: #172840;

                font-size: 15px;
                font-weight: 800;
                line-height: 1.4;
            }

            .smi-top5-selo {
                padding: 5px 8px;

                background: #e9f2ff;
                color: #1764ca;

                border-radius: 20px;

                font-size: 10px;
                font-weight: 700;
            }

            .smi-top5-acessorios .smi-top5-selo {
                color: #9b6900;
                background: #fff2d2;
            }

            /* RANKING */

            .smi-top5-linha {
                display: grid;

                grid-template-columns:
                    23px minmax(75px, 1fr)
                    minmax(65px, 1.2fr) 34px;

                align-items: center;
                gap: 8px;

                padding: 11px 0;

                border-bottom:
                    1px solid #edf1f6;
            }

            .smi-top5-linha:last-child {
                border-bottom: none;
            }

            .smi-top5-posicao {
                display: grid;
                place-items: center;

                width: 23px;
                height: 23px;

                border-radius: 50%;

                background: #e5f0ff;
                color: #245381;

                font-size: 11px;
                font-weight: 800;
            }

            .smi-top5-acessorios
            .smi-top5-posicao {
                background: #fff0ca;
                color: #996700;
            }

            .smi-top5-nome {
                min-width: 0;

                color: #243852;

                font-size: 11px;
                font-weight: 700;

                overflow-wrap: anywhere;
            }

            .smi-top5-trilha {
                width: 100%;
                height: 11px;

                overflow: hidden;

                border-radius: 20px;
                background: #e5efff;
            }

            .smi-top5-barra {
                display: block;

                width: 0;
                height: 100%;

                border-radius: 20px;

                background: linear-gradient(
                    90deg,
                    #72acfa,
                    #2477ed
                );

                transition: width .25s ease;
            }

            .smi-top5-acessorios
            .smi-top5-trilha {
                background: #fff0d3;
            }

            .smi-top5-acessorios
            .smi-top5-barra {
                background: linear-gradient(
                    90deg,
                    #ffd15a,
                    #f6a914
                );
            }

            .smi-top5-quantidade {
                color: #172840;

                font-size: 13px;
                font-weight: 800;

                text-align: right;
                font-variant-numeric: tabular-nums;
            }

            .smi-top5-vazio {
                padding: 22px 8px;

                color: #8290a3;
                font-size: 12px;
                text-align: center;
            }

            .smi-top5-rodape {
                margin: auto 0 0;
                padding-top: 12px;

                color: #8290a3;
                font-size: 10px;
            }

            /* ATALHOS */

            .dashboard-smi .dashboard-atalhos {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr)) !important;
            }

            .dashboard-smi .dashboard-atalhos button {
                min-height: 66px !important;

                padding: 11px !important;
                font-size: 11px !important;
            }

            /* RESPONSIVIDADE */

            @media (max-width: 1450px) {

                .dashboard-smi .dashboard-corpo {
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr)) !important;
                }

                .dashboard-smi .dashboard-corpo
                > :first-child {
                    grid-column: 1 / -1;
                }
            }

            @media (max-width: 850px) {

                .dashboard-smi .dashboard-corpo {
                    grid-template-columns: 1fr !important;
                }

                .dashboard-smi .dashboard-corpo
                > :first-child {
                    grid-column: auto;
                }
            }

            @media (max-width: 480px) {

                .smi-top5-linha {
                    grid-template-columns:
                        22px minmax(65px, 1fr)
                        minmax(50px, 1fr) 30px;

                    gap: 5px;
                }

                .smi-top5-nome {
                    font-size: 10px;
                }
            }

        `;

        document.head.appendChild(estilo);
    }

    /* =====================================================
       CLASSIFICAÇÃO DAS MÁQUINAS E ACESSÓRIOS

       Mesma regra utilizada no cadastro existente.
       ===================================================== */

    function ehAcessorio(modelo, catalogo) {

        const cadastrado = catalogo.find(item =>
            item.modelo === modelo
        );

        if (cadastrado?.tipo === "acessorio") {
            return true;
        }

        if (cadastrado?.tipo === "maquina") {
            return false;
        }

        return /^(MY\d|ESTEIRA|CARRINHO)/i.test(
            modelo
        );
    }

    /* =====================================================
       CRIAR OS PAINÉIS
       ===================================================== */

    function criarPainel(id, titulo, classe) {

        const painel = document.createElement("section");

        painel.id = id;

        painel.className =
            "dashboard-painel smi-top5 " + classe;

        const cabecalho = document.createElement("div");
        cabecalho.className = "smi-top5-cabecalho";

        const nome = document.createElement("h3");
        nome.textContent = titulo;

        const selo = document.createElement("span");
        selo.className = "smi-top5-selo";
        selo.textContent = "Estoque principal";

        cabecalho.append(nome, selo);

        const lista = document.createElement("div");
        lista.className = "smi-top5-lista";

        const rodape = document.createElement("p");
        rodape.className = "smi-top5-rodape";
        rodape.textContent =
            "Quantidades atuais do sistema.";

        painel.append(cabecalho, lista, rodape);

        return painel;
    }

    function prepararDashboard() {

        const dashboard = $("telaDashboardSMI");

        if (!dashboard) return false;

        const corpo = dashboard.querySelector(
            ".dashboard-corpo"
        );

        if (!corpo) return false;

        if (!$(ID_MAQUINAS)) {

            corpo.appendChild(
                criarPainel(
                    ID_MAQUINAS,
                    "Top 5 máquinas com maior quantidade",
                    "smi-top5-maquinas"
                )
            );
        }

        if (!$(ID_ACESSORIOS)) {

            corpo.appendChild(
                criarPainel(
                    ID_ACESSORIOS,
                    "Top 5 acessórios com maior quantidade",
                    "smi-top5-acessorios"
                )
            );
        }

        /* Retira do Dashboard o painel repetido
           de controle de reservas, mantendo os
           indicadores principais e o acesso rápido. */

        Array.from(corpo.children).forEach(painel => {

            if (
                painel.id === ID_MAQUINAS ||
                painel.id === ID_ACESSORIOS
            ) {
                return;
            }

            const titulo = painel.querySelector("h3");

            if (
                titulo?.textContent.trim() ===
                "Controle de reservas"
            ) {
                painel.hidden = true;
                painel.remove();
            }
        });

        return true;
    }

    /* =====================================================
       DESENHAR UM RANKING
       ===================================================== */

    function desenharRanking(id, registros) {

        const painel = $(id);

        if (!painel) return;

        const lista = painel.querySelector(
            ".smi-top5-lista"
        );

        lista.replaceChildren();

        if (!registros.length) {

            const vazio = document.createElement("p");

            vazio.className = "smi-top5-vazio";

            vazio.textContent =
                "Nenhum item com saldo positivo.";

            lista.appendChild(vazio);

            return;
        }

        const maior = Math.max(
            ...registros.map(item => item.quantidade),
            1
        );

        registros.forEach((item, indice) => {

            const linha = document.createElement("div");
            linha.className = "smi-top5-linha";

            const posicao = document.createElement("span");
            posicao.className = "smi-top5-posicao";
            posicao.textContent = indice + 1;

            const nome = document.createElement("span");
            nome.className = "smi-top5-nome";
            nome.textContent = item.modelo;
            nome.title = item.modelo;

            const trilha = document.createElement("div");
            trilha.className = "smi-top5-trilha";

            const barra = document.createElement("span");
            barra.className = "smi-top5-barra";

            barra.style.width = (
                item.quantidade / maior * 100
            ) + "%";

            trilha.appendChild(barra);

            const quantidade = document.createElement("strong");
            quantidade.className = "smi-top5-quantidade";
            quantidade.textContent = item.quantidade;

            linha.append(
                posicao,
                nome,
                trilha,
                quantidade
            );

            lista.appendChild(linha);
        });
    }

    function mostrarErro(texto) {

        [ID_MAQUINAS, ID_ACESSORIOS].forEach(id => {

            const painel = $(id);

            if (!painel) return;

            const lista = painel.querySelector(
                ".smi-top5-lista"
            );

            lista.textContent = texto;
            lista.className =
                "smi-top5-lista smi-top5-vazio";
        });
    }

    /* =====================================================
       CARREGAR DADOS REAIS DO SUPABASE
       ===================================================== */

    async function atualizarTop5() {

        if (carregando) return;

        if (!prepararDashboard()) return;

        carregando = true;

        try {

            const repositorio = window.smiRepositorio;

            if (
                !repositorio ||
                typeof repositorio.lerEstoque !== "function"
            ) {
                throw new Error(
                    "Repositório não disponível."
                );
            }

            const resultado = await repositorio.lerEstoque();

            const estado = resultado.dados;

            if (
                !Array.isArray(estado?.entradas) ||
                !Array.isArray(estado?.saidas)
            ) {
                throw new Error(
                    "Dados do estoque inválidos."
                );
            }

            const catalogo =
                Array.isArray(estado.catalogoImportado)
                    ? estado.catalogoImportado
                    : [];

            const saldos = new Map();

            function adicionar(modelo, quantidade) {

                if (!modelo) return;

                const atual = saldos.get(modelo) || 0;

                saldos.set(
                    modelo,
                    atual + quantidade
                );
            }

            /* Entradas do Estoque Principal */

            estado.entradas.forEach(item => {

                if (
                    item.setor &&
                    item.setor !== "estoque"
                ) {
                    return;
                }

                adicionar(
                    item.modelo,
                    Number(item.quantidade) || 0
                );
            });

            /* Saídas do Estoque Principal */

            estado.saidas.forEach(item => {

                if (
                    item.setor &&
                    item.setor !== "estoque"
                ) {
                    return;
                }

                adicionar(
                    item.modelo,
                    -(Number(item.quantidade) || 0)
                );
            });

            const maquinas = [];
            const acessorios = [];

            saldos.forEach((quantidade, modelo) => {

                if (quantidade <= 0) return;

                const registro = {
                    modelo,
                    quantidade
                };

                if (ehAcessorio(modelo, catalogo)) {
                    acessorios.push(registro);
                } else {
                    maquinas.push(registro);
                }
            });

            function ordenar(a, b) {

                return (
                    b.quantidade - a.quantidade ||
                    a.modelo.localeCompare(
                        b.modelo,
                        "pt-BR"
                    )
                );
            }

            maquinas.sort(ordenar);
            acessorios.sort(ordenar);

            desenharRanking(
                ID_MAQUINAS,
                maquinas.slice(0, 5)
            );

            desenharRanking(
                ID_ACESSORIOS,
                acessorios.slice(0, 5)
            );

            ultimaRevisao = resultado.revisao;

            console.log(
                "SMI Top 5 atualizado. Revisão:",
                ultimaRevisao
            );

        } catch (erro) {

            console.error(
                "Erro ao atualizar Top 5:",
                erro
            );

            mostrarErro(
                "Não foi possível carregar os rankings."
            );

        } finally {
            carregando = false;
        }
    }

    /* =====================================================
       EVENTOS
       ===================================================== */

    function iniciar() {

        criarEstilos();

        if (!prepararDashboard()) {
            console.warn(
                "Dashboard não encontrado para o Top 5."
            );
            return;
        }

        /* Atualiza ao abrir o Dashboard */

        $("btnDashboardSMI")?.addEventListener(
            "click",
            atualizarTop5
        );

        /* Atualiza pelo botão do sistema */

        $("btnAtualizar")?.addEventListener(
            "click",
            atualizarTop5
        );

        /* Primeira leitura */

        atualizarTop5();

    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    } else {
        iniciar();
    }

})();
