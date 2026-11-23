/* ==========================================================
   SMI MÁQUINAS — INVENTÁRIO GERAL
   Integração Supabase — 2026

   Contagem: ESTOQUE PRINCIPAL + SHOW ROOM
   Histórico compartilhado na nuvem
   Sem alterações nos saldos das máquinas
   ========================================================== */

(() => {
    "use strict";

    const TABELA = "inventarios_maquinas";
    const TELA = "telaInventarioSMI";
    const RASCUNHO = "smi_inventario_rascunho_v2";

    const el = id => document.getElementById(id);

    let referencia = null;
    let contagens = {};
    let historico = [];
    let finalizado = false;
    let gravando = false;
    let inventarioAberto = false;
    let idEnvio = null;
    let usuarioId = null;
    let carregandoHistorico = false;

    /* ======================================================
       FUNÇÕES GERAIS
       ====================================================== */

    function hoje() {
        const d = new Date();

        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0")
        ].join("-");
    }

    function formatarData(valor) {
        if (!valor) return "—";

        const d = new Date(`${valor}T12:00:00`);

        return Number.isNaN(d.getTime())
            ? valor
            : d.toLocaleDateString("pt-BR");
    }

    function novoId() {
        return crypto.randomUUID();
    }

    function cliente() {
        if (!window.smiSupabase) {
            throw new Error(
                "Conexão com Supabase indisponível."
            );
        }

        return window.smiSupabase;
    }

    async function usuario() {
        const { data, error } =
            await cliente().auth.getUser();

        if (error) throw error;

        if (!data?.user) {
            throw new Error(
                "Sua sessão expirou. Entre novamente."
            );
        }

        return data.user;
    }

    function mensagem(texto, erro = false) {
        const alvo = el("invMensagem");

        if (!alvo) return;

        alvo.textContent = texto;
        alvo.className =
            "inv-mensagem " +
            (erro ? "inv-erro" : "inv-sucesso");

        alvo.hidden = false;
    }

    function esconderMensagem() {
        if (el("invMensagem")) {
            el("invMensagem").hidden = true;
        }
    }

    /* ======================================================
       RASCUNHO LOCAL DA CONTAGEM
       ====================================================== */

    function salvarRascunho() {
        if (finalizado) return;

        try {
            localStorage.setItem(
                RASCUNHO,
                JSON.stringify({
                    usuarioId,
                    contagens,
                    idEnvio,
                    data: el("invData")?.value || "",
                    responsavel:
                        el("invResponsavel")?.value || "",
                    identificacao:
                        el("invIdentificacao")?.value || ""
                })
            );
        } catch (erro) {
            console.warn(
                "Não foi possível salvar o rascunho:",
                erro
            );
        }
    }

    function carregarRascunho() {
        try {
            const texto = localStorage.getItem(
                RASCUNHO
            );

            if (!texto) return;

            const salvo = JSON.parse(texto);

            if (
                !salvo ||
                salvo.usuarioId !== usuarioId ||
                typeof salvo.contagens !== "object" ||
                Array.isArray(salvo.contagens)
            ) {
                return;
            }

            contagens = salvo.contagens || {};
            idEnvio = salvo.idEnvio || null;

            el("invData").value =
                salvo.data || hoje();

            el("invResponsavel").value =
                salvo.responsavel || "";

            el("invIdentificacao").value =
                salvo.identificacao || "";

        } catch (erro) {
            console.warn(
                "Rascunho não recuperado:",
                erro
            );
        }
    }

    function limparRascunho() {
        localStorage.removeItem(RASCUNHO);
    }

    /* ======================================================
       ESTOQUE CONSOLIDADO DIRETO DA NUVEM
       ====================================================== */

    async function consultarEstoque() {
        if (!window.smiRepositorio?.lerEstoque) {
            throw new Error(
                "Repositório de máquinas indisponível."
            );
        }

        await usuario();

        const resultado =
            await window.smiRepositorio.lerEstoque();

        const estado = resultado.dados;

        if (
            !Array.isArray(estado?.entradas) ||
            !Array.isArray(estado?.saidas) ||
            !Array.isArray(estado?.reservas)
        ) {
            throw new Error(
                "Formato de estoque inválido."
            );
        }

        if (typeof MODELOS === "undefined") {
            throw new Error(
                "Catálogo de modelos não carregado."
            );
        }

        const modelos = MODELOS.map(modelo => {
            // Entradas e saídas de ambos os depósitos.
            // Reservas não diminuem o estoque físico.

            const entradas = estado.entradas
                .filter(item => item.modelo === modelo)
                .reduce(
                    (soma, item) =>
                        soma + Number(item.quantidade || 0),
                    0
                );

            const saidas = estado.saidas
                .filter(item => item.modelo === modelo)
                .reduce(
                    (soma, item) =>
                        soma + Number(item.quantidade || 0),
                    0
                );

            return {
                modelo,
                sistema: entradas - saidas
            };
        });

        return {
            revisao: resultado.revisao,
            modelos
        };
    }

    async function carregarReferencia() {
        referencia = await consultarEstoque();
        renderizar();
    }

    function temContagem() {
        return Object.values(contagens).some(item =>
            item &&
            item.fisico !== "" &&
            item.fisico !== undefined &&
            item.fisico !== null
        );
    }

    /* ======================================================
       CRIAR ESTILOS
       ====================================================== */

    function criarEstilos() {
        if (el("smiEstilosInventario")) return;

        const style = document.createElement("style");
        style.id = "smiEstilosInventario";

        style.textContent = `
            #${TELA} {
                padding-bottom: 30px;
                color: #172840;
            }

            .inv-cabecalho,
            .inv-acoes,
            .inv-rodape-acoes {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
            }

            .inv-cabecalho {
                margin-bottom: 20px;
            }

            .inv-cabecalho h2 {
                margin: 0 0 5px;
                color: #172840;
                font-size: 23px;
            }

            .inv-cabecalho p {
                color: #708096;
                font-size: 13px;
            }

            .inv-acoes {
                justify-content: flex-end;
            }

            .inv-cards {
                display: grid;
                grid-template-columns:
                    repeat(4, minmax(0, 1fr));
                gap: 14px;
                margin-bottom: 20px;
            }

            .inv-card,
            .inv-painel {
                background: white;
                border: 1px solid #dfe7f0;
                border-radius: 14px;
            }

            .inv-card {
                padding: 18px;
            }

            .inv-card span {
                color: #64758d;
                font-size: 12px;
            }

            .inv-card strong {
                display: block;
                margin-top: 5px;
                color: #172840;
                font-size: 29px;
            }

            .inv-card.verde strong {
                color: #168b57;
            }

            .inv-card.amarelo strong {
                color: #bc8312;
            }

            .inv-card.vermelho strong {
                color: #c64757;
            }

            .inv-painel {
                padding: 21px;
                margin-bottom: 19px;
            }

            .inv-painel h3 {
                margin: 0 0 17px;
                color: #172840;
                font-size: 18px;
            }

            .inv-dados {
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
                gap: 15px;
            }

            .inv-dados label {
                display: flex;
                flex-direction: column;
                gap: 7px;
                color: #344763;
                font-size: 12px;
                font-weight: bold;
            }

            .inv-dados input,
            .inv-filtros input,
            .inv-filtros select,
            .inv-quantidade,
            .inv-observacao {
                background: #fff !important;
                color: #172840 !important;
                border: 1px solid #cbd7e5 !important;
                border-radius: 8px !important;
                padding: 9px 12px;
            }

            .inv-nota {
                margin: 15px 0 0;
                padding: 12px;
                background: #eef5ff;
                color: #355b86;
                border-radius: 9px;
                font-size: 12px;
            }

            .inv-filtros {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-bottom: 15px;
            }

            .inv-filtros input {
                flex: 1 1 240px;
            }

            .inv-filtros select {
                flex: 0 1 195px;
            }

            .inv-tabela-container {
                width: 100%;
                overflow-x: auto;
                border: 1px solid #dfe7f0;
                border-radius: 10px;
            }

            .inv-tabela {
                width: 100%;
                border-collapse: collapse;
            }

            .inv-tabela th {
                padding: 13px;
                background: #edf3fa;
                color: #344965;
                font-size: 12px;
                text-align: left;
                white-space: nowrap;
            }

            .inv-tabela td {
                padding: 10px 13px;
                color: #273b54;
                border-bottom: 1px solid #e8eef5;
                font-size: 12px;
            }

            .inv-tabela tbody tr:hover {
                background: #f7faff;
            }

            .inv-modelo {
                font-weight: 800;
            }

            .inv-quantidade {
                width: 86px !important;
                min-height: 36px !important;
                text-align: center;
                padding: 7px !important;
            }

            .inv-observacao {
                min-width: 160px;
                min-height: 36px !important;
                padding: 7px 9px !important;
            }

            .inv-positivo {
                color: #168b57 !important;
                font-weight: 800;
            }

            .inv-negativo {
                color: #c64757 !important;
                font-weight: 800;
            }

            .inv-neutro {
                color: #74839a !important;
            }

            .inv-status {
                display: inline-block;
                padding: 5px 9px;
                border-radius: 7px;
                font-size: 10px;
                font-weight: 800;
            }

            .inv-status.pendente {
                background: #edf1f6;
                color: #697b91;
            }

            .inv-status.conferido {
                background: #e6f7ed;
                color: #168b57;
            }

            .inv-status.divergente {
                background: #ffecef;
                color: #c64757;
            }

            .inv-rodape-acoes {
                justify-content: flex-end;
                margin-top: 20px;
            }

            .inv-mensagem {
                margin-top: 15px;
                padding: 12px;
                border-radius: 9px;
                font-size: 13px;
            }

            .inv-sucesso {
                background: #e6f7ed;
                color: #166c43;
            }

            .inv-erro {
                background: #fff0f1;
                color: #b03244;
            }

            .inv-acoes-tabela {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }

            .inv-mini-btn {
                padding: 6px 10px;
                border: 1px solid #cddcf0;
                background: #eef5ff;
                color: #1656a2;
                border-radius: 7px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
            }

            .inv-detalhes {
                margin-top: 18px;
            }

            .inv-detalhes[hidden] {
                display: none !important;
            }

            .inv-finalizado {
                padding: 12px;
                margin-bottom: 15px;
                background: #e6f7ed;
                color: #166c43;
                border-radius: 9px;
            }

            .inv-finalizado[hidden] {
                display: none !important;
            }

            @media (max-width: 1100px) {
                .inv-cards {
                    grid-template-columns: repeat(2, 1fr);
                }

                .inv-dados {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            @media (max-width: 650px) {
                .inv-cards,
                .inv-dados {
                    grid-template-columns: 1fr;
                }

                .inv-painel {
                    padding: 14px;
                }
            }

            @media print {
                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }

                body.smi-imprimindo-inventario .sidebar,
                body.smi-imprimindo-inventario
                main.conteudo > :not(#${TELA}),
                body.smi-imprimindo-inventario
                .inv-acoes,
                body.smi-imprimindo-inventario
                .inv-filtros,
                body.smi-imprimindo-inventario
                .inv-rodape-acoes,
                body.smi-imprimindo-inventario
                #invHistorico {
                    display: none !important;
                }

                body.smi-imprimindo-inventario .conteudo {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    overflow: visible !important;
                }

                body.smi-imprimindo-inventario #${TELA} {
                    display: block !important;
                }

                .inv-tabela-container {
                    overflow: visible !important;
                }

                .inv-quantidade,
                .inv-observacao {
                    border: 0 !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ======================================================
       CRIAR INTERFACE
       ====================================================== */

    function criarTela() {
        const main = document.querySelector(
            "main.conteudo"
        );

        if (!main || el(TELA)) return;

        const tela = document.createElement("section");
        tela.id = TELA;
        tela.className = "tela";
        tela.hidden = true;

        tela.innerHTML = `
            <div class="inv-cabecalho">
                <div>
                    <h2>Inventário Geral de Máquinas</h2>
                    <p>
                        Contagem consolidada:
                        Estoque Principal + Show Room
                    </p>
                </div>

                <div class="inv-acoes">
                    <button type="button"
                        id="invAtualizar"
                        class="btn btn-secundario">
                        Atualizar saldos
                    </button>

                    <button type="button"
                        id="invImprimir"
                        class="btn btn-secundario">
                        Imprimir
                    </button>
                </div>
            </div>

            <div class="inv-cards">
                <div class="inv-card">
                    <span>Total no sistema</span>
                    <strong id="invTotalSistema">0</strong>
                </div>

                <div class="inv-card verde">
                    <span>Modelos contados</span>
                    <strong id="invContados">0</strong>
                </div>

                <div class="inv-card amarelo">
                    <span>Pendentes</span>
                    <strong id="invPendentes">0</strong>
                </div>

                <div class="inv-card vermelho">
                    <span>Divergências</span>
                    <strong id="invDivergencias">0</strong>
                </div>
            </div>

            <div class="inv-painel">
                <h3>Informações da contagem</h3>

                <div class="inv-dados">
                    <label>
                        Responsável *
                        <input type="text"
                            id="invResponsavel"
                            maxlength="120"
                            placeholder="Nome do responsável">
                    </label>

                    <label>
                        Data do inventário *
                        <input type="date" id="invData">
                    </label>

                    <label>
                        Identificação
                        <input type="text"
                            id="invIdentificacao"
                            maxlength="120"
                            placeholder="Ex.: Inventário geral">
                    </label>
                </div>

                <p class="inv-nota">
                    Contagem única dos dois estoques.
                    Reservas ativas entram no estoque físico.
                    Máquinas vendidas e já baixadas não entram.
                    A contagem só altera os saldos depois da aprovação.
                </p>
            </div>

            <div class="inv-painel">
                <h3>Contagem física</h3>

                <p id="invFinalizado"
                    class="inv-finalizado" hidden>
                    Inventário finalizado e registrado
                    no Supabase.
                </p>

                <div class="inv-filtros">
                    <input type="search"
                        id="invBusca"
                        placeholder="Buscar modelo da máquina...">

                    <select id="invFiltro">
                        <option value="todos">
                            Todos os modelos
                        </option>
                        <option value="pendentes">
                            Pendentes
                        </option>
                        <option value="divergentes">
                            Com divergência
                        </option>
                        <option value="conferidos">
                            Conferidos
                        </option>
                    </select>
                </div>

                <div class="inv-tabela-container">
                    <table class="inv-tabela">
                        <thead>
                            <tr>
                                <th>Modelo</th>
                                <th>Saldo do sistema</th>
                                <th>Contagem física</th>
                                <th>Diferença</th>
                                <th>Status</th>
                                <th>Observações</th>
                            </tr>
                        </thead>

                        <tbody id="invTabelaCorpo"></tbody>
                    </table>
                </div>

                <div class="inv-rodape-acoes">
                    <button type="button"
                        id="invNovaContagem"
                        class="btn btn-secundario">
                        Nova contagem
                    </button>

                    <button type="button"
                        id="invLimpar"
                        class="btn btn-secundario">
                        Limpar contagem
                    </button>

                    <button type="button"
                        id="invExportar"
                        class="btn btn-secundario">
                        Exportar CSV
                    </button>

                    <button type="button"
                        id="invSalvar"
                        class="btn btn-primario">
                        Finalizar inventário
                    </button>
                </div>

                <p id="invMensagem"
                    class="inv-mensagem"
                    role="status"
                    aria-live="polite"
                    hidden></p>
            </div>

            <div class="inv-painel" id="invPainelAprovacao" hidden>
                <h3>Aprovar ajustes do inventário</h3>
                <p class="inv-nota">Informe a diferença em cada local. Use números negativos para retirar máquinas e positivos para acrescentar. A soma dos dois locais deve ser igual à divergência geral.</p>
                <div class="inv-tabela-container">
                    <table class="inv-tabela">
                        <thead><tr><th>Modelo</th><th>Diferença geral</th><th>Ajuste Estoque Principal</th><th>Ajuste Show Room</th></tr></thead>
                        <tbody id="invTabelaAprovacao"></tbody>
                    </table>
                </div>
                <button type="button" id="invAprovar" class="btn btn-primario">Aprovar e atualizar Estoque</button>
            </div>

            <div class="inv-painel" id="invHistorico">
                <h3>Histórico de inventários</h3>

                <div class="inv-tabela-container">
                    <table class="inv-tabela">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Responsável</th>
                                <th>Identificação</th>
                                <th>Modelos</th>
                                <th>Divergências</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody id="invTabelaHistorico"></tbody>
                    </table>
                </div>

                <div class="inv-detalhes"
                    id="invDetalhes"
                    hidden></div>
            </div>
        `;

        const rodape = main.querySelector(".rodape");

        if (rodape) {
            rodape.before(tela);
        } else {
            main.appendChild(tela);
        }

        el("invData").value = hoje();
    }

    /* ======================================================
       MENU
       ====================================================== */

    function criarMenu() {
        const menu = document.querySelector(
            ".sidebar .menu"
        );

        if (!menu || el("btnInventarioSMI")) return;

        const botao = document.createElement("button");
        botao.id = "btnInventarioSMI";
        botao.type = "button";
        botao.className = "menu-item";
        botao.setAttribute("aria-controls", TELA);

        const icone = document.createElement("span");
        icone.className = "smi-icone-final";
        icone.setAttribute("aria-hidden", "true");

        icone.innerHTML = `
            <svg viewBox="0 0 24 24"
                width="19" height="19"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round">
                <rect x="4" y="3"
                    width="16" height="18" rx="2"/>
                <path d="M8 3.5h8"/>
                <path d="M8 10l2 2 4-4"/>
                <path d="M8 17h8"/>
            </svg>
        `;

        const texto = document.createElement("span");
        texto.className = "smi-texto-final";
        texto.textContent = "Inventário";

        botao.append(icone, texto);

        const showroom = menu.querySelector(
            '[data-tela="showroom"]'
        );

        if (showroom) {
            showroom.after(botao);
        } else {
            menu.appendChild(botao);
        }

        botao.addEventListener("click", abrirInventario);
    }

    /* ======================================================
       NAVEGAÇÃO
       ====================================================== */

    async function abrirInventario() {
        inventarioAberto = true;

        document.querySelectorAll(
            "main .tela"
        ).forEach(tela => {
            tela.hidden = tela.id !== TELA;
        });

        const indicadores =
            document.querySelector(".indicadores");

        if (indicadores) indicadores.hidden = true;

        document.querySelectorAll(
            ".sidebar .menu-item"
        ).forEach(botao => {
            botao.classList.remove("ativo");
            botao.removeAttribute("aria-current");
        });

        el("btnInventarioSMI").classList.add("ativo");

        el("btnInventarioSMI").setAttribute(
            "aria-current",
            "page"
        );

        el("tituloPagina").textContent = "Inventário";

        try {
            const user = await usuario();

            if (!inventarioAberto) return;

            if (usuarioId !== user.id) {
                usuarioId = user.id;
                carregarRascunho();
            }

            if (!referencia) {
                await carregarReferencia();
            }

            if (!inventarioAberto) return;

            renderizar();
            await carregarHistorico();

        } catch (erro) {
            mensagem(erro.message, true);
        }
    }

    function sairInventario() {
        if (!inventarioAberto) return;

        inventarioAberto = false;
        salvarRascunho();

        el(TELA).hidden = true;

        const indicadores =
            document.querySelector(".indicadores");

        if (indicadores) indicadores.hidden = false;

        const botao = el("btnInventarioSMI");

        botao.classList.remove("ativo");
        botao.removeAttribute("aria-current");
    }

    /* ======================================================
       CONTAGENS
       ====================================================== */

    function estadoContagem(item) {
        const registro = contagens[item.modelo];

        if (
            !registro ||
            registro.fisico === "" ||
            registro.fisico === undefined ||
            registro.fisico === null
        ) {
            return "pendente";
        }

        return Number(registro.fisico) === item.sistema
            ? "conferido"
            : "divergente";
    }

    function atualizarIndicadores() {
        if (!referencia) return;

        const modelos = referencia.modelos;

        let total = 0;
        let contados = 0;
        let divergencias = 0;

        modelos.forEach(item => {
            total += item.sistema;

            const estado = estadoContagem(item);

            if (estado !== "pendente") {
                contados++;
            }

            if (estado === "divergente") {
                divergencias++;
            }
        });

        el("invTotalSistema").textContent = total;
        el("invContados").textContent = contados;

        el("invPendentes").textContent =
            modelos.length - contados;

        el("invDivergencias").textContent = divergencias;
    }

    function validarQuantidade(valor) {
        if (valor === "") return true;

        return Number.isSafeInteger(Number(valor)) &&
            Number(valor) >= 0;
    }

    function renderizarTabela() {
        if (!referencia) return;

        const corpo = el("invTabelaCorpo");
        corpo.replaceChildren();

        const busca = el("invBusca").value
            .trim().toLowerCase();

        const filtro = el("invFiltro").value;

        const modelos = referencia.modelos.filter(item => {
            const status = estadoContagem(item);

            return item.modelo.toLowerCase().includes(busca) &&
                (
                    filtro === "todos" ||
                    (filtro === "pendentes" &&
                        status === "pendente") ||
                    (filtro === "divergentes" &&
                        status === "divergente") ||
                    (filtro === "conferidos" &&
                        status === "conferido")
                );
        });

        modelos.forEach(item => {
            const registro = contagens[item.modelo] || {};

            const linha = document.createElement("tr");

            const modelo = document.createElement("td");
            modelo.className = "inv-modelo";
            modelo.textContent = item.modelo;

            const sistema = document.createElement("td");
            sistema.textContent = item.sistema;

            const celFisico = document.createElement("td");

            const fisico = document.createElement("input");
            fisico.type = "number";
            fisico.min = "0";
            fisico.step = "1";
            fisico.className = "inv-quantidade";
            fisico.value = registro.fisico ?? "";
            fisico.disabled = finalizado || gravando;

            celFisico.append(fisico);

            const diferenca = document.createElement("td");
            const status = document.createElement("td");
            const selo = document.createElement("span");

            status.append(selo);

            const celObs = document.createElement("td");
            const obs = document.createElement("input");

            obs.type = "text";
            obs.maxLength = 300;
            obs.className = "inv-observacao";
            obs.value = registro.observacao || "";
            obs.placeholder = "Observações";
            obs.disabled = finalizado || gravando;

            celObs.append(obs);

            function atualizarLinha() {
                const estado = estadoContagem(item);
                const valor = contagens[item.modelo]?.fisico;

                const nomes = {
                    pendente: "Pendente",
                    conferido: "Conferido",
                    divergente: "Divergente"
                };

                selo.textContent = nomes[estado];
                selo.className = "inv-status " + estado;

                if (
                    valor === "" ||
                    valor === undefined ||
                    valor === null
                ) {
                    diferenca.textContent = "—";
                    diferenca.className = "inv-neutro";
                    return;
                }

                const resultado =
                    Number(valor) - item.sistema;

                diferenca.textContent =
                    resultado > 0
                        ? "+" + resultado
                        : String(resultado);

                diferenca.className =
                    resultado > 0
                        ? "inv-positivo"
                        : resultado < 0
                            ? "inv-negativo"
                            : "inv-neutro";
            }

            fisico.addEventListener("input", () => {
                const valor = fisico.value.trim();

                if (!validarQuantidade(valor)) {
                    fisico.setCustomValidity(
                        "Informe um número inteiro não negativo."
                    );
                    fisico.reportValidity();
                    return;
                }

                fisico.setCustomValidity("");

                contagens[item.modelo] = {
                    fisico: valor,
                    observacao:
                        contagens[item.modelo]?.observacao || ""
                };

                atualizarLinha();
                atualizarIndicadores();
                salvarRascunho();
            });

            obs.addEventListener("input", () => {
                contagens[item.modelo] = {
                    fisico:
                        contagens[item.modelo]?.fisico ?? "",
                    observacao: obs.value
                };

                salvarRascunho();
            });

            linha.append(
                modelo,
                sistema,
                celFisico,
                diferenca,
                status,
                celObs
            );

            corpo.append(linha);
            atualizarLinha();
        });

        if (!modelos.length) {
            const linha = document.createElement("tr");
            const celula = document.createElement("td");

            celula.colSpan = 6;
            celula.textContent =
                "Nenhum modelo encontrado.";

            linha.append(celula);
            corpo.append(linha);
        }
    }

    function renderizar() {
        atualizarIndicadores();
        renderizarTabela();

        el("invFinalizado").hidden = !finalizado;
        el("invSalvar").disabled = finalizado || gravando;
        el("invLimpar").disabled = finalizado || gravando;
        el("invAtualizar").disabled = finalizado || gravando;

        [
            "invResponsavel",
            "invData",
            "invIdentificacao"
        ].forEach(id => {
            el(id).disabled = finalizado || gravando;
        });
    }

    /* ======================================================
       GERAR REGISTRO
       ====================================================== */

    function gerarRegistro() {
        if (!referencia) {
            throw new Error("Saldo não carregado.");
        }

        const responsavel =
            el("invResponsavel").value.trim();

        const data = el("invData").value;
        const identificacao =
            el("invIdentificacao").value.trim();

        if (!responsavel || !data) {
            throw new Error(
                "Informe o responsável e a data."
            );
        }

        const linhas = referencia.modelos.map(item => {
            const registro = contagens[item.modelo] || {};
            const valor = registro.fisico;

            if (
                valor === undefined ||
                valor === null ||
                valor === ""
            ) {
                throw new Error(
                    "Existem modelos pendentes de contagem."
                );
            }

            if (!validarQuantidade(String(valor))) {
                throw new Error(
                    "Contagem inválida: " + item.modelo
                );
            }

            const fisico = Number(valor);
            const diferenca = fisico - item.sistema;

            return {
                modelo: item.modelo,
                sistema: item.sistema,
                fisico,
                diferenca,
                status: diferenca === 0
                    ? "Conferido"
                    : "Divergente",
                observacao: registro.observacao || ""
            };
        });

        return {
            id: idEnvio || novoId(),
            data_inventario: data,
            responsavel,
            identificacao,
            total_sistema: linhas.reduce(
                (s, x) => s + x.sistema, 0
            ),
            total_fisico: linhas.reduce(
                (s, x) => s + x.fisico, 0
            ),
            modelos_contados: linhas.length,
            divergencias: linhas.filter(
                x => x.diferenca !== 0
            ).length,
            registros: linhas,
            revisao_estoque: referencia.revisao
        };
    }

    /* ======================================================
       SALVAR NO SUPABASE
       ====================================================== */

    async function finalizar() {
        if (gravando || finalizado) return;

        try {
            const registro = gerarRegistro();

            gravando = true;
            renderizar();
            esconderMensagem();

            const user = await usuario();

            // Confere se o estoque permaneceu inalterado.
            const atual = await consultarEstoque();

            if (
                atual.revisao !== referencia.revisao ||
                JSON.stringify(atual.modelos) !==
                JSON.stringify(referencia.modelos)
            ) {
                throw new Error(
                    "O estoque mudou durante o inventário. " +
                    "Confira a contagem e atualize os saldos."
                );
            }

            const confirmar = window.confirm(
                "Confirma a finalização do inventário?\n\n" +
                "Modelos: " + registro.modelos_contados +
                "\nDivergências: " + registro.divergencias +
                "\n\nO inventário será salvo no Supabase. " +
                "Nenhum saldo será alterado."
            );

            if (!confirmar) return;

            if (!idEnvio) {
                idEnvio = registro.id;
                salvarRascunho();
            }

            const payload = {
                ...registro,
                id: idEnvio,
                criado_por: user.id
            };

            const { error } = await cliente()
                .from(TABELA)
                .insert(payload);

            if (error) {
                // A mesma identificação pode ter sido
                // gravada numa tentativa anterior.
                const { data: existente, error: consultaErro } =
                    await cliente()
                    .from(TABELA)
                    .select("id")
                    .eq("id", idEnvio)
                    .maybeSingle();

                if (consultaErro || !existente) {
                    throw error;
                }
            }

            finalizado = true;
            limparRascunho();

            mensagem(
                "Inventário registrado no Supabase com sucesso. " +
                "Nenhum saldo foi alterado. Confira os ajustes antes de aprovar."
            );

            mostrarAprovacao(payload);

            await carregarHistorico();

        } catch (erro) {
            mensagem(
                "Não foi possível confirmar o salvamento: " +
                erro.message +
                ". A contagem foi preservada.",
                true
            );

            salvarRascunho();

        } finally {
            gravando = false;
            renderizar();
        }
    }

    /* ======================================================
       APROVAÇÃO DOS AJUSTES (EXECUÇÃO ATÔMICA NO SUPABASE)
       ====================================================== */

    let pendenteAprovacao = null;

    function mostrarAprovacao(inventario) {
        const painel = el("invPainelAprovacao");
        const corpo = el("invTabelaAprovacao");
        painel.hidden = true;
        corpo.replaceChildren();
        pendenteAprovacao = null;

        if (inventario.aprovado_em) {
            mensagem("Este inventário já está aprovado.");
            return;
        }
        if (!inventario.revisao_estoque) {
            mensagem("Este inventário antigo não tem revisão do estoque. Faça uma nova contagem para aprová-lo.", true);
            return;
        }

        const divergentes = (inventario.registros || []).filter(
            item => item.diferenca !== 0
        );
        pendenteAprovacao = inventario;

        divergentes.forEach(item => {
            const tr = document.createElement("tr");
            const modelo = document.createElement("td");
            modelo.textContent = item.modelo;
            const diferenca = document.createElement("td");
            diferenca.textContent = item.diferenca > 0
                ? "+" + item.diferenca : String(item.diferenca);
            const principal = document.createElement("input");
            principal.type = "number";
            principal.step = "1";
            principal.value = "0";
            principal.dataset.modelo = item.modelo;
            principal.className = "inv-ajuste-principal inv-quantidade";
            const showroom = document.createElement("input");
            showroom.type = "number";
            showroom.step = "1";
            showroom.value = String(item.diferenca);
            showroom.dataset.modelo = item.modelo;
            showroom.className = "inv-ajuste-showroom inv-quantidade";
            const c1 = document.createElement("td");
            const c2 = document.createElement("td");
            c1.append(principal);
            c2.append(showroom);
            tr.append(modelo, diferenca, c1, c2);
            corpo.append(tr);
        });

        painel.hidden = false;
        painel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function aprovarAjustes() {
        const inv = pendenteAprovacao;
        if (!inv || gravando) return;

        const ajustes = [];
        for (const item of inv.registros.filter(x => x.diferenca !== 0)) {
            const inputs = [...el("invTabelaAprovacao").querySelectorAll("input")];
            const principalInput = inputs.find(x =>
                x.classList.contains("inv-ajuste-principal") && x.dataset.modelo === item.modelo
            );
            const showroomInput = inputs.find(x =>
                x.classList.contains("inv-ajuste-showroom") && x.dataset.modelo === item.modelo
            );
            const principal = Number(principalInput?.value);
            const showroom = Number(showroomInput?.value);
            if (!principalInput?.value.trim() || !showroomInput?.value.trim() ||
                !Number.isSafeInteger(principal) || !Number.isSafeInteger(showroom) ||
                principal + showroom !== item.diferenca) {
                mensagem("Confira os ajustes do modelo " + item.modelo +
                    ": a soma dos dois locais deve ser " + item.diferenca + ".", true);
                return;
            }
            ajustes.push({ modelo: item.modelo, principal, showroom });
        }

        if (!window.confirm(
            "APROVAR e ALTERAR o Estoque Principal/Show Room?\n\n" +
            "Esta ação não poderá ser repetida. Confira as quantidades por local."
        )) return;

        gravando = true;
        el("invAprovar").disabled = true;
        try {
            const { error } = await cliente().rpc("maquinas_aprovar_inventario", {
                p_inventario: inv.id,
                p_ajustes: ajustes
            });
            if (error) throw error;
            pendenteAprovacao = null;
            el("invPainelAprovacao").hidden = true;
            mensagem("Inventário aprovado. Ajustes aplicados ao estoque na nuvem. Atualize a tela do Estoque para conferir.");
            await carregarHistorico();
        } catch (erro) {
            mensagem("Não foi possível confirmar a aprovação: " + erro.message +
                ". Confira o inventário e os saldos na nuvem antes de repetir.", true);
        } finally {
            gravando = false;
            el("invAprovar").disabled = false;
        }
    }

    /* ======================================================
       HISTÓRICO COMPARTILHADO
       ====================================================== */

    async function carregarHistorico() {
        if (carregandoHistorico) return;

        carregandoHistorico = true;

        try {
            await usuario();

            const { data, error } = await cliente()
                .from(TABELA)
                .select(
                    "id,data_inventario,responsavel," +
                    "identificacao,total_sistema,total_fisico," +
                    "modelos_contados,divergencias,criado_em,aprovado_em"
                )
                .order("criado_em", {
                    ascending: false
                })
                .limit(50);

            if (error) throw error;

            historico = data || [];
            renderizarHistorico();

        } catch (erro) {
            mensagem(
                "Erro ao carregar o histórico: " +
                erro.message,
                true
            );

        } finally {
            carregandoHistorico = false;
        }
    }

    function renderizarHistorico() {
        const corpo = el("invTabelaHistorico");
        corpo.replaceChildren();

        if (!historico.length) {
            const linha = document.createElement("tr");
            const celula = document.createElement("td");

            celula.colSpan = 6;
            celula.textContent =
                "Nenhum inventário encontrado no Supabase.";

            linha.append(celula);
            corpo.append(linha);
            return;
        }

        historico.forEach(item => {
            const linha = document.createElement("tr");

            [
                formatarData(item.data_inventario),
                item.responsavel,
                item.identificacao || "—",
                item.modelos_contados,
                item.divergencias
            ].forEach(valor => {
                const td = document.createElement("td");
                td.textContent = String(valor ?? "");
                linha.append(td);
            });

            const acoes = document.createElement("td");
            const botao = document.createElement("button");

            botao.type = "button";
            botao.className = "inv-mini-btn";
            botao.textContent = "Visualizar";

            botao.addEventListener("click", () => {
                abrirDetalhes(item.id);
            });

            acoes.append(botao);
            if (!item.aprovado_em) {
                const aprovar = document.createElement("button");
                aprovar.type = "button";
                aprovar.className = "inv-mini-btn";
                aprovar.textContent = "Conferir ajustes";
                aprovar.addEventListener("click", async () => {
                    try {
                        const { data, error } = await cliente()
                            .from(TABELA).select("*")
                            .eq("id", item.id).single();
                        if (error) throw error;
                        mostrarAprovacao(data);
                    } catch (erro) {
                        mensagem(erro.message, true);
                    }
                });
                acoes.append(aprovar);
            }
            linha.append(acoes);
            corpo.append(linha);
        });
    }

    /* ======================================================
       VISUALIZAR INVENTÁRIO ANTERIOR
       ====================================================== */

    async function abrirDetalhes(id) {
        const painel = el("invDetalhes");

        painel.hidden = false;
        painel.replaceChildren();

        const carregando = document.createElement("p");
        carregando.textContent = "Carregando inventário...";
        painel.append(carregando);

        try {
            await usuario();

            const { data, error } = await cliente()
                .from(TABELA)
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;

            painel.replaceChildren();

            const titulo = document.createElement("h3");
            titulo.textContent =
                "Inventário de " +
                formatarData(data.data_inventario);

            const resumo = document.createElement("p");
            resumo.textContent =
                "Responsável: " + data.responsavel +
                " | Total sistema: " + data.total_sistema +
                " | Total físico: " + data.total_fisico;

            const tabela = document.createElement("table");
            tabela.className = "inv-tabela";

            const thead = document.createElement("thead");
            const cabecalho = document.createElement("tr");

            [
                "Modelo",
                "Sistema",
                "Físico",
                "Diferença",
                "Status",
                "Observações"
            ].forEach(nome => {
                const th = document.createElement("th");
                th.textContent = nome;
                cabecalho.append(th);
            });

            thead.append(cabecalho);
            tabela.append(thead);

            const tbody = document.createElement("tbody");

            (data.registros || []).forEach(item => {
                const tr = document.createElement("tr");

                [
                    item.modelo,
                    item.sistema,
                    item.fisico,
                    item.diferenca,
                    item.status,
                    item.observacao || ""
                ].forEach(valor => {
                    const td = document.createElement("td");
                    td.textContent = String(valor ?? "");
                    tr.append(td);
                });

                tbody.append(tr);
            });

            tabela.append(tbody);

            const fechar = document.createElement("button");
            fechar.type = "button";
            fechar.className = "btn btn-secundario";
            fechar.textContent = "Fechar detalhes";

            fechar.addEventListener("click", () => {
                painel.hidden = true;
                painel.replaceChildren();
            });

            painel.append(titulo, resumo, tabela, fechar);

            painel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (erro) {
            painel.textContent =
                "Erro ao consultar inventário: " +
                erro.message;
        }
    }

    /* ======================================================
       NOVA CONTAGEM
       ====================================================== */

    async function novaContagem() {
        if (gravando) return;

        if (!finalizado && temContagem()) {
            if (!window.confirm(
                "Iniciar uma nova contagem e descartar " +
                "o rascunho atual?"
            )) return;
        }

        try {
            const novaReferencia =
                await consultarEstoque();

            referencia = novaReferencia;
            contagens = {};
            finalizado = false;
            idEnvio = null;
            el("invPainelAprovacao").hidden = true;

            limparRascunho();

            el("invResponsavel").value = "";
            el("invIdentificacao").value = "";
            el("invData").value = hoje();
            el("invBusca").value = "";
            el("invFiltro").value = "todos";

            esconderMensagem();
            renderizar();

            mensagem("Nova contagem iniciada.");

        } catch (erro) {
            mensagem(erro.message, true);
        }
    }

    async function atualizarSaldos() {
        if (gravando || finalizado) return;

        if (temContagem() && !window.confirm(
            "Atualizar os saldos pode alterar as divergências. " +
            "Deseja continuar?"
        )) return;

        try {
            await carregarReferencia();

            mensagem(
                "Saldos consolidados atualizados."
            );

        } catch (erro) {
            mensagem(erro.message, true);
        }
    }

    function limparContagem() {
        if (gravando || finalizado) return;

        if (!window.confirm(
            "Limpar todas as quantidades informadas?"
        )) return;

        contagens = {};
        idEnvio = null;
        salvarRascunho();
        renderizar();
    }

    /* ======================================================
       EXPORTAR CSV
       ====================================================== */

    function exportarCSV() {
        try {
            if (!referencia) {
                throw new Error(
                    "Saldo não carregado."
                );
            }

            const cabecalho = [
                "Modelo",
                "Sistema",
                "Físico",
                "Diferença",
                "Status",
                "Observações"
            ];

            const linhas = referencia.modelos.map(item => {
                const registro = contagens[item.modelo] || {};

                const informado =
                    registro.fisico !== undefined &&
                    registro.fisico !== "";

                const fisico = informado
                    ? Number(registro.fisico)
                    : "";

                return [
                    item.modelo,
                    item.sistema,
                    fisico,
                    informado
                        ? fisico - item.sistema
                        : "",
                    informado
                        ? estadoContagem(item)
                        : "Pendente",
                    registro.observacao || ""
                ];
            });

            function escapar(valor) {
                let texto = String(valor ?? "");

                if (/^\s*[=+\-@]/.test(texto)) {
                    texto = "'" + texto;
                }

                return '"' +
                    texto.replace(/"/g, '""') + '"';
            }

            const conteudo = [
                cabecalho,
                ...linhas
            ].map(linha =>
                linha.map(escapar).join(";")
            ).join("\r\n");

            const blob = new Blob(
                ["\uFEFF", conteudo],
                { type: "text/csv;charset=utf-8" }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download =
                "SMI_Inventario_Geral_" +
                (el("invData").value || hoje()) +
                ".csv";

            document.body.append(link);
            link.click();
            link.remove();

            setTimeout(
                () => URL.revokeObjectURL(url),
                1000
            );

        } catch (erro) {
            mensagem(erro.message, true);
        }
    }

    /* ======================================================
       IMPRESSÃO
       ====================================================== */

    function imprimir() {
        document.body.classList.add(
            "smi-imprimindo-inventario"
        );

        window.print();
    }

    window.addEventListener("afterprint", () => {
        document.body.classList.remove(
            "smi-imprimindo-inventario"
        );
    });

    /* ======================================================
       EVENTOS
       ====================================================== */

    function configurarEventos() {
        el("invAprovar").addEventListener("click", aprovarAjustes);
        el("invAtualizar").addEventListener(
            "click", atualizarSaldos
        );

        el("invBusca").addEventListener(
            "input", renderizarTabela
        );

        el("invFiltro").addEventListener(
            "change", renderizarTabela
        );

        el("invSalvar").addEventListener(
            "click", finalizar
        );

        el("invNovaContagem").addEventListener(
            "click", novaContagem
        );

        el("invLimpar").addEventListener(
            "click", limparContagem
        );

        el("invExportar").addEventListener(
            "click", exportarCSV
        );

        el("invImprimir").addEventListener(
            "click", imprimir
        );

        [
            "invResponsavel",
            "invData",
            "invIdentificacao"
        ].forEach(id => {
            el(id).addEventListener(
                "input", salvarRascunho
            );
        });

        document.querySelectorAll(
            ".sidebar .menu-item"
        ).forEach(botao => {
            if (botao.id === "btnInventarioSMI") return;

            botao.addEventListener(
                "click",
                sairInventario,
                true
            );
        });
    }

    /* ======================================================
       INICIALIZAÇÃO
       ====================================================== */

    function iniciar() {
        criarEstilos();
        criarTela();
        criarMenu();
        configurarEventos();

        console.log(
            "SMI Máquinas — Inventário Supabase inicializado."
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded", iniciar
        );
    } else {
        iniciar();
    }

})();
