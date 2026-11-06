(() => {
    "use strict";

    function iniciarAcesso() {
        const raiz = document.documentElement;

        const formulario =
            document.getElementById("smiFormAcesso");

        const email =
            document.getElementById("acessoEmail");

        const senha =
            document.getElementById("acessoSenha");

        const entrar =
            document.getElementById("acessoEntrar");

        const mensagem =
            document.getElementById("acessoMensagem");

        const cliente = window.smiSupabase;

        raiz.classList.add("smi-bloqueado");

        if (!cliente?.auth) {
            entrar.textContent = "Acesso indisponível";

            mensagem.textContent =
                "Não foi possível carregar o Supabase. " +
                "Confira a internet e recarregue a página.";

            return;
        }

        const usuarioAtual =
            document.getElementById("usuarioAtual");

        const sair = document.createElement("button");

        sair.id = "smiSair";
        sair.type = "button";
        sair.textContent = "Sair";

        if (usuarioAtual) {
            usuarioAtual.insertAdjacentElement(
                "afterend",
                sair
            );
        } else {
            document.querySelector(".sidebar")?.appendChild(sair);
        }

        let enviando = false;

        function atualizarTela(sessao) {
            const usuario = sessao?.user;

            raiz.classList.toggle(
                "smi-bloqueado",
                !usuario
            );

            let nome = "";

            if (usuario) {
                const emailUsuario =
                    usuario.email?.toLowerCase();

                if (
                    emailUsuario ===
                    "logistica.br@smigroup.net"
                ) {
                    nome = "DAVI.SMI";
                } else {
                    nome =
                        usuario.user_metadata?.display_name ||
                        usuario.email ||
                        "Usuário";
                }
            }

            if (usuarioAtual) {
                usuarioAtual.textContent = nome;
            }

            const usuarioConfiguracoes =
                document.getElementById("cfgUsuario");

            if (usuarioConfiguracoes) {
                usuarioConfiguracoes.textContent =
                    nome || "Sem usuário conectado";
            }

            if (!usuario) {
                document
                    .querySelectorAll("dialog[open]")
                    .forEach(dialogo => dialogo.close());
            } else {
                mensagem.textContent = "";
            }

            if (!enviando) {
                entrar.disabled = false;
                entrar.textContent = "Entrar";
            }
        }

        /*
         * Acompanha login, logout e renovação da sessão.
         * Não faz chamadas Auth dentro deste callback.
         */
        let recebeuEvento = false;

        cliente.auth.onAuthStateChange((evento, sessao) => {
            recebeuEvento = true;

            if (evento === "SIGNED_OUT") {
                senha.value = "";
            }

            atualizarTela(sessao);
        });

        /*
         * Recupera uma sessão já existente.
         */
        cliente.auth.getSession()
            .then(({ data, error }) => {
                if (recebeuEvento) {
                    return;
                }

                atualizarTela(
                    error ? null : data.session
                );

                mensagem.textContent = error
                    ? "Não foi possível verificar a sessão. Entre novamente."
                    : "";
            })
            .catch(() => {
                if (recebeuEvento) {
                    return;
                }

                atualizarTela(null);

                mensagem.textContent =
                    "Confira a conexão e tente entrar.";
            });

        /*
         * Entrar.
         */
        formulario.addEventListener(
            "submit",
            async evento => {
                evento.preventDefault();

                if (enviando) {
                    return;
                }

                enviando = true;

                entrar.disabled = true;
                entrar.textContent = "Entrando...";
                mensagem.textContent = "";

                try {
                    const { data, error } =
                        await cliente.auth.signInWithPassword({
                            email: email.value.trim(),
                            password: senha.value
                        });

                    if (error) {
                        if (
                            error.message ===
                            "Invalid login credentials"
                        ) {
                            mensagem.textContent =
                                "E-mail ou senha incorretos.";
                        } else if (
                            error.message ===
                            "Email not confirmed"
                        ) {
                            mensagem.textContent =
                                "O e-mail ainda não foi confirmado no Supabase.";
                        } else {
                            mensagem.textContent =
                                "Não foi possível entrar. " +
                                "Confira a conexão e os dados de acesso.";
                        }

                        return;
                    }

                    if (!data.session) {
                        mensagem.textContent =
                            "Não foi possível iniciar a sessão. " +
                            "Tente novamente.";

                        return;
                    }

                    senha.value = "";

                    atualizarTela(data.session);
                } catch {
                    mensagem.textContent =
                        "Não foi possível conectar. " +
                        "Confira sua internet.";
                } finally {
                    enviando = false;

                    entrar.disabled = false;
                    entrar.textContent = "Entrar";
                }
            }
        );

        /*
         * Sair deste navegador.
         */
        sair.addEventListener("click", async () => {
            sair.disabled = true;

            try {
                const { error } =
                    await cliente.auth.signOut({
                        scope: "local"
                    });

                if (error) {
                    throw error;
                }

                senha.value = "";

                atualizarTela(null);

                mensagem.textContent = "";

                email.focus();
            } catch {
                alert(
                    "Não foi possível sair. " +
                    "Confira a conexão e tente novamente."
                );
            } finally {
                sair.disabled = false;
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            iniciarAcesso,
            { once: true }
        );
    } else {
        iniciarAcesso();
    }
})();