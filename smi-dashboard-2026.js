
/* ==========================================================
   SMI MÁQUINAS — DASHBOARD 2026
   SMI GROUP

   Dashboard integrado ao estoque Supabase
   Alertas automáticos de vencimento de reservas

   - Alerta 3 dias antes do vencimento
   - Alerta vermelho para reservas vencidas
   - Acesso direto à tela de Relatórios
   - Não altera reservas ou estoque
   ========================================================== */

(function () {
    "use strict";

    const DIAS_ALERTA = 3;
    const ID_ALERTA = "smiAlertaVencimentoReservas";
    const ID_ESTILO = "smiEstilosAlertaReservas";

    let dashboardAberto = false;
    let consultandoReservas = false;
    let inicializado = false;

    const el = id => document.getElementById(id);

    /* =====================================================
       INDICADORES DO DASHBOARD
       ===================================================== */

    function copiarIndicador(origem, destinos) {
        const elemento = el(origem);

        if (!elemento) return;

        const valor = elemento.textContent.trim();

        destinos.forEach(function (id) {
            const destino = el(id);

            if (destino) {
                destino.textContent = valor;
            }
        });
    }

    function atualizarDashboard() {
        copiarIndicador("totalEstoque", [
            "dashTotalEstoque"
        ]);

        copiarIndicador("totalDisponiveis", [
            "dashTotalDisponiveis",
            "dashResumoDisponiveis"
        ]);

        copiarIndicador("totalReservadas", [
            "dashTotalReservadas",
            "dashResumoReservadas"
        ]);

        copiarIndicador("totalVendidas", [
            "dashTotalVendidas",
            "dashResumoVendidas"
        ]);
    }

    /* =====================================================
       NAVEGAÇÃO
       ===================================================== */

    function abrirDashboard() {
        const dashboard = el("telaDashboardSMI");
        const indicadores = document.querySelector(
            ".indicadores"
        );
        const titulo = el("tituloPagina");
        const botaoDashboard = el("btnDashboardSMI");

        if (!dashboard || !indicadores || !botaoDashboard) {
            return;
        }

        document.querySelectorAll("main .tela").forEach(
            function (tela) {
                tela.hidden = tela !== dashboard;
            }
        );

        indicadores.hidden = true;
        dashboard.hidden = false;
        dashboardAberto = true;

        if (titulo) {
            titulo.textContent = "Dashboard";
        }

        document.querySelectorAll(".menu-item").forEach(
            function (botao) {
                botao.classList.remove("ativo");
                botao.removeAttribute("aria-current");
            }
        );

        botaoDashboard.classList.add("ativo");

        botaoDashboard.setAttribute(
            "aria-current",
            "page"
        );

        atualizarDashboard();
        atualizarAlertaReservas();
    }

    function fecharDashboard() {
        if (!dashboardAberto) return;

        const dashboard = el("telaDashboardSMI");
        const indicadores = document.querySelector(
            ".indicadores"
        );

        dashboardAberto = false;

        if (dashboard) dashboard.hidden = true;
        if (indicadores) indicadores.hidden = false;

        const botao = el("btnDashboardSMI");

        if (botao) {
            botao.classList.remove("ativo");
            botao.removeAttribute("aria-current");
        }
    }

    function navegarPara(tela) {
        const botao = document.querySelector(
            `.menu-item[data-tela="${tela}"]`
        );

        if (!botao) {
            console.warn(
                "SMI: tela não encontrada:",
                tela
            );
            return;
        }

        fecharDashboard();
        botao.click();
    }

    /* =====================================================
       CÁLCULO DE VENCIMENTO
       ===================================================== */

    function diasParaVencer(valor) {
        if (!valor) return null;

        const texto = String(valor).slice(0, 10);
        const partes = texto.split("-").map(Number);

        if (
            partes.length !== 3 ||
            partes.some(numero => !Number.isInteger(numero))
        ) {
            return null;
        }

        const [ano, mes, dia] = partes;

        const dataLimite = new Date(
            ano,
            mes - 1,
            dia
        );

        if (
            dataLimite.getFullYear() !== ano ||
            dataLimite.getMonth() !== mes - 1 ||
            dataLimite.getDate() !== dia
        ) {
            return null;
        }

        const agora = new Date();

        const hojeUTC = Date.UTC(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
        );

        const limiteUTC = Date.UTC(
            ano,
            mes - 1,
            dia
        );

        return Math.round(
            (limiteUTC - hojeUTC) / 86400000
        );
    }

    /* =====================================================
       ESTILOS DO ALERTA
       ===================================================== */

    function criarEstilos() {
        if (el(ID_ESTILO)) return;

        const estilo = document.createElement("style");

        estilo.id = ID_ESTILO;

        estilo.textContent = `

            /* CARD DE RESERVAS */

            .dashboard-kpi:has(#${ID_ALERTA}) {
                position: relative;
            }

            /* ALERTA */

            #${ID_ALERTA} {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                flex-wrap: wrap;
                gap: 5px;

                width: fit-content;
                max-width: 100%;

                margin-top: 7px;
                padding: 5px 7px;

                background: #fff1d7;
                border: 1px solid #f6d89e;
                border-radius: 7px;

                color: #a45b08;

                font-family: Arial, sans-serif;
                font-size: 10px;
                font-weight: 600;
                line-height: 1.4;

                cursor: pointer;
                text-align: left;
                box-sizing: border-box;
            }

            #${ID_ALERTA}:hover {
                background: #ffe7b6;
            }

            #${ID_ALERTA}[hidden] {
                display: none !important;
            }

            /* ALERTA VENCIDO */

            #${ID_ALERTA}.smi-alerta-vencido {
                background: #ffe9ec;
                border-color: #f2b9c3;
                color: #b42336;
            }

            #${ID_ALERTA}.smi-alerta-vencido:hover {
                background: #ffdce2;
            }

            /* LINK */

            #${ID_ALERTA} .smi-alerta-link {
                color: #1768d5;
                font-weight: 600;
                text-decoration: underline;
                white-space: nowrap;
            }

            #${ID_ALERTA}:focus-visible {
                outline: 2px solid #1768d5;
                outline-offset: 2px;
            }

            /* MANTÉM OS ELEMENTOS DO CARD
               ORGANIZADOS VERTICALMENTE */

            #dashTotalReservadas {
                display: block;
            }

            .dashboard-kpi:has(#${ID_ALERTA})
            > div:last-child > span,
            .dashboard-kpi:has(#${ID_ALERTA})
            > div:last-child > strong,
            .dashboard-kpi:has(#${ID_ALERTA})
            > div:last-child > small {
                display: block;
            }

            .dashboard-kpi:has(#${ID_ALERTA})
            > div:last-child > small[hidden] {
                display: none !important;
            }

        `;

        document.head.appendChild(estilo);
    }

    /* =====================================================
       CRIAR ALERTA DENTRO DO CARD RESERVADAS
       ===================================================== */

    function criarAlerta() {
        const existente = el(ID_ALERTA);

        if (existente) return existente;

        const numero = el("dashTotalReservadas");

        if (!numero) return null;

        const card = numero.closest(
            ".dashboard-kpi"
        );

        if (!card) return null;

        const conteudo = numero.parentElement;

        if (!conteudo) return null;

        criarEstilos();

        const alerta = document.createElement("button");

        alerta.id = ID_ALERTA;
        alerta.type = "button";
        alerta.hidden = true;

        alerta.title =
            "Clique para consultar as reservas nos Relatórios";

        alerta.addEventListener("click", function () {
            navegarPara("relatorios");
        });

        // O alerta fica no mesmo bloco
        // do título e do número de reservas.
        // Não é adicionado como outro card.

        conteudo.appendChild(alerta);

        return alerta;
    }

    /* =====================================================
       MOSTRAR OU ESCONDER DESCRIÇÃO DO CARD
       ===================================================== */

    function atualizarDescricaoCard(temAlerta) {
        const numero = el("dashTotalReservadas");

        if (!numero) return;

        const conteudo = numero.parentElement;

        if (!conteudo) return;

        const descricao = conteudo.querySelector("small");

        if (descricao) {
            // Quando aparece o alerta, ele ocupa
            // o espaço da descrição normal.
            descricao.hidden = temAlerta;
        }
    }

    /* =====================================================
       CONSULTAR RESERVAS NO SUPABASE
       ===================================================== */

    async function atualizarAlertaReservas() {
        if (consultandoReservas) return;

        const alerta = criarAlerta();

        if (!alerta) return;

        const repositorio = window.smiRepositorio;

        if (!repositorio?.lerEstoque) {
            alerta.hidden = true;
            atualizarDescricaoCard(false);
            return;
        }

        consultandoReservas = true;

        try {
            const resultado = await repositorio.lerEstoque();

            const reservas = resultado?.dados?.reservas;

            if (!Array.isArray(reservas)) {
                alerta.hidden = true;
                atualizarDescricaoCard(false);
                return;
            }

            let proximas = 0;
            let vencidas = 0;

            reservas.forEach(function (reserva) {
                // Somente reservas ativas.
                if (reserva.status !== "ativa") {
                    return;
                }

                const dias = diasParaVencer(
                    reserva.vencimento
                );

                if (dias === null) return;

                if (dias < 0) {
                    vencidas++;
                } else if (dias <= DIAS_ALERTA) {
                    proximas++;
                }
            });

            const totalAlertas = proximas + vencidas;

            // Sem vencimentos próximos:
            // preserva o card normal.

            if (totalAlertas === 0) {
                alerta.hidden = true;
                atualizarDescricaoCard(false);
                return;
            }

            // Existe alerta.
            atualizarDescricaoCard(true);

            alerta.classList.toggle(
                "smi-alerta-vencido",
                vencidas > 0
            );

            const mensagens = [];

            if (vencidas > 0) {
                mensagens.push(
                    vencidas === 1
                        ? "1 reserva vencida"
                        : `${vencidas} reservas vencidas`
                );
            }

            if (proximas > 0) {
                mensagens.push(
                    proximas === 1
                        ? "1 próxima do vencimento"
                        : `${proximas} próximas do vencimento`
                );
            }

            alerta.replaceChildren();

            const sino = document.createElement("span");
            sino.textContent = "🔔";

            const texto = document.createElement("span");
            texto.textContent = mensagens.join(" • ");

            const link = document.createElement("span");
            link.className = "smi-alerta-link";
            link.textContent = "Ver relatório →";

            alerta.append(
                sino,
                texto,
                link
            );

            alerta.hidden = false;

        } catch (erro) {
            console.warn(
                "SMI: erro ao consultar reservas:",
                erro
            );

            alerta.hidden = true;
            atualizarDescricaoCard(false);

        } finally {
            consultandoReservas = false;
        }
    }

    /* =====================================================
       EVENTOS E INICIALIZAÇÃO
       ===================================================== */

    function iniciar() {
        if (inicializado) return;

        inicializado = true;

        const dashboard = el("telaDashboardSMI");
        const botaoDashboard = el("btnDashboardSMI");
        const indicadores = document.querySelector(
            ".indicadores"
        );
        const titulo = el("tituloPagina");

        if (
            !dashboard ||
            !botaoDashboard ||
            !indicadores ||
            !titulo
        ) {
            console.warn(
                "SMI Dashboard: elementos não encontrados."
            );
            inicializado = false;
            return;
        }

        // Navegação principal.
        botaoDashboard.addEventListener(
            "click",
            abrirDashboard
        );

        document.querySelectorAll(
            ".menu-item[data-tela]"
        ).forEach(function (botao) {
            botao.addEventListener(
                "click",
                fecharDashboard,
                true
            );
        });

        // Botão Ver estoque.
        el("dashAbrirEstoque")?.addEventListener(
            "click",
            function () {
                navegarPara("estoque");
            }
        );

        // Outros atalhos.
        dashboard.querySelectorAll(
            "[data-abrir-tela]"
        ).forEach(function (botao) {
            botao.addEventListener(
                "click",
                function () {
                    navegarPara(
                        botao.dataset.abrirTela
                    );
                }
            );
        });

        // Atualiza os indicadores quando
        // seus valores originais mudarem.
        const observer = new MutationObserver(
            atualizarDashboard
        );

        [
            "totalEstoque",
            "totalDisponiveis",
            "totalReservadas",
            "totalVendidas"
        ].forEach(function (id) {
            const elemento = el(id);

            if (elemento) {
                observer.observe(elemento, {
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            }
        });

        // Botão Atualizar.
        el("btnAtualizar")?.addEventListener(
            "click",
            function () {
                atualizarDashboard();
                atualizarAlertaReservas();
            }
        );

        // Atualiza os alertas quando o
        // usuário voltar à aba.
        document.addEventListener(
            "visibilitychange",
            function () {
                if (!document.hidden) {
                    atualizarAlertaReservas();
                }
            }
        );

        // Atualização periódica.
        setInterval(
            atualizarAlertaReservas,
            60000
        );

        criarAlerta();
        atualizarDashboard();
        abrirDashboard();

        console.log(
            "SMI Máquinas — Dashboard com alertas inicializado."
        );
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
