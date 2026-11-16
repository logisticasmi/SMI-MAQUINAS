
/* =====================================================
   SMI MÁQUINAS — CORREÇÃO VISUAL DOS RELATÓRIOS
   Versão 2026

   Corrige:
   - Linhas azul-escuras
   - Contraste dos textos
   - Cores das etiquetas
   - Cabeçalho e botões
   - Pesquisa e filtros

   Não modifica os dados do Supabase.
   ===================================================== */

(function () {
    "use strict";

    const ID = "smi-relatorios-visual-2026";

    if (document.getElementById(ID)) return;

    const estilo = document.createElement("style");

    estilo.id = ID;

    estilo.textContent = `

        /* ==========================================
           ÁREA DOS RELATÓRIOS
           ========================================== */

        #relatoriosUnificados {
            color: #172840 !important;
        }

        #relatoriosUnificados h2 {
            color: #172840 !important;
            font-size: 22px !important;
            font-weight: 800 !important;
        }

        /* ==========================================
           ABAS: TODOS, ENTRADAS, RESERVAS, VENDAS
           ========================================== */

        #relatoriosUnificados .ru-abas {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 9px !important;
            margin: 18px 0 !important;
        }

        #relatoriosUnificados .ru-abas button {
            min-height: 40px !important;
            padding: 9px 16px !important;

            color: #25496f !important;
            background: #f0f5fc !important;

            border: 1px solid #d5e2f1 !important;
            border-radius: 9px !important;

            font-size: 12px !important;
            font-weight: 700 !important;
        }

        #relatoriosUnificados
        .ru-abas button[aria-pressed="true"] {
            color: #ffffff !important;
            background: #0966d7 !important;
            border-color: #0966d7 !important;
        }

        /* ==========================================
           FILTROS
           ========================================== */

        #ruFiltros {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: flex-end !important;

            gap: 13px !important;
            padding: 17px !important;

            background: #ffffff !important;

            border: 1px solid #dfe7f0 !important;
            border-radius: 13px !important;
        }

        #ruFiltros .campo {
            margin-bottom: 0 !important;
        }

        #ruFiltros label {
            color: #344763 !important;
            font-size: 12px !important;
            font-weight: 700 !important;
        }

        #ruFiltros input,
        #ruFiltros select {
            min-height: 42px !important;

            color: #172840 !important;
            background: #ffffff !important;

            border: 1px solid #cbd7e5 !important;
            border-radius: 8px !important;
        }

        #ruFiltros .btn-primario {
            color: #ffffff !important;
            background: #0966d7 !important;
            border-color: #0966d7 !important;
        }

        /* ==========================================
           BARRA DE RESULTADOS
           ========================================== */

        #relatoriosUnificados .ru-barra {
            display: flex !important;
            align-items: center !important;
            flex-wrap: wrap !important;

            gap: 10px !important;
            margin: 16px 0 !important;
        }

        #ruContagem {
            margin-right: auto !important;
            color: #52657d !important;
            font-size: 13px !important;
        }

        #ruExportar,
        #ruImprimir,
        #ruLimpar {
            color: #205084 !important;
            background: #f0f5fc !important;

            border: 1px solid #d3e0f0 !important;
            border-radius: 8px !important;
        }

        /* ==========================================
           CONTAINER DA TABELA
           ========================================== */

        #ruTabela {
            width: 100% !important;
            max-height: 65vh !important;

            overflow: auto !important;

            background: #ffffff !important;

            border: 1px solid #dfe7f0 !important;
            border-radius: 13px !important;
        }

        #ruTabela table {
            width: 100% !important;
            border-collapse: collapse !important;

            background: #ffffff !important;
            color: #172840 !important;

            font-size: 12px !important;
        }

        /* ==========================================
           CABEÇALHO DA TABELA
           ========================================== */

        #ruTabela thead,
        #ruTabela thead tr {
            background: #edf3fa !important;
        }

        #ruTabela th {
            position: sticky !important;
            top: 0 !important;
            z-index: 2 !important;

            padding: 14px 12px !important;

            color: #344763 !important;
            background: #edf3fa !important;

            border-bottom: 1px solid #dfe7f0 !important;

            font-size: 12px !important;
            font-weight: 800 !important;

            text-align: left !important;
            white-space: nowrap !important;
        }

        /* ==========================================
           CORREÇÃO DAS LINHAS AZUIS
           ========================================== */

        #ruTabela tbody tr,
        #ruTabela tbody tr:nth-child(odd) {
            background: #ffffff !important;
            color: #172840 !important;
        }

        #ruTabela tbody tr:nth-child(even) {
            background: #f6f9fd !important;
            color: #172840 !important;
        }

        #ruTabela tbody tr:hover,
        #ruTabela tbody tr:nth-child(even):hover {
            background: #eaf3ff !important;
        }

        /* ==========================================
           TEXTO DAS CÉLULAS
           ========================================== */

        #ruTabela tbody td {
            padding: 12px !important;

            color: #263b55 !important;

            border-bottom: 1px solid #e6ecf4 !important;

            background: transparent !important;

            font-size: 12px !important;
            line-height: 1.5 !important;

            vertical-align: middle !important;
        }

        #ruTabela tbody tr:last-child td {
            border-bottom: none !important;
        }

        /* ==========================================
           ETIQUETAS DE STATUS
           ========================================== */

        #ruTabela .ru-etiqueta {
            display: inline-flex !important;
            align-items: center !important;

            padding: 5px 9px !important;

            color: #205084 !important;
            background: #e7f1ff !important;

            border: 1px solid #cee2fb !important;
            border-radius: 7px !important;

            font-size: 11px !important;
            font-weight: 800 !important;
            white-space: nowrap !important;
        }

        /* ENTRADA */

        #ruTabela .ru-entrada {
            color: #167749 !important;
            background: #e3f7ec !important;
            border-color: #bee9d0 !important;
        }

        /* RESERVA */

        #ruTabela .ru-reserva {
            color: #956400 !important;
            background: #fff1ce !important;
            border-color: #f2dfa8 !important;
        }

        /* VENDA */

        #ruTabela .ru-venda {
            color: #b53749 !important;
            background: #ffe8ed !important;
            border-color: #f4c9d1 !important;
        }

        /* EXPIRADA */

        #ruTabela .ru-expirada {
            color: #9f4850 !important;
            background: #fcebef !important;
            border-color: #edcdd3 !important;
        }

        /* ==========================================
           BOTÃO EDITAR / VENDER
           ========================================== */

        #ruTabela td .btn {
            min-height: 36px !important;

            padding: 7px 12px !important;

            color: #205084 !important;
            background: #eef5ff !important;

            border: 1px solid #cddff3 !important;
            border-radius: 8px !important;

            font-size: 11px !important;
            font-weight: 700 !important;

            box-shadow: none !important;
        }

        #ruTabela td .btn:hover {
            color: #ffffff !important;
            background: #0966d7 !important;
            border-color: #0966d7 !important;
        }

        /* ==========================================
           RESPONSIVIDADE
           ========================================== */

        @media (max-width: 1000px) {

            #ruFiltros {
                gap: 10px !important;
            }

            #ruTabela th,
            #ruTabela td {
                white-space: normal;
            }
        }

        /* ==========================================
           IMPRESSÃO
           ========================================== */

        @media print {

            #ruTabela {
                max-height: none !important;
                overflow: visible !important;
            }

            #ruTabela tbody tr,
            #ruTabela tbody tr:nth-child(even) {
                background: #ffffff !important;
            }

            #ruTabela th,
            #ruTabela td {
                color: #000000 !important;
            }

            #ruTabela tr {
                break-inside: avoid;
            }
        }

    `;

    function aplicarEstilo() {
        if (!document.getElementById(ID)) {
            document.head.appendChild(estilo);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            aplicarEstilo
        );
    } else {
        aplicarEstilo();
    }

})();
