
/* =====================================================
   SMI MÁQUINAS — DASHBOARD 2026
   SMI GROUP
   ===================================================== */

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {

        const dashboard = document.getElementById(
            "telaDashboardSMI"
        );

        const botaoDashboard = document.getElementById(
            "btnDashboardSMI"
        );

        const indicadores = document.querySelector(
            ".indicadores"
        );

        const titulo = document.getElementById(
            "tituloPagina"
        );

        if (
            !dashboard ||
            !botaoDashboard ||
            !indicadores ||
            !titulo
        ) {
            console.warn(
                "SMI Dashboard: elementos não encontrados."
            );
            return;
        }

        let dashboardAberto = false;

        function copiarIndicador(origem, destinos) {

            const elemento = document.getElementById(origem);

            if (!elemento) return;

            const valor = elemento.textContent.trim();

            destinos.forEach(function (id) {

                const destino = document.getElementById(id);

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

        function abrirDashboard() {

            document.querySelectorAll(
                "main .tela"
            ).forEach(function (tela) {

                tela.hidden = tela !== dashboard;
            });

            indicadores.hidden = true;
            dashboard.hidden = false;

            dashboardAberto = true;

            titulo.textContent = "Dashboard";

            document.querySelectorAll(
                ".menu-item"
            ).forEach(function (botao) {

                botao.classList.remove("ativo");

                botao.removeAttribute(
                    "aria-current"
                );
            });

            botaoDashboard.classList.add("ativo");

            botaoDashboard.setAttribute(
                "aria-current",
                "page"
            );

            atualizarDashboard();
        }

        function fecharDashboard() {

            if (!dashboardAberto) return;

            dashboardAberto = false;

            dashboard.hidden = true;
            indicadores.hidden = false;

            botaoDashboard.classList.remove("ativo");

            botaoDashboard.removeAttribute(
                "aria-current"
            );
        }

        function navegarPara(tela) {

            const botao = document.querySelector(
                `.menu-item[data-tela="${tela}"]`
            );

            if (botao) {

                fecharDashboard();

                botao.click();
            }
        }

        botaoDashboard.addEventListener(
            "click",
            function () {

                abrirDashboard();
            }
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

        const botaoEstoque = document.getElementById(
            "dashAbrirEstoque"
        );

        if (botaoEstoque) {

            botaoEstoque.addEventListener(
                "click",
                function () {
                    navegarPara("estoque");
                }
            );
        }

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

        const observer = new MutationObserver(
            function () {
                atualizarDashboard();
            }
        );

        [
            "totalEstoque",
            "totalDisponiveis",
            "totalReservadas",
            "totalVendidas"
        ].forEach(function (id) {

            const elemento = document.getElementById(id);

            if (elemento) {

                observer.observe(elemento, {
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            }
        });

        const botaoAtualizar = document.getElementById(
            "btnAtualizar"
        );

        if (botaoAtualizar) {

            botaoAtualizar.addEventListener(
                "click",
                function () {
                    atualizarDashboard();
                }
            );
        }

        atualizarDashboard();

        // Exibe o Dashboard como tela inicial.
        abrirDashboard();

    });

})();
