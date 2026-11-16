
/* =========================================================
   SMI MÁQUINAS — IDENTIDADE VISUAL 2026

   MENU LATERAL + ESTOQUE + SHOW ROOM

   Alterações exclusivamente visuais.
   Não altera dados, saldos, reservas ou Supabase.
   ========================================================= */

(function () {
    "use strict";

    const ID_ESTILO = "smi-visual-integrado-2026";

    /* =====================================================
       CSS — MENU E CATÁLOGO
       ===================================================== */

    if (!document.getElementById(ID_ESTILO)) {

        const estilo = document.createElement("style");
        estilo.id = ID_ESTILO;

        estilo.textContent = `

        /* ===========================================
           MENU LATERAL
           =========================================== */

        .sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;

            display: flex !important;
            flex-direction: column !important;

            width: 235px !important;
            height: 100vh !important;

            padding: 22px 14px !important;

            background: linear-gradient(
                180deg,
                #082b5b,
                #071e3d
            ) !important;

            overflow-x: hidden !important;
            overflow-y: auto !important;

            z-index: 30 !important;
        }

        .sidebar .marca {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;

            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;

            margin: 0 0 12px !important;
            padding: 5px !important;

            overflow: visible !important;
        }

        .sidebar .marca img,
        .sidebar .marca-logo,
        .sidebar .logo-menu-smigroup {
            display: block !important;

            width: 160px !important;
            max-width: 100% !important;

            height: 65px !important;
            max-height: 65px !important;

            margin: 0 auto !important;
            padding: 0 !important;

            object-fit: contain !important;
        }

        .sidebar .marca span {
            font-size: 12px !important;
            letter-spacing: 1px !important;
            text-align: center !important;
        }

        .sidebar-descricao {
            margin: 0 0 24px !important;

            color: #b7cce5 !important;
            font-size: 11px !important;
            text-align: center !important;
        }

        .sidebar .menu {
            display: flex !important;
            flex-direction: column !important;

            width: 100% !important;
            gap: 5px !important;

            padding: 0 !important;
            margin: 0 !important;
        }

        .sidebar .menu-item {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: flex-start !important;

            width: 100% !important;
            min-height: 46px !important;

            margin: 0 !important;
            padding: 11px 12px !important;

            background: transparent;
            color: #e3edfa !important;

            border: 1px solid transparent;
            border-radius: 9px !important;

            font-size: 13px !important;
            font-weight: 600 !important;

            text-align: left !important;
            white-space: nowrap !important;

            overflow: hidden !important;
        }

        .sidebar .menu-item:hover {
            background: rgba(
                255, 255, 255, .10
            ) !important;
        }

        .sidebar .menu-item.ativo {
            background: #1265cd !important;
            color: #ffffff !important;

            border-color: #2079df !important;
            box-shadow: none !important;
        }

        .sidebar .menu-item::before,
        .sidebar .menu-item::after {
            content: none !important;
            display: none !important;
        }

        .sidebar .smi-icone-final {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;

            width: 21px !important;
            height: 21px !important;

            flex: 0 0 21px !important;

            margin-right: 12px !important;
        }

        .sidebar .smi-icone-final svg {
            width: 19px !important;
            height: 19px !important;

            fill: none !important;
            stroke: currentColor !important;
            stroke-width: 1.8 !important;

            stroke-linecap: round !important;
            stroke-linejoin: round !important;
        }

        .sidebar .smi-texto-final {
            display: block !important;

            flex: 1 !important;
            min-width: 0 !important;

            font-size: 13px !important;
            font-weight: 600 !important;

            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }

        .sidebar-ilustracao {
            display: none !important;
        }

        .sidebar-rodape {
            margin-top: auto !important;
            padding: 22px 5px 5px !important;

            text-align: center !important;
        }

        .sidebar-rodape span {
            font-size: 10px !important;
            letter-spacing: 1.5px !important;
        }

        .sidebar-rodape small {
            font-size: 10px !important;
        }

        .conteudo {
            margin-left: 235px !important;
            width: calc(100% - 235px) !important;
            min-width: 0 !important;
        }

        /* ===========================================
           ESTOQUE — ESPAÇAMENTO GERAL
           =========================================== */

        #telaEstoque {
            padding-bottom: 24px;
        }

        #telaEstoque .catalogo {
            padding-top: 8px !important;
        }

        #telaEstoque .secao-cabecalho {
            margin-bottom: 15px !important;
        }

        #telaEstoque .secao-cabecalho h2 {
            margin-bottom: 5px !important;

            color: #172840 !important;
            font-size: 22px !important;
            font-weight: 800 !important;
        }

        #telaEstoque .secao-cabecalho p {
            margin-bottom: 0 !important;

            color: #687b93 !important;
            font-size: 13px !important;
        }

        /* ===========================================
           INDICADORES DO ESTOQUE
           =========================================== */

        body .indicadores {
            gap: 13px !important;
            margin-bottom: 20px !important;
        }

        body .indicador {
            min-height: 104px !important;

            padding-top: 14px !important;
            padding-bottom: 14px !important;

            border-radius: 13px !important;
        }

        body .indicador strong {
            font-size: 29px !important;
        }

        body .indicador-titulo {
            font-size: 12px !important;
        }

        body .indicador small {
            font-size: 10px !important;
        }

        /* ===========================================
           BARRA DE PESQUISA E FILTROS
           =========================================== */

        #telaEstoque .catalogo-filtros {
            display: flex !important;
            align-items: end !important;
            flex-wrap: wrap !important;

            gap: 12px !important;

            padding: 15px !important;
            margin-bottom: 12px !important;

            background: #ffffff !important;

            border: 1px solid #dce5f0 !important;
            border-radius: 13px !important;

            box-shadow: none !important;
        }

        #telaEstoque .catalogo-filtros .campo {
            margin-bottom: 0 !important;
        }

        #telaEstoque .catalogo-filtros label {
            margin-bottom: 3px !important;

            color: #354966 !important;
            font-size: 11px !important;
            font-weight: 700 !important;
        }

        #telaEstoque .catalogo-filtros input,
        #telaEstoque .catalogo-filtros select {
            min-height: 40px !important;

            padding: 8px 12px !important;

            color: #172840 !important;
            background: #ffffff !important;

            border: 1px solid #cbd7e5 !important;
            border-radius: 8px !important;

            font-size: 12px !important;
        }

        #telaEstoque .catalogo-filtros input:focus,
        #telaEstoque .catalogo-filtros select:focus {
            outline: 2px solid #9dc5fb !important;
            outline-offset: 1px !important;
        }

        #statusCatalogo {
            margin-bottom: 12px !important;

            color: #8593a6 !important;
            font-size: 11px !important;
        }

        /* ===========================================
           GRADE DE MÁQUINAS
           =========================================== */

        #telaEstoque .grade-modelos {
            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr)) !important;

            gap: 15px !important;
        }

        /* ===========================================
           CARDS DAS MÁQUINAS
           =========================================== */

        #telaEstoque .card-modelo {
            display: flex;
            flex-direction: column;

            min-width: 0;
            height: 100%;

            overflow: hidden !important;

            background: #ffffff !important;

            border: 1px solid #dee6f0 !important;
            border-radius: 13px !important;

            box-shadow:
                0 3px 12px rgba(
                    21, 43, 73, .045
                ) !important;

            transition:
                transform .2s ease,
                border-color .2s ease,
                box-shadow .2s ease;
        }

        #telaEstoque .card-modelo:hover {
            transform: translateY(-3px) !important;

            border-color: #91baf1 !important;

            box-shadow:
                0 8px 24px rgba(
                    19, 54, 103, .09
                ) !important;
        }

        #telaEstoque .card-modelo.selecionado {
            border-color: #0966d7 !important;

            box-shadow:
                0 0 0 2px rgba(
                    9, 102, 215, .13
                ) !important;
        }

        /* ===========================================
           FOTOS DAS MÁQUINAS
           =========================================== */

        #telaEstoque .modelo-foto-container {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;

            width: 100% !important;
            height: 174px !important;

            padding: 12px !important;

            background: #ffffff !important;
            border-bottom: 1px solid #f0f3f7;
        }

        #telaEstoque .modelo-foto {
            display: block;

            width: 100% !important;
            height: 100% !important;

            max-width: 100% !important;
            max-height: 100% !important;

            object-fit: contain !important;
            object-position: center !important;
        }

        #telaEstoque .modelo-sem-foto {
            color: #8291a4 !important;
            font-size: 12px !important;
            text-align: center !important;
        }

        /* ===========================================
           CONTEÚDO DOS CARDS
           =========================================== */

        #telaEstoque .modelo-conteudo {
            display: flex;
            flex-direction: column;

            flex: 1;

            padding: 13px !important;

            background: #ffffff !important;
        }

        #telaEstoque .modelo-cabecalho {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;

            gap: 8px !important;
            margin-bottom: 12px !important;
        }

        #telaEstoque .modelo-nome {
            margin: 0 !important;

            color: #172840 !important;

            font-size: 17px !important;
            font-weight: 800 !important;

            line-height: 1.3 !important;

            overflow-wrap: anywhere;
        }

        /* ===========================================
           SELO DE DISPONIBILIDADE
           =========================================== */

        #telaEstoque .selo-saldo {
            display: inline-flex;
            align-items: center;

            padding: 4px 8px !important;

            color: #16824d !important;
            background: #e6f7ed !important;

            border: 1px solid #bde8d0 !important;
            border-radius: 7px !important;

            font-size: 10px !important;
            font-weight: 700 !important;

            white-space: nowrap;
        }

        #telaEstoque .selo-saldo.zerado {
            color: #67788c !important;
            background: #eef2f7 !important;
            border-color: #dae3ed !important;
        }

        /* ===========================================
           SALDOS DAS MÁQUINAS
           =========================================== */

        #telaEstoque .modelo-saldos {
            display: grid !important;

            grid-template-columns:
                repeat(4, minmax(0, 1fr)) !important;

            gap: 0 !important;

            margin: 0 0 14px !important;
            padding-top: 11px !important;

            border-top:
                1px solid #edf1f6 !important;

            text-align: center !important;
        }

        #telaEstoque .modelo-saldos > div {
            min-width: 0 !important;
            padding: 0 3px !important;
        }

        #telaEstoque .modelo-saldos > div + div {
            border-left:
                1px solid #e8edf3 !important;
        }

        #telaEstoque .modelo-saldos dt {
            color: #78879b !important;

            font-size: 9px !important;
            font-weight: 600 !important;

            line-height: 1.3 !important;
        }

        #telaEstoque .modelo-saldos dd {
            margin: 5px 0 0 !important;

            color: #21344e;
            font-size: 20px !important;
            font-weight: 800 !important;

            line-height: 1.2 !important;
        }

        #telaEstoque .modelo-disponiveis {
            color: #15915b !important;
        }

        #telaEstoque .modelo-reservadas {
            color: #b98110 !important;
        }

        #telaEstoque .modelo-vendidas {
            color: #cb4658 !important;
        }

        /* ===========================================
           BOTÃO SELECIONAR MÁQUINA
           =========================================== */

        #telaEstoque .btn-reservar {
            width: 100% !important;
            min-height: 39px !important;

            margin-top: auto !important;
            padding: 9px 12px !important;

            background: #0966d7 !important;
            color: #ffffff !important;

            border: 1px solid #0966d7 !important;
            border-radius: 8px !important;

            font-size: 12px !important;
            font-weight: 700 !important;

            transition: background .2s ease;
        }

        #telaEstoque .btn-reservar:hover {
            background: #0755b5 !important;
            border-color: #0755b5 !important;
        }

        /* ===========================================
           PAGINAÇÃO
           =========================================== */

        #telaEstoque .paginacao {
            margin-top: 19px !important;
            padding-top: 15px !important;
        }

        #telaEstoque #resumoPaginacao {
            color: #75869a !important;
            font-size: 12px !important;
        }

        #telaEstoque #botoesPaginacao {
            display: flex !important;
            flex-wrap: wrap !important;

            gap: 6px !important;
        }

        #telaEstoque #botoesPaginacao button {
            min-width: 34px !important;
            min-height: 34px !important;

            padding: 6px !important;

            border-radius: 7px !important;
            font-size: 12px !important;
        }

        /* ===========================================
           FORMULÁRIO DA MÁQUINA
           =========================================== */

        #telaEstoque .painel-reserva {
            background: #ffffff !important;
            color: #172840 !important;
            border-radius: 14px !important;
        }

        #telaEstoque .painel-cabecalho h2 {
            font-size: 20px !important;
        }

        /* ===========================================
           LAYOUT EM LISTA
           =========================================== */

        #telaEstoque .grade-modelos.em-lista {
            grid-template-columns: 1fr !important;
        }

        #telaEstoque .em-lista .card-modelo {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
        }

        #telaEstoque .em-lista .modelo-foto-container {
            width: 180px !important;
            height: 155px !important;
            flex: 0 0 180px !important;

            border-right: 1px solid #edf1f6;
            border-bottom: none;
        }

        #telaEstoque .em-lista .modelo-conteudo {
            flex: 1 !important;
            min-width: 0 !important;
        }

        #telaEstoque .em-lista .btn-reservar {
            max-width: 240px !important;
        }

        /* ===========================================
           RESPONSIVIDADE — COMPUTADORES MENORES
           =========================================== */

        @media (max-width: 1450px) {

            #telaEstoque .grade-modelos {
                grid-template-columns:
                    repeat(3, minmax(0, 1fr)) !important;
            }
        }

        @media (max-width: 1150px) {

            #telaEstoque .grade-modelos {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr)) !important;
            }
        }

        /* ===========================================
           RESPONSIVIDADE — TABLETS
           =========================================== */

        @media (max-width: 1000px) {

            .sidebar {
                position: relative !important;

                width: 100% !important;
                height: auto !important;
            }

            .sidebar .menu {
                display: grid !important;

                grid-template-columns:
                    repeat(2, minmax(0, 1fr)) !important;
            }

            .conteudo {
                margin-left: 0 !important;
                width: 100% !important;
            }
        }

        /* ===========================================
           RESPONSIVIDADE — CELULARES
           =========================================== */

        @media (max-width: 650px) {

            #telaEstoque .grade-modelos {
                grid-template-columns: 1fr !important;
            }

            #telaEstoque .modelo-foto-container {
                height: 190px !important;
            }

            #telaEstoque .modelo-nome {
                font-size: 18px !important;
            }

            #telaEstoque .modelo-saldos dd {
                font-size: 22px !important;
            }

            #telaEstoque .em-lista .card-modelo {
                flex-direction: column !important;
            }

            #telaEstoque .em-lista .modelo-foto-container {
                width: 100% !important;
                height: 180px !important;
                flex: initial !important;

                border-right: none;
                border-bottom: 1px solid #edf1f6;
            }

            #telaEstoque .em-lista .btn-reservar {
                max-width: none !important;
            }
        }

        @media (max-width: 520px) {

            .sidebar .menu {
                grid-template-columns: 1fr !important;
            }
        }

        /* ===========================================
           IMPRESSÃO
           =========================================== */

        @media print {

            .sidebar,
            .dashboard-smi {
                display: none !important;
            }

            .conteudo {
                margin: 0 !important;
                width: 100% !important;
            }
        }

        `;

        document.head.appendChild(estilo);
    }

    /* =====================================================
       ÍCONES DO MENU
       ===================================================== */

    const icones = {

        dashboard: `
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
        `,

        estoque: `
            <path d="M3 7l9-4 9 4-9 4-9-4z"/>
            <path d="M3 7v10l9 4 9-4V7"/>
            <path d="M12 11v10"/>
        `,

        showroom: `
            <rect x="3" y="8" width="18" height="13" rx="2"/>
            <path d="M3 12h18"/>
            <path d="M6 8V4h12v4"/>
        `,

        entradas: `
            <path d="M12 3v12"/>
            <path d="M7 10l5 5 5-5"/>
            <path d="M4 17v4h16v-4"/>
        `,

        saidas: `
            <path d="M12 21V9"/>
            <path d="M7 14l5-5 5 5"/>
            <path d="M4 7V3h16v4"/>
        `,

        reservas: `
            <rect x="3" y="5" width="18" height="16" rx="2"/>
            <path d="M7 3v4M17 3v4M3 10h18"/>
            <path d="M8 15h8"/>
        `,

        inventario: `
            <rect x="4" y="3" width="16" height="18" rx="2"/>
            <path d="M8 3.5h8"/>
            <path d="M8 10l2 2 4-4"/>
            <path d="M8 17h8"/>
        `,

        relatorios: `
            <path d="M4 20V12"/>
            <path d="M10 20V5"/>
            <path d="M16 20V9"/>
            <path d="M22 20H2"/>
        `,

        exportacoes: `
            <path d="M12 3v12"/>
            <path d="M7 10l5 5 5-5"/>
            <path d="M4 17v4h16v-4"/>
        `,

        formulario: `
            <path d="M5 3h10l4 4v14H5z"/>
            <path d="M15 3v5h4"/>
            <path d="M8 12h8"/>
            <path d="M8 16h8"/>
        `,

        configuracoes: `
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3"/>
            <path d="M2 12h3M19 12h3"/>
            <path d="M5 5l2 2M17 17l2 2"/>
            <path d="M19 5l-2 2M7 17l-2-2"/>
        `
    };

    /* =====================================================
       IDENTIFICAÇÃO DOS ITENS DO MENU
       ===================================================== */

    function identificarItem(botao) {

        if (botao.id === "btnDashboardSMI") {
            return "dashboard";
        }

        const texto = (
            botao.textContent || ""
        ).toLowerCase();

        if (texto.includes("show room")) {
            return "showroom";
        }

        if (texto.includes("inventário")) {
            return "inventario";
        }

        if (texto.includes("configura")) {
            return "configuracoes";
        }

        if (texto.includes("formul")) {
            return "formulario";
        }

        if (texto.includes("exporta")) {
            return "exportacoes";
        }

        if (texto.includes("relatório")) {
            return "relatorios";
        }

        const tela = (
            botao.dataset.tela || ""
        ).toLowerCase();

        return icones[tela] ? tela : "estoque";
    }

    /* =====================================================
       NOMES DOS ITENS
       ===================================================== */

    function obterNome(botao, tipo) {

        const nomes = {
            dashboard: "Dashboard",
            estoque: "Estoque",
            showroom: "SHOW ROOM",
            entradas: "Entradas",
            saidas: "Saídas",
            reservas: "Reservas",
            inventario: "Inventário",
            relatorios: "Relatórios",
            exportacoes: "Exportações",
            formulario: "FORMULÁRIO",
            configuracoes: "Configurações"
        };

        return nomes[tipo] || (
            botao.textContent || ""
        ).trim();
    }

    /* =====================================================
       PADRONIZAÇÃO DOS ÍCONES
       ===================================================== */

    function corrigirMenu() {

        const botoes = document.querySelectorAll(
            ".sidebar .menu-item"
        );

        botoes.forEach(function (botao) {

            const tipo = identificarItem(botao);
            const nome = obterNome(botao, tipo);

            const icone = document.createElement("span");

            icone.className = "smi-icone-final";

            icone.setAttribute(
                "aria-hidden",
                "true"
            );

            icone.innerHTML = `
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    ${icones[tipo]}
                </svg>
            `;

            const texto = document.createElement("span");

            texto.className = "smi-texto-final";
            texto.textContent = nome;

            /*
              Mantém o botão original e seus eventos.
              Substitui apenas o conteúdo visual.
            */

            botao.replaceChildren(icone, texto);
        });
    }

    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            corrigirMenu
        );

    } else {

        corrigirMenu();
    }

})();
