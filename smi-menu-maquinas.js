
/* ==========================================================
   SMI MÁQUINAS — MENU LATERAL
   VERSÃO 2026 — AJUSTE VISUAL

   - Menu azul-marinho
   - Logo SMI Group
   - Título SMI MÁQUINAS
   - Principal / Operações / Sistema
   - Ícones coloridos
   - Item ativo em azul
   - BP1102AS semitransparente
   - Curvas azuis discretas
   - Rodapé SMI DO BRASIL

   Não altera dados, reservas, estoque ou Supabase.
   ========================================================== */

(function () {
    "use strict";

    const ID_ESTILO = "smi-menu-maquinas-estilo";
    const IMAGEM_MAQUINA = "img/bp1102as.png";

    /* ======================================================
       FUNÇÕES AUXILIARES
       ====================================================== */

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();
    }

    /* ======================================================
       CSS COMPLETO
       ====================================================== */

    function criarEstilos() {

        if (document.getElementById(ID_ESTILO)) {
            return;
        }

        const style = document.createElement("style");
        style.id = ID_ESTILO;

        style.textContent = `

            /* ==========================================
               ELEMENTOS DO MENU ANTIGO
               ========================================== */

            .sidebar > .marca,
            .sidebar > .sidebar-descricao,
            .sidebar > .sidebar-rodape {
                display: none !important;
            }

            /* ==========================================
               MENU LATERAL
               ========================================== */

            .sidebar {
                width: 220px !important;
                min-width: 220px !important;

                display: flex !important;
                flex-direction: column !important;

                padding: 14px 11px 12px !important;

                background: linear-gradient(
                    180deg,
                    #082a5c 0%,
                    #06224b 55%,
                    #071e3b 100%
                ) !important;

                border-right:
                    1px solid rgba(255,255,255,.06) !important;

                overflow-x: hidden !important;
                overflow-y: auto !important;

                box-sizing: border-box !important;
            }

            .sidebar::-webkit-scrollbar {
                width: 5px;
            }

            .sidebar::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,.14);
                border-radius: 20px;
            }

            /* ==========================================
               CABEÇALHO
               ========================================== */

            .smi-menu-topo {
                display: block !important;
                margin-bottom: 12px !important;
                text-align: center;
                flex-shrink: 0;
            }

            .smi-menu-logo-wrap {
                display: flex;
                align-items: center;
                justify-content: center;

                margin-bottom: 12px !important;
            }

            .smi-menu-logo-wrap img {
                display: block;

                width: 132px !important;
                max-width: 100% !important;

                height: auto !important;
                object-fit: contain;
            }

            .smi-menu-titulo {
                margin: 0;

                color: #ffffff;

                font-size: 17px !important;
                font-weight: 800;

                letter-spacing: .4px;
                line-height: 1.4;

                text-align: center;
            }

            .smi-menu-subtitulo {
                margin-top: 4px;

                color: rgba(255,255,255,.75);

                font-size: 9px !important;
                font-weight: 700;

                letter-spacing: 2px !important;
                text-transform: uppercase;

                text-align: center;
            }

            /* ==========================================
               GRUPOS DO MENU
               ========================================== */

            .smi-menu-grupo {
                display: flex;
                align-items: center;

                gap: 8px !important;

                margin-top: 11px !important;
                margin-bottom: 6px !important;

                flex-shrink: 0;
            }

            .smi-menu-grupo span {
                color: rgba(255,255,255,.72);

                font-size: 10px !important;
                font-weight: 800;

                letter-spacing: 1px;
                white-space: nowrap;
            }

            .smi-menu-grupo::after {
                content: "";

                height: 1px;
                flex: 1;

                background: rgba(255,255,255,.16);
            }

            /* ==========================================
               LISTA DO MENU
               ========================================== */

            .sidebar .menu {
                display: flex !important;
                flex-direction: column !important;

                gap: 5px !important;

                flex-shrink: 0;
            }

           .sidebar .menu-item {
    display: flex !important;
    align-items: center !important;

    width: 100% !important;
    min-height: 42px !important;

    padding: 7px 10px !important;
    gap: 10px !important;

                background: transparent !important;
                color: #ffffff !important;

                border: 1px solid transparent !important;
                border-radius: 10px !important;

                font-size: 12px !important;
                font-weight: 700 !important;

                text-align: left !important;
                cursor: pointer;

                box-sizing: border-box !important;

                transition:
                    background .2s ease,
                    border-color .2s ease;
            }

            .sidebar .menu-item:hover {
                background:
                    rgba(255,255,255,.07) !important;
            }

            /* ==========================================
               ITEM SELECIONADO
               ========================================== */

            .sidebar .menu-item.ativo,
            .sidebar .menu-item[aria-current="page"] {
                background: linear-gradient(
                    90deg,
                    #218cff 0%,
                    #286bff 100%
                ) !important;

                border-color:
                    rgba(255,255,255,.10) !important;

                box-shadow:
                    0 8px 20px rgba(19,94,220,.24) !important;
            }

            /* ==========================================
               ÍCONES
               ========================================== */

            .smi-menu-icone-box {
                display: inline-flex;
                align-items: center;
                justify-content: center;

                width: 28px !important;
                height: 28px !important;
                min-width: 28px !important;

                border-radius: 9px !important;

                background: rgba(255,255,255,.08);

                box-shadow:
                    inset 0 0 0 1px
                    rgba(255,255,255,.05);

                flex-shrink: 0;
            }

            .smi-menu-icone-box svg {
                width: 17px !important;
                height: 17px !important;

                stroke: currentColor;
                fill: none;

                stroke-width: 1.9;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            /* CORES */

            .smi-menu-cor-dashboard {
                color: #ffffff;
            }

            .smi-menu-cor-estoque {
                color: #d6ecff;
            }

            .smi-menu-cor-showroom {
                color: #f3f7ff;
            }

            .smi-menu-cor-inventario {
                color: #a9ffd8;
            }

            .smi-menu-cor-entradas {
                color: #32d7ff;
            }

            .smi-menu-cor-saidas {
                color: #4aa3ff;
            }

            .smi-menu-cor-relatorios {
                color: #a396ff;
            }

            .smi-menu-cor-exportacoes {
                color: #43c5ff;
            }

            .smi-menu-cor-formulario {
                color: #e9edf6;
            }

            .smi-menu-cor-configuracoes {
                color: #9fd5ff;
            }

            .sidebar .menu-item.ativo
            .smi-menu-icone-box,
            .sidebar .menu-item[aria-current="page"]
            .smi-menu-icone-box {
                background:
                    rgba(255,255,255,.14) !important;
            }

            /* ==========================================
               TEXTO E SETA
               ========================================== */

           .smi-menu-texto {
    flex: 1;
    min-width: 0;

    color: inherit;

    font-size: 13px !important;
    font-weight: 700 !important;
    letter-spacing: .1px !important;
}

            .smi-menu-seta {
                display: inline-flex;
                align-items: center;
                justify-content: center;

                width: 14px;
                height: 14px;

                color: rgba(255,255,255,.82);

                flex-shrink: 0;
            }

            .smi-menu-seta svg {
                width: 14px;
                height: 14px;

                stroke: currentColor;
                fill: none;

                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            /* ==========================================
               ÁREA DECORATIVA DA BP1102AS
               ========================================== */

            .smi-menu-maquina {
                position: relative !important;

                width: calc(100% + 22px) !important;

                height: 170px !important;
                min-height: 170px !important;

                margin: auto -11px 0 !important;
                padding-top: 12px !important;

                background: transparent !important;

                border: none !important;
                box-shadow: none !important;

                overflow: hidden !important;
                pointer-events: none !important;

                isolation: isolate;
                flex-shrink: 0;
            }

            /* ==========================================
               FOTO DA MÁQUINA
               ========================================== */

            .smi-menu-foto-maquina {
                position: absolute !important;

                display: block !important;

                width: 130% !important;
                max-width: none !important;

                height: 164px !important;

                left: 50% !important;
                bottom: 2px !important;

                transform:
                    translateX(-50%) !important;

                object-fit: contain !important;
                object-position:
                    center bottom !important;

                /* TRANSPARÊNCIA */

                opacity: .29 !important;

                /* MISTURA A FOTO AO FUNDO AZUL */

                mix-blend-mode: multiply !important;

                filter:
                    grayscale(1)
                    sepia(.65)
                    hue-rotate(165deg)
                    saturate(1.5)
                    contrast(1.12)
                    brightness(.9) !important;

                /* REMOVER BORDAS RETANGULARES */

                -webkit-mask-image:
                    radial-gradient(
                        ellipse 69% 57% at 50% 55%,
                        black 28%,
                        rgba(0,0,0,.85) 49%,
                        transparent 100%
                    ) !important;

                mask-image:
                    radial-gradient(
                        ellipse 69% 57% at 50% 55%,
                        black 28%,
                        rgba(0,0,0,.85) 49%,
                        transparent 100%
                    ) !important;

                z-index: 1 !important;
            }

            /* ==========================================
               PRIMEIRA CURVA AZUL
               ========================================== */

            .smi-menu-maquina::before {
                content: "" !important;

                position: absolute !important;

                width: 170% !important;
                height: 110px !important;

                left: -38% !important;
                bottom: -47px !important;

                border-top:
                    1px solid rgba(
                        39,156,255,.38
                    ) !important;

                border-radius: 50% !important;

                transform:
                    rotate(-12deg) !important;

                box-shadow:
                    0 -4px 16px
                    rgba(14,135,255,.10) !important;

                z-index: 2 !important;
            }

            /* ==========================================
               SEGUNDA CURVA AZUL
               ========================================== */

            .smi-menu-maquina::after {
                content: "" !important;

                position: absolute !important;

                width: 160% !important;
                height: 115px !important;

                left: -28% !important;
                bottom: -73px !important;

                border-top:
                    1px solid rgba(
                        63,169,255,.22
                    ) !important;

                border-radius: 50% !important;

                transform:
                    rotate(8deg) !important;

                z-index: 2 !important;
            }

            /* ==========================================
               RODAPÉ
               ========================================== */

            .smi-menu-rodape {
                display: block !important;

                margin-top: 0 !important;

                padding-top: 5px !important;
                padding-bottom: 5px !important;

                text-align: center !important;

                flex-shrink: 0;
            }

            .smi-menu-rodape strong {
                display: block;

                color: #ffffff;

                font-size: 10px !important;
                font-weight: 800;

                letter-spacing: 1.4px;
            }

            .smi-menu-rodape span {
                display: block;

                margin-top: 3px !important;

                color: rgba(255,255,255,.75);

                font-size: 9px !important;
            }

            /* ==========================================
               TELAS COM MENOR ALTURA
               ========================================== */

            @media (max-height: 760px) {

                .smi-menu-maquina {
                    margin-top: 12px !important;
                }
            }

            /* ==========================================
               IMPRESSÃO
               ========================================== */

            @media print {

                .smi-menu-maquina {
                    display: none !important;
                }
            }

        `;


/* ==================================================
   SMI MÁQUINAS — ACABAMENTO FINAL APROVADO
   ================================================== */

style.textContent += `

    /* Fundo contínuo da barra lateral */
    .sidebar {
        background: linear-gradient(
            180deg,
            #082a5c 0%,
            #06224b 55%,
            #071e3b 100%
        ) !important;
    }

    /* Área da máquina integrada ao fundo */
    .smi-menu-maquina {
        position: relative !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        overflow: hidden !important;
        isolation: isolate !important;
    }

    /* BP1102AS suave e sem bordas retangulares */
    .smi-menu-foto-maquina {
        opacity: .25 !important;

        mix-blend-mode: multiply !important;

        filter:
            grayscale(1)
            sepia(.6)
            hue-rotate(165deg)
            saturate(1.4)
            contrast(1.08) !important;

        -webkit-mask-image:
            radial-gradient(
                ellipse 85% 70% at 50% 55%,
                black 20%,
                rgba(0,0,0,.7) 50%,
                transparent 100%
            ) !important;

        mask-image:
            radial-gradient(
                ellipse 85% 70% at 50% 55%,
                black 20%,
                rgba(0,0,0,.7) 50%,
                transparent 100%
            ) !important;
    }

    /* Curvas de iluminação azul discretas */
    .smi-menu-maquina::before {
        opacity: .5 !important;
        box-shadow:
            0 -4px 14px rgba(0,140,255,.08) !important;
    }

    .smi-menu-maquina::after {
        opacity: .35 !important;
    }

`;


        document.head.appendChild(style);
    }

    /* ======================================================
       SETA DO MENU
       ====================================================== */

    function svgSeta() {

        return `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true">
                <path d="M9 6l6 6-6 6"></path>
            </svg>
        `;
    }

    /* ======================================================
       ÍCONES DO MENU
       ====================================================== */

    function iconeSVG(tipo) {

        const icones = {

            dashboard: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <rect x="3" y="3"
                          width="7" height="7"></rect>
                    <rect x="14" y="3"
                          width="7" height="7"></rect>
                    <rect x="3" y="14"
                          width="7" height="7"></rect>
                    <rect x="14" y="14"
                          width="7" height="7"></rect>
                </svg>
            `,

            estoque: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <path
                        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z">
                    </path>
                    <path d="M4 7.5L12 12l8-4.5"></path>
                    <path d="M12 12v9"></path>
                </svg>
            `,

            showroom: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <rect x="4" y="7"
                          width="16" height="11" rx="2">
                    </rect>
                    <path d="M8 7V5h8v2"></path>
                </svg>
            `,

            inventario: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <rect x="5" y="3"
                          width="14" height="18" rx="2">
                    </rect>
                    <path d="M9 3.5l2 2 4-4"></path>
                    <path d="M8 12h8"></path>
                    <path d="M8 16h8"></path>
                </svg>
            `,

            entradas: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <path d="M12 4v10"></path>
                    <path d="M8 10l4 4 4-4"></path>
                    <path d="M4 20h16"></path>
                </svg>
            `,

            saidas: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <path d="M12 20V10"></path>
                    <path d="M8 14l4-4 4 4"></path>
                    <path d="M4 4h16"></path>
                </svg>
            `,

            relatorios: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <path d="M5 19V10"></path>
                    <path d="M12 19V5"></path>
                    <path d="M19 19v-8"></path>
                </svg>
            `,

            exportacoes: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <path d="M12 4v10"></path>
                    <path d="M8 10l4 4 4-4"></path>
                    <path d="M5 19h14"></path>
                </svg>
            `,

            formulario: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <path
                        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z">
                    </path>
                    <path d="M14 3v5h5"></path>
                    <path d="M9 13h6"></path>
                    <path d="M9 17h6"></path>
                </svg>
            `,

            configuracoes: `
                <svg viewBox="0 0 24 24"
                     aria-hidden="true">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path
                        d="M19 12a7 7 0 0 0-.2-1.6l2-1.6-2-3.5-2.4.9a7 7 0 0 0-2.7-1.6L13.3 2h-4l-.4 2.6a7 7 0 0 0-2.7 1.6l-2.4-.9-2 3.5 2 1.6a7 7 0 0 0 0 3.2l-2 1.6 2 3.5 2.4-.9a7 7 0 0 0 2.7 1.6l.4 2.6h4l.4-2.6a7 7 0 0 0 2.7-1.6l2.4.9 2-3.5-2-1.6A7 7 0 0 0 19 12z">
                    </path>
                </svg>
            `
        };

        return icones[tipo] || icones.dashboard;
    }

    /* ======================================================
       CONFIGURAÇÃO DOS ITENS
       ====================================================== */

    function obterConfigMenu(textoOriginal) {

        const texto = normalizar(textoOriginal);

        const mapa = {

            "dashboard": {
                grupo: "principal",
                tipo: "dashboard",
                cor: "smi-menu-cor-dashboard"
            },

            "estoque": {
                grupo: "principal",
                tipo: "estoque",
                cor: "smi-menu-cor-estoque"
            },

            "show room": {
                grupo: "principal",
                tipo: "showroom",
                cor: "smi-menu-cor-showroom"
            },

            "showroom": {
                grupo: "principal",
                tipo: "showroom",
                cor: "smi-menu-cor-showroom"
            },

            "inventario": {
                grupo: "principal",
                tipo: "inventario",
                cor: "smi-menu-cor-inventario"
            },

            "entradas": {
                grupo: "operacoes",
                tipo: "entradas",
                cor: "smi-menu-cor-entradas"
            },

            "saidas": {
                grupo: "operacoes",
                tipo: "saidas",
                cor: "smi-menu-cor-saidas"
            },

            "relatorios": {
                grupo: "sistema",
                tipo: "relatorios",
                cor: "smi-menu-cor-relatorios"
            },

            "exportacoes": {
                grupo: "sistema",
                tipo: "exportacoes",
                cor: "smi-menu-cor-exportacoes"
            },

            "formulario": {
                grupo: "sistema",
                tipo: "formulario",
                cor: "smi-menu-cor-formulario"
            },

            "configuracoes": {
                grupo: "sistema",
                tipo: "configuracoes",
                cor: "smi-menu-cor-configuracoes"
            }
        };

        return mapa[texto] || {
            grupo: "sistema",
            tipo: "dashboard",
            cor: "smi-menu-cor-dashboard"
        };
    }

    /* ======================================================
       DIVISÕES DO MENU
       ====================================================== */

    function criarSeparadorGrupo(texto) {

        const grupo = document.createElement("div");
        grupo.className = "smi-menu-grupo";

        const span = document.createElement("span");
        span.textContent = texto;

        grupo.appendChild(span);

        return grupo;
    }

    /* ======================================================
       TOPO DO MENU
       ====================================================== */

    function montarTopo(sidebar) {

        if (sidebar.querySelector(".smi-menu-topo")) {
            return;
        }

        const topo = document.createElement("div");
        topo.className = "smi-menu-topo";

        const logoWrap = document.createElement("div");
        logoWrap.className = "smi-menu-logo-wrap";

        const logoOriginal = sidebar.querySelector(
            ":scope > .marca img, :scope > img"
        ) || sidebar.querySelector(
            "img:not(.smi-menu-foto-maquina)"
        );

        if (logoOriginal) {

            const novaLogo = logoOriginal.cloneNode(true);

            novaLogo.removeAttribute("id");

            logoWrap.appendChild(novaLogo);
        }

        const titulo = document.createElement("h2");
        titulo.className = "smi-menu-titulo";
        titulo.textContent = "SMI MÁQUINAS";

        const subtitulo = document.createElement("div");
        subtitulo.className = "smi-menu-subtitulo";
        subtitulo.textContent = "Controle de estoque";

        topo.append(
            logoWrap,
            titulo,
            subtitulo
        );

        sidebar.insertBefore(
            topo,
            sidebar.firstChild
        );

        // Esconde a identificação antiga.
        sidebar.querySelectorAll(
            ":scope > .marca, " +
            ":scope > .sidebar-descricao"
        ).forEach(elemento => {
            elemento.style.display = "none";
        });
    }

    /* ======================================================
       RODAPÉ DO MENU
       ====================================================== */

    function montarRodape(sidebar) {

        if (sidebar.querySelector(".smi-menu-rodape")) {
            return;
        }

        const rodape = document.createElement("div");
        rodape.className = "smi-menu-rodape";

        const nome = document.createElement("strong");
        nome.textContent = "SMI DO BRASIL";

        const descricao = document.createElement("span");
        descricao.textContent = "Gestão de máquinas";

        rodape.append(
            nome,
            descricao
        );

        sidebar.appendChild(rodape);
    }

    /* ======================================================
       MÁQUINA BP1102AS
       ====================================================== */

    function montarImagemMaquina(sidebar) {

        if (
            sidebar.querySelector(".smi-menu-maquina")
        ) {
            return;
        }

        const area = document.createElement("div");
        area.className = "smi-menu-maquina";

        area.setAttribute(
            "aria-hidden",
            "true"
        );

        const foto = document.createElement("img");

        foto.className = "smi-menu-foto-maquina";

        foto.src = IMAGEM_MAQUINA;
        foto.alt = "";

        foto.loading = "lazy";
        foto.decoding = "async";

        foto.addEventListener("error", function () {

            console.warn(
                "Imagem BP1102AS não encontrada:",
                IMAGEM_MAQUINA
            );

            area.style.display = "none";
        });

        area.appendChild(foto);

        const rodape = sidebar.querySelector(
            ".smi-menu-rodape"
        );

        if (rodape) {
            rodape.before(area);
        } else {
            sidebar.appendChild(area);
        }
    }

    /* ======================================================
       PERSONALIZAR BOTÕES EXISTENTES
       ====================================================== */

    function decorarItens(menu) {

        const itens = Array.from(
            menu.querySelectorAll(".menu-item")
        );

        if (!itens.length) {
            return;
        }

        // Remove apenas divisões geradas anteriormente.
        menu.querySelectorAll(
            ".smi-menu-grupo"
        ).forEach(grupo => grupo.remove());

        let ultimoGrupo = "";

        itens.forEach(botao => {

            const textoCru =
                botao.dataset.smiNomeOriginal ||
                botao.textContent.trim();

            const config = obterConfigMenu(textoCru);

            if (config.grupo !== ultimoGrupo) {

                ultimoGrupo = config.grupo;

                const nomeGrupo =
                    config.grupo === "principal"
                        ? "PRINCIPAL"
                        : config.grupo === "operacoes"
                            ? "OPERAÇÕES"
                            : "SISTEMA";

                botao.before(
                    criarSeparadorGrupo(nomeGrupo)
                );
            }

            // Preserva os eventos dos botões existentes.
            if (botao.dataset.smiDecorado === "1") {
                return;
            }

            botao.dataset.smiNomeOriginal = textoCru;
            botao.dataset.smiDecorado = "1";

            const box = document.createElement("span");

            box.className =
                "smi-menu-icone-box " +
                config.cor;

            box.innerHTML = iconeSVG(config.tipo);

        const texto = document.createElement("span");
texto.className = "smi-menu-texto";

const nomesPadronizados = {
    "dashboard": "Dashboard",
    "estoque": "Estoque",
    "show room": "Show Room",
    "showroom": "Show Room",
    "inventario": "Inventário",
    "entradas": "Entradas",
    "saidas": "Saídas",
    "relatorios": "Relatórios",
    "exportacoes": "Exportações",
    "formulario": "Formulário",
    "configuracoes": "Configurações"
};

texto.textContent =
    nomesPadronizados[normalizar(textoCru)] || textoCru;

            const seta = document.createElement("span");
            seta.className = "smi-menu-seta";

            seta.innerHTML = svgSeta();

            botao.replaceChildren(
                box,
                texto,
                seta
            );
        });
    }

    /* ======================================================
       MONTAR O MENU
       ====================================================== */

    function aplicarMenuMaquinas() {

        const sidebar = document.querySelector(
            ".sidebar"
        );

        const menu = sidebar?.querySelector(
            ".menu"
        );

        if (!sidebar || !menu) {

            console.warn(
                "Menu lateral do SMI Máquinas não encontrado."
            );

            return;
        }

        // Limpa apenas os elementos decorativos
        // criados pelo próprio arquivo.

        sidebar.querySelectorAll(
            ".smi-menu-topo, " +
            ".smi-menu-rodape, " +
            ".smi-menu-maquina"
        ).forEach(elemento => elemento.remove());

        montarTopo(sidebar);

        decorarItens(menu);

        montarRodape(sidebar);

        montarImagemMaquina(sidebar);

        console.log(
            "SMI Máquinas — menu visual atualizado."
        );
    }

    /* ======================================================
       INICIALIZAÇÃO
       ====================================================== */

    function iniciar() {

        criarEstilos();

        aplicarMenuMaquinas();
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
