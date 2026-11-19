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

        // =========================================
        // BOTÃO SAIR
        // =========================================

        let sair = document.getElementById("smiSair");

        if (!sair) {
            sair = document.createElement("button");

            sair.id = "smiSair";
            sair.type = "button";
            sair.textContent = "Sair";

            if (usuarioAtual) {
                usuarioAtual.insertAdjacentElement(
                    "afterend",
                    sair
                );
            } else {
                document.querySelector(".sidebar")
                    ?.appendChild(sair);
            }
        }

        let enviando = false;

        // Identifica a consulta mais recente para impedir
        // que uma resposta antiga troque o nome do usuário.
        let versaoUsuario = 0;

        // =========================================
        // EXIBIR NOME DO USUÁRIO
        // =========================================

        function mostrarNome(nome) {
            if (usuarioAtual) {
                usuarioAtual.textContent = nome;
            }

            const usuarioConfiguracoes =
                document.getElementById("cfgUsuario");

            if (usuarioConfiguracoes) {
                usuarioConfiguracoes.textContent =
                    nome || "Sem usuário conectado";
            }
        }

        // =========================================
        // BUSCAR NOME NO SUPABASE
        // =========================================

        async function buscarNomeUsuario(usuario) {
            if (!usuario?.id) {
                return "";
            }

            const emailUsuario =
                usuario.email?.trim().toLowerCase() || "";

            // Nome provisório enquanto a consulta é feita.
            const nomeProvisorio =
                usuario.user_metadata?.display_name ||
                usuario.email ||
                "Usuário";

            try {
                const { data, error } = await cliente
                    .from("maquinas_usuarios")
                    .select("nome")
                    .eq("usuario_id", usuario.id)
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                const nomeBanco =
                    typeof data?.nome === "string"
                        ? data.nome.trim()
                        : "";

                if (nomeBanco) {
                    return nomeBanco;
                }

            } catch (erro) {
                console.warn(
                    "Não foi possível consultar o nome do usuário:",
                    erro
                );
            }

            // Compatibilidade com as contas já existentes.
            // A prioridade continua sendo o nome cadastrado
            // na tabela maquinas_usuarios.

            const nomesConhecidos = {
                "logistica.br@smigroup.net": "DAVI.SMI",
                "vander.oliveira@smigroup.net": "VANDER.SMI"
            };

            return (
                nomesConhecidos[emailUsuario] ||
                nomeProvisorio
            );
        }

        // =========================================
        // ATUALIZAR TELA DE ACESSO
        // =========================================

        function atualizarTela(sessao) {
            const usuario = sessao?.user;

            const versaoAtual = ++versaoUsuario;

            raiz.classList.toggle(
                "smi-bloqueado",
                !usuario
            );

            if (usuario) {
                // Exibe um nome provisório imediatamente.
                mostrarNome(
                    usuario.user_metadata?.display_name ||
                    usuario.email ||
                    "Usuário"
                );

                // Busca o nome correto sem bloquear a tela.
                buscarNomeUsuario(usuario)
                    .then(nome => {
                        // Não altera o nome se a sessão mudou.
                        if (versaoAtual !== versaoUsuario) {
                            return;
                        }

                        mostrarNome(nome);
                    })
                    .catch(erro => {
                        console.warn(
                            "Falha ao atualizar nome:",
                            erro
                        );
                    });

                mensagem.textContent = "";

            } else {
                mostrarNome("");

                document
                    .querySelectorAll("dialog[open]")
                    .forEach(dialogo => {
                        dialogo.close();
                    });
            }

            if (!enviando) {
                entrar.disabled = false;
                entrar.textContent = "Entrar";
            }
        }

        // =========================================
        // ACOMPANHAR SESSÃO
        // =========================================

        /*
         * Mantemos o callback de autenticação sem
         * consultas assíncronas diretas ao Auth.
         *
         * A busca do nome acontece separadamente.
         */

        let recebeuEvento = false;

        cliente.auth.onAuthStateChange(
            (evento, sessao) => {
                recebeuEvento = true;

                if (evento === "SIGNED_OUT") {
                    senha.value = "";
                }

                atualizarTela(sessao);
            }
        );

        // =========================================
        // RECUPERAR SESSÃO EXISTENTE
        // =========================================

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

        // =========================================
        // ENTRAR NO SISTEMA
        // =========================================

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

                } catch (erro) {
                    console.error(
                        "Erro no login:",
                        erro
                    );

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

        // =========================================
        // SAIR DO SISTEMA
        // =========================================

        sair.addEventListener(
            "click",
            async () => {
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

                } catch (erro) {
                    console.error(
                        "Erro ao sair:",
                        erro
                    );

                    alert(
                        "Não foi possível sair. " +
                        "Confira a conexão e tente novamente."
                    );

                } finally {
                    sair.disabled = false;
                }
            }
        );

        console.log(
            "SMI Máquinas: controle de acesso carregado."
        );
    }

    // =========================================
    // INICIALIZAÇÃO
    // =========================================

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