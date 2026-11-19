(() => {
    "use strict";

    const CHAVE_PREFERENCIAS =
        "smi_maquinas_preferencias_v1";

    function iniciarCabecalho() {

        const cabecalho = document.querySelector(
            ".cabecalho-acoes"
        );

        if (!cabecalho) {
            console.error(
                "Cabeçalho do SMI Máquinas não encontrado."
            );
            return;
        }

        if (document.getElementById("smiBarraSuperior")) {
            return;
        }

        // =========================================
        // CABEÇALHO SUPERIOR
        // =========================================

        const barra = document.createElement("div");

        barra.id = "smiBarraSuperior";

        barra.innerHTML = `
            <button
                type="button"
                class="smi-idioma"
                data-idioma="pt-BR"
                title="Português"
                aria-label="Selecionar português"
            >
                <svg
                    width="26"
                    height="18"
                    viewBox="0 0 26 18"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <rect
                        width="26"
                        height="18"
                        fill="#009B3A"
                    />

                    <path
                        d="M13 2 L24 9 L13 16 L2 9 Z"
                        fill="#FFDF00"
                    />

                    <circle
                        cx="13"
                        cy="9"
                        r="4.2"
                        fill="#002776"
                    />

                    <path
                        d="M8.9 8.4 Q13 6.8 17.1 9"
                        stroke="#FFFFFF"
                        stroke-width="1"
                        fill="none"
                    />
                </svg>

                <strong>BR</strong>
            </button>

            <span class="smi-separador"></span>

            <button
                type="button"
                class="smi-idioma"
                data-idioma="it-IT"
                title="Italiano"
                aria-label="Seleziona italiano"
            >
                <svg
                    width="26"
                    height="18"
                    viewBox="0 0 26 18"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <rect
                        width="8.67"
                        height="18"
                        fill="#009246"
                    />

                    <rect
                        x="8.67"
                        width="8.66"
                        height="18"
                        fill="#FFFFFF"
                    />

                    <rect
                        x="17.33"
                        width="8.67"
                        height="18"
                        fill="#CE2B37"
                    />
                </svg>

                <strong>IT</strong>
            </button>

            <span
                id="smiRelogio"
                aria-label="Data e hora atual"
            ></span>

            <div id="smiUsuarioTopo">
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="#67439B"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <circle
                        cx="12"
                        cy="7"
                        r="4"
                    />

                    <path
                        d="M4 22V19C4 14.6 7.6 12 12 12
                           C16.4 12 20 14.6 20 19V22Z"
                    />
                </svg>

                <span id="smiNomeTopo"></span>
            </div>

            <div id="smiSairTopo"></div>
        `;

        cabecalho.prepend(barra);

        // =========================================
        // ESTILOS DO CABEÇALHO
        // =========================================

        const estilo = document.createElement("style");

        estilo.id = "smiEstiloCabecalho";

        estilo.textContent = `

            #smiBarraSuperior {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 14px;
                padding: 6px 8px;
                min-height: 44px;
                box-sizing: border-box;
                background: #ffffff;
                color: #092b5b;
                font-family: inherit;
                font-size: 13px;
            }

            #smiBarraSuperior .smi-idioma {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 4px 2px;
                border: none;
                border-radius: 4px;
                background: transparent;
                color: #092b5b;
                cursor: pointer;
                font-family: inherit;
                font-size: 13px;
            }

            #smiBarraSuperior .smi-idioma svg {
                display: block;
                width: 26px;
                height: 18px;
                flex-shrink: 0;
                border: 1px solid #e5e7eb;
            }

            #smiBarraSuperior .smi-idioma strong {
                font-weight: 700;
            }

            #smiBarraSuperior .smi-idioma:hover {
                background: #edf4ff;
            }

            #smiBarraSuperior .smi-idioma.ativo {
                opacity: 1;
            }

            #smiBarraSuperior .smi-idioma:not(.ativo) {
                opacity: .85;
            }

            #smiBarraSuperior .smi-separador {
                width: 1px;
                height: 23px;
                background: #d9e2ed;
            }

            #smiRelogio {
                color: #315886;
                font-size: 12px;
                white-space: nowrap;
                font-variant-numeric: tabular-nums;
            }

            #smiUsuarioTopo {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                color: #315886;
                font-size: 12px;
                white-space: nowrap;
            }

            #smiUsuarioTopo svg {
                width: 15px;
                height: 15px;
                flex-shrink: 0;
            }

            #smiBarraSuperior #usuarioAtual {
                margin: 0 !important;
                color: #315886 !important;
                font-size: 12px !important;
                white-space: nowrap;
            }

            #smiBarraSuperior #smiSair {
                margin: 0 !important;
                min-height: 35px !important;
                padding: 8px 16px !important;
                border: none !important;
                border-radius: 7px !important;
                background: #d80f2c !important;
                color: #ffffff !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                cursor: pointer;
            }

            #smiBarraSuperior #smiSair:hover {
                background: #b80d26 !important;
            }

            .cabecalho-acoes {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 10px;
            }

            @media (max-width: 900px) {
                #smiBarraSuperior {
                    gap: 10px;
                }
            }

            @media (max-width: 520px) {
                #smiBarraSuperior {
                    justify-content: center;
                    gap: 8px;
                }
            }
        `;

        document.head.appendChild(estilo);

        // =========================================
        // DATA E HORA EM TEMPO REAL
        // =========================================

        const relogio = document.getElementById(
            "smiRelogio"
        );

        function atualizarRelogio() {

            const agora = new Date();

            const data = new Intl.DateTimeFormat(
                "pt-BR",
                {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            ).format(agora);

            const hora = new Intl.DateTimeFormat(
                "pt-BR",
                {
                    timeZone: "America/Sao_Paulo",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                }
            ).format(agora);

            relogio.textContent = `${data}  ${hora}`;
        }

        atualizarRelogio();

        setInterval(atualizarRelogio, 1000);

        // =========================================
        // USUÁRIO E BOTÃO SAIR
        // =========================================

        const nomeTopo = document.getElementById(
            "smiNomeTopo"
        );

        const sairTopo = document.getElementById(
            "smiSairTopo"
        );

        function sincronizarUsuario() {

            const usuario = document.getElementById(
                "usuarioAtual"
            );

            if (
                usuario &&
                usuario.parentElement !== nomeTopo
            ) {
                nomeTopo.appendChild(usuario);
            }

            const sair = document.getElementById(
                "smiSair"
            );

            if (
                sair &&
                sair.parentElement !== sairTopo
            ) {
                sairTopo.appendChild(sair);
            }
        }

        sincronizarUsuario();

        // O login pode carregar depois do cabeçalho.

        const observador = new MutationObserver(() => {
            sincronizarUsuario();
        });

        observador.observe(document.body, {
            childList: true,
            subtree: true
        });

        // =========================================
        // IDIOMAS: PORTUGUÊS E ITALIANO
        // =========================================

        function obterIdioma() {

            try {

                const preferencias = JSON.parse(
                    localStorage.getItem(
                        CHAVE_PREFERENCIAS
                    ) || "{}"
                );

                return preferencias.idioma === "it-IT"
                    ? "it-IT"
                    : "pt-BR";

            } catch (_) {

                return "pt-BR";
            }
        }

        function destacarIdioma() {

            const idiomaAtual = obterIdioma();

            barra.querySelectorAll(
                ".smi-idioma"
            ).forEach(botao => {

                const ativo =
                    botao.dataset.idioma === idiomaAtual;

                botao.classList.toggle(
                    "ativo",
                    ativo
                );

                botao.setAttribute(
                    "aria-pressed",
                    String(ativo)
                );
            });
        }

        function alterarIdioma(idioma) {

            if (
                idioma !== "pt-BR" &&
                idioma !== "it-IT"
            ) {
                return;
            }

            if (obterIdioma() === idioma) {
                destacarIdioma();
                return;
            }

            // Integração com as Configurações existentes.

            const opcao = document.querySelector(
                `input[name="cfgIdioma"][value="${idioma}"]`
            );

            const salvar = document.getElementById(
                "cfgSalvarIdioma"
            );

            if (opcao && salvar) {

                opcao.checked = true;
                salvar.click();

            } else {

                try {

                    const preferencias = JSON.parse(
                        localStorage.getItem(
                            CHAVE_PREFERENCIAS
                        ) || "{}"
                    );

                    preferencias.idioma = idioma;

                    localStorage.setItem(
                        CHAVE_PREFERENCIAS,
                        JSON.stringify(preferencias)
                    );

                    document.documentElement.lang = idioma;

                    window.location.reload();
                    return;

                } catch (erro) {

                    console.error(
                        "Não foi possível alterar o idioma:",
                        erro
                    );

                    return;
                }
            }

            destacarIdioma();
        }

        barra.querySelectorAll(
            ".smi-idioma"
        ).forEach(botao => {

            botao.addEventListener("click", () => {

                alterarIdioma(
                    botao.dataset.idioma
                );
            });
        });

        destacarIdioma();

        console.log(
            "SMI Máquinas: cabeçalho BR/IT carregado."
        );
    }

    // =========================================
    // INICIALIZAÇÃO
    // =========================================

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarCabecalho
        );

    } else {

        iniciarCabecalho();
    }

})();