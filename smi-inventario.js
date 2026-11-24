/* ==========================================================
   SMI MÁQUINAS — INVENTÁRIO GERAL
   Integração Supabase — 2026

   Contagem: ESTOQUE PRINCIPAL + SHOW ROOM
   Histórico compartilhado na nuvem
   Saldos alterados somente após aprovação
   ========================================================== */

(() => {
    "use strict";

    const TABELA = "inventarios_maquinas";
    const TELA = "telaInventarioSMI";
    const RASCUNHO = "smi_inventario_por_local_v3";

    const LOCAIS = ["estoque", "showroom"];

    const nomeLocal = setor =>
        setor === "showroom"
            ? "Show Room"
            : "Estoque Principal";

    const chave = item =>
        `${item.setor}::${item.modelo}`;

    const el = id => document.getElementById(id);

    let referencia = null;
    let contagens = {};
       let historico = [];
    let ultimoInventario = null;
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
                    setor: el("invLocal")?.value || "estoque",
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

            el("invLocal").value =
                LOCAIS.includes(salvo.setor)
                    ? salvo.setor
                    : "estoque";

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
       ESTOQUE POR LOCAL DIRETO DA NUVEM
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

        const modelos = LOCAIS.flatMap(setor =>
            MODELOS.map(modelo => {

                // Reservas não diminuem o estoque físico.

                const entradas = estado.entradas
                    .filter(item =>
                        item.modelo === modelo &&
                        (
                            item.setor === "showroom"
                                ? "showroom"
                                : "estoque"
                        ) === setor
                    )
                    .reduce(
                        (soma, item) =>
                            soma + Number(
                                item.quantidade || 0
                            ),
                        0
                    );

                const saidas = estado.saidas
                    .filter(item =>
                        item.modelo === modelo &&
                        (
                            item.setor === "showroom"
                                ? "showroom"
                                : "estoque"
                        ) === setor
                    )
                    .reduce(
                        (soma, item) =>
                            soma + Number(
                                item.quantidade || 0
                            ),
                        0
                    );

                return {
                    modelo,
                    setor,
                    sistema: entradas - saidas
                };
            })
        );

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

            /* ==========================================
               NOVOS GRÁFICOS DO INVENTÁRIO
               ========================================== */

            .inv-graficos {
                display: grid;
                gap: 14px;
                margin-bottom: 20px;
            }

            .inv-grafico {
                background: #fff;
                border: 1px solid #dfe7f0;
                border-radius: 14px;
                padding: 0;
                min-width: 0;
                overflow: hidden;
            }

            .inv-grafico-cabecalho {
                display: flex;
                align-items: center;
                gap: 18px;
                flex-wrap: wrap;
                padding: 13px 17px;
                color: white;
                background: #1769e8;
            }

            .inv-grafico-acessorios
            .inv-grafico-cabecalho {
                background: #18a8db;
            }

            .inv-grafico-cabecalho h3 {
                margin: 0;
                font-size: 17px;
                color: white;
                flex: 1 1 260px;
            }

            .inv-grafico-resumo {
                display: flex;
                align-items: center;
                gap: 24px;
            }

            .inv-grafico-metrica {
                display: flex;
                flex-direction: column;
                min-width: 90px;
            }

            .inv-grafico-metrica small {
                color: #ffffff !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                opacity: 1 !important;
                white-space: nowrap;
                line-height: 1.5;
            }

            .inv-grafico-metrica strong {
                color: #ffffff !important;
                font-size: 22px !important;
                font-weight: 800 !important;
                line-height: 1.3;
            }

            .inv-grafico-filtro {
                border: 0;
                border-radius: 8px;
                background: #fff;
                color: #183b68;
                font-weight: 700;
                padding: 8px 10px;
                max-width: 175px;
            }

            .inv-grafico-rolagem {
                overflow-x: auto;
                overflow-y: hidden;
                padding: 10px 16px 8px 44px;
                position: relative;
            }

            .inv-grafico-area {
                display: flex;
                align-items: end;
                gap: 9px;
                height: 190px;
                min-width: 100%;
                width: max-content;
                padding: 20px 8px 0;
                border-bottom: 1px solid #c9d5e4;
                box-sizing: border-box;

                background-image:
                    repeating-linear-gradient(
                        to top,
                        transparent 0,
                        transparent calc(25% - 1px),
                        #e3eaf3 calc(25% - 1px),
                        #e3eaf3 25%
                    );
            }

            .inv-grafico-item {
                width: 57px;
                flex: 0 0 57px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: end;
                height: 100%;
            }

            .inv-grafico-numero {
                font-size: 12px;
                font-weight: 700;
                color: #172840;
                margin-bottom: 4px;
            }

            .inv-grafico-coluna {
                width: 27px;
                border-radius: 3px 3px 0 0;
                min-height: 2px;
            }

            .inv-grafico-rotulos {
                display: flex;
                gap: 9px;
                min-width: 100%;
                width: max-content;
                padding: 0 8px;
                box-sizing: border-box;
            }

            .inv-grafico-rotulo {
                width: 57px;
                flex: 0 0 57px;
                height: 80px;
                position: relative;
            }

            .inv-grafico-rotulo span {
                position: absolute;
                top: 7px;
                left: 28px;
                transform: rotate(45deg);
                transform-origin: left top;
                width: 95px;
                font-size: 11px;
                color: #263954;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .inv-grafico-vazio {
                color: #64758d;
                padding: 18px 0;
            }

            /* ==========================================
               OPÇÃO 1 — NOVO VISUAL DOS CARDS
               ========================================== */

            .inv-card {
                border-top: 3px solid #1769e8;
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 16px 18px;
                min-height: 90px;
                box-shadow: 0 2px 5px rgba(19,45,81,.05);
            }

            .inv-card.verde {
                border-top-color: #149c54;
            }

            .inv-card.amarelo {
                border-top-color: #ed9a17;
            }

            .inv-card.vermelho {
                border-top-color: #e33a49;
            }

            .inv-card-icone {
                width: 48px;
                height: 48px;
                flex: 0 0 48px;
                display: grid;
                place-items: center;
                border-radius: 10px;
                color: #1769e8;
                background: #edf4ff;
                font-size: 25px;
            }

            .inv-card.verde .inv-card-icone {
                color: #148b51;
                background: #e9f8ef;
            }

            .inv-card.amarelo .inv-card-icone {
                color: #d48b11;
                background: #fff4e5;
            }

            .inv-card.vermelho .inv-card-icone {
                color: #d73548;
                background: #fff0f1;
            }

            .inv-card-info {
                min-width: 0;
            }

            .inv-card strong {
                margin-top: 2px;
            }

            /* ==========================================
               BARRA DE PROGRESSO DO INVENTÁRIO
               ========================================== */

            .inv-progresso {
                display: flex;
                align-items: center;
                gap: 20px;
                background: #f6f9ff;
                border: 1px solid #cfddf5;
                border-radius: 12px;
                padding: 15px 19px;
                margin-bottom: 28px;
            }

            .inv-progresso-conteudo {
                flex: 1;
                min-width: 0;
            }

            .inv-progresso-titulo {
                display: block;
                color: #102c57;
                font-weight: 800;
                font-size: 17px;
                margin-bottom: 8px;
            }

            .inv-progresso-trilho {
                height: 14px;
                border-radius: 30px;
                background: #dbe5f3;
                overflow: hidden;
            }

            .inv-progresso-preenchimento {
                height: 100%;
                width: 0%;
                background: #1769e8;
                border-radius: inherit;
                transition: width .25s;
            }

            .inv-ultima-data {
                color: #203b64;
                font-size: 13px;
                border-left: 1px solid #c4d4ec;
                padding-left: 22px;
                white-space: nowrap;
            }

            /* ==========================================
               GRÁFICOS LADO A LADO
               ========================================== */

            .inv-graficos {
                grid-template-columns:
                    repeat(2, minmax(0,1fr));
                gap: 16px;
            }

            .inv-grafico {
                padding: 15px 14px 9px;
                overflow: hidden;
            }

            .inv-grafico-cabecalho,
            .inv-grafico-acessorios .inv-grafico-cabecalho {
                background: #fff;
                color: #172840;
                padding: 0 0 12px;
                gap: 10px;
                flex-wrap: nowrap;
                align-items: start;
            }

            .inv-grafico-cabecalho h3 {
                color: #172840;
                font-size: 16px;
                flex: 1 1 auto;
                min-width: 0;
                padding: 7px 0 7px 12px;
                border-left: 4px solid #1769e8;
            }

            .inv-grafico-acessorios
            .inv-grafico-cabecalho h3 {
                border-left-color: #18a8db;
            }

            .inv-grafico-resumo {
                gap: 6px;
                flex: 0 0 auto;
            }

            .inv-grafico-metrica {
                background: #eef4fc;
                border-radius: 8px;
                padding: 5px 7px;
                min-width: 65px;
                text-align: center;
            }

            .inv-grafico-metrica small {
                color: #28476e !important;
                opacity: 1 !important;
                font-size: 10px !important;
                font-weight: 600;
            }

            .inv-grafico-metrica strong {
                color: #0f4caa !important;
                font-size: 18px !important;
            }

            .inv-grafico-filtro {
                display: none;
            }

            .inv-grafico-area {
                height: 205px;
            }

            .inv-grafico-coluna {
                width: 29px;
            }

            .inv-local-global {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #29466c;
                font-size: 12px;
            }

            .inv-local-global select {
                border: 1px solid #d2dfef;
                border-radius: 8px;
                padding: 9px 12px;
                background: white;
                color: #152f55;
                font-weight: 700;
            }

            .inv-grafico-item.inv-top3
            .inv-grafico-coluna {
                background: #0950ce !important;
            }

            .inv-grafico-acessorios
            .inv-grafico-item.inv-top3
            .inv-grafico-coluna {
                background: #078caa !important;
            }

            @media(max-width: 1350px) {
                .inv-graficos {
                    grid-template-columns: 1fr;
                }

                .inv-grafico-cabecalho {
                    flex-wrap: wrap !important;
                }
            }

            @media(max-width: 800px) {
                .inv-progresso {
                    flex-wrap: wrap;
                }

                .inv-ultima-data {
                    border-left: 0;
                    padding-left: 0;
                }
            }

            /* ==========================================
               EIXOS DOS GRÁFICOS
               ========================================== */

            .inv-grafico-eixo {
                position: absolute;
                top: 30px;
                left: 4px;
                height: 170px;
                width: 36px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                text-align: right;
                color: #62748b;
                font-size: 10px;
            }

            @media (max-width: 750px) {
                .inv-grafico-resumo {
                    width: 100%;
                    justify-content: space-between;
                    gap: 8px;
                }

                .inv-grafico-cabecalho {
                    gap: 10px;
                }
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
                .inv-graficos,
                body.smi-imprimindo-inventario
                .inv-progresso,
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
                        Contagem separada por local:
                        Estoque Principal e Show Room
                    </p>
                </div>

                <div class="inv-acoes">
                    <label class="inv-local-global">
                        Local:

                        <select
                            id="invLocalGraficos"
                            aria-label="Filtrar gráficos por local">

                            <option value="todos">
                                Todos os locais
                            </option>

                            <option value="estoque">
                                Estoque Principal
                            </option>

                            <option value="showroom">
                                Show Room
                            </option>

                        </select>
                    </label>

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

            <!-- ==========================================
                 CARDS DO INVENTÁRIO
                 ========================================== -->

            <div class="inv-cards">

                <div class="inv-card">
                    <div class="inv-card-icone"
                        aria-hidden="true">
                        ▤
                    </div>

                    <div class="inv-card-info">
                        <span>Total no sistema</span>
                        <strong id="invTotalSistema">0</strong>
                    </div>
                </div>

                <div class="inv-card verde">
                    <div class="inv-card-icone"
                        aria-hidden="true">
                        ⬡
                    </div>

                    <div class="inv-card-info">
                        <span>Modelos contados</span>
                        <strong id="invContados">0</strong>
                    </div>
                </div>

                <div class="inv-card amarelo">
                    <div class="inv-card-icone"
                        aria-hidden="true">
                        ◷
                    </div>

                    <div class="inv-card-info">
                        <span>Pendentes</span>
                        <strong id="invPendentes">0</strong>
                    </div>
                </div>

                <div class="inv-card vermelho">
                    <div class="inv-card-icone"
                        aria-hidden="true">
                        ⚠
                    </div>

                    <div class="inv-card-info">
                        <span>Divergências</span>
                        <strong id="invDivergencias">0</strong>
                    </div>
                </div>

            </div>

            <!-- ==========================================
                 PROGRESSO DA CONTAGEM
                 ========================================== -->

            <div class="inv-progresso"
                aria-label="Progresso da contagem">

                <div class="inv-progresso-conteudo">

                    <span class="inv-progresso-titulo"
                        id="invTextoProgresso">
                        0 de 0 modelos contados
                    </span>

                    <div class="inv-progresso-trilho">
                        <div
                            class="inv-progresso-preenchimento"
                            id="invBarraProgresso">
                        </div>
                    </div>

                </div>

                <div class="inv-ultima-data">
                    ▣ Último inventário:
                    <strong id="invUltimaData">—</strong>
                </div>

            </div>

            <!-- ==========================================
                 GRÁFICOS DO INVENTÁRIO
                 ========================================== -->

            <div class="inv-graficos"
                aria-label="Gráficos de saldo por modelo">

                <!-- GRÁFICO DE MÁQUINAS -->

                <div class="inv-grafico inv-grafico-maquinas">

                    <div class="inv-grafico-cabecalho">

                        <h3>
                            Quantidade de máquinas por modelo
                        </h3>

                        <div
                            class="inv-grafico-resumo"
                            id="invResumoMaquinas">
                        </div>

                        <select
                            class="inv-grafico-filtro"
                            id="invFiltroGraficoMaquinas"
                            aria-label="Filtrar gráfico de máquinas por local">

                            <option value="todos">
                                Todos os locais
                            </option>

                            <option value="estoque">
                                Estoque Principal
                            </option>

                            <option value="showroom">
                                Show Room
                            </option>

                        </select>

                    </div>

                    <div
                        id="invGraficoMaquinas"
                        class="inv-grafico-rolagem">
                    </div>

                </div>

                <!-- GRÁFICO DE ACESSÓRIOS -->

                <div class="inv-grafico inv-grafico-acessorios">

                    <div class="inv-grafico-cabecalho">

                        <h3>
                            Quantidade de acessórios por modelo
                        </h3>

                        <div
                            class="inv-grafico-resumo"
                            id="invResumoAcessorios">
                        </div>

                        <select
                            class="inv-grafico-filtro"
                            id="invFiltroGraficoAcessorios"
                            aria-label="Filtrar gráfico de acessórios por local">

                            <option value="todos">
                                Todos os locais
                            </option>

                            <option value="estoque">
                                Estoque Principal
                            </option>

                            <option value="showroom">
                                Show Room
                            </option>

                        </select>

                    </div>

                    <div
                        id="invGraficoAcessorios"
                        class="inv-grafico-rolagem">
                    </div>

                </div>

            </div>

            <!-- ==========================================
                 INFORMAÇÕES DA CONTAGEM
                 ========================================== -->

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
                    Selecione o local e conte as máquinas
                    de cada depósito.

                    Reservas ativas entram no estoque físico.

                    Máquinas vendidas e já baixadas não entram.

                    Conte os dois locais antes de finalizar.
                    Os saldos só mudam após a aprovação.
                </p>
            </div>

            <!-- ==========================================
                 CONTAGEM FÍSICA
                 ========================================== -->

            <div class="inv-painel">
                <h3>Contagem física</h3>

                <label style="
                    display:block;
                    max-width:360px;
                    margin:12px 0;
                    font-weight:700;
                ">
                    Local da contagem

                    <select id="invLocal" style="
                        display:block;
                        width:100%;
                        padding:12px;
                        margin-top:6px;
                        border:1px solid #cbd9ea;
                        border-radius:8px;
                    ">

                        <option value="estoque">
                            Estoque Principal
                        </option>

                        <option value="showroom">
                            Show Room
                        </option>

                    </select>
                </label>

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

            <div class="inv-painel"
                id="invPainelAprovacao" hidden>

                <h3>Aprovar ajustes do inventário</h3>

                <p class="inv-nota">
                    As divergências já estão identificadas
                    por local. Confira antes de aprovar.
                </p>

                <div class="inv-tabela-container">
                    <table class="inv-tabela">
                        <thead>
                            <tr>
                                <th>Modelo</th>
                                <th>Local</th>
                                <th>Diferença</th>
                            </tr>
                        </thead>

                        <tbody id="invTabelaAprovacao"></tbody>
                    </table>
                </div>

                <button type="button"
                    id="invAprovar"
                    class="btn btn-primario">
                    Aprovar e atualizar Estoque
                </button>
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

        botao.addEventListener(
            "click",
            abrirInventario
        );
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

        if (indicadores) {
            indicadores.hidden = true;
        }

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

        if (indicadores) {
            indicadores.hidden = false;
        }

        const botao = el("btnInventarioSMI");

        botao.classList.remove("ativo");
        botao.removeAttribute("aria-current");
    }

    /* ======================================================
       CONTAGENS
       ====================================================== */

    function estadoContagem(item) {
        const registro = contagens[chave(item)];

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

    /* ======================================================
       ATUALIZAR INDICADORES
       ====================================================== */

    function atualizarIndicadores() {
        if (!referencia) return;

        const modelos = referencia.modelos.filter(
            item => item.setor === el("invLocal").value
        );

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

        /* ==============================================
           BARRA DE PROGRESSO
           ============================================== */

        const titulo = el("invTextoProgresso");
        const barra = el("invBarraProgresso");

        if (titulo) {
            titulo.textContent =
                `${contados} de ${modelos.length} modelos contados`;
        }

        if (barra) {
            const percentual = modelos.length
                ? (contados / modelos.length) * 100
                : 0;

            barra.style.width = `${percentual}%`;
        }
    }

    /* ======================================================
       GRÁFICOS DO INVENTÁRIO
       ====================================================== */

    // Painel somente leitura.
    // Utiliza os saldos consolidados dos dois locais.
    // Contagens não aprovadas não substituem o saldo oficial.

    function renderizarGraficos() {
        if (!referencia?.modelos) return;

        const tipos = new Map();

        if (
            typeof dados !== "undefined" &&
            Array.isArray(dados?.catalogoImportado)
        ) {
            dados.catalogoImportado.forEach(item => {
                if (item?.modelo) {
                    tipos.set(item.modelo, item.tipo);
                }
            });
        }

        /* ==================================================
           CONSULTAR SALDOS DOS GRÁFICOS
           ================================================== */

                function itensDoGrafico(tipoDesejado, filtroId) {
            const filtro = el(filtroId)?.value || "todos";
            const totais = new Map();

            // Os gráficos utilizam somente o último
            // inventário finalizado e salvo no Supabase.

            const registros = ultimoInventario?.registros || [];

            registros.forEach(item => {
                const setor = item.setor === "showroom"
                    ? "showroom"
                    : "estoque";

                if (filtro !== "todos" && setor !== filtro) {
                    return;
                }

                const modelo = String(item.modelo || "").trim();
                const quantidade = Number(item.fisico);

                if (
                    !modelo ||
                    !Number.isFinite(quantidade) ||
                    quantidade <= 0
                ) {
                    return;
                }

                totais.set(
                    modelo,
                    (totais.get(modelo) || 0) + quantidade
                );
            });

            return [...totais.entries()]
                .filter(([modelo]) => {
                    const tipo = tipos.get(modelo) ||
                        (
                            /^(MY\d|ESTEIRA|CARRINHO)/i.test(modelo)
                                ? "acessorio"
                                : "maquina"
                        );

                    return tipo === tipoDesejado;
                })
                .map(([modelo, quantidade]) => ({
                    modelo,
                    quantidade
                }))
                .sort(
                    (a, b) =>
                        b.quantidade - a.quantidade ||
                        a.modelo.localeCompare(b.modelo)
                );
        }
        /* ==================================================
           MONTAGEM DOS GRÁFICOS
           ================================================== */

        const montar = (id, resumoId, itens, cor) => {
            const destino = el(id);

            if (!destino) return;

            destino.replaceChildren();

            const resumo = el(resumoId);

            if (resumo) {
                resumo.replaceChildren();

                const metricas = [
                    [
                        "Unidades",
                        itens.reduce(
                            (soma, item) =>
                                soma + item.quantidade,
                            0
                        )
                    ],
                    [
                        "Modelos ativos",
                        itens.length
                    ],
                    [
                        "Maior estoque",
                        itens.length
                            ? Math.max(
                                ...itens.map(
                                    item => item.quantidade
                                )
                            )
                            : 0
                    ]
                ];

                metricas.forEach(([titulo, valor]) => {
                    const campo =
                        document.createElement("div");

                    campo.className =
                        "inv-grafico-metrica";

                    const nome =
                        document.createElement("small");

                    nome.textContent = titulo;

                    const numero =
                        document.createElement("strong");

                    numero.textContent = valor;

                    campo.append(nome, numero);
                    resumo.append(campo);
                });
            }

            if (!itens.length) {
                const vazio =
                    document.createElement("p");

                vazio.className =
                    "inv-grafico-vazio";

                vazio.textContent =
                    "Nenhum item com saldo positivo.";

                destino.append(vazio);
                return;
            }

            // Ordenação do maior para o menor.

            itens.sort(
                (a, b) =>
                    b.quantidade - a.quantidade ||
                    a.modelo.localeCompare(b.modelo)
            );

                        const maximo = Math.max(
                ...itens.map(item => item.quantidade)
            );

            const area = document.createElement("div");
            area.className = "inv-grafico-area";

            // Eixo vertical com escala de quantidades.

            const eixo = document.createElement("div");
            eixo.className = "inv-grafico-eixo";

            for (let i = 4; i >= 0; i--) {
                const marca = document.createElement("span");

                marca.textContent = Math.round(
                    maximo * i / 4
                );

                eixo.append(marca);
            }

            const rotulos = document.createElement("div");
            rotulos.className = "inv-grafico-rotulos";

            // Cria uma coluna para cada modelo.

            itens.forEach(({ modelo, quantidade }, indice) => {
                const item = document.createElement("div");
                item.className = "inv-grafico-item" + (indice < 3 ? " inv-top3" : "");
                item.title = `${modelo}: ${quantidade}`;

                // Número acima da coluna.

                const numero = document.createElement("span");
                numero.className = "inv-grafico-numero";
                numero.textContent = quantidade;

                // Coluna com altura proporcional.

                const coluna = document.createElement("div");
                coluna.className = "inv-grafico-coluna";
                coluna.style.backgroundColor = cor;

                coluna.style.height =
                    `${Math.max(
                        2,
                        quantidade / maximo * 150
                    )}px`;

                item.append(numero, coluna);
                area.append(item);

                // Nome do modelo abaixo.

                const rotulo = document.createElement("div");
                rotulo.className = "inv-grafico-rotulo";

                const texto = document.createElement("span");
                texto.textContent = modelo;
                texto.title = modelo;

                rotulo.append(texto);
                rotulos.append(rotulo);
            });

            destino.append(eixo, area, rotulos);
        };

        // Máquinas: Azul Royal.

        montar(
            "invGraficoMaquinas",
            "invResumoMaquinas",
            itensDoGrafico(
                "maquina",
                "invFiltroGraficoMaquinas"
            ),
            "#1769E8"
        );

        // Acessórios: Azul Ciano.

        montar(
            "invGraficoAcessorios",
            "invResumoAcessorios",
            itensDoGrafico(
                "acessorio",
                "invFiltroGraficoAcessorios"
            ),
            "#18A8DB"
        );
    }

    /* ======================================================
       VALIDAR QUANTIDADES
       ====================================================== */

    function validarQuantidade(valor) {
        if (valor === "") return true;

        return Number.isSafeInteger(Number(valor)) &&
            Number(valor) >= 0;
    }

    /* ======================================================
       RENDERIZAR TABELA
       ====================================================== */

    function renderizarTabela() {
        if (!referencia) return;

        const corpo = el("invTabelaCorpo");
        corpo.replaceChildren();

        const busca = el("invBusca").value
            .trim().toLowerCase();

        const filtro = el("invFiltro").value;

        const modelos = referencia.modelos.filter(item => {
            const status = estadoContagem(item);

            return item.setor === el("invLocal").value &&
                item.modelo.toLowerCase().includes(busca) &&
                (
                    filtro === "todos" ||
                    (
                        filtro === "pendentes" &&
                        status === "pendente"
                    ) ||
                    (
                        filtro === "divergentes" &&
                        status === "divergente"
                    ) ||
                    (
                        filtro === "conferidos" &&
                        status === "conferido"
                    )
                );
        });

        modelos.forEach(item => {
            const registro = contagens[chave(item)] || {};

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

            /* ==============================================
               ATUALIZAR SITUAÇÃO DA LINHA
               ============================================== */

            function atualizarLinha() {
                const estado = estadoContagem(item);

                const valor =
                    contagens[chave(item)]?.fisico;

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

            /* ==============================================
               REGISTRAR CONTAGEM FÍSICA
               ============================================== */

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

                contagens[chave(item)] = {
                    fisico: valor,
                    observacao:
                        contagens[chave(item)]?.observacao || ""
                };

                atualizarLinha();
                atualizarIndicadores();
                salvarRascunho();
            });

            /* ==============================================
               REGISTRAR OBSERVAÇÕES
               ============================================== */

            obs.addEventListener("input", () => {
                contagens[chave(item)] = {
                    fisico:
                        contagens[chave(item)]?.fisico ?? "",
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

    /* ======================================================
       ATUALIZAR TELA
       ====================================================== */

    function renderizar() {
        atualizarIndicadores();
        renderizarGraficos();
        renderizarTabela();

        el("invFinalizado").hidden = !finalizado;

        el("invSalvar").disabled =
            finalizado || gravando;

        el("invLimpar").disabled =
            finalizado || gravando;

        el("invAtualizar").disabled =
            finalizado || gravando;

        [
            "invResponsavel",
            "invData",
            "invIdentificacao"
        ].forEach(id => {
            el(id).disabled =
                finalizado || gravando;
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
            const registro =
                contagens[chave(item)] || {};

            const valor = registro.fisico;

            if (
                valor === undefined ||
                valor === null ||
                valor === ""
            ) {
                throw new Error(
                    `Ainda falta contar ${item.modelo} em ${nomeLocal(item.setor)}.`
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
                setor: item.setor,
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
                (s, x) => s + x.sistema,
                0
            ),

            total_fisico: linhas.reduce(
                (s, x) => s + x.fisico,
                0
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

            // Confere se o estoque permaneceu
            // inalterado durante a contagem.

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

                // Verifica se o mesmo inventário
                // já foi registrado anteriormente.

                const {
                    data: existente,
                    error: consultaErro
                } = await cliente()
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
                "Nenhum saldo foi alterado. " +
                "Confira as divergências por local antes de aprovar."
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
       APROVAÇÃO DOS AJUSTES
       EXECUÇÃO ATÔMICA NO SUPABASE
       ====================================================== */

    let pendenteAprovacao = null;

    function mostrarAprovacao(inventario) {
        const painel = el("invPainelAprovacao");
        const corpo = el("invTabelaAprovacao");

        painel.hidden = true;
        corpo.replaceChildren();

        pendenteAprovacao = null;

        if (inventario.aprovado_em) {
            mensagem(
                "Este inventário já está aprovado."
            );
            return;
        }

        if (!inventario.revisao_estoque) {
            mensagem(
                "Este inventário antigo não tem revisão " +
                "do estoque. Faça uma nova contagem " +
                "para aprová-lo.",
                true
            );
            return;
        }

        if (
            !(inventario.registros || []).every(
                item => LOCAIS.includes(item.setor)
            )
        ) {
            mensagem(
                "Este inventário foi feito no formato antigo, " +
                "sem separação por local. Faça uma nova " +
                "contagem para aprovar com segurança.",
                true
            );
            return;
        }

        const divergentes =
            (inventario.registros || []).filter(
                item => item.diferenca !== 0
            );

        pendenteAprovacao = inventario;

        divergentes.forEach(item => {
            const tr = document.createElement("tr");

            const modelo = document.createElement("td");
            modelo.textContent = item.modelo;

            const local = document.createElement("td");
            local.textContent = nomeLocal(item.setor);

            const diferenca = document.createElement("td");

            diferenca.textContent =
                item.diferenca > 0
                    ? "+" + item.diferenca
                    : String(item.diferenca);

            tr.append(
                modelo,
                local,
                diferenca
            );

            corpo.append(tr);
        });

        painel.hidden = false;

        painel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /* ======================================================
       APROVAR E ATUALIZAR OS ESTOQUES
       ====================================================== */

    async function aprovarAjustes() {
        const inv = pendenteAprovacao;

        if (!inv || gravando) return;

        const confirmar = window.confirm(
            "APROVAR e ALTERAR o Estoque Principal/Show Room?\n\n" +
            "Os ajustes serão feitos conforme a contagem de cada local."
        );

        if (!confirmar) return;

        gravando = true;

        el("invAprovar").disabled = true;

        try {
            const { error } = await cliente().rpc(
                "maquinas_aprovar_inventario_por_local",
                {
                    p_inventario: inv.id
                }
            );

            if (error) throw error;

            pendenteAprovacao = null;

            el("invPainelAprovacao").hidden = true;

            mensagem(
                "Inventário aprovado. " +
                "Ajustes aplicados ao estoque na nuvem. " +
                "Atualize a tela do Estoque para conferir."
            );

            await carregarHistorico();

        } catch (erro) {
            mensagem(
                "Não foi possível confirmar a aprovação: " +
                erro.message +
                ". Confira o inventário e os saldos " +
                "na nuvem antes de repetir.",
                true
            );

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

            // Carrega o histórico de inventários.

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

            // Limpa o resultado anterior para evitar
            // mostrar dados desatualizados.

            ultimoInventario = null;

            if (historico.length > 0) {
                const idUltimo = historico[0].id;

                // Recupera as quantidades físicas
                // de cada modelo e de cada local.

                const {
                    data: inventario,
                    error: erroInventario
                } = await cliente()
                    .from(TABELA)
                    .select(
                        "id,data_inventario,total_fisico," +
                        "modelos_contados,divergencias,registros"
                    )
                    .eq("id", idUltimo)
                    .single();

                if (erroInventario) {
                    throw erroInventario;
                }

                ultimoInventario = inventario;
            }

            // Atualiza a data apresentada no painel.

            const ultimaData = el("invUltimaData");

            if (ultimaData) {
                ultimaData.textContent = ultimoInventario
                    ? formatarData(
                        ultimoInventario.data_inventario
                    )
                    : "Nenhum registro";

                if (ultimoInventario) {
                    ultimaData.title =
                        "Modelos registrados: " +
                        ultimoInventario.modelos_contados +
                        " | Total físico: " +
                        ultimoInventario.total_fisico +
                        " | Divergências: " +
                        ultimoInventario.divergencias;
                } else {
                    ultimaData.removeAttribute("title");
                }
            }

            // Atualiza os gráficos com a contagem física.

            renderizarGraficos();

            // Mantém o histórico disponível.

            renderizarHistorico();

        } catch (erro) {
            ultimoInventario = null;

            const ultimaData = el("invUltimaData");

            if (ultimaData) {
                ultimaData.textContent = "Indisponível";
                ultimaData.removeAttribute("title");
            }

            renderizarGraficos();

            mensagem(
                "Erro ao carregar o histórico: " +
                erro.message,
                true
            );

        } finally {
            carregandoHistorico = false;
        }
    }
    /* ======================================================
       MOSTRAR HISTÓRICO NA TABELA
       ====================================================== */

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
                aprovar.textContent = "Conferir por local";

                aprovar.addEventListener("click", async () => {
                    try {
                        const { data, error } = await cliente()
                            .from(TABELA)
                            .select("*")
                            .eq("id", item.id)
                            .single();

                        if (error) throw error;

                        mostrarAprovacao(data);

                    } catch (erro) {
                        mensagem(
                            erro.message,
                            true
                        );
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
                "Local",
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
                    item.setor
                        ? nomeLocal(item.setor)
                        : "Inventário antigo",
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

            painel.append(
                titulo,
                resumo,
                tabela,
                fechar
            );

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
            )) {
                return;
            }
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
            el("invLocal").value = "estoque";

            esconderMensagem();
            renderizar();

            mensagem("Nova contagem iniciada.");

        } catch (erro) {
            mensagem(
                erro.message,
                true
            );
        }
    }

    /* ======================================================
       ATUALIZAR SALDOS DOS DEPÓSITOS
       ====================================================== */

    async function atualizarSaldos() {
        if (gravando || finalizado) return;

        if (
            temContagem() &&
            !window.confirm(
                "Atualizar os saldos pode alterar as divergências. " +
                "Deseja continuar?"
            )
        ) {
            return;
        }

        try {
            await carregarReferencia();

            mensagem(
                "Saldos dos dois locais atualizados."
            );

        } catch (erro) {
            mensagem(
                erro.message,
                true
            );
        }
    }

    /* ======================================================
       LIMPAR CONTAGEM
       ====================================================== */

    function limparContagem() {
        if (gravando || finalizado) return;

        if (!window.confirm(
            "Limpar todas as quantidades informadas?"
        )) {
            return;
        }

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
                "Local",
                "Sistema",
                "Físico",
                "Diferença",
                "Status",
                "Observações"
            ];

            const linhas = referencia.modelos.map(item => {
                const registro =
                    contagens[chave(item)] || {};

                const informado =
                    registro.fisico !== undefined &&
                    registro.fisico !== "";

                const fisico = informado
                    ? Number(registro.fisico)
                    : "";

                return [
                    item.modelo,
                    nomeLocal(item.setor),
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
                {
                    type: "text/csv;charset=utf-8"
                }
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
            mensagem(
                erro.message,
                true
            );
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

        el("invLocalGraficos")?.addEventListener("change", event => {
            ["invFiltroGraficoMaquinas", "invFiltroGraficoAcessorios"].forEach(id => {
                if (el(id)) el(id).value = event.target.value;
            });
            renderizarGraficos();
        });

        /* ==============================================
           FILTROS DOS GRÁFICOS
           ============================================== */

        [
            "invFiltroGraficoMaquinas",
            "invFiltroGraficoAcessorios"
        ].forEach(id => {

            el(id)?.addEventListener(
                "change",
                renderizarGraficos
            );

        });

        // Alternar entre Estoque Principal e Show Room.

        el("invLocal").addEventListener(
            "change",
            () => {
                renderizar();
                salvarRascunho();
            }
        );

        // Aprovação do inventário.

        el("invAprovar").addEventListener(
            "click",
            aprovarAjustes
        );

        // Atualização de saldos.

        el("invAtualizar").addEventListener(
            "click",
            atualizarSaldos
        );

        // Busca de modelos.

        el("invBusca").addEventListener(
            "input",
            renderizarTabela
        );

        // Filtros de contagem.

        el("invFiltro").addEventListener(
            "change",
            renderizarTabela
        );

        // Finalizar inventário.

        el("invSalvar").addEventListener(
            "click",
            finalizar
        );

        // Nova contagem.

        el("invNovaContagem").addEventListener(
            "click",
            novaContagem
        );

        // Limpar contagem.

        el("invLimpar").addEventListener(
            "click",
            limparContagem
        );

        // Exportar CSV.

        el("invExportar").addEventListener(
            "click",
            exportarCSV
        );

        // Imprimir inventário.

        el("invImprimir").addEventListener(
            "click",
            imprimir
        );

        // Salvar automaticamente os dados da contagem.

        [
            "invResponsavel",
            "invData",
            "invIdentificacao"
        ].forEach(id => {
            el(id).addEventListener(
                "input",
                salvarRascunho
            );
        });

        // Fechar o inventário ao navegar para outra tela.

        document.querySelectorAll(
            ".sidebar .menu-item"
        ).forEach(botao => {

            if (
                botao.id === "btnInventarioSMI"
            ) {
                return;
            }

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
            "DOMContentLoaded",
            iniciar
        );

    } else {

        iniciar();

    }

})();

