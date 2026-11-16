
/* ==========================================================
   SMI MÁQUINAS — CORREÇÃO DO FORMULÁRIO COMERCIAL
   VERSÃO 2026

   Corrige:
   - Logo SMI Group muito grande
   - Formulário ultrapassando a tela
   - Rolagem horizontal
   - Alinhamento de Cliente e Vendedor
   - Organização das tabelas
   - Impressão em folha A4

   Não altera dados, reservas ou Supabase.
   ========================================================== */

(function () {
    "use strict";

    const ID_ESTILO = "smi-formulario-visual-2026";

    function aplicarCorrecao() {

        if (document.getElementById(ID_ESTILO)) {
            return;
        }

        const estilo = document.createElement("style");

        estilo.id = ID_ESTILO;

        estilo.textContent = `

        /* ==============================================
           ÁREA PRINCIPAL DO FORMULÁRIO
           ============================================== */

        #telaFormularioComercial {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;

            padding: 0 0 28px !important;
            margin: 0 !important;

            box-sizing: border-box !important;
        }

        #telaFormularioComercial,
        #telaFormularioComercial * {
            box-sizing: border-box;
        }

        /* ==============================================
           TÍTULO E DESCRIÇÃO
           ============================================== */

        #telaFormularioComercial
        .secao-cabecalho {
            max-width: 100% !important;
            margin-bottom: 20px !important;
        }

        #telaFormularioComercial
        .secao-cabecalho h2 {
            color: #172840 !important;
            font-size: 23px !important;
            font-weight: 800 !important;
            margin-bottom: 6px !important;
        }

        #telaFormularioComercial
        .secao-cabecalho p {
            color: #687a91 !important;
            font-size: 13px !important;
        }

        /* ==============================================
           BOTÕES DO FORMULÁRIO
           ============================================== */

        #telaFormularioComercial
        .acoes-formulario-comercial {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            flex-wrap: wrap !important;

            gap: 10px !important;
            margin-bottom: 20px !important;
        }

        #telaFormularioComercial
        .acoes-formulario-comercial .btn {
            min-height: 41px !important;
            border-radius: 9px !important;
            font-size: 12px !important;
            font-weight: 700 !important;
        }

        /* ==============================================
           FOLHA PRINCIPAL
           ============================================== */

        #telaFormularioComercial
        .folha-comercial {
            display: block !important;

            width: 100% !important;
            max-width: 850px !important;
            min-width: 0 !important;

            height: auto !important;
            min-height: 0 !important;

            margin: 0 auto !important;
            padding: 24px !important;

            background: #ffffff !important;
            color: #172840 !important;

            border: 1px solid #dfe7f0 !important;
            border-radius: 14px !important;

            box-shadow:
                0 4px 20px rgba(18, 40, 70, .06) !important;

            overflow: visible !important;
        }

        /* ==============================================
           CABEÇALHO DO FORMULÁRIO
           ============================================== */

        #telaFormularioComercial
        .cabecalho-comercial {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;

            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;

            height: auto !important;
            min-height: 0 !important;

            padding: 22px 20px !important;

            background: #eaf2fb !important;
            border: 1px solid #d0deed !important;
            border-radius: 10px !important;

            overflow: hidden !important;
        }

        /* ==============================================
           LOGO SMI GROUP
           CORREÇÃO PRINCIPAL
           ============================================== */

        #telaFormularioComercial
        .marca-comercial {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;

            width: 100% !important;
            max-width: 100% !important;

            height: auto !important;
            min-height: 0 !important;

            margin: 0 auto 20px !important;
            padding: 0 !important;

            background: transparent !important;
            border: none !important;

            overflow: hidden !important;

            text-align: center !important;
            line-height: normal !important;
        }

        #telaFormularioComercial
        .logo-formulario-smigroup,
        #telaFormularioComercial
        .marca-comercial img {
            display: block !important;

            width: 220px !important;
            max-width: 100% !important;

            height: 95px !important;
            max-height: 95px !important;

            min-width: 0 !important;
            min-height: 0 !important;

            margin: 0 auto !important;
            padding: 0 !important;

            object-fit: contain !important;
            object-position: center !important;

            background: transparent !important;
            border: none !important;

            box-shadow: none !important;

            transform: none !important;
            position: static !important;

            flex: 0 1 auto !important;
        }

        /* ==============================================
           CLIENTE
           ============================================== */

        #telaFormularioComercial
        #clienteFormularioComercial {
            display: block !important;

            width: 100% !important;
            max-width: 100% !important;

            min-height: 48px !important;

            margin: 0 auto 12px !important;
            padding: 10px 12px !important;

            background: transparent !important;
            color: #172840 !important;

            border: none !important;
            border-radius: 0 !important;

            text-align: center !important;

            font-size: 23px !important;
            font-weight: 800 !important;
            line-height: 1.3 !important;

            box-shadow: none !important;
        }

        #telaFormularioComercial
        #clienteFormularioComercial::placeholder {
            color: #687a90 !important;
            opacity: 1 !important;
        }

        /* ==============================================
           VENDEDOR
           ============================================== */

        #telaFormularioComercial
        #vendedorFormularioComercial {
            display: block !important;

            width: 100% !important;
            max-width: 100% !important;

            min-height: 44px !important;

            margin: 0 auto !important;
            padding: 8px 12px !important;

            background: transparent !important;
            color: #172840 !important;

            border: none !important;

            text-align: center !important;

            font-size: 17px !important;
            font-weight: 700 !important;

            box-shadow: none !important;
        }

        #telaFormularioComercial
        #vendedorFormularioComercial::placeholder {
            color: #718196 !important;
        }

        /* RÓTULOS */

        #telaFormularioComercial
        .rotulo-dados-formulario {
            display: block !important;
            width: 100% !important;

            margin: 10px 0 4px !important;

            color: #28517e !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            letter-spacing: 1px !important;

            text-align: center !important;
        }

        /* ==============================================
           TABELAS DE MÁQUINAS E ACESSÓRIOS
           ============================================== */

        #telaFormularioComercial
        .tabela-comercial {
            width: 100% !important;
            max-width: 100% !important;

            margin: 0 !important;

            background: white !important;
            color: #172840 !important;

            border-collapse: collapse !important;
            table-layout: fixed !important;
        }

        #telaFormularioComercial
        .tabela-comercial caption {
            padding: 23px 0 10px !important;

            color: #172840 !important;

            font-size: 19px !important;
            font-weight: 800 !important;

            text-align: center !important;
        }

        #telaFormularioComercial
        .tabela-comercial th {
            padding: 10px 8px !important;

            color: #274461 !important;
            background: #edf3fa !important;

            border: 1px solid #cbd7e5 !important;

            font-size: 12px !important;
            font-weight: 800 !important;

            text-align: center !important;

            overflow-wrap: anywhere !important;
        }

        #telaFormularioComercial
        .tabela-comercial td {
            padding: 4px 6px !important;

            color: #172840 !important;
            background: #ffffff !important;

            border: 1px solid #d5dfea !important;

            vertical-align: middle !important;
            text-align: center !important;

            overflow-wrap: anywhere !important;
        }

        #telaFormularioComercial
        .tabela-comercial td:first-child {
            background: #f3f7fc !important;
        }

        #telaFormularioComercial
        .tabela-comercial tbody tr:nth-child(even) {
            background: #ffffff !important;
        }

        #telaFormularioComercial
        .tabela-comercial tbody tr:hover td {
            background: #f7faff !important;
        }

        /* ==============================================
           CAMPOS DA TABELA
           ============================================== */

        #telaFormularioComercial
        .tabela-comercial input {
            display: block !important;

            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;

            min-height: 34px !important;

            padding: 6px !important;

            color: #172840 !important;
            background: transparent !important;

            border: none !important;
            border-radius: 0 !important;

            font-size: 12px !important;
            text-align: center !important;
        }

        #telaFormularioComercial
        .tabela-comercial input:focus {
            outline: 2px solid #7eb4f6 !important;
            outline-offset: -2px !important;
        }

        /* ==============================================
           BOTÕES ADICIONAR MÁQUINA / ACESSÓRIO
           ============================================== */

        #telaFormularioComercial
        .controle-linhas {
            display: flex !important;
            justify-content: flex-end !important;
            align-items: center !important;

            gap: 10px !important;
            margin-top: 10px !important;
            margin-bottom: 12px !important;
        }

        #telaFormularioComercial
        .controle-linhas .btn {
            min-height: 38px !important;
            padding: 8px 14px !important;

            color: #205084 !important;
            background: #eef5ff !important;

            border: 1px solid #cddff3 !important;
            border-radius: 8px !important;

            font-size: 12px !important;
            font-weight: 700 !important;
        }

        #telaFormularioComercial
        .controle-linhas .btn:hover {
            color: white !important;
            background: #0966d7 !important;
            border-color: #0966d7 !important;
        }

        /* ==============================================
           DETALHES DO FORMULÁRIO
           ============================================== */

        #telaFormularioComercial
        #dadosCompletosFormulario {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
        }

        #telaFormularioComercial
        .grade-dados-formulario {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
        }

        #telaFormularioComercial
        .campo-dados-formulario {
            min-width: 0 !important;
            max-width: 100% !important;
        }

        #telaFormularioComercial
        .campo-dados-formulario input,
        #telaFormularioComercial
        .campo-dados-formulario textarea {
            max-width: 100% !important;
            min-width: 0 !important;
        }

        /* ==============================================
           OBSERVAÇÕES
           ============================================== */

        #telaFormularioComercial
        .observacao-comercial {
            margin: 18px 0 0 !important;

            color: #718196 !important;
            font-size: 12px !important;
            line-height: 1.5 !important;
        }

        /* ==============================================
           RESPONSIVIDADE
           ============================================== */

        @media screen and (max-width: 900px) {

            #telaFormularioComercial
            .folha-comercial {
                padding: 16px !important;
            }

            #telaFormularioComercial
            .cabecalho-comercial {
                padding: 15px !important;
            }

            #telaFormularioComercial
            .logo-formulario-smigroup {
                width: 170px !important;
                height: 75px !important;
                max-height: 75px !important;
            }
        }

        @media screen and (max-width: 550px) {

            #telaFormularioComercial
            .folha-comercial {
                padding: 10px !important;
            }

            #telaFormularioComercial
            .cabecalho-comercial {
                padding: 12px 8px !important;
            }

            #telaFormularioComercial
            #clienteFormularioComercial {
                font-size: 18px !important;
            }

            #telaFormularioComercial
            #vendedorFormularioComercial {
                font-size: 15px !important;
            }

            #telaFormularioComercial
            .tabela-comercial th,
            #telaFormularioComercial
            .tabela-comercial input {
                font-size: 10px !important;
            }

            #telaFormularioComercial
            .tabela-comercial td {
                padding: 3px !important;
            }
        }

        /* ==============================================
           IMPRESSÃO A4 — APENAS O FORMULÁRIO
           ============================================== */

        @media print {

            @page {
                size: A4 portrait;
                margin: 12mm;
            }

            body.imprimindo-comercial {
                background: #ffffff !important;
                overflow: visible !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial {
                width: 100% !important;
                max-width: 100% !important;

                margin: 0 !important;
                padding: 0 !important;

                overflow: visible !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            .folha-comercial {
                width: 100% !important;
                max-width: 100% !important;

                margin: 0 !important;
                padding: 0 !important;

                background: white !important;

                border: none !important;
                border-radius: 0 !important;

                box-shadow: none !important;
                overflow: visible !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            .cabecalho-comercial {
                padding: 12px !important;
                background: #eaf2fb !important;
                border: 1px solid #cbd7e5 !important;
                border-radius: 0 !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            .logo-formulario-smigroup,
            body.imprimindo-comercial
            #telaFormularioComercial
            .marca-comercial img {
                display: block !important;

                width: 160px !important;
                height: 65px !important;
                max-height: 65px !important;

                object-fit: contain !important;

                margin: 0 auto !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            .marca-comercial {
                margin-bottom: 8px !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            #clienteFormularioComercial {
                font-size: 20px !important;
                min-height: 35px !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            #vendedorFormularioComercial {
                font-size: 15px !important;
                min-height: 32px !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            .nao-imprimir {
                display: none !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            .tabela-comercial tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            .tabela-comercial thead {
                display: table-header-group !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            input,
            body.imprimindo-comercial
            #telaFormularioComercial
            textarea {
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial
            input::placeholder,
            body.imprimindo-comercial
            #telaFormularioComercial
            textarea::placeholder {
                color: transparent !important;
            }

            body.imprimindo-comercial
            #telaFormularioComercial * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }

        `;

        document.head.appendChild(estilo);

        console.log(
            "SMI Máquinas: formulário comercial corrigido."
        );
    }

    /* ======================================================
       INICIALIZAÇÃO

       Aplica a correção após o formulário original
       ser criado pelo app.js.
       ====================================================== */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            function () {
                setTimeout(aplicarCorrecao, 0);
            }
        );

    } else {

        aplicarCorrecao();
    }

})();
