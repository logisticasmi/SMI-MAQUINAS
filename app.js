// =====================================================
// SMI MÁQUINAS — ESTOQUE PRINCIPAL E SHOW ROOM
// Teste local: dados salvos neste navegador.
// =====================================================

const MODELOS = [
    "HS500",
    "HS500E",
    "HS500 SERVO",
    "HS700",
    "HS800",
    "FP6000",
    "FP6000CS",
    "T452",
    "T452 INOX",
    "T452H",
    "T450",
    "T652",
    "T652H",
    "T650",
    "T852H",
    "FW300E",
    "FW400E",
    "FW500E",
    "FW550E",
    "FW550",
    "GH1000/400",
    "GH2000/400",
    "GH2000/600",
    "GH2000/400 INOX",
    "GHS2000/400B",
    "GHS2000/700B",
    "GHS2000/400R",
    "GHS2000/400F",
    "GHS2000/400P",
    "GHS2000/400S",
    "GHS2000/400FC",
    "GHS1000/400B",
    "SL45",
    "SL55",
    "S560NA",
    "S870",
    "FP560A",
    "FP870A",
    "BP600",
    "BP800",
    "BP800AS",
    "BP802AS",
    "BP1102AS",
    "BP1402AS",
    "BP800AR 350P",
    "BP802AR 350P",
    "BP600AR 150R",
    "BP800AR 230R",
    "BP802AR 230R",
    "BP800AR 280ST",
    "BP802ARV 350R-S",
    "BP 800ARV 230R-P",
    "BP802ARV 350R-SP",
    "BP802ARV 280R",
    "BP800AR 150Z",
    "BP802ALV 600R",
    "XP650 ALX",
    "XP650ASX",
    "XP650 ARX",
    "FP8000CS",
    "WPS 600R"
];

// Fotos utilizadas nos dois catálogos.
// Exemplo:
// "HS500": "img/hs500.jpg"

const FOTOS_MODELOS = {
    "T852H": "img/t852h.png",
    "HS500": "img/hs500.png",
    "HS500 SERVO": "img/hs500-servo.png",
    "HS500E": "img/hs500e.png",
    "HS700": "img/hs700.png",
    "HS800": "img/hs800.png",
    "BP800": "img/bp800.png",
    "BP1102AS": "img/bp1102as.png",
    "BP802AR 350P": "img/bp802ar-350p.png",
    "BP600AR 150R": "img/bp600ar-150r.png",
    "BP802AR 230R": "img/bp802ar-230r.png",
    "BP800AR 150Z": "img/bp800ar-150z.png",
    "BP800AR 280ST": "img/bp800ar-280st.png",
    "BP802ARV 350R-S": "img/bp802arv-350r-s.png"
};
const CHAVE_DADOS = "smi_maquinas_teste_v1";
const POR_PAGINA = 9;

let dados;
let setorAtual = "estoque";
let telaAtual = "estoque";
let paginaAtual = 1;
let modeloSelecionado = "";
let registroEmEdicao = null;
let relatorioAtual = null;

const $ = id => document.getElementById(id);

// =====================================================
// FUNÇÕES GERAIS
// =====================================================

function novoId() {
    return crypto.randomUUID();
}

function normalizar(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function dataLocal(valor) {
    if (!valor) return "";

    if (
        typeof valor === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
        return valor;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return "";

    return [
        data.getFullYear(),
        String(data.getMonth() + 1).padStart(2, "0"),
        String(data.getDate()).padStart(2, "0")
    ].join("-");
}

function hoje() {
    return dataLocal(new Date());
}

function formatarData(valor, comHora = false) {
    if (!valor) return "—";

    const data = /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ? new Date(`${valor}T12:00:00`)
        : new Date(valor);

    if (Number.isNaN(data.getTime())) return "—";

    return comHora
        ? data.toLocaleString("pt-BR")
        : data.toLocaleDateString("pt-BR");
}

function mensagem(texto, tipo = "") {
    $("mensagemSistema").textContent = texto;
    $("mensagemSistema").className = `mensagem-sistema ${tipo}`;
    $("mensagemSistema").hidden = false;
}

function setorDe(item) {
    // Registros antigos pertencem ao estoque principal.
    return item.setor === "showroom"
        ? "showroom"
        : "estoque";
}

function nomeSetor(setor) {
    return setor === "showroom"
        ? "SHOW ROOM"
        : "Estoque principal";
}

// =====================================================
// DADOS LOCAIS
// =====================================================

function carregarDados() {
    const texto = localStorage.getItem(CHAVE_DADOS);

    if (!texto) {
        return {
            versao: 1,
            entradas: [],
            saidas: [],
            reservas: []
        };
    }

    const salvo = JSON.parse(texto);

    if (
        salvo.versao !== 1 ||
        !Array.isArray(salvo.entradas) ||
        !Array.isArray(salvo.saidas) ||
        !Array.isArray(salvo.reservas)
    ) {
        throw new Error("Formato dos dados locais inválido.");
    }

    return salvo;
}

function atualizarDados() {
    dados = carregarDados();
}

function invalidarRelatorio() {
    relatorioAtual = null;
    $("btnExportarRelatorio").disabled = true;
}

function gravarDados(proximosDados) {
    localStorage.setItem(
        CHAVE_DADOS,
        JSON.stringify(proximosDados)
    );

    dados = proximosDados;
    invalidarRelatorio();
}

function executar(acao) {
    try {
        atualizarDados();
        acao();
    } catch (erro) {
        mensagem(
            "Não foi possível concluir: " + erro.message,
            "erro"
        );
    }
}

// =====================================================
// SALDOS SEPARADOS
// =====================================================

function reservaAtiva(item) {
    return (
        item.status === "ativa" &&
        new Date(item.vencimento).getTime() > Date.now()
    );
}

function saldo(modelo, setor = setorAtual) {
    const entradas = dados.entradas
        .filter(item =>
            item.modelo === modelo &&
            setorDe(item) === setor
        )
        .reduce(
            (soma, item) => soma + Number(item.quantidade || 0),
            0
        );

    const saidas = dados.saidas
        .filter(item =>
            item.modelo === modelo &&
            setorDe(item) === setor
        )
        .reduce(
            (soma, item) => soma + Number(item.quantidade || 0),
            0
        );

    const reservadas = dados.reservas.filter(item =>
        item.modelo === modelo &&
        setorDe(item) === setor &&
        reservaAtiva(item)
    ).length;

    const vendidas = dados.saidas
        .filter(item =>
            item.modelo === modelo &&
            setorDe(item) === setor &&
            item.tipo === "venda"
        )
        .reduce(
            (soma, item) => soma + Number(item.quantidade || 0),
            0
        );

    const total = entradas - saidas;

    return {
        total,
        disponiveis: total - reservadas,
        reservadas,
        vendidas
    };
}

function situacao(item) {
    if (item.status === "ativa" && !reservaAtiva(item)) {
        return "expirada";
    }

    return item.status;
}

function nomeSituacao(status) {
    return {
        ativa: "Reservado",
        disponivel: "Disponível",
        vendida: "Vendido",
        expirada: "Expirada",
        cancelada: "Cancelada",
        concluida: "Saída registrada"
    }[status] || status;
}

function expirarReservas() {
    const vencidas = dados.reservas.filter(item =>
        item.status === "ativa" &&
        new Date(item.vencimento).getTime() <= Date.now()
    );

    if (!vencidas.length) return 0;

    const ids = new Set(vencidas.map(item => item.id));
    const agora = new Date().toISOString();

    gravarDados({
        ...dados,
        reservas: dados.reservas.map(item =>
            ids.has(item.id)
                ? {
                    ...item,
                    status: "expirada",
                    historico: [...(item.historico || []), { ...item, historico: undefined, status: "expirada", em: agora }],
                    encerradaEm: agora
                }
                : item
        )
    });

    return vencidas.length;
}

// =====================================================
// BOTÃO SHOW ROOM E SELETORES
// =====================================================

function prepararShowRoom() {
    const botaoEstoque = document.querySelector(
        '[data-tela="estoque"]'
    );

    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = "menu-item";
    botao.dataset.tela = "showroom";
    botao.textContent = "SHOW ROOM";
    botao.setAttribute("aria-controls", "telaEstoque");

    botaoEstoque.after(botao);

    document.querySelector(
        '[data-tela="reservas"]'
    ).textContent = "Relatórios";

    document.querySelector(
        '[data-tela="relatorios"]'
    ).textContent = "Exportações";

    document.querySelector(
        "#telaReservas h2"
    ).textContent = "Relatórios";

    document.querySelector(
        "#telaRelatorios h2"
    ).textContent = "Exportações";

    const resumo = document.createElement("p");

    resumo.id = "resumoSetor";
    resumo.className = "texto-auxiliar";

    document.querySelector(".indicadores").before(resumo);

    function criarSeletor(containerId, id, titulo, todos) {
        const campo = document.createElement("div");
        const label = document.createElement("label");
        const select = document.createElement("select");

        campo.className = "campo";
        label.htmlFor = id;
        label.textContent = titulo;
        select.id = id;

        if (todos) {
            select.add(new Option("Todos os estoques", ""));
        }

        select.add(
            new Option("Estoque principal", "estoque")
        );

        select.add(
            new Option("SHOW ROOM", "showroom")
        );

        campo.append(label, select);
        $(containerId).prepend(campo);

        return select;
    }

    criarSeletor(
        "formEntrada",
        "entradaSetor",
        "Estoque de destino",
        false
    ).addEventListener("change", evento => {
        mudarSetor(evento.target.value);
    });

    criarSeletor(
        "formSaida",
        "saidaSetor",
        "Estoque de origem",
        false
    ).addEventListener("change", evento => {
        mudarSetor(evento.target.value);
    });

    criarSeletor(
        "formRelatorio",
        "relatorioSetor",
        "Estoque",
        true
    ).addEventListener("change", invalidarRelatorio);

    criarSeletor(
        "telaReservas",
        "filtroSetorReserva",
        "Estoque",
        true
    ).addEventListener("change", renderizarReservas);

    const coluna = document.createElement("th");
    coluna.textContent = "Estoque";

    $("listaReservas")
        .closest("table")
        .querySelector("thead tr")
        .prepend(coluna);

    const descricao = document.querySelector(
        "#telaSaidas .secao-cabecalho p"
    );

    if (descricao) {
        descricao.textContent =
            "Escolha o estoque de origem. Para vender uma máquina " +
            "reservada, abra seu registro em Relatórios.";
    }
}

function mudarSetor(setor) {
    if (!["estoque", "showroom"].includes(setor)) return;

    const mudou = setorAtual !== setor;
    setorAtual = setor;

    $("entradaSetor").value = setor;
    $("saidaSetor").value = setor;

    $("tituloCatalogo").textContent = setor === "showroom"
        ? "SHOW ROOM"
        : "Catálogo de máquinas";

    $("resumoSetor").textContent =
        `Indicadores: ${nomeSetor(setor)}. Saldos separados.`;

    if (mudou) {
        registroEmEdicao = null;
        modeloSelecionado = "";
        paginaAtual = 1;

        $("formReserva").reset();
        $("tituloReserva").textContent = "Registrar máquina";

        $("saidaReserva").value = "";
        $("saidaModelo").value = "";
        $("saidaQuantidade").value = 1;
        $("saidaCliente").value = "";
    }

    renderizarTudo();
}

// =====================================================
// NAVEGAÇÃO
// =====================================================

function trocarTela(nome) {
    const telas = {
        estoque: [
            "telaEstoque",
            "Estoque de máquinas"
        ],
        showroom: [
            "telaEstoque",
            "SHOW ROOM"
        ],
        entradas: [
            "telaEntradas",
            "Entrada de máquinas"
        ],
        saidas: [
            "telaSaidas",
            "Saída de máquinas"
        ],
        reservas: [
            "telaReservas",
            "Relatórios"
        ],
        relatorios: [
            "telaRelatorios",
            "Exportações"
        ]
    };

    if (!telas[nome]) return;

    telaAtual = nome;

    if (nome === "estoque" || nome === "showroom") {
        mudarSetor(nome);
    }

    const ids = new Set(
        Object.values(telas).map(item => item[0])
    );

    ids.forEach(id => {
        $(id).hidden = id !== telas[nome][0];
    });

    document.querySelectorAll("[data-tela]").forEach(botao => {
        const ativo = botao.dataset.tela === nome;

        botao.classList.toggle("ativo", ativo);

        if (ativo) {
            botao.setAttribute("aria-current", "page");
        } else {
            botao.removeAttribute("aria-current");
        }
    });

    $("tituloPagina").textContent = telas[nome][1];
}

function preencherModelos() {
    [
        "entradaModelo",
        "saidaModelo",
        "relatorioModelo"
    ].forEach(id => {
        MODELOS.forEach(modelo => {
            $(id).add(new Option(modelo, modelo));
        });
    });
}

// =====================================================
// INDICADORES E CATÁLOGO
// =====================================================

function renderizarIndicadores() {
    const resumo = MODELOS.reduce(
        (soma, modelo) => {
            const item = saldo(modelo);

            soma.total += item.total;
            soma.disponiveis += item.disponiveis;
            soma.reservadas += item.reservadas;
            soma.vendidas += item.vendidas;

            return soma;
        },
        {
            total: 0,
            disponiveis: 0,
            reservadas: 0,
            vendidas: 0
        }
    );

    $("totalEstoque").textContent = resumo.total;
    $("totalDisponiveis").textContent = resumo.disponiveis;
    $("totalReservadas").textContent = resumo.reservadas;
    $("totalVendidas").textContent = resumo.vendidas;
    $("totalModelos").textContent = MODELOS.length;
}

function modelosFiltrados() {
    const busca = normalizar($("buscaModelo").value);
    const filtro = $("filtroDisponibilidade").value;

    return MODELOS.filter(modelo => {
        if (!normalizar(modelo).includes(busca)) return false;

        const item = saldo(modelo);

        if (filtro === "disponiveis") {
            return item.disponiveis > 0;
        }

        if (filtro === "reservadas") {
            return item.reservadas > 0;
        }

        if (filtro === "vendidas") {
            return item.vendidas > 0;
        }

        if (filtro === "sem-estoque") {
            return item.total === 0;
        }

        return true;
    });
}

function renderizarCatalogo() {
    const modelos = modelosFiltrados();

    const paginas = Math.max(
        1,
        Math.ceil(modelos.length / POR_PAGINA)
    );

    paginaAtual = Math.min(paginaAtual, paginas);

    const inicio = (paginaAtual - 1) * POR_PAGINA;
    const pagina = modelos.slice(inicio, inicio + POR_PAGINA);

    $("listaModelos").replaceChildren();

    pagina.forEach(modelo => {
        const fragmento = $("templateCardModelo")
            .content.cloneNode(true);

        const item = saldo(modelo);

        const card = fragmento.querySelector(".card-modelo");
        const foto = fragmento.querySelector(".modelo-foto");
        const semFoto = fragmento.querySelector(".modelo-sem-foto");
        const botao = fragmento.querySelector(".btn-reservar");

        card.classList.toggle(
            "selecionado",
            modelo === modeloSelecionado
        );

        fragmento.querySelector(
            ".modelo-nome"
        ).textContent = modelo;

        fragmento.querySelector(
            ".modelo-total"
        ).textContent = item.total;

        fragmento.querySelector(
            ".modelo-disponiveis"
        ).textContent = item.disponiveis;

        fragmento.querySelector(
            ".modelo-reservadas"
        ).textContent = item.reservadas;

        fragmento.querySelector(
            ".modelo-vendidas"
        ).textContent = item.vendidas;

        if (FOTOS_MODELOS[modelo]) {
            foto.alt = `Máquina ${modelo}`;

            foto.loading = "eager";

            foto.addEventListener("load", () => {
                foto.hidden = false;
                semFoto.hidden = true;
            });

            foto.addEventListener("error", () => {
                foto.hidden = true;
                semFoto.hidden = false;
            });

            foto.src = FOTOS_MODELOS[modelo];
        }

        botao.disabled = false;
        botao.textContent = "Selecionar máquina";

        botao.addEventListener("click", () => {
            selecionarModelo(modelo);
        });

        $("listaModelos").append(fragmento);
    });

    $("catalogoVazio").hidden = modelos.length > 0;

    $("statusCatalogo").textContent =
        `${nomeSetor(setorAtual)} — modelos na sequência definida.`;

    $("resumoPaginacao").textContent = modelos.length
        ? `${inicio + 1}–${inicio + pagina.length} de ${modelos.length} modelos`
        : "0 modelos";

    $("botoesPaginacao").replaceChildren();

    for (let numero = 1; numero <= paginas; numero++) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.textContent = numero;

        if (numero === paginaAtual) {
            botao.setAttribute("aria-current", "page");
        }

        botao.addEventListener("click", () => {
            paginaAtual = numero;
            renderizarCatalogo();
        });

        $("botoesPaginacao").append(botao);
    }
}

// =====================================================
// FORMULÁRIO DA MÁQUINA
// =====================================================

function ajustarCamposStatus() {
    $("reservaVencimento").required =
        $("reservaStatus").value === "ativa";
}

function selecionarModelo(modelo) {
    registroEmEdicao = null;
    modeloSelecionado = modelo;

    $("formReserva").reset();

    $("reservaModeloId").value = modelo;
    $("reservaModelo").value = modelo;
    $("reservaData").value = hoje();

    const limite = new Date();
    limite.setDate(limite.getDate() + 10);

    $("reservaVencimento").value = dataLocal(limite);

    $("tituloReserva").textContent = `Registrar ${modelo}`;
    $("mensagemReserva").textContent = "";

    ajustarCamposStatus();
    atualizarPainelReserva();
    renderizarCatalogo();
}

function atualizarPainelReserva() {
    $("camposReserva").disabled = !modeloSelecionado;

    $("orientacaoReserva").textContent = modeloSelecionado
        ? (
            `${modeloSelecionado}: ` +
            `${saldo(modeloSelecionado).disponiveis} disponível(is). ` +
            "Para vender uma reserva, abra o registro em Relatórios."
        )
        : "Selecione um modelo no catálogo.";
}

function calcularVencimento() {
    const valor = $("reservaVencimento").value;

    if (!valor) return null;

    const data = new Date(`${valor}T23:59:59.999`);

    return Number.isNaN(data.getTime()) ? null : data;
}

function registrarReserva(evento) {
    evento.preventDefault();

    if (!$("formReserva").reportValidity()) return;

    executar(() => {
        expirarReservas();

        const anterior = registroEmEdicao
            ? dados.reservas.find(
                item => item.id === registroEmEdicao
            )
            : null;

        if (registroEmEdicao && !anterior) {
            throw new Error("Registro não encontrado.");
        }

        if (
            anterior &&
            ["vendida", "concluida"].includes(anterior.status)
        ) {
            throw new Error(
                "Este registro já possui saída e não pode ser vendido novamente."
            );
        }

        const modelo = modeloSelecionado;
        const status = $("reservaStatus").value;

        const cliente = $("reservaCliente").value.trim();
        const vendedor = $("reservaVendedor").value.trim();
        const codigo = $("reservaCodigo").value.trim();
        const serie = $("reservaSerie").value.trim();

        const dataReserva = $("reservaData").value;
        const vencimento = calcularVencimento();

        if (
            !MODELOS.includes(modelo) ||
            !cliente ||
            !vendedor ||
            !codigo ||
            !serie ||
            !dataReserva
        ) {
            throw new Error("Preencha os campos obrigatórios.");
        }

        if (
            !["ativa", "disponivel", "vendida"].includes(status)
        ) {
            throw new Error("Status inválido.");
        }

        if (
            status === "ativa" &&
            (
                !vencimento ||
                vencimento.getTime() <= Date.now() ||
                $("reservaVencimento").value < dataReserva
            )
        ) {
            throw new Error(
                "Informe uma data limite futura e igual ou posterior à data da reserva."
            );
        }

        const disponibilidade =
            saldo(modelo).disponiveis +
            (
                anterior && reservaAtiva(anterior)
                    ? 1
                    : 0
            );

        if (disponibilidade < 1) {
            throw new Error(
                "Sem saldo disponível neste estoque. Abra o registro existente para vender ou liberar a máquina."
            );
        }

        const repetida = dados.reservas.some(item =>
            item.id !== anterior?.id &&
            item.modelo === modelo &&
            normalizar(item.serie) === normalizar(serie) &&
            (
                reservaAtiva(item) ||
                item.status === "vendida" ||
                item.status === "disponivel"
            )
        );

        const jaSaiu = dados.saidas.some(item =>
            item.modelo === modelo &&
            item.serie &&
            normalizar(item.serie) === normalizar(serie)
        );

        if (repetida || jaSaiu) {
            throw new Error(
                "Esta série já está cadastrada ou já teve saída. Edite o registro existente."
            );
        }

        const agora = new Date().toISOString();

        const campos = {
            setor: setorAtual,
            modelo,
            quantidade: 1,
            cliente,
            vendedor,
            matricula: $("reservaMatricula").value.trim(),
            codigo,
            serie,
            dataReserva,
            vencimento: vencimento
                ? vencimento.toISOString()
                : "",
            nf: $("reservaNF").value.trim(),
            dataEmissao: $("reservaEmissao").value,
            status,
            observacoes: $("reservaObservacoes").value.trim()
        };

        const registro = {
            ...anterior,
            ...campos,
            id: anterior?.id || novoId(),
            criadaEm: anterior?.criadaEm || agora,
            atualizadaEm: agora,
            historico: [
                ...(anterior?.historico || []),
                {
                    ...campos,
                    em: agora
                }
            ]
        };

        const saidas = [...dados.saidas];

        if (status === "vendida") {
            saidas.push({
                id: novoId(),
                tipo: "venda",
                setor: setorAtual,
                modelo,
                quantidade: 1,
                data: hoje(),
                cliente,
                vendedor,
                codigo,
                serie,
                nf: registro.nf,
                dataEmissao: registro.dataEmissao,
                matricula: registro.matricula,
                reservaId: registro.id,
                responsavel: registro.responsavel || vendedor,
                observacoes: registro.observacoes,
                registradaEm: agora
            });
        }

        const reservas = anterior
            ? dados.reservas.map(item =>
                item.id === anterior.id ? registro : item
            )
            : [...dados.reservas, registro];

        gravarDados({
            ...dados,
            saidas,
            reservas
        });

        selecionarModelo(modelo);
        renderizarTudo();

        mensagem(
            status === "vendida"
                ? "Venda registrada e estoque baixado."
                : "Registro salvo. Consulte em Relatórios ou Exportações.",
            "sucesso"
        );
    });
}

function editarRegistro(id) {
    executar(() => {
        expirarReservas();

        const registro = dados.reservas.find(
            item => item.id === id
        );

        if (!registro) {
            throw new Error("Registro não encontrado.");
        }

        if (
            ["vendida", "concluida"].includes(registro.status)
        ) {
            throw new Error("Este registro já possui saída.");
        }

        trocarTela(setorDe(registro));
        selecionarModelo(registro.modelo);

        registroEmEdicao = registro.id;

        const campos = {
            reservaMatricula: registro.matricula || "",
            reservaVendedor: registro.vendedor,
            reservaCliente: registro.cliente,
            reservaCodigo: registro.codigo || "",
            reservaSerie: registro.serie,
            reservaData:
                registro.dataReserva ||
                dataLocal(registro.criadaEm),
            reservaVencimento:
                dataLocal(registro.vencimento),
            reservaNF: registro.nf,
            reservaEmissao: registro.dataEmissao,
            reservaObservacoes: registro.observacoes,
            reservaStatus:
                reservaAtiva(registro)
                    ? "ativa"
                    : "disponivel"
        };

        Object.entries(campos).forEach(([idCampo, valor]) => {
            $(idCampo).value = valor || "";
        });

        $("tituloReserva").textContent =
            `Editar ${registro.modelo}`;

        ajustarCamposStatus();

        $("reservaVendedor").focus();
    });
}

// =====================================================
// ENTRADAS
// =====================================================

function registrarEntrada(evento) {
    evento.preventDefault();

    if (!$("formEntrada").reportValidity()) return;

    executar(() => {
        const modelo = $("entradaModelo").value;
        const quantidade = Number($("entradaQuantidade").value);
        const responsavel = $("entradaResponsavel").value.trim();
        const data = $("entradaData").value;

        if (!MODELOS.includes(modelo)) {
            throw new Error("Selecione um modelo válido.");
        }

        if (
            !Number.isSafeInteger(quantidade) ||
            quantidade < 1
        ) {
            throw new Error(
                "Informe uma quantidade inteira positiva."
            );
        }

        if (!responsavel || !data) {
            throw new Error("Informe a data e o responsável.");
        }

        const entrada = {
            id: novoId(),
            setor: setorAtual,
            modelo,
            quantidade,
            data,
            matricula: $("entradaMatricula").value.trim(),
            codigo: $("entradaCodigo").value.trim(),
            serie: $("entradaSerie").value.trim(),
            origem: $("entradaOrigem").value.trim(),
            nf: $("entradaNF").value.trim(),
            responsavel,
            observacoes: $("entradaObservacoes").value.trim(),
            registradaEm: new Date().toISOString()
        };

        gravarDados({
            ...dados,
            entradas: [...dados.entradas, entrada]
        });

        $("formEntrada").reset();
        $("entradaSetor").value = setorAtual;
        $("entradaData").value = hoje();

        renderizarTudo();

        mensagem("Entrada registrada neste navegador.", "sucesso");
    });
}

// =====================================================
// SAÍDAS
// =====================================================

function renderizarSeletorReservas() {
    const seletor = $("saidaReserva");
    const selecionada = seletor.value;

    seletor.replaceChildren(
        new Option("Saída sem reserva", "")
    );

    dados.reservas
        .filter(item =>
            setorDe(item) === setorAtual &&
            reservaAtiva(item)
        )
        .forEach(item => {
            seletor.add(
                new Option(
                    `${item.modelo} — ${item.cliente} — Série ${item.serie}`,
                    item.id
                )
            );
        });

    seletor.value = selecionada;

    preencherSaidaVinculada();
}

function preencherSaidaVinculada() {
    const reserva = dados.reservas.find(item =>
        item.id === $("saidaReserva").value &&
        setorDe(item) === setorAtual &&
        reservaAtiva(item)
    );

    $("saidaModelo").disabled = Boolean(reserva);
    $("saidaQuantidade").readOnly = Boolean(reserva);

    if (reserva) {
        $("saidaModelo").value = reserva.modelo;
        $("saidaQuantidade").value = 1;
        $("saidaCliente").value = reserva.cliente;
    }
}

function registrarSaida(evento) {
    evento.preventDefault();

    if (!$("formSaida").reportValidity()) return;

    executar(() => {
        expirarReservas();

        const reservaId = $("saidaReserva").value;

        const reserva = dados.reservas.find(
            item => item.id === reservaId
        );

        if (
            reservaId &&
            (
                !reserva ||
                setorDe(reserva) !== setorAtual ||
                !reservaAtiva(reserva)
            )
        ) {
            renderizarTudo();

            throw new Error(
                "A reserva não está ativa neste estoque."
            );
        }

        const modelo = reserva
            ? reserva.modelo
            : $("saidaModelo").value;

        const quantidade = reserva
            ? 1
            : Number($("saidaQuantidade").value);

        const cliente = $("saidaCliente").value.trim();
        const responsavel = $("saidaResponsavel").value.trim();
        const data = $("saidaData").value;

        if (!MODELOS.includes(modelo)) {
            throw new Error("Selecione um modelo válido.");
        }

        if (
            !Number.isSafeInteger(quantidade) ||
            quantidade < 1
        ) {
            throw new Error(
                "Informe uma quantidade inteira positiva."
            );
        }

        const limite =
            saldo(modelo).disponiveis +
            (reserva ? 1 : 0);

        if (quantidade > limite) {
            throw new Error(
                "Saldo insuficiente neste estoque."
            );
        }

        if (!cliente || !responsavel || !data) {
            throw new Error(
                "Informe a data, o cliente e o responsável."
            );
        }

        const agora = new Date().toISOString();

        const saida = {
            id: novoId(),
            setor: setorAtual,
            tipo: "venda",
            modelo,
            quantidade,
            data,
            cliente,
            responsavel,
            matricula: reserva?.matricula || "",
            vendedor: reserva?.vendedor || "",
            codigo: reserva?.codigo || "",
            serie: reserva?.serie || "",
            nf: $("saidaNF").value.trim(),
            dataEmissao: data,
            observacoes: $("saidaObservacoes").value.trim(),
            reservaId: reservaId || null,
            registradaEm: agora
        };

        gravarDados({
            ...dados,
            saidas: [...dados.saidas, saida],
            reservas: dados.reservas.map(item =>
                item.id === reservaId
                    ? {
                        ...item,
                        status: "vendida",
                        nf: saida.nf,
                        dataEmissao: saida.dataEmissao,
                        encerradaEm: agora
                    }
                    : item
            )
        });

        $("formSaida").reset();
        $("saidaSetor").value = setorAtual;
        $("saidaData").value = hoje();
        $("saidaModelo").disabled = false;
        $("saidaQuantidade").readOnly = false;

        renderizarTudo();

        mensagem(
            "Saída registrada e estoque baixado.",
            "sucesso"
        );
    });
}

// =====================================================
// TABELAS
// =====================================================

function adicionarLinha(corpo, valores) {
    const linha = document.createElement("tr");

    valores.forEach(valor => {
        const celula = document.createElement("td");

        celula.textContent =
            valor === "" || valor == null ? "—" : valor;

        linha.append(celula);
    });

    corpo.append(linha);

    return linha;
}

function linhaVazia(corpo, colunas, texto) {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");

    celula.colSpan = colunas;
    celula.textContent = texto;

    linha.append(celula);
    corpo.append(linha);
}

function renderizarHistoricos() {
    const entradas = $("listaEntradas");
    const saidas = $("listaSaidas");

    entradas.replaceChildren();
    saidas.replaceChildren();

    const entradasDoSetor = dados.entradas.filter(
        item => setorDe(item) === setorAtual
    );

    const saidasDoSetor = dados.saidas.filter(
        item => setorDe(item) === setorAtual
    );

    [...entradasDoSetor].reverse().forEach(item => {
        adicionarLinha(entradas, [
            formatarData(item.data),
            item.modelo,
            item.quantidade,
            item.origem,
            item.nf,
            item.responsavel
        ]);
    });

    [...saidasDoSetor].reverse().forEach(item => {
        adicionarLinha(saidas, [
            formatarData(item.data),
            item.modelo,
            item.quantidade,
            item.cliente,
            item.nf,
            item.responsavel
        ]);
    });

    if (!entradasDoSetor.length) {
        linhaVazia(
            entradas,
            6,
            "Nenhuma entrada registrada neste estoque."
        );
    }

    if (!saidasDoSetor.length) {
        linhaVazia(
            saidas,
            6,
            "Nenhuma saída registrada neste estoque."
        );
    }
}

function colunasRegistro(item) {
    return [
        nomeSetor(setorDe(item)),
        item.vendedor || "",
        item.cliente || "",
        item.modelo || "",
        item.codigo || "",
        item.serie || "",
        formatarData(item.dataReserva || item.criadaEm),
        formatarData(item.vencimento),
        item.nf || "",
        formatarData(item.dataEmissao),
        nomeSituacao(situacao(item))
    ];
}

function renderizarReservas() {
    const corpo = $("listaReservas");
    const busca = normalizar($("buscaReserva").value);
    const filtro = $("filtroReserva").value;
    const setor = $("filtroSetorReserva").value;

    corpo.replaceChildren();

    const registros = [...dados.reservas]
        .reverse()
        .filter(item => {
            const texto = normalizar([
                item.modelo,
                item.cliente,
                item.vendedor,
                item.codigo,
                item.serie,
                item.nf
            ].join(" "));

            return (
                (!setor || setorDe(item) === setor) &&
                texto.includes(busca) &&
                (
                    filtro === "todas" ||
                    situacao(item) === filtro
                )
            );
        });

    registros.forEach(item => {
        const linha = adicionarLinha(
            corpo,
            [...colunasRegistro(item), ""]
        );

        if (
            !["vendida", "concluida"].includes(item.status)
        ) {
            const botao = document.createElement("button");

            botao.type = "button";
            botao.className = "btn btn-secundario";
            botao.textContent = "Editar / vender";

            botao.addEventListener("click", () => {
                editarRegistro(item.id);
            });

            linha.lastElementChild.append(botao);
        }
    });

    $("reservasVazias").hidden = registros.length > 0;
}

function renderizarTudo() {
    renderizarIndicadores();
    renderizarCatalogo();
    atualizarPainelReserva();
    renderizarHistoricos();
    renderizarReservas();
    renderizarSeletorReservas();
}

// =====================================================
// EXPORTAÇÕES E RELATÓRIOS
// =====================================================

function consultarRelatorio(evento) {
    evento.preventDefault();

    executar(() => {
        expirarReservas();

        const tipo = $("relatorioTipo").value;
        const setor = $("relatorioSetor").value;
        const modelo = $("relatorioModelo").value;
        const inicio = $("relatorioInicio").value;
        const fim = $("relatorioFim").value;

        if (
            tipo !== "estoque" &&
            inicio &&
            fim &&
            inicio > fim
        ) {
            throw new Error(
                "A data inicial deve ser anterior ou igual à final."
            );
        }

        function dentroDoPeriodo(item, data) {
            return (
                (!setor || setorDe(item) === setor) &&
                (!modelo || item.modelo === modelo) &&
                (!inicio || data >= inicio) &&
                (!fim || data <= fim)
            );
        }

        let cabecalhos = [];
        let linhas = [];

        if (tipo === "estoque") {
            cabecalhos = [
                "Estoque",
                "Modelo",
                "Total",
                "Disponível",
                "Reservado",
                "Vendido"
            ];

            const setores = setor
                ? [setor]
                : ["estoque", "showroom"];

            linhas = setores.flatMap(setorConsultado =>
                MODELOS
                    .filter(nome => !modelo || nome === modelo)
                    .map(nome => {
                        const item = saldo(nome, setorConsultado);

                        return [
                            nomeSetor(setorConsultado),
                            nome,
                            item.total,
                            item.disponiveis,
                            item.reservadas,
                            item.vendidas
                        ];
                    })
            );

        } else if (tipo === "entradas") {
            cabecalhos = [
                "Estoque",
                "Data",
                "Modelo",
                "Quantidade",
                "Origem",
                "NF",
                "Responsável",
                "Observações"
            ];

            linhas = dados.entradas
                .filter(item =>
                    dentroDoPeriodo(item, item.data)
                )
                .map(item => [
                    nomeSetor(setorDe(item)),
                    formatarData(item.data),
                    item.modelo,
                    item.quantidade,
                    item.origem,
                    item.nf,
                    item.responsavel,
                    item.observacoes
                ]);

        } else if (tipo === "saidas") {
            cabecalhos = [
                "Estoque",
                "Data",
                "Modelo",
                "Quantidade",
                "Cliente",
                "NF",
                "Responsável",
                "S/N",
                "Observações",
                "Vendedor",
                "Código",
                "Data emissão"
            ];

            linhas = dados.saidas
                .filter(item =>
                    dentroDoPeriodo(item, item.data)
                )
                .map(item => [
                    nomeSetor(setorDe(item)),
                    formatarData(item.data),
                    item.modelo,
                    item.quantidade,
                    item.cliente,
                    item.nf,
                    item.responsavel,
                    item.serie,
                    item.observacoes,
                    item.vendedor,
                    item.codigo,
                    formatarData(item.dataEmissao)
                ]);

        } else {
            cabecalhos = [
                "Estoque",
                "Vendedor",
                "Cliente",
                "Máquina",
                "Código",
                "S/N",
                "Data da reserva",
                "Data limite reserva",
                "N° nota fiscal",
                "Data emissão",
                "Status",
                "Quantidade",
                "Responsável anterior",
                "Matrícula anterior",
                "Observações"
            ];

            let registros = [...dados.reservas];

            if (tipo === "registros") {
                const saidasSemReserva = dados.saidas
                    .filter(item => !item.reservaId)
                    .map(item => ({
                        ...item,
                        status: item.tipo === "venda"
                            ? "vendida"
                            : "concluida",
                        criadaEm:
                            item.registradaEm ||
                            item.data
                    }));

                registros = [
                    ...registros,
                    ...saidasSemReserva
                ];
            }

            linhas = registros
                .filter(item => {
                    const data =
                        item.dataReserva ||
                        dataLocal(item.criadaEm || item.data);

                    return dentroDoPeriodo(item, data);
                })
                .map(item => [
                    ...colunasRegistro(item),
                    item.quantidade || 1,
                    item.responsavel || "",
                    item.matricula || "",
                    item.observacoes || ""
                ]);
        }

        const tabela = document.createElement("table");
        const legenda = document.createElement("caption");
        const cabeca = document.createElement("thead");
        const linhaCabeca = document.createElement("tr");
        const corpo = document.createElement("tbody");

        legenda.textContent = `${linhas.length} registro(s)`;

        cabecalhos.forEach(texto => {
            const celula = document.createElement("th");

            celula.scope = "col";
            celula.textContent = texto;

            linhaCabeca.append(celula);
        });

        cabeca.append(linhaCabeca);

        linhas.forEach(linha => {
            adicionarLinha(corpo, linha);
        });

        if (!linhas.length) {
            linhaVazia(
                corpo,
                cabecalhos.length,
                "Nenhum registro encontrado."
            );
        }

        tabela.append(legenda, cabeca, corpo);

        $("resultadoRelatorio").replaceChildren(tabela);

        relatorioAtual = {
            tipo,
            cabecalhos,
            linhas
        };

        $("btnExportarRelatorio").disabled = false;
    });
}

function exportarRelatorio() {
    if (!relatorioAtual) return;

    function celulaCSV(valor) {
        let texto = String(valor ?? "");

        if (/^\s*[=+\-@]/.test(texto)) {
            texto = "'" + texto;
        }

        return '"' + texto.replace(/"/g, '""') + '"';
    }

    const conteudo = [
        relatorioAtual.cabecalhos,
        ...relatorioAtual.linhas
    ]
        .map(linha =>
            linha.map(celulaCSV).join(";")
        )
        .join("\r\n");

    const arquivo = new Blob(
        ["\uFEFF", conteudo],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;

    link.download =
        `smi_maquinas_${relatorioAtual.tipo}_${hoje()}.csv`;

    document.body.append(link);

    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

// =====================================================
// VERIFICAÇÃO DOS PRAZOS
// =====================================================

function verificarVencimentos() {
    executar(() => {
        const quantidade = expirarReservas();

        renderizarTudo();

        if (quantidade > 0) {
            mensagem(
                `${quantidade} reserva(s) vencida(s). ` +
                "As máquinas voltaram a ficar disponíveis.",
                "aviso"
            );
        }
    });
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    prepararShowRoom();

    try {
        dados = carregarDados();
        expirarReservas();
    } catch (erro) {
        mensagem(
            "Não foi possível carregar os dados locais. " +
            "Os dados existentes não foram apagados. " +
            erro.message,
            "erro"
        );

        return;
    }

    preencherModelos();

    $("entradaData").value = hoje();
    $("saidaData").value = hoje();

    document.querySelectorAll("[data-tela]").forEach(botao => {
        botao.addEventListener("click", () => {
            verificarVencimentos();
            trocarTela(botao.dataset.tela);
        });
    });

    $("buscaModelo").addEventListener("input", () => {
        paginaAtual = 1;
        renderizarCatalogo();
    });

    $("filtroDisponibilidade").addEventListener("change", () => {
        paginaAtual = 1;
        renderizarCatalogo();
    });

    $("btnNovoRegistro").addEventListener("click", () => {
        selecionarModelo(modeloSelecionado);
    });

    $("reservaStatus").addEventListener(
        "change",
        ajustarCamposStatus
    );

    $("formReserva").addEventListener(
        "submit",
        registrarReserva
    );

    $("formEntrada").addEventListener(
        "submit",
        registrarEntrada
    );

    $("formSaida").addEventListener(
        "submit",
        registrarSaida
    );

    $("saidaReserva").addEventListener(
        "change",
        preencherSaidaVinculada
    );

    $("buscaReserva").addEventListener(
        "input",
        renderizarReservas
    );

    $("filtroReserva").addEventListener(
        "change",
        renderizarReservas
    );

    $("formRelatorio").addEventListener(
        "submit",
        consultarRelatorio
    );

    $("btnExportarRelatorio").addEventListener(
        "click",
        exportarRelatorio
    );

    $("btnAtualizar").addEventListener(
        "click",
        verificarVencimentos
    );

    function atualizarFiltrosRelatorio() {
        const estoque =
            $("relatorioTipo").value === "estoque";

        $("relatorioInicio").disabled = estoque;
        $("relatorioFim").disabled = estoque;

        invalidarRelatorio();
    }

    $("relatorioTipo").addEventListener(
        "change",
        atualizarFiltrosRelatorio
    );

    [
        "relatorioModelo",
        "relatorioInicio",
        "relatorioFim"
    ].forEach(id => {
        $(id).addEventListener(
            "change",
            invalidarRelatorio
        );
    });

    atualizarFiltrosRelatorio();
    ajustarCamposStatus();
    trocarTela("estoque");

    mensagem(
        "Modo de teste local: os dados ficam somente neste navegador.",
        "aviso"
    );

    setInterval(verificarVencimentos, 30000);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            verificarVencimentos();
        }
    });

    window.addEventListener("storage", evento => {
        if (
            evento.key === CHAVE_DADOS ||
            evento.key === null
        ) {
            verificarVencimentos();
        }
    });
});

// Oculta temporariamente Saídas e Exportações do menu.
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(
        '[data-tela="saidas"], [data-tela="relatorios"]'
    ).forEach(function (botao) {
        botao.hidden = true;
    });
});

// =====================================================
// NOVO VISUAL — CATÁLOGO AMPLO E FORMULÁRIO EM JANELA
// Cole este bloco somente uma vez, no final do app.js.
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("dialogoMaquina")) return;

    const painel = document.querySelector(".painel-reserva");
    const catalogo = document.getElementById("listaModelos");
    const filtros = document.querySelector(
        "#telaEstoque .catalogo-filtros"
    );

    if (!painel || !catalogo || !filtros) return;

    // Aviso compacto e permanente do armazenamento local.
    const selo = document.createElement("span");
    selo.className = "selo-local";
    selo.textContent = "Teste local • Dados neste navegador";

    document.querySelector(
        ".cabecalho > div"
    ).append(selo);

    // Remove somente o aviso inicial repetido.
    // Erros e avisos operacionais continuam aparecendo.
    const aviso = document.getElementById("mensagemSistema");

    if (
        aviso.textContent.trim() ===
        "Modo de teste local: os dados ficam somente neste navegador."
    ) {
        aviso.hidden = true;
    }

    // Atalho para entrada de máquinas.
    const novaEntrada = document.createElement("button");
    novaEntrada.type = "button";
    novaEntrada.className = "btn btn-primario";
    novaEntrada.textContent = "+ Nova entrada";

    novaEntrada.addEventListener("click", function () {
        trocarTela("entradas");

        // Mantém o estoque de origem selecionado:
        // Estoque principal ou SHOW ROOM.
        document.getElementById("entradaSetor").value =
            setorAtual;

        document.getElementById("entradaModelo").focus();
    });

    document.querySelector(
        ".cabecalho-acoes"
    ).append(novaEntrada);

    // Ícones do menu, sem alterar os identificadores usados
    // pela navegação existente.
    const icones = {
        estoque: "▱",
        showroom: "▣",
        entradas: "↳",
        reservas: "▥"
    };

    document.querySelectorAll(".menu-item").forEach(function (botao) {
        const icone = icones[botao.dataset.tela];

        if (!icone) return;

        const simbolo = document.createElement("span");
        simbolo.className = "icone-menu";
        simbolo.setAttribute("aria-hidden", "true");
        simbolo.textContent = icone;

        botao.prepend(simbolo);
    });

    // Texto do catálogo.
    const descricao = document.querySelector(
        "#telaEstoque .secao-cabecalho p"
    );

    if (descricao) {
        descricao.textContent =
            "Selecione uma máquina para reservar ou vender.";
    }

    document.getElementById("buscaModelo").placeholder =
        "Buscar modelo...";

    // Alternar entre cartões e lista.
    const controles = document.createElement("div");
    controles.className = "visualizacao";
    controles.setAttribute("role", "group");
    controles.setAttribute("aria-label", "Visualização do catálogo");

    const botaoGrade = document.createElement("button");
    botaoGrade.type = "button";
    botaoGrade.className = "btn";
    botaoGrade.textContent = "▦";
    botaoGrade.title = "Visualizar em cartões";
    botaoGrade.setAttribute("aria-label", "Visualizar em cartões");

    const botaoLista = document.createElement("button");
    botaoLista.type = "button";
    botaoLista.className = "btn";
    botaoLista.textContent = "☷";
    botaoLista.title = "Visualizar em lista";
    botaoLista.setAttribute("aria-label", "Visualizar em lista");

    function mudarVisualizacao(lista) {
        catalogo.classList.toggle("em-lista", lista);

        botaoGrade.setAttribute(
            "aria-pressed",
            String(!lista)
        );

        botaoLista.setAttribute(
            "aria-pressed",
            String(lista)
        );
    }

    botaoGrade.addEventListener("click", function () {
        mudarVisualizacao(false);
    });

    botaoLista.addEventListener("click", function () {
        mudarVisualizacao(true);
    });

    controles.append(botaoGrade, botaoLista);
    filtros.append(controles);

    mudarVisualizacao(false);

    // Formulário existente dentro de uma janela nativa.
    // Os campos e seus eventos são preservados.
    const dialogo = document.createElement("dialog");
    dialogo.id = "dialogoMaquina";
    dialogo.className = "dialogo-maquina";
    dialogo.setAttribute("aria-labelledby", "tituloReserva");

    document.body.append(dialogo);
    dialogo.append(painel);

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "btn fechar-dialogo";
    fechar.textContent = "×";
    fechar.setAttribute("aria-label", "Fechar formulário");

    painel.querySelector(".painel-cabecalho").append(fechar);

    let focoAnterior = null;

    function abrirFormulario() {
        if (dialogo.open) return;

        focoAnterior = document.activeElement;

        dialogo.showModal();
        document.body.classList.add("modal-aberto");
        dialogo.scrollTop = 0;

        document.getElementById("reservaVendedor").focus();
    }

    function fecharFormulario() {
        if (dialogo.open) {
            dialogo.close();
        }
    }

    fechar.addEventListener("click", fecharFormulario);

    // A tecla Escape também fecha a janela.
    dialogo.addEventListener("close", function () {
        document.body.classList.remove("modal-aberto");

        if (
            focoAnterior instanceof HTMLElement &&
            focoAnterior.isConnected
        ) {
            focoAnterior.focus();
        } else if (
            !document.getElementById("telaEstoque").hidden
        ) {
            document.getElementById("buscaModelo").focus();
        }
    });

    // Aproveita a seleção original, incluindo a edição
    // de reservas aberta pelo relatório.
    const selecionarOriginal = selecionarModelo;

    selecionarModelo = function (modelo) {
        selecionarOriginal(modelo);

        if (modelo) {
            abrirFormulario();
        }
    };

    // Fecha o formulário ao navegar para outra tela.
    const trocarTelaOriginal = trocarTela;

    trocarTela = function (nome) {
        fecharFormulario();
        trocarTelaOriginal(nome);
    };

    // Acrescenta a indicação de disponibilidade aos cards.
    function decorarCards() {
        catalogo.querySelectorAll(".card-modelo").forEach(
            function (card) {
                if (card.querySelector(".modelo-cabecalho")) {
                    return;
                }

                const nome = card.querySelector(".modelo-nome");
                const conteudo = card.querySelector(
                    ".modelo-conteudo"
                );

                const disponiveis = Number(
                    card.querySelector(
                        ".modelo-disponiveis"
                    ).textContent
                );

                const cabecalho = document.createElement("div");
                cabecalho.className = "modelo-cabecalho";

                const seloSaldo = document.createElement("span");
                seloSaldo.className = "selo-saldo";

                if (disponiveis > 0) {
                    seloSaldo.textContent = "✓ Disponível";
                } else {
                   seloSaldo.textContent = "✕ Indisponível";
                    seloSaldo.classList.add("zerado");
                }

                conteudo.prepend(cabecalho);
                cabecalho.append(nome, seloSaldo);
            }
        );
    }

    const renderizarOriginal = renderizarCatalogo;

    renderizarCatalogo = function () {
        renderizarOriginal();
        decorarCards();
    };

    // Aplica o acabamento aos cards já carregados.
    decorarCards();
});

// =====================================================
// FORMULÁRIO COMERCIAL — PREENCHIMENTO E IMPRESSÃO
// Cole somente uma vez no final do app.js.
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("telaFormularioComercial")) return;

    const estilo = document.createElement("style");

    estilo.textContent = `
        .acoes-formulario-comercial {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 20px;
        }

        .folha-comercial {
            width: 100%;
            max-width: 850px;
            margin: 0 auto;
            padding: 24px;
            color: #111;
            background: #fff;
            border-radius: 10px;
        }

        .cabecalho-comercial {
            padding: 18px;
            background: #dbe6f2;
            border: 1px solid #222;
        }

        .marca-comercial {
            margin-bottom: 16px;
            color: #0878b9;
            font-size: 24px;
            font-weight: 800;
        }

        .folha-comercial input {
            min-width: 0;
            width: 100%;
            min-height: 32px;
            padding: 5px 8px;
            color: #111;
            background: transparent;
            border: 0;
            border-radius: 0;
            box-shadow: none;
        }

        .folha-comercial input::placeholder {
            color: #687584;
        }

        .folha-comercial input:focus {
            outline: 2px solid #087dff;
            outline-offset: -2px;
        }

        #clienteFormularioComercial {
            min-height: 58px;
            text-align: center;
            font-size: clamp(22px, 3vw, 38px);
            font-weight: 800;
        }

        .tabela-comercial {
            width: 100%;
            margin: 0;
            table-layout: fixed;
            border-collapse: collapse;
            white-space: normal;
        }

        .tabela-comercial caption {
            padding: 24px 0 8px;
            color: #111;
            font-size: 23px;
            font-weight: 700;
            text-align: center;
        }

        .tabela-comercial th,
        .tabela-comercial td {
            padding: 0;
            color: #111;
            background: #fff;
            border: 1px solid #222;
            text-align: center;
        }

        .tabela-comercial th {
            padding: 7px 5px;
            font-size: 14px;
        }

        .tabela-comercial td:first-child {
            background: #dbe6f2;
        }

        .tabela-comercial tbody tr:hover {
            background: transparent;
        }

        .tabela-comercial input {
            text-align: center;
            font-size: 14px;
        }

        .controle-linhas {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
        }

        .observacao-comercial {
            margin: 20px 0 0;
            color: #334155;
            font-size: 12px;
        }

        @page {
            size: A4 portrait;
            margin: 12mm;
        }

        @media print {
            body.imprimindo-comercial {
                background: #fff !important;
            }

            body.imprimindo-comercial > :not(main) {
                display: none !important;
            }

            body.imprimindo-comercial main {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
            }

            body.imprimindo-comercial main > :not(
                #telaFormularioComercial
            ) {
                display: none !important;
            }

            body.imprimindo-comercial #telaFormularioComercial {
                display: block !important;
            }

            body.imprimindo-comercial .nao-imprimir {
                display: none !important;
            }

            body.imprimindo-comercial .folha-comercial {
                max-width: none;
                padding: 0;
                border-radius: 0;
            }

            body.imprimindo-comercial .folha-comercial,
            body.imprimindo-comercial .folha-comercial * {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }

            body.imprimindo-comercial .tabela-comercial tr {
                break-inside: avoid;
            }

            body.imprimindo-comercial .tabela-comercial thead {
                display: table-header-group;
            }

            body.imprimindo-comercial input::placeholder {
                color: transparent !important;
            }

            body.imprimindo-comercial input {
                outline: none !important;
            }
        }
    `;

    document.head.append(estilo);

    const tela = document.createElement("section");

    tela.id = "telaFormularioComercial";
    tela.className = "tela";
    tela.hidden = true;

    tela.innerHTML = `
        <div class="secao-cabecalho nao-imprimir">
            <h2>Formulário comercial</h2>
            <p>
                Preencha o cliente ou projeto, as máquinas
                e os acessórios. Depois clique em imprimir.
            </p>
        </div>

        <div class="acoes-formulario-comercial nao-imprimir">
            <button
                type="button"
                class="btn btn-primario"
                id="imprimirFormularioComercial"
            >
                Imprimir formulário
            </button>

            <button
                type="button"
                class="btn btn-secundario"
                id="limparFormularioComercial"
            >
                Limpar formulário
            </button>
        </div>

        <div class="folha-comercial">
            <div class="cabecalho-comercial">
                <div class="marca-comercial">SMI DO BRASIL</div>

                <input
                    type="text"
                    id="clienteFormularioComercial"
                    placeholder="CLIENTE / PROJETO"
                    aria-label="Cliente ou projeto"
                    maxlength="80"
                    autocomplete="off"
                >
            </div>

            <table class="tabela-comercial">
                <caption>Máquinas</caption>
                <thead>
                    <tr>
                        <th scope="col">Modelo Máquina</th>
                        <th scope="col">Código</th>
                        <th scope="col">Número de série</th>
                    </tr>
                </thead>
                <tbody id="maquinasFormularioComercial"></tbody>
            </table>

            <div class="controle-linhas nao-imprimir">
                <button
                    type="button"
                    class="btn btn-secundario"
                    id="adicionarMaquinaFormulario"
                >
                    + Adicionar máquina
                </button>
            </div>

            <table class="tabela-comercial">
                <caption>Acessórios</caption>
                <thead>
                    <tr>
                        <th scope="col">Descrição</th>
                        <th scope="col">Código</th>
                        <th scope="col">Disponibilidade</th>
                    </tr>
                </thead>
                <tbody id="acessoriosFormularioComercial"></tbody>
            </table>

            <div class="controle-linhas nao-imprimir">
                <button
                    type="button"
                    class="btn btn-secundario"
                    id="adicionarAcessorioFormulario"
                >
                    + Adicionar acessório
                </button>
            </div>

            <p class="observacao-comercial nao-imprimir">
                Este formulário não altera os saldos do estoque.
                O preenchimento permanece enquanto a página estiver aberta.
            </p>
        </div>
    `;

    const principal = document.querySelector("main");
    principal.append(tela);

    function adicionarLinha(idTabela, nomes) {
        const tabela = document.getElementById(idTabela);
        const numero = tabela.rows.length + 1;
        const linha = document.createElement("tr");

        nomes.forEach(function (nome) {
            const celula = document.createElement("td");
            const campo = document.createElement("input");

            campo.type = "text";
            campo.maxLength = 80;
            campo.autocomplete = "off";

            campo.setAttribute(
                "aria-label",
                nome + " — linha " + numero
            );

            celula.append(campo);
            linha.append(celula);
        });

        tabela.append(linha);
    }

    function novaLinhaMaquina() {
        adicionarLinha(
            "maquinasFormularioComercial",
            ["Modelo da máquina", "Código", "Número de série"]
        );
    }

    function novaLinhaAcessorio() {
        adicionarLinha(
            "acessoriosFormularioComercial",
            ["Descrição", "Código", "Disponibilidade"]
        );
    }

    function iniciarLinhas() {
        document.getElementById(
            "maquinasFormularioComercial"
        ).replaceChildren();

        document.getElementById(
            "acessoriosFormularioComercial"
        ).replaceChildren();

        for (let numero = 0; numero < 8; numero++) {
            novaLinhaMaquina();
            novaLinhaAcessorio();
        }
    }

    iniciarLinhas();

    const botaoMenu = document.createElement("button");

    botaoMenu.type = "button";
    botaoMenu.className = "menu-item";
    botaoMenu.setAttribute(
        "aria-controls",
        "telaFormularioComercial"
    );

    botaoMenu.innerHTML = `
        <span class="icone-menu" aria-hidden="true">▤</span>
        <span>FORMULÁRIO</span>
    `;

    document.querySelector(".menu").append(botaoMenu);

    const navegacaoOriginal = trocarTela;

    trocarTela = function (nome) {
        tela.hidden = true;
        botaoMenu.classList.remove("ativo");
        botaoMenu.removeAttribute("aria-current");

        navegacaoOriginal(nome);
    };

    botaoMenu.addEventListener("click", function () {
        // Usa a navegação existente para fechar a janela
        // de registro de máquinas, caso esteja aberta.
        trocarTela("estoque");

        principal.querySelectorAll(".tela").forEach(
            function (secao) {
                secao.hidden = true;
            }
        );

        document.querySelectorAll(".menu-item").forEach(
            function (botao) {
                botao.classList.remove("ativo");
                botao.removeAttribute("aria-current");
            }
        );

        tela.hidden = false;

        botaoMenu.classList.add("ativo");
        botaoMenu.setAttribute("aria-current", "page");

        document.getElementById("tituloPagina").textContent =
            "Formulário comercial";

        document.getElementById(
            "clienteFormularioComercial"
        ).focus();
    });

    document.getElementById(
        "adicionarMaquinaFormulario"
    ).addEventListener("click", novaLinhaMaquina);

    document.getElementById(
        "adicionarAcessorioFormulario"
    ).addEventListener("click", novaLinhaAcessorio);

    document.getElementById(
        "limparFormularioComercial"
    ).addEventListener("click", function () {
        if (!confirm("Limpar todos os campos deste formulário?")) {
            return;
        }

        document.getElementById(
            "clienteFormularioComercial"
        ).value = "";

        iniciarLinhas();

        document.getElementById(
            "clienteFormularioComercial"
        ).focus();
    });

    document.getElementById(
        "imprimirFormularioComercial"
    ).addEventListener("click", function () {
        const cliente = document.getElementById(
            "clienteFormularioComercial"
        );

        if (!cliente.value.trim()) {
            alert("Preencha o cliente ou projeto antes de imprimir.");
            cliente.focus();
            return;
        }

        document.body.classList.add("imprimindo-comercial");

        try {
            window.print();
        } finally {
            document.body.classList.remove(
                "imprimindo-comercial"
            );
        }
    });

    window.addEventListener("afterprint", function () {
        document.body.classList.remove("imprimindo-comercial");
    });
});

// Logo no menu lateral e no formulário.
document.addEventListener("DOMContentLoaded", function () {
    const caminhoLogo = "img/logo-smigroup.png";

    function criarLogo(classe) {
        const imagem = document.createElement("img");
        imagem.src = caminhoLogo;
        imagem.alt = "SMI Group";
        imagem.className = classe;
        return imagem;
    }

    const marcaMenu = document.querySelector(".sidebar .marca");

    if (marcaMenu) {
        marcaMenu.replaceChildren(
            criarLogo("logo-menu-smigroup")
        );
    }

    const marcaFormulario = document.querySelector(
        ".marca-comercial"
    );

    if (marcaFormulario) {
        marcaFormulario.replaceChildren(
            criarLogo("logo-formulario-smigroup")
        );
    }
});

// Ícones do menu no padrão visual do WMS.
document.addEventListener("DOMContentLoaded", function () {
    const desenhos = {
        estoque: `
            <path d="m12 3 9 5-9 5-9-5 9-5Z"/>
            <path d="M3 8v9l9 5 9-5V8M12 13v9"/>
            <path d="m7.5 5.5 9 5"/>
        `,
        showroom: `
            <rect x="3" y="3" width="18" height="13" rx="2"/>
            <path d="M8 21h8M12 16v5"/>
        `,
        entradas: `
            <path d="M12 3v12m-5-5 5 5 5-5"/>
            <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>
        `,
        reservas: `
            <path d="M5 20v-7M12 20V4M19 20V9"/>
        `,
        formulario: `
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
            <path d="M14 2v6h6M8 12h8M8 16h8"/>
        `
    };

    document.querySelectorAll(".menu .menu-item").forEach(
        function (botao) {
            const tipo =
                botao.getAttribute("aria-controls") ===
                "telaFormularioComercial"
                    ? "formulario"
                    : botao.dataset.tela;

            if (!desenhos[tipo]) return;

            // Remove os símbolos antigos.
            botao.querySelectorAll(
                ".icone-menu, .icone-wms, .seta-menu-wms"
            ).forEach(function (elemento) {
                elemento.remove();
            });

            const icone = document.createElement("span");
            icone.className = "icone-wms icone-wms-" + tipo;
            icone.setAttribute("aria-hidden", "true");

            icone.innerHTML = `
                <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    ${desenhos[tipo]}
                </svg>
            `;

            const seta = document.createElement("span");
            seta.className = "seta-menu-wms";
            seta.textContent = "›";
            seta.setAttribute("aria-hidden", "true");

            botao.prepend(icone);
            botao.append(seta);
        }
    );
});
// =====================================================
// RELATÓRIOS UNIFICADOS — ENTRADAS, RESERVAS E VENDAS
// =====================================================
function montarHistoricoMaquinas(base) {
    const linhas = [];
    base.entradas.forEach(e => linhas.push({
        ...e, tipo: 'Entrada', statusTexto: 'Recebido', dataEvento: e.data
    }));
    base.reservas.forEach(r => {
        const historico = r.historico || [];
        // Uma linha para cada início de reserva; salvar uma edição
        // da mesma reserva não cria outra movimentação.
        const inicios = historico.filter((h, i) => h.status === 'ativa' &&
            (i === 0 || historico[i - 1].status !== 'ativa'));
        if (!inicios.length && ['ativa', 'expirada', 'cancelada', 'concluida'].includes(r.status)) {
            inicios.push(r);
        }
        inicios.forEach((h, i) => {
            const atual = i === inicios.length - 1;
            const estado = atual ? r.status : 'encerrada';
            const textos = { ativa: 'Reservado', expirada: 'Expirada', cancelada: 'Cancelada', vendida: 'Convertida em venda', concluida: 'Convertida em venda', encerrada: 'Encerrada', disponivel: 'Liberada' };
            linhas.push({ ...r, ...h, tipo: 'Reserva', quantidade: 1,
                dataEvento: h.dataReserva || h.em || r.criadaEm,
                statusTexto: textos[estado] || estado,
                status: estado, registroId: r.id,
                // A nota da venda permanece na linha da venda.
                nf: h.nf || '', dataEmissao: h.dataEmissao || '' });
        });
    });
    base.saidas.forEach(s => linhas.push({ ...s, tipo: 'Venda',
        statusTexto: 'Vendido', dataEvento: s.data }));
    return linhas.sort((a,b) => String(b.dataEvento || '').localeCompare(String(a.dataEvento || '')));
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('relatoriosUnificados')) return;
    function campoExtra(form, id, titulo, obrigatorio = false) {
        const div = document.createElement('div');
        div.className = 'campo';
        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = titulo + (obrigatorio ? ' *' : '');
        const input = document.createElement('input');
        input.id = id; input.type = 'text'; input.maxLength = 100;
        input.required = obrigatorio;
        div.append(label,input);
        document.getElementById(form).prepend(div);
    }
    campoExtra('formEntrada','entradaSerie','S/N (opcional na entrada)');
    campoExtra('formEntrada','entradaCodigo','Código');
    campoExtra('formEntrada','entradaMatricula','Matrícula',true);
    campoExtra('camposReserva','reservaMatricula','Matrícula',true);
    // Uma série identifica uma unidade; entradas em lote podem não ter série.
    const entrada = document.getElementById('formEntrada');
    entrada.addEventListener('submit', evento => {
        if (document.getElementById('entradaSerie').value.trim() &&
            Number(document.getElementById('entradaQuantidade').value) !== 1) {
            evento.preventDefault(); evento.stopImmediatePropagation();
            alert('Ao informar S/N, registre uma máquina por entrada. Para um lote, deixe S/N vazio.');
        }
    }, true);

    const tela = document.getElementById('telaReservas');
    // Conserva os elementos antigos, pois ainda são usados pela aplicação.
    const antigo = document.createElement('div');
    antigo.hidden = true;
    while(tela.firstChild) antigo.append(tela.firstChild);
    tela.append(antigo);
    const painel = document.createElement('section');
    painel.id = 'relatoriosUnificados';
    painel.innerHTML = `
        <h2>Histórico de entradas, reservas e vendas</h2>
        <div class="ru-abas" role="group" aria-label="Tipo de relatório">
          <button type="button" class="btn" data-ru="Todos">Todos</button>
          <button type="button" class="btn" data-ru="Entrada">Entradas</button>
          <button type="button" class="btn" data-ru="Reserva">Reservas</button>
          <button type="button" class="btn" data-ru="Venda">Vendas</button>
          <button type="button" class="btn" data-ru="Expirada">Expiradas</button>
        </div>
        <form id="ruFiltros" class="card catalogo-filtros">
          <div class="campo campo-busca"><label for="ruBusca">Buscar</label><input id="ruBusca" type="search" placeholder="Máquina, cliente, matrícula, código ou S/N"></div>
          <div class="campo"><label for="ruSetor">Estoque</label><select id="ruSetor"><option value="">Todos</option><option value="estoque">Principal</option><option value="showroom">SHOW ROOM</option></select></div>
          <div class="campo"><label for="ruInicio">De</label><input id="ruInicio" type="date"></div>
          <div class="campo"><label for="ruFim">Até</label><input id="ruFim" type="date"></div>
          <button class="btn btn-primario" type="submit">Consultar</button>
          <button class="btn" type="button" id="ruLimpar">Limpar</button>
        </form>
        <div class="ru-barra"><span id="ruContagem" role="status"></span><button class="btn" type="button" id="ruExportar">Exportar CSV (Excel)</button><button class="btn" type="button" id="ruImprimir">Imprimir</button></div>
        <div class="tabela-container" id="ruTabela"></div>
        <p class="texto-auxiliar">Reservas expiradas liberam a disponibilidade sem gerar outra entrada. Nesta versão local, os prazos são conferidos ao abrir e durante o uso do aplicativo.</p>
        <p class="texto-auxiliar">Registros antigos sem matrícula, código ou S/N mantêm esses campos em branco. O período considera a data de cada entrada, reserva ou venda.</p>`;
    tela.append(painel);
    const estilo = document.createElement('style');
    estilo.textContent = `.ru-abas,.ru-barra{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:18px 0}.ru-barra span{margin-right:auto}.ru-abas [aria-pressed="true"]{background:#087dff}#ruFiltros .campo{flex:1 1 130px}#ruFiltros .campo-busca{flex:3 1 250px}#ruTabela{max-height:65vh}#ruTabela th{position:sticky;top:0;z-index:1}#ruTabela tbody tr:nth-child(even){background:#11283e}.ru-etiqueta{display:inline-block;padding:4px 8px;border-radius:6px;background:#174b7e}.ru-reserva{background:#725319}.ru-venda{background:#603c8d}.ru-expirada{background:#823c43}`;
    document.head.append(estilo);
    let tipo = 'Todos';
    let resultado = [];
    let aplicados = {busca:'',setor:'',inicio:'',fim:''};
    const cabecalhos = ['Tipo','Data','Estoque','Máquina','Qtd.','Matrícula','Código','S/N','Cliente','Vendedor','Limite reserva','Nº NF','Emissão','Status','Ações'];
    function valores(r) {
        return [r.tipo, formatarData(r.dataEvento), nomeSetor(setorDe(r)), r.modelo,
            r.quantidade, r.matricula, r.codigo, r.serie, r.cliente, r.vendedor,
            r.tipo === 'Reserva' ? formatarData(r.vencimento) : '', r.nf,
            r.dataEmissao ? formatarData(r.dataEmissao) : '', r.statusTexto];
    }
    function construirTabela(registros, acoes) {
        const tabela = document.createElement('table');
        const thead = tabela.createTHead(); const h = thead.insertRow();
        cabecalhos.slice(0, acoes ? 15 : 14).forEach(t => {
            const th = document.createElement('th'); th.scope='col'; th.textContent=t; h.append(th);
        });
        const corpo = tabela.createTBody();
        registros.forEach(r => {
            const tr = corpo.insertRow();
            valores(r).forEach((v,i) => {
                const td = tr.insertCell();
                if (i === 0 || i === 13) {
                    const badge = document.createElement('span');
                    badge.className = 'ru-etiqueta ru-' + (r.statusTexto === 'Expirada' ? 'expirada' : r.tipo.toLowerCase());
                    badge.textContent = String(v ?? '—'); td.append(badge);
                } else td.textContent = v === '' || v == null ? '—' : String(v);
            });
            if (acoes) {
                const td = tr.insertCell();
                if(r.tipo === 'Reserva' && ['ativa','expirada','cancelada','disponivel'].includes(r.status)) {
                    const b = document.createElement('button'); b.type='button'; b.className='btn';
                    b.textContent='Editar / vender'; b.onclick=()=>editarRegistro(r.registroId); td.append(b);
                } else td.textContent='—';
            }
        });
        if (!registros.length) {
            const td=corpo.insertRow().insertCell(); td.colSpan=acoes?15:14;
            td.textContent='Nenhum registro encontrado para os filtros selecionados.';
        }
        return tabela;
    }
    function desenhar() {
        const f=aplicados;
        resultado=montarHistoricoMaquinas(dados).filter(r=> {
            const dia=dataLocal(r.dataEvento);
            return (tipo==='Todos' || (tipo==='Expirada' ? r.statusTexto==='Expirada' : r.tipo===tipo)) &&
                (!f.setor || setorDe(r)===f.setor) && (!f.inicio || dia>=f.inicio) && (!f.fim || dia<=f.fim) &&
                (!f.busca || normalizar(valores(r).join(' ')).includes(normalizar(f.busca)));
        });
        document.getElementById('ruTabela').replaceChildren(construirTabela(resultado,true));
        document.getElementById('ruContagem').textContent=`${resultado.length} registro(s) encontrado(s)`;
        painel.querySelectorAll('[data-ru]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ru===tipo)));
    }
    function consultar(evento) {
        evento?.preventDefault();
        const inicio=document.getElementById('ruInicio').value;
        const fim=document.getElementById('ruFim').value;
        if(inicio && fim && inicio>fim) { alert('A data inicial deve ser anterior ou igual à final.'); return false; }
        aplicados={busca:document.getElementById('ruBusca').value.trim(),setor:document.getElementById('ruSetor').value,inicio,fim};
        verificarVencimentos(); desenhar(); return true;
    }
    painel.querySelectorAll('[data-ru]').forEach(b=>b.onclick=()=>{tipo=b.dataset.ru;consultar();});
    document.getElementById('ruFiltros').onsubmit=consultar;
    document.getElementById('ruLimpar').onclick=()=>{document.getElementById('ruFiltros').reset();tipo='Todos';consultar();};
    const renderizarAnterior=renderizarTudo;
    renderizarTudo=function(){renderizarAnterior();desenhar();};
    document.getElementById('ruExportar').onclick=()=>{
        if (!consultar()) return;
        const proteger=v=>'"'+String(v ?? '').replace(/^[\s]*([=+@-])/u,"'$1").replace(/"/g,'""')+'"';
        const csv='\uFEFF'+[cabecalhos.slice(0,14),...resultado.map(valores)].map(l=>l.map(proteger).join(';')).join('\r\n');
        const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
        const a=document.createElement('a');a.href=url;a.download='relatorio-maquinas.csv';a.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    document.getElementById('ruImprimir').onclick=()=>{
        if (!consultar()) return;
        const janela=window.open('','_blank');
        if(!janela){alert('Permita abrir a janela de impressão neste site.');return;}
        const doc=janela.document;doc.title='Relatório de máquinas';
        const css=doc.createElement('style');css.textContent='@page{size:A4 landscape;margin:10mm}body{font-family:Arial;color:#111}h1{font-size:20px}p{font-size:11px}table{width:100%;border-collapse:collapse;font-size:9px}td,th{padding:5px;border:1px solid #aaa;text-align:left;overflow-wrap:anywhere}th{background:#e0ebf4}tr{break-inside:avoid}';doc.head.append(css);
        const titulo=doc.createElement('h1');titulo.textContent='SMI Máquinas — Relatórios';
        const resumo=doc.createElement('p');resumo.textContent=`${tipo} • ${resultado.length} registros • ${nomeSetor(aplicados.setor)}${!aplicados.setor?' / SHOW ROOM':''} • Período: ${aplicados.inicio||'Todos'} a ${aplicados.fim||'Todos'} • Busca: ${aplicados.busca||'Todas'}`;
        doc.body.append(titulo,resumo,doc.importNode(construirTabela(resultado,false),true));
       janela.focus();

setTimeout(function () {
    window.smiTraduzirDocumento?.(doc);
    janela.print();
}, 250);

    };
    desenhar();
});

// =====================================================
// IMPORTAÇÃO — ESTOQUE MAQUINAS.xlsx
//
// Primeira ocorrência: estoque principal.
// Ocorrências seguintes: SHOW ROOM.
// Acessórios ficam no catálogo, sem imagem.
// Quantidades vazias não são importadas.
// =====================================================

(function () {
    "use strict";

    // Se a versão completa já possui a importação,
    // não cria o recurso novamente.
    if (typeof PLANILHA_RECEBIDA !== "undefined") {
        return;
    }

    const ID_IMPORTACAO = "estoque-maquinas-2026-11-05-v1";

    // Linha do Excel, descrição original e quantidade.
    // null significa que a quantidade estava vazia.
    const origemPlanilha = [
        [2, "SL45", 2],
        [3, "SL55", 15],
        [4, "S560NA", 4],
        [5, "S870", 2],
        [6, "GHS1000/400B", 3],
        [7, "GH1000/400", 6],
        [8, "GH2000/400", 10],
        [9, "GHS2000/400S", null],
        [10, "GH2000/400 INOX", 2],
        [11, "GH2000/600", 1],
        [12, "FP560A", null],
        [13, "FP870A", 2],
        [14, "FP6000", 5],
        [15, "FP6000CS", 8],
        [17, "FP6000CS INOX", 2],
        [18, "FP8000CS", null],
        [19, "T450", null],
        [20, "T650", 2],
        [21, "T452", 8],
        [23, "T452 VETRONITE", null],
        [24, "T452 INOX+VETRONITE", 3],
        [25, "T652", 1],
        [26, "BP802AR 230R (Dimel)", 1],
        [27, "BP800", 3],
        [28, "BP800AS", 1],
        [29, "BP802AS", null],
        [30, "BP800AR 230R", null],
        [31, "XP650ALX", 1],
        [32, "GHS2000/400F", 2],
        [33, "GHS2000/400R", 3],
        [34, "GHS2000/400B", 8],
        [35, "GHS2000/400FC*(editorial)", 1],
        [36, "GHS2000/700B", 2],
        [37, "GHS2000/400P", 2],
        [38, "HS500E", 4],
        [39, "HS500", null],
        [40, "HS500 SERVO", 2],
        [41, "HS700", null],
        [42, "HS800", null],
        [43, "HS800 SERVO", null],
        [44, "T452H", 2],
        [47, "T652H", null],
        [48, "T852H", 1],
        [50, "FW550", null],
        [51, "FW300E", null],
        [52, "FW300E (Dimel)", 1],
        [53, "FW400E", null],
        [54, "FW500E", 2],
        [55, "FW550E", 2],
        [56, "MY150026 (SL45)", 2],
        [57, "MY150025 (SL55)", 15],
        [58, "MY120019 (BP)", 1],
        [59, "MY120020 (BP ESTEIRA DE 2MT)", null],
        [60, "MY120021 (T450/T452/T452H)", 15],
        [61, "MY120002 (T650/T652/T652H)", 8],
        [62, "MY120027 (T452 INOX)", 3],
        [63, "MY120081 (T852H)", 1],
        [64, "MY120005 Esteira 600MM (T450)", 9],
        [65, "MY120038 (BP600)", 3],
        [66, "MY120014 (T652)", 4],
        [67, "MY120018 ( T452)", 4],
        [68, "ZB010833", 3],
        [69, "GHS2000/400B", 1],
        [70, "FP6000CS", 1],
        [71, "T452", 1],
        [72, "GHS2000/400B", 1],
        [73, "FW550", 1],
        [74, "MY120019 (BP)", 2],
        [75, "MY120021", 2],
        [76, "GH2000/400", 1],
        [77, "MY120018", 1],
        [78, "T450", 1],
        [79, "S560NA", 1],
        [80, "MY150025 (SL55)", 1],
        [81, "T452H", 1],
        [82, "FW400E", 1],
        [83, "SL55", 1],
        [84, "MY120038", 1],
        [85, "BP800AS", 1],
        [86, "XP650ALX", 1],
        [87, "FW750S SERVO XB", 1]
    ];

    const tiposCatalogo = new Map();
    const primeirasDescricoes = new Map();
    const ocorrencias = new Map();

    // Prepara os nomes e separa os estoques.
    const linhas = origemPlanilha.map(function (registro) {
        const [linha, descricao, quantidade] = registro;

        const original = descricao.trim().replace(/\s+/g, " ");

        const codigoEncontrado = original.match(
            /^(MY\d+|ZB\d+)/i
        );

        let chave = codigoEncontrado
            ? codigoEncontrado[1].toUpperCase()
            : original
                .replace(/\s*\(Dimel\)/gi, "")
                .replace(/\*\(editorial\)/gi, "")
                .trim();

        if (chave === "XP650ALX") {
            chave = "XP650 ALX";
        }

        if (!primeirasDescricoes.has(chave)) {
            primeirasDescricoes.set(
                chave,
                codigoEncontrado ? original : chave
            );
        }

        const quantidadeOcorrencias = ocorrencias.get(chave) || 0;

        ocorrencias.set(chave, quantidadeOcorrencias + 1);

        return {
            linha,
            original,
            chave,
            modelo: primeirasDescricoes.get(chave),
            quantidade,
            setor: quantidadeOcorrencias === 0
                ? "estoque"
                : "showroom",
            tipo: chave.startsWith("MY")
                ? "acessorio"
                : chave.startsWith("ZB")
                    ? "pendente"
                    : "maquina"
        };
    });

    function recuperarCatalogo(base) {
        (base.catalogoImportado || []).forEach(function (item) {
            if (!item || typeof item.modelo !== "string") {
                return;
            }

            tiposCatalogo.set(item.modelo, item.tipo);

            if (!MODELOS.includes(item.modelo)) {
                MODELOS.push(item.modelo);
            }
        });
    }

    // Recupera os novos modelos ao carregar os dados locais.
    const carregarAnterior = carregarDados;

    carregarDados = function () {
        const base = carregarAnterior();

        recuperarCatalogo(base);

        return base;
    };

    // Retira a área de imagem dos acessórios.
    const renderizarAnterior = renderizarCatalogo;

    renderizarCatalogo = function () {
        renderizarAnterior();

        document.querySelectorAll(
            "#listaModelos .card-modelo"
        ).forEach(function (card) {
            const nome = card.querySelector(".modelo-nome");

            if (!nome) return;

            const acessorio =
                tiposCatalogo.get(nome.textContent.trim()) ===
                "acessorio";

            card.classList.toggle(
                "item-acessorio-importado",
                acessorio
            );
        });
    };

    document.addEventListener("DOMContentLoaded", function () {
        if (
            document.getElementById("importacaoRecebida") ||
            document.getElementById("blocoImportacaoExcel")
        ) {
            return;
        }

        const formEntrada = document.getElementById(
            "formEntrada"
        );

        if (!formEntrada) return;

        const estilo = document.createElement("style");

        estilo.textContent = `
            .item-acessorio-importado .modelo-foto-container {
                display: none !important;
            }

            .item-acessorio-importado .modelo-conteudo::before {
                content: "ACESSÓRIO";
                display: block;
                margin-bottom: 12px;
                color: #8eb7da;
                font-size: 10px;
                letter-spacing: 1px;
            }

            #blocoImportacaoExcel .campo-importacao {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 16px;
                margin-top: 20px;
            }

            #tabelaImportacaoExcel {
                max-height: 450px;
                overflow: auto;
            }

            #tabelaImportacaoExcel th {
                position: sticky;
                top: 0;
                z-index: 1;
            }

            .confirmacao-importacao {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 20px 0;
            }

            .confirmacao-importacao input {
                width: 18px;
                min-height: 18px;
                flex: 0 0 18px;
            }

            @media (max-width: 760px) {
                #blocoImportacaoExcel .campo-importacao {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.append(estilo);

        const bloco = document.createElement("section");

        bloco.id = "blocoImportacaoExcel";
        bloco.className = "card";

        bloco.innerHTML = `
            <h2>Importar estoque do Excel</h2>

            <p>
                Dados preparados da planilha
                <strong>ESTOQUE MAQUINAS.xlsx</strong>
                enviada na conversa.
            </p>

            <button
                type="button"
                class="btn btn-secundario"
                id="abrirImportacaoExcel"
            >
                Conferir planilha recebida
            </button>

            <div id="previaImportacaoExcel" hidden>
                <p style="margin-top: 18px">
                    Primeira ocorrência: estoque principal.
                    Ocorrências seguintes: SHOW ROOM.
                    Quantidades vazias não geram saldo.
                </p>

                <p>
                    <strong>
                        As quantidades serão somadas ao saldo atual.
                    </strong>
                    Confira a coluna “Após importar”.
                </p>

                <div class="campo-importacao">
                    <div class="campo">
                        <label for="excelMatricula">
                            Matrícula do responsável *
                        </label>
                        <input
                            id="excelMatricula"
                            type="text"
                            maxlength="100"
                        >
                    </div>

                    <div class="campo">
                        <label for="excelResponsavel">
                            Responsável pela importação *
                        </label>
                        <input
                            id="excelResponsavel"
                            type="text"
                            maxlength="120"
                        >
                    </div>

                    <div class="campo">
                        <label for="excelData">
                            Data da carga inicial *
                        </label>
                        <input
                            id="excelData"
                            type="date"
                        >
                    </div>
                </div>

                <p class="texto-auxiliar">
                    A planilha não informa as datas históricas
                    de recebimento nem os números de série.
                    A data acima identifica a carga inicial.
                </p>

                <p id="resumoImportacaoExcel" role="status"></p>

                <div
                    id="tabelaImportacaoExcel"
                    class="tabela-container"
                ></div>

                <label class="confirmacao-importacao">
                    <input
                        id="confirmacaoImportacaoExcel"
                        type="checkbox"
                    >
                    Conferi os destinos e os saldos finais
                    e quero somar estas quantidades.
                </label>

                <div class="formulario-acoes">
                    <button
                        type="button"
                        class="btn btn-secundario"
                        id="backupImportacaoExcel"
                    >
                        Baixar backup dos dados atuais
                    </button>

                    <button
                        type="button"
                        class="btn btn-primario"
                        id="gravarImportacaoExcel"
                    >
                        Confirmar importação
                    </button>
                </div>

                <p
                    id="mensagemImportacaoExcel"
                    role="status"
                    aria-live="polite"
                ></p>
            </div>
        `;

        formEntrada.before(bloco);

        let baseConferida = "";

        const campo = id => document.getElementById(id);

        function importacaoExistente(base) {
            return (base.importacoes || []).some(function (item) {
                return item.id === ID_IMPORTACAO;
            });
        }

        function saldoFisico(modelo, setor) {
            const recebidas = dados.entradas
                .filter(function (item) {
                    return (
                        item.modelo === modelo &&
                        setorDe(item) === setor
                    );
                })
                .reduce(function (total, item) {
                    return total + Number(item.quantidade || 0);
                }, 0);

            const retiradas = dados.saidas
                .filter(function (item) {
                    return (
                        item.modelo === modelo &&
                        setorDe(item) === setor
                    );
                })
                .reduce(function (total, item) {
                    return total + Number(item.quantidade || 0);
                }, 0);

            return recebidas - retiradas;
        }

        function montarPrevia() {
            atualizarDados();

            baseConferida = JSON.stringify(dados);

            const totais = new Map();

            linhas.forEach(function (item) {
                if (item.quantidade === null) return;

                const chave = item.setor + "|" + item.modelo;

                totais.set(
                    chave,
                    (totais.get(chave) || 0) + item.quantidade
                );
            });

            const tabela = document.createElement("table");
            const cabecalho = tabela.createTHead().insertRow();

            [
                "Linha Excel",
                "Descrição original",
                "Item no aplicativo",
                "Tipo",
                "Destino",
                "Quantidade",
                "Saldo atual",
                "Após importar"
            ].forEach(function (titulo) {
                const th = document.createElement("th");

                th.scope = "col";
                th.textContent = titulo;

                cabecalho.append(th);
            });

            const corpo = tabela.createTBody();

            linhas.forEach(function (item) {
                const linha = corpo.insertRow();

                [
                    item.linha,
                    item.original,
                    item.modelo
                ].forEach(function (valor) {
                    linha.insertCell().textContent = String(valor);
                });

                const celulaTipo = linha.insertCell();

                if (item.chave === "ZB010833") {
                    const seletor = document.createElement("select");

                    seletor.setAttribute(
                        "aria-label",
                        "Classificação do item ZB010833"
                    );

                    seletor.add(
                        new Option("Selecione o tipo", "pendente")
                    );

                    seletor.add(
                        new Option("Máquina", "maquina")
                    );

                    seletor.add(
                        new Option("Acessório", "acessorio")
                    );

                    seletor.value = item.tipo;

                    seletor.addEventListener("change", function () {
                        item.tipo = seletor.value;

                        campo(
                            "confirmacaoImportacaoExcel"
                        ).checked = false;
                    });

                    celulaTipo.append(seletor);
                } else {
                    celulaTipo.textContent =
                        item.tipo === "acessorio"
                            ? "Acessório"
                            : "Máquina";
                }

                linha.insertCell().textContent =
                    nomeSetor(item.setor);

                linha.insertCell().textContent =
                    item.quantidade === null
                        ? "Sem quantidade — ignorada"
                        : String(item.quantidade);

                const saldo = saldoFisico(
                    item.modelo,
                    item.setor
                );

                const chave = item.setor + "|" + item.modelo;

                linha.insertCell().textContent = String(saldo);

                linha.insertCell().textContent = String(
                    saldo + (totais.get(chave) || 0)
                );
            });

            campo("tabelaImportacaoExcel").replaceChildren(
                tabela
            );

            const preenchidas = linhas.filter(function (item) {
                return item.quantidade !== null;
            });

            const totalPrincipal = preenchidas
                .filter(item => item.setor === "estoque")
                .reduce(
                    (total, item) => total + item.quantidade,
                    0
                );

            const totalShowroom = preenchidas
                .filter(item => item.setor === "showroom")
                .reduce(
                    (total, item) => total + item.quantidade,
                    0
                );

            campo("resumoImportacaoExcel").textContent =
                `${preenchidas.length} linhas com quantidade • ` +
                `${totalPrincipal} unidades no principal • ` +
                `${totalShowroom} no SHOW ROOM • ` +
                `${linhas.length - preenchidas.length} linhas ` +
                "sem quantidade. Máquinas e acessórios juntos.";

            const importada = importacaoExistente(dados);

            campo("gravarImportacaoExcel").disabled = importada;

            if (importada) {
                campo("mensagemImportacaoExcel").textContent =
                    "Esta planilha já foi importada neste navegador. " +
                    "A repetição está bloqueada.";
            }
        }

        campo("abrirImportacaoExcel").addEventListener(
            "click",
            function () {
                campo("previaImportacaoExcel").hidden = false;
                campo("excelData").value = hoje();

                campo(
                    "confirmacaoImportacaoExcel"
                ).checked = false;

                executar(montarPrevia);
            }
        );

        campo("backupImportacaoExcel").addEventListener(
            "click",
            function () {
                executar(function () {
                    const arquivo = new Blob(
                        [JSON.stringify(dados, null, 2)],
                        { type: "application/json" }
                    );

                    const endereco = URL.createObjectURL(arquivo);
                    const link = document.createElement("a");

                    link.href = endereco;

                    link.download =
                        "backup-smi-maquinas-" + hoje() + ".json";

                    link.click();

                    setTimeout(function () {
                        URL.revokeObjectURL(endereco);
                    }, 1000);
                });
            }
        );

        campo("gravarImportacaoExcel").addEventListener(
            "click",
            function () {
                const mensagemLocal = campo(
                    "mensagemImportacaoExcel"
                );

                try {
                    if (
                        !campo(
                            "confirmacaoImportacaoExcel"
                        ).checked
                    ) {
                        throw new Error(
                            "Confira a prévia e marque a confirmação."
                        );
                    }

                    const matricula = campo(
                        "excelMatricula"
                    ).value.trim();

                    const responsavel = campo(
                        "excelResponsavel"
                    ).value.trim();

                    const dataCarga = campo("excelData").value;

                    if (!matricula || !responsavel || !dataCarga) {
                        throw new Error(
                            "Preencha matrícula, responsável e " +
                            "data da carga inicial."
                        );
                    }

                    if (
                        linhas.some(function (item) {
                            return (
                                item.quantidade !== null &&
                                item.tipo === "pendente"
                            );
                        })
                    ) {
                        throw new Error(
                            "Classifique ZB010833 como máquina " +
                            "ou acessório na prévia."
                        );
                    }

                    atualizarDados();

                    if (importacaoExistente(dados)) {
                        throw new Error(
                            "Esta planilha já foi importada. " +
                            "Nenhuma quantidade foi duplicada."
                        );
                    }

                    if (
                        JSON.stringify(dados) !== baseConferida
                    ) {
                        montarPrevia();

                        campo(
                            "confirmacaoImportacaoExcel"
                        ).checked = false;

                        throw new Error(
                            "Os dados mudaram. A prévia foi " +
                            "atualizada; confira os novos saldos."
                        );
                    }

                    const agora = new Date().toISOString();

                    const entradasNovas = linhas
                        .filter(function (item) {
                            return (
                                item.quantidade !== null &&
                                item.quantidade > 0
                            );
                        })
                        .map(function (item) {
                            return {
                                id:
                                    ID_IMPORTACAO +
                                    "-linha-" +
                                    item.linha,

                                importacaoId: ID_IMPORTACAO,
                                linhaPlanilha: item.linha,
                                setor: item.setor,
                                modelo: item.modelo,
                                quantidade: item.quantidade,

                                data: dataCarga,
                                matricula,
                                responsavel,

                                codigo:
                                    /^(MY|ZB)\d+$/i.test(item.chave)
                                        ? item.chave
                                        : "",

                                serie: "",
                                nf: "",

                                origem:
                                    "Saldo inicial — " +
                                    "ESTOQUE MAQUINAS.xlsx",

                                observacoes:
                                    "Carga inicial; não é a data " +
                                    "histórica de recebimento. " +
                                    "Descrição original: " +
                                    item.original,

                                registradaEm: agora
                            };
                        });

                    const repetida = entradasNovas.some(
                        function (nova) {
                            return dados.entradas.some(
                                function (existente) {
                                    return existente.id === nova.id;
                                }
                            );
                        }
                    );

                    if (repetida) {
                        throw new Error(
                            "Já existem registros desta importação. " +
                            "Nenhum dado foi duplicado."
                        );
                    }

                    const catalogo = new Map(
                        (dados.catalogoImportado || []).map(
                            item => [item.modelo, item]
                        )
                    );

                    linhas.forEach(function (item) {
                        if (item.tipo === "pendente") return;

                        catalogo.set(item.modelo, {
                            modelo: item.modelo,
                            tipo: item.tipo
                        });
                    });

                    const proximosDados = {
                        ...dados,

                        entradas: [
                            ...dados.entradas,
                            ...entradasNovas
                        ],

                        catalogoImportado: [
                            ...catalogo.values()
                        ],

                        importacoes: [
                            ...(dados.importacoes || []),

                            {
                                id: ID_IMPORTACAO,
                                arquivo: "ESTOQUE MAQUINAS.xlsx",
                                em: agora,
                                linhas: entradasNovas.length,

                                unidades: entradasNovas.reduce(
                                    function (total, item) {
                                        return (
                                            total + item.quantidade
                                        );
                                    },
                                    0
                                )
                            }
                        ]
                    };

                    // Grava toda a importação em uma única operação.
                    gravarDados(proximosDados);

                    recuperarCatalogo(proximosDados);

                    [
                        "entradaModelo",
                        "saidaModelo",
                        "relatorioModelo"
                    ].forEach(function (id) {
                        const seletor = campo(id);

                        if (!seletor) return;

                        const existentes = new Set(
                            Array.from(seletor.options).map(
                                opcao => opcao.value
                            )
                        );

                        MODELOS.forEach(function (modelo) {
                            if (existentes.has(modelo)) return;

                            seletor.add(
                                new Option(modelo, modelo)
                            );

                            existentes.add(modelo);
                        });
                    });

                    renderizarTudo();
                    montarPrevia();

                    mensagemLocal.textContent =
                        "Importação concluída: 203 unidades " +
                        "adicionadas, sendo 182 no principal e " +
                        "21 no SHOW ROOM. Consulte o estoque " +
                        "e o relatório de entradas.";
                } catch (erro) {
                    mensagemLocal.textContent = erro.message;
                }
            }
        );

        renderizarTudo();
    });
})();

// =====================================================
// SUBSTITUIR OS DADOS DE TESTE PELA PLANILHA
// Executa somente ao confirmar a importação.
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    const botao =
        document.getElementById("gravarImportacaoExcel") ||
        document.getElementById("confirmarPreviaExcel");

    if (!botao || botao.dataset.substituicaoConfigurada) return;

    botao.dataset.substituicaoConfigurada = "sim";

    const lote = "estoque-maquinas-2026-11-05-v1";

    const bloco =
        document.getElementById("blocoImportacaoExcel") ||
        document.getElementById("importacaoRecebida");

    let substituindo = false;
    let concluido = false;

    function ajustarPrevia() {
        if (!bloco) return;

        botao.textContent = "Substituir testes e carregar estoque";

        // Corrige as orientações da importação anterior.
        bloco.querySelectorAll("p").forEach(function (p) {
            if (
                /quantidades serão somadas/i.test(p.textContent)
            ) {
                p.textContent =
                    "Os dados de teste serão substituídos pelas " +
                    "quantidades da planilha. O estoque principal " +
                    "ficará com 182 unidades e o SHOW ROOM com 21.";
            }
        });

        const checkbox =
            document.getElementById("confirmacaoImportacaoExcel") ||
            document.getElementById("aceitePreviaExcel");

        if (checkbox) {
            const label = checkbox.closest("label");

            if (
                label &&
                !label.dataset.textoSubstituicao
            ) {
                label.replaceChildren(
                    checkbox,
                    document.createTextNode(
                        " Conferi e quero substituir os dados " +
                        "de teste pelas quantidades da planilha."
                    )
                );

                label.dataset.textoSubstituicao = "sim";
            }
        }

        // Mostra os saldos finais sem somar os testes.
        const tabela =
            document.getElementById("tabelaImportacaoExcel") ||
            document.getElementById("tabelaPreviaExcel");

        if (!tabela) return;

        const linhas = Array.from(
            tabela.querySelectorAll("tbody tr")
        );

        const totais = new Map();

        linhas.forEach(function (linha) {
            const celulas = linha.cells;

            if (celulas.length < 8) return;

            const modelo = celulas[2].textContent.trim();
            const destino = celulas[4].textContent.trim();
            const texto = celulas[5].textContent.trim();

            if (!/^\d+$/.test(texto)) return;

            const chave = destino + "|" + modelo;

            totais.set(
                chave,
                (totais.get(chave) || 0) + Number(texto)
            );
        });

        linhas.forEach(function (linha) {
            const celulas = linha.cells;

            if (celulas.length < 8) return;

            const chave =
                celulas[4].textContent.trim() +
                "|" +
                celulas[2].textContent.trim();

            celulas[7].textContent = String(
                totais.get(chave) || 0
            );
        });
    }

    const gravarAnterior = gravarDados;

    gravarDados = function (proximosDados) {
        if (!substituindo) {
            return gravarAnterior(proximosDados);
        }

        const entradasPlanilha = proximosDados.entradas.filter(
            function (entrada) {
                return entrada.importacaoId === lote;
            }
        );

        const principal = entradasPlanilha
            .filter(item => setorDe(item) === "estoque")
            .reduce(
                (total, item) => total + Number(item.quantidade || 0),
                0
            );

        const showroom = entradasPlanilha
            .filter(item => setorDe(item) === "showroom")
            .reduce(
                (total, item) => total + Number(item.quantidade || 0),
                0
            );

        if (principal !== 182 || showroom !== 21) {
            throw new Error(
                "A carga não corresponde à planilha completa. " +
                "Os dados de teste não foram substituídos."
            );
        }

        // Guarda uma cópia antes de substituir.
        // Não altera nenhum dado do WMS de peças.
        const atuais = localStorage.getItem(CHAVE_DADOS);

        if (atuais) {
            localStorage.setItem(
                CHAVE_DADOS +
                "_backup_antes_substituicao_" +
                Date.now(),
                atuais
            );
        }

        gravarAnterior({
            ...proximosDados,
            entradas: entradasPlanilha,
            saidas: [],
            reservas: []
        });

        concluido = true;
    };

    // Ativa a substituição apenas durante este clique.
    botao.addEventListener(
        "click",
        function () {
            substituindo = true;
            concluido = false;

            queueMicrotask(function () {
                substituindo = false;

                if (!concluido) return;

                const mensagem =
                    document.getElementById(
                        "mensagemImportacaoExcel"
                    ) ||
                    document.getElementById(
                        "mensagemPreviaExcel"
                    );

                if (mensagem) {
                    mensagem.textContent =
                        "Dados de teste substituídos. " +
                        "Estoque principal: 182 unidades. " +
                        "SHOW ROOM: 21 unidades. " +
                        "Reservado e Vendido: zero.";
                }

                ajustarPrevia();
            });
        },
        true
    );

    const abrir =
        document.getElementById("abrirImportacaoExcel") ||
        document.getElementById("abrirPreviaExcel");

    if (abrir) {
        abrir.addEventListener("click", ajustarPrevia);
    }

    ajustarPrevia();
});

// Zera os dados uma única vez para começar as entradas manuais.
document.addEventListener("DOMContentLoaded", function () {
    executar(function () {
        const identificador = "inicio-manual-2026-11-06";

        // Impede que as próximas atualizações apaguem novas entradas.
        if (dados.reinicioManual === identificador) return;

        // Guarda uma cópia dos dados anteriores.
        localStorage.setItem(
            CHAVE_DADOS + "_backup_antes_inicio_manual",
            JSON.stringify(dados)
        );

        gravarDados({
            ...dados,
            entradas: [],
            saidas: [],
            reservas: [],
            importacoes: [],
            reinicioManual: identificador
        });

        modeloSelecionado = "";
        registroEmEdicao = null;

        document.getElementById("formReserva").reset();

        renderizarTudo();

        mensagem(
            "Estoque zerado. Agora registre as entradas manualmente.",
            "sucesso"
        );
    });

    // Retira a importação da tela para seguir com entradas manuais.
    [
        "blocoImportacaoExcel",
        "importacaoRecebida"
    ].forEach(function (id) {
        const bloco = document.getElementById(id);

        if (bloco) bloco.hidden = true;
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const matricula = document.getElementById("entradaMatricula");

    if (matricula) {
        matricula.required = false;
        matricula.removeAttribute("aria-required");
    }

    const rotulo = document.querySelector(
        'label[for="entradaMatricula"]'
    );

    if (rotulo) {
        rotulo.textContent = "Matrícula (opcional)";
    }
});

// =====================================================
// RESERVA COM VÁRIAS MÁQUINAS E ACESSÓRIOS
// Cole no final do app.js
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("adicionarConjunto")) return;

    const el = id => document.getElementById(id);
    const form = el("formReserva");
    const valor = id => el(id).value.trim();

    let extras = [];
    let escolhido = "";

    function acessorio(modelo) {
        return (
            (dados.catalogoImportado || []).some(item =>
                item.modelo === modelo &&
                item.tipo === "acessorio"
            ) ||
            /^(MY\d|ESTEIRA|CARRINHO)/i.test(modelo)
        );
    }

    // -------------------------------------------------
    // VISUAL
    // -------------------------------------------------

    const estilo = document.createElement("style");

    estilo.textContent = `
        #painelConjunto {
            grid-column: 1 / -1;
            margin: 18px 0;
            padding: 16px;
            border: 1px solid #42647d;
            border-radius: 12px;
        }

        #painelConjunto[hidden] {
            display: none !important;
        }

        #opcoesConjunto {
            max-height: 240px;
            overflow: auto;
            margin: 10px 0;
        }

        .opcao-conjunto {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 10px !important;
            margin: 4px 0;
            background: #10283d;
            color: #fff;
            border: 1px solid #32536b;
            border-radius: 7px;
            text-align: left;
        }

        .opcao-conjunto:not(:disabled):hover {
            background: #164775;
            border-color: #168bff;
        }

        .opcao-conjunto:disabled {
            opacity: 0.75;
            cursor: not-allowed;
        }

        .saldo-conjunto {
            padding: 4px 9px;
            border-radius: 7px;
            font-size: 12px;
            white-space: nowrap;
        }

        .saldo-conjunto.verde {
            color: #48e39b;
            background: #103f32;
            border: 1px solid #24734f;
        }

        .saldo-conjunto.vermelho {
            color: #ff9292;
            background: #4a202b;
            border: 1px solid #9e4050;
        }

        .campos-conjunto {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        #listaConjunto {
            grid-column: 1 / -1;
            margin: 12px 0;
        }

        .linha-conjunto {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 9px;
            border-bottom: 1px solid #32536b;
        }

        .acoes-conjunto {
            grid-column: 1 / -1;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 16px;
        }

        .acoes-conjunto button {
            width: auto !important;
            min-height: 44px;
            padding: 10px 22px !important;
        }

        #conjuntosSalvos {
            margin: 0 0 16px;
            padding: 12px;
            border: 1px solid #42647d;
            border-radius: 10px;
        }

        @media (max-width: 600px) {
            .campos-conjunto {
                grid-template-columns: 1fr;
            }

            .saldo-conjunto {
                white-space: normal;
            }

            .acoes-conjunto {
                flex-wrap: wrap;
            }
        }

        @media print {
            #conjuntosSalvos {
                display: none !important;
            }
        }
    `;

    document.head.append(estilo);

    // -------------------------------------------------
    // PAINEL PARA ADICIONAR ITENS
    // -------------------------------------------------

    const painel = document.createElement("section");

    painel.id = "painelConjunto";
    painel.hidden = true;

    painel.innerHTML = `
        <h3>Adicionar máquina ou acessório</h3>

        <label for="buscaConjunto">
            Buscar máquina ou acessório
        </label>

        <input
            id="buscaConjunto"
            type="search"
            placeholder="Digite o modelo..."
        >

        <div id="opcoesConjunto"></div>

        <p id="selecaoConjunto">
            Selecione um item disponível.
        </p>

        <div class="campos-conjunto">
            <label>
                Código
                <input id="codigoConjunto" type="text">
            </label>

            <label>
                Nº de série
                <input id="serieConjunto" type="text">
            </label>
        </div>

        <p>
            Itens indisponíveis não podem ser adicionados.
            Série opcional para acessórios.
        </p>

        <button
            id="incluirConjunto"
            type="button"
            class="btn btn-secundario"
        >
            Incluir item
        </button>
    `;

    const lista = document.createElement("div");
    lista.id = "listaConjunto";

    const acoes = document.createElement("div");
    acoes.className = "acoes-conjunto";

    const adicionar = document.createElement("button");

    adicionar.id = "adicionarConjunto";
    adicionar.type = "button";
    adicionar.className = "btn btn-secundario";
    adicionar.textContent = "+ Adicionar";

    const salvar = form.querySelector('button[type="submit"]');

    if (!salvar) return;

    salvar.textContent = "Salvar registro";
    salvar.before(painel, lista, acoes);

    acoes.append(adicionar, salvar);

    function itensAtuais() {
        return [
            {
                modelo: modeloSelecionado,
                codigo: valor("reservaCodigo"),
                serie: valor("reservaSerie")
            },
            ...extras
        ];
    }

    function livre(modelo) {
        const incluidos = itensAtuais().filter(
            item => item.modelo === modelo
        ).length;

        return Math.max(
            0,
            saldo(modelo, setorAtual).disponiveis - incluidos
        );
    }

    function listar() {
        const destino = el("opcoesConjunto");

        destino.replaceChildren();

        const busca = normalizar(valor("buscaConjunto"));

        const modelos = [
            ...new Set([
                ...MODELOS,
                ...dados.entradas.map(item => item.modelo),
                ...(dados.catalogoImportado || []).map(
                    item => item.modelo
                )
            ])
        ].filter(Boolean);

        modelos
            .filter(modelo => normalizar(modelo).includes(busca))
            .forEach(modelo => {
                const quantidade = livre(modelo);

                const botao = document.createElement("button");

                botao.type = "button";
                botao.className = "opcao-conjunto";
                botao.disabled = quantidade < 1;

                const nome = document.createElement("span");

                nome.textContent =
                    modelo +
                    (acessorio(modelo) ? " • Acessório" : "");

                const selo = document.createElement("span");

                selo.className =
                    "saldo-conjunto " +
                    (quantidade > 0 ? "verde" : "vermelho");

                selo.textContent =
                    (quantidade > 0
                        ? "Disponível"
                        : "Indisponível") +
                    " · " +
                    quantidade;

                botao.append(nome, selo);

                botao.onclick = function () {
                    escolhido = modelo;

                    el("selecaoConjunto").textContent =
                        "Selecionado: " + modelo;

                    el("codigoConjunto").focus();
                };

                destino.append(botao);
            });
    }

    function mostrarItens() {
        lista.replaceChildren();

        if (!extras.length) return;

        const titulo = document.createElement("strong");

        titulo.textContent = "Itens deste registro";
        lista.append(titulo);

        itensAtuais().forEach((item, indice) => {
            const linha = document.createElement("div");

            linha.className = "linha-conjunto";

            const texto = document.createElement("span");

            texto.textContent = [
                item.modelo,
                item.codigo || "Sem código",
                item.serie || "Sem série"
            ].join(" — ");

            linha.append(texto);

            if (indice > 0) {
                const remover = document.createElement("button");

                remover.type = "button";
                remover.textContent = "Remover";

                remover.onclick = function () {
                    extras.splice(indice - 1, 1);
                    mostrarItens();
                    listar();
                };

                linha.append(remover);
            }

            lista.append(linha);
        });
    }

    adicionar.onclick = function () {
        if (registroEmEdicao) {
            alert(
                "Para acrescentar itens, crie um novo registro. " +
                "Esta edição altera apenas o item aberto."
            );
            return;
        }

        atualizarDados();

        painel.hidden = !painel.hidden;

        if (!painel.hidden) {
            listar();
            el("buscaConjunto").focus();
        }
    };

    el("buscaConjunto").oninput = listar;

    el("incluirConjunto").onclick = function () {
        atualizarDados();

        if (!escolhido || livre(escolhido) < 1) {
            alert("Selecione um item disponível.");
            return;
        }

        const codigo = valor("codigoConjunto");
        const serie = valor("serieConjunto");

        if (
            !codigo ||
            (!serie && !acessorio(escolhido))
        ) {
            alert(
                "Preencha código e número de série da máquina."
            );
            return;
        }

        extras.push({
            modelo: escolhido,
            codigo,
            serie
        });

        escolhido = "";

        el("codigoConjunto").value = "";
        el("serieConjunto").value = "";

        el("selecaoConjunto").textContent =
            "Item incluído. Selecione outro, se desejar.";

        mostrarItens();
        listar();
    };

    // Limpa os itens temporários quando abre outro registro.

    const selecionarAntes = selecionarModelo;

    selecionarModelo = function (modelo) {
        extras = [];
        escolhido = "";

        painel.hidden = true;
        lista.replaceChildren();

        selecionarAntes(modelo);
    };

    // -------------------------------------------------
    // REABRIR FORMULÁRIOS SALVOS
    // -------------------------------------------------

    const seletorSalvos = document.createElement("div");

    seletorSalvos.id = "conjuntosSalvos";
    seletorSalvos.className = "nao-imprimir";

    seletorSalvos.innerHTML = `
        <label for="selecionarConjuntoSalvo">
            Abrir formulário de um registro salvo
        </label>

        <select id="selecionarConjuntoSalvo"></select>
    `;

    el("telaFormularioComercial").prepend(seletorSalvos);

    function atualizarSalvos() {
        const seletor = el("selecionarConjuntoSalvo");

        seletor.replaceChildren(
            new Option("Selecione o registro...", "")
        );

        const grupos = new Map();

        dados.reservas.forEach(registro => {
            if (registro.conjuntoId) {
                grupos.set(registro.conjuntoId, registro);
            }
        });

        [...grupos].reverse().forEach(([id, registro]) => {
            seletor.add(
                new Option(
                    registro.cliente +
                    " — " +
                    (registro.conjuntoNumero || id),
                    id
                )
            );
        });
    }

    function preencherFormulario(id, abrir) {
        const itens = dados.reservas.filter(
            registro => registro.conjuntoId === id
        );

        if (!itens.length) return;

        if (abrir) {
            document.querySelector(
                '[aria-controls="telaFormularioComercial"]'
            ).click();
        }

        el("clienteFormularioComercial").value =
            itens[0].cliente;

        [
            "maquinasFormularioComercial",
            "acessoriosFormularioComercial"
        ].forEach(idTabela => {
            const tabela = el(idTabela);

            tabela.replaceChildren();

            const tabelaAcessorios =
                idTabela === "acessoriosFormularioComercial";

            const registros = itens.filter(
                registro =>
                    acessorio(registro.modelo) === tabelaAcessorios
            );

            const linhas = registros.map(registro => {
                if (!tabelaAcessorios) {
                    return [
                        registro.modelo,
                        registro.codigo,
                        registro.serie
                    ];
                }

                const disponibilidade =
                    registro.status === "vendida"
                        ? "Vendido"
                        : reservaAtiva(registro)
                            ? "Reservado"
                            : "Reserva encerrada";

                return [
                    registro.modelo,
                    registro.codigo,
                    disponibilidade
                ];
            });

            while (linhas.length < 8) {
                linhas.push(["", "", ""]);
            }

            linhas.forEach(valores => {
                const linha = document.createElement("tr");

                valores.forEach(conteudo => {
                    const celula = document.createElement("td");
                    const campo = document.createElement("input");

                    campo.type = "text";
                    campo.value = conteudo || "";

                    celula.append(campo);
                    linha.append(celula);
                });

                tabela.append(linha);
            });
        });

        el("selecionarConjuntoSalvo").value = id;
    }

    el("selecionarConjuntoSalvo").onchange = function (evento) {
        atualizarDados();

        preencherFormulario(
            evento.target.value,
            false
        );
    };

    document.querySelector(
        '[aria-controls="telaFormularioComercial"]'
    ).addEventListener("click", function () {
        atualizarDados();
        atualizarSalvos();
    });

    atualizarSalvos();

    // -------------------------------------------------
    // SALVAR TODOS OS ITENS DO REGISTRO
    // -------------------------------------------------

    form.addEventListener("submit", function (evento) {
        // Mantém a edição individual pelo relatório.
        if (registroEmEdicao) return;

        evento.preventDefault();
        evento.stopImmediatePropagation();

        if (!form.reportValidity()) return;

        if (
            escolhido ||
            valor("codigoConjunto") ||
            valor("serieConjunto")
        ) {
            alert(
                "Clique em Incluir item ou limpe os campos " +
                "do item antes de salvar."
            );
            return;
        }

        executar(function () {
            expirarReservas();

            const itens = itensAtuais();

            const status = valor("reservaStatus");
            const cliente = valor("reservaCliente");
            const vendedor = valor("reservaVendedor");

            const dataReserva = valor("reservaData");
            const vencimento = calcularVencimento();

            if (
                !cliente ||
                !vendedor ||
                !dataReserva ||
                !["ativa", "vendida", "disponivel"].includes(status)
            ) {
                throw new Error(
                    "Confira cliente, vendedor, data e status."
                );
            }

            if (
                status === "ativa" &&
                (
                    !vencimento ||
                    vencimento.getTime() <= Date.now() ||
                    valor("reservaVencimento") < dataReserva
                )
            ) {
                throw new Error(
                    "Informe uma data limite futura e " +
                    "posterior ou igual à data da reserva."
                );
            }

            const usados = new Map();
            const series = new Set();

            // Confere todos os itens antes de gravar qualquer um.
            itens.forEach(item => {
                if (
                    !item.modelo ||
                    !item.codigo ||
                    (!item.serie && !acessorio(item.modelo))
                ) {
                    throw new Error(
                        "Preencha modelo, código e série " +
                        "de cada máquina."
                    );
                }

                const quantidade =
                    (usados.get(item.modelo) || 0) + 1;

                usados.set(item.modelo, quantidade);

                if (
                    saldo(item.modelo, setorAtual).disponiveis <
                    quantidade
                ) {
                    throw new Error(
                        "Saldo insuficiente: " + item.modelo
                    );
                }

                if (!item.serie) return;

                const chave =
                    normalizar(item.modelo) +
                    "|" +
                    normalizar(item.serie);

                const repetida = dados.reservas.some(registro =>
                    registro.modelo === item.modelo &&
                    normalizar(registro.serie || "") ===
                        normalizar(item.serie) &&
                    (
                        reservaAtiva(registro) ||
                        ["vendida", "disponivel"].includes(
                            registro.status
                        )
                    )
                );

                const saiu = dados.saidas.some(registro =>
                    registro.modelo === item.modelo &&
                    registro.serie &&
                    normalizar(registro.serie) ===
                        normalizar(item.serie)
                );

                if (series.has(chave) || repetida || saiu) {
                    throw new Error(
                        "Série repetida ou já utilizada: " +
                        item.modelo +
                        " / " +
                        item.serie
                    );
                }

                series.add(chave);
            });

            const agora = new Date().toISOString();
            const conjuntoId = novoId();
            const conjuntoNumero = "REG-" + conjuntoId;

            const registros = itens.map(item => {
                const campos = {
                    ...item,

                    setor: setorAtual,
                    quantidade: 1,

                    cliente,
                    vendedor,

                    matricula: valor("reservaMatricula"),

                    dataReserva,

                    vencimento: vencimento
                        ? vencimento.toISOString()
                        : "",

                    nf: valor("reservaNF"),
                    dataEmissao: valor("reservaEmissao"),

                    status,

                    observacoes: valor("reservaObservacoes"),

                    conjuntoId,
                    conjuntoNumero
                };

                return {
                    ...campos,

                    id: novoId(),

                    criadaEm: agora,
                    atualizadaEm: agora,

                    historico: [
                        {
                            ...campos,
                            em: agora
                        }
                    ]
                };
            });

            const novasSaidas = status === "vendida"
                ? registros.map(registro => ({
                    ...registro,

                    id: novoId(),
                    reservaId: registro.id,

                    tipo: "venda",
                    data: hoje(),

                    responsavel: vendedor,
                    registradaEm: agora
                }))
                : [];

            gravarDados({
                ...dados,

                reservas: [
                    ...dados.reservas,
                    ...registros
                ],

                saidas: [
                    ...dados.saidas,
                    ...novasSaidas
                ]
            });

            extras = [];
            escolhido = "";

            lista.replaceChildren();
            painel.hidden = true;

            el("codigoConjunto").value = "";
            el("serieConjunto").value = "";

            renderizarTudo();
            atualizarSalvos();

            preencherFormulario(conjuntoId, true);

            mensagem(
                "Registro salvo com " +
                registros.length +
                " item(ns). Formulário preenchido.",
                "sucesso"
            );
        });
    }, true);
});

// =====================================================
// FORMULÁRIO COM TODOS OS DADOS DO REGISTRO
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    const el = id => document.getElementById(id);

    const folha = document.querySelector(".folha-comercial");
    const cliente = el("clienteFormularioComercial");
    const seletor = el("selecionarConjuntoSalvo");

    if (!folha || !cliente || !seletor) return;
    if (el("dadosCompletosFormulario")) return;

    // CLIENTE E VENDEDOR NO CABEÇALHO

    cliente.placeholder = "CLIENTE";
    cliente.setAttribute("aria-label", "Cliente");

    const rotuloCliente = document.createElement("label");
    rotuloCliente.className = "rotulo-dados-formulario";
    rotuloCliente.htmlFor = cliente.id;
    rotuloCliente.textContent = "CLIENTE";

    cliente.before(rotuloCliente);

    const rotuloVendedor = document.createElement("label");
    rotuloVendedor.className = "rotulo-dados-formulario";
    rotuloVendedor.htmlFor = "vendedorFormularioComercial";
    rotuloVendedor.textContent = "VENDEDOR";

    const vendedor = document.createElement("input");

    vendedor.id = "vendedorFormularioComercial";
    vendedor.type = "text";
    vendedor.placeholder = "VENDEDOR";
    vendedor.autocomplete = "off";

    cliente.after(rotuloVendedor, vendedor);

    // DADOS COMPLEMENTARES DO REGISTRO

    const detalhes = document.createElement("section");
    detalhes.id = "dadosCompletosFormulario";

    const observacao = folha.querySelector(
        ".observacao-comercial"
    );

    if (observacao) {
        observacao.before(detalhes);
    } else {
        folha.append(detalhes);
    }

    const estilo = document.createElement("style");

    estilo.textContent = `
        .rotulo-dados-formulario {
            display: block;
            margin-top: 14px;
            margin-bottom: 4px;
            color: #173858;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            text-align: left;
        }

        #clienteFormularioComercial {
            font-size: 28px !important;
            text-align: left !important;
        }

        #vendedorFormularioComercial {
            width: 100%;
            font-size: 22px;
            font-weight: 700;
            color: #173858;
            text-align: left;
        }

        #dadosCompletosFormulario {
            margin-top: 24px;
            color: #111;
        }

        #dadosCompletosFormulario h3 {
            margin: 20px 0 12px;
            color: #111;
        }

        .detalhe-item-formulario {
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #9baebe;
            break-inside: avoid;
        }

        .detalhe-item-formulario h4 {
            margin: 0 0 12px;
            color: #173858;
        }

        .grade-dados-formulario {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .campo-dados-formulario {
            display: block;
            color: #111;
            font-size: 12px;
            font-weight: 700;
        }

        .campo-dados-formulario input,
        .campo-dados-formulario textarea {
            display: block;
            box-sizing: border-box;
            width: 100%;
            margin-top: 4px;
            padding: 7px;
            border: 1px solid #b2c0cc;
            border-radius: 0;
            background: #fff;
            color: #111;
            font: 14px Arial, sans-serif;
            font-weight: 400;
        }

        .campo-dados-formulario.completo {
            grid-column: 1 / -1;
        }

        .campo-dados-formulario textarea {
            min-height: 65px;
            resize: vertical;
        }

        @media print {
            #dadosCompletosFormulario {
                display: block !important;
            }

            .detalhe-item-formulario {
                break-inside: avoid;
            }

            #dadosCompletosFormulario textarea {
                overflow: visible;
                resize: none;
            }
        }
    `;

    document.head.append(estilo);

    function formatarData(valor) {
        if (!valor) return "";

        const data = String(valor).slice(0, 10);
        const partes = data.split("-");

        return partes.length === 3
            ? partes.reverse().join("/")
            : valor;
    }

    function nomeStatus(registro) {
        if (
            registro.status === "ativa" &&
            !reservaAtiva(registro)
        ) {
            return "Expirada";
        }

        const nomes = {
            ativa: "Reservado",
            disponivel: "Disponível",
            vendida: "Vendido",
            expirada: "Expirada",
            cancelada: "Cancelada",
            concluida: "Concluída"
        };

        return nomes[registro.status] || registro.status || "";
    }

    function adicionarCampo(
        destino,
        nome,
        conteudo,
        completo = false
    ) {
        const rotulo = document.createElement("label");

        rotulo.className =
            "campo-dados-formulario" +
            (completo ? " completo" : "");

        const texto = document.createElement("span");
        texto.textContent = nome;

        const campo = document.createElement(
            completo ? "textarea" : "input"
        );

        if (!completo) campo.type = "text";

        campo.value = conteudo || "";

        rotulo.append(texto, campo);
        destino.append(rotulo);

        if (completo) {
            function ajustarAltura() {
                campo.style.height = "auto";
                campo.style.height =
                    Math.max(65, campo.scrollHeight) + "px";
            }

            campo.addEventListener("input", ajustarAltura);

            requestAnimationFrame(ajustarAltura);
        }
    }

    function atualizarFormularioCompleto() {
        const conjuntoId = seletor.value;

        if (!conjuntoId) {
            vendedor.value = "";
            detalhes.replaceChildren();
            return;
        }

        const registros = dados.reservas.filter(
            item => item.conjuntoId === conjuntoId
        );

        if (!registros.length) return;

        const primeiro = registros[0];

        cliente.value = primeiro.cliente || "";

        vendedor.value = [
            ...new Set(
                registros
                    .map(item => item.vendedor)
                    .filter(Boolean)
            )
        ].join(" / ");

        detalhes.replaceChildren();

        const titulo = document.createElement("h3");

        titulo.textContent = "Dados completos do registro";
        detalhes.append(titulo);

        registros.forEach(registro => {
            const bloco = document.createElement("div");
            bloco.className = "detalhe-item-formulario";

            const modelo = document.createElement("h4");

            modelo.textContent = registro.modelo;
            bloco.append(modelo);

            const grade = document.createElement("div");
            grade.className = "grade-dados-formulario";

            adicionarCampo(
                grade,
                "Matrícula",
                registro.matricula
            );

            adicionarCampo(
                grade,
                "Vendedor",
                registro.vendedor
            );

            adicionarCampo(
                grade,
                "Cliente",
                registro.cliente
            );

            adicionarCampo(
                grade,
                "Máquina / acessório",
                registro.modelo
            );

            adicionarCampo(
                grade,
                "Código",
                registro.codigo
            );

            adicionarCampo(
                grade,
                "Número de série",
                registro.serie
            );

            adicionarCampo(
                grade,
                "Data da reserva",
                formatarData(registro.dataReserva)
            );

            adicionarCampo(
                grade,
                "Data limite da reserva",
                formatarData(registro.vencimento)
            );

            adicionarCampo(
                grade,
                "Número da nota fiscal",
                registro.nf
            );

            adicionarCampo(
                grade,
                "Data de emissão",
                formatarData(registro.dataEmissao)
            );

            adicionarCampo(
                grade,
                "Status",
                nomeStatus(registro)
            );

            adicionarCampo(
                grade,
                "Estoque",
                setorDe(registro) === "showroom"
                    ? "SHOW ROOM"
                    : "Estoque principal"
            );

            adicionarCampo(
                grade,
                "Observações",
                registro.observacoes,
                true
            );

            bloco.append(grade);
            detalhes.append(bloco);
        });
    }

    // Atualiza ao escolher um registro salvo.

    seletor.addEventListener("change", function () {
        queueMicrotask(atualizarFormularioCompleto);
    });

    // Atualiza depois de salvar ou editar um registro.

    const gravarAntes = gravarDados;

    gravarDados = function (proximosDados) {
        const resultado = gravarAntes(proximosDados);

        queueMicrotask(atualizarFormularioCompleto);

        return resultado;
    };

    // Atualiza ao abrir o menu FORMULÁRIO.

    const menuFormulario = document.querySelector(
        '[aria-controls="telaFormularioComercial"]'
    );

    if (menuFormulario) {
        menuFormulario.addEventListener("click", function () {
            queueMicrotask(atualizarFormularioCompleto);
        });
    }

    // Limpa os dados complementares ao limpar o formulário.

    const limpar = el("limparFormularioComercial");

    if (limpar) {
        limpar.addEventListener("click", function () {
            queueMicrotask(function () {
                // O código original limpa o cliente quando
                // o usuário confirma a limpeza.
                if (cliente.value !== "") return;

                vendedor.value = "";
                seletor.value = "";
                detalhes.replaceChildren();
            });
        });
    }

    atualizarFormularioCompleto();
});

// Retira a matrícula da tela de reserva.
document.addEventListener("DOMContentLoaded", function () {
    const campo = document.getElementById("reservaMatricula");

    if (!campo) return;

    campo.required = false;
    campo.removeAttribute("aria-required");
    campo.type = "hidden";

    const rotulo = document.querySelector(
        'label[for="reservaMatricula"]'
    );

    if (rotulo) {
        rotulo.hidden = true;
        rotulo.style.display = "none";
    }

    // Oculta também o espaço do campo, caso exista
    // um contêiner exclusivo para ele.
    const recipiente = campo.closest(
        ".campo, .form-group, .campo-formulario"
    );

    if (
        recipiente &&
        recipiente.querySelectorAll(
            "input, select, textarea"
        ).length === 1
    ) {
        recipiente.hidden = true;
        recipiente.style.display = "none";
    }
});

// =====================================================
// CONFIGURAÇÕES — SMI MÁQUINAS
// =====================================================

(function () {
    "use strict";

    const CHAVE_PREFERENCIAS = "smi_maquinas_preferencias_v1";

    let preferencias = {
        tema: "escuro",
        idioma: "pt-BR"
    };

    try {
        const salvas = JSON.parse(
            localStorage.getItem(CHAVE_PREFERENCIAS) || "null"
        );

        if (salvas?.tema === "claro") {
            preferencias.tema = "claro";
        }

        if (salvas?.idioma === "it-IT") {
            preferencias.idioma = "it-IT";
        }
    } catch (_) {
        // Mantém o padrão quando não houver preferência válida.
    }

    document.documentElement.dataset.temaSmi = preferencias.tema;
    document.documentElement.lang = preferencias.idioma;

    // -------------------------------------------------
    // TEXTOS DA INTERFACE EM ITALIANO
    // -------------------------------------------------

    const traducoes = {
        "Configurações": "Impostazioni",
        "Dados da Empresa": "Dati dell'azienda",
        "Empresa": "Azienda",
        "Sistema": "Sistema",
        "Depósitos": "Magazzini",

        "2 unidades — Estoque principal e SHOW ROOM":
            "2 unità — Magazzino principale e SHOW ROOM",

        "Usuário Atual": "Utente attuale",

        "Sessão local — sem login":
            "Sessione locale — senza accesso",

        "Aparência do Sistema": "Aspetto del sistema",

        "Escolha o tema visual do aplicativo.":
            "Scegli il tema dell'applicazione.",

        "Modo Claro": "Tema chiaro",
        "Modo Escuro": "Tema scuro",

        "Visual claro em todas as telas":
            "Interfaccia chiara in tutte le schermate",

        "Visual escuro em todas as telas":
            "Interfaccia scura in tutte le schermate",

        "Salvar aparência": "Salva aspetto",
        "Idioma do Sistema": "Lingua del sistema",

        "Escolha o idioma da interface.":
            "Scegli la lingua dell'interfaccia.",

        "Português (Brasil)": "Portoghese (Brasile)",
        "Italiano": "Italiano",
        "Salvar idioma": "Salva lingua",

        "Preferências salvas neste navegador.":
            "Preferenze salvate in questo browser.",

        "Aparência salva.": "Aspetto salvato.",
        "Idioma salvo.": "Lingua salvata.",

        "Não foi possível salvar as preferências neste navegador.":
            "Impossibile salvare le preferenze in questo browser.",

        "Estoque": "Magazzino",
        "Entradas": "Entrate",
        "Saídas": "Uscite",
        "Reservas": "Prenotazioni",
        "Relatórios": "Report",
        "FORMULÁRIO": "MODULO",
        "Formulário comercial": "Modulo commerciale",

        "Estoque de máquinas": "Magazzino macchine",
        "Entrada de máquinas": "Entrata macchine",
        "Saída de máquinas": "Uscita macchine",
        "Estoque principal": "Magazzino principale",

        "Gestão de máquinas": "Gestione macchine",

        "Controle de estoque de máquinas":
            "Gestione del magazzino macchine",

        "Atualizar": "Aggiorna",
        "+ Nova entrada": "+ Nuova entrata",
        "Nova entrada": "Nuova entrata",

        "Teste local • Dados neste navegador":
            "Test locale • Dati in questo browser",

        "Modo de teste local: os dados ficam somente neste navegador.":
            "Modalità di prova locale: i dati rimangono in questo browser.",

        "Indicadores: Estoque principal. Saldos separados.":
            "Indicatori: magazzino principale. Giacenze separate.",

        "Indicadores: SHOW ROOM. Saldos separados.":
            "Indicatori: SHOW ROOM. Giacenze separate.",

        "Total em estoque": "Totale in magazzino",
        "Disponível": "Disponibile",
        "Indisponível": "Non disponibile",
        "Sem disponível": "Non disponibile",
        "Reservado": "Prenotato",
        "Vendido": "Venduto",

        "Disponíveis + reservadas": "Disponibili + prenotate",

        "Liberadas para reserva ou venda":
            "Disponibili per prenotazione o vendita",

        "Reservas dentro do prazo": "Prenotazioni in corso",
        "Vendas acumuladas": "Vendite accumulate",

        "Catálogo de máquinas": "Catalogo macchine",

        "Selecione uma máquina para reservar ou vender":
            "Seleziona una macchina da prenotare o vendere",

        "Selecione uma máquina para reservar ou vender.":
            "Seleziona una macchina da prenotare o vendere.",

        "Controle por modelo e quantidade. Número de série informado na reserva ou venda.":
            "Gestione per modello e quantità. Numero di serie indicato nella prenotazione o vendita.",

        "Buscar modelo": "Cerca modello",
        "Buscar modelo...": "Cerca modello...",
        "Digite o modelo...": "Digita il modello...",
        "Disponibilidade": "Disponibilità",
        "Todos os modelos": "Tutti i modelli",
        "Somente disponíveis": "Solo disponibili",
        "Com disponibilidade": "Disponibili",
        "Sem disponibilidade": "Non disponibili",
        "Foto a cadastrar": "Foto da inserire",

        "Estoque principal — modelos na sequência definida.":
            "Magazzino principale — modelli nell'ordine definito.",

        "SHOW ROOM — modelos na sequência definida.":
            "SHOW ROOM — modelli nell'ordine definito.",

        "Total": "Totale",
        "Selecionar máquina": "Seleziona macchina",
        "Selecionado": "Selezionato",
        "Nenhum modelo encontrado.": "Nessun modello trovato.",
        "Anterior": "Precedente",
        "Próxima": "Successiva",

        "Registrar máquina": "Registra macchina",
        "Dados da máquina": "Dati della macchina",
        "Matrícula": "Matricola",
        "Matrícula (opcional)": "Matricola (facoltativa)",
        "Vendedor": "Venditore",
        "Cliente": "Cliente",
        "Máquina": "Macchina",
        "Código": "Codice",
        "Data da reserva": "Data della prenotazione",
        "Data limite reserva": "Scadenza prenotazione",
        "Data limite da reserva": "Scadenza della prenotazione",
        "Nº nota fiscal": "N. fattura",
        "N° nota fiscal": "N. fattura",
        "Nº da nota fiscal": "N. fattura",
        "Data emissão": "Data di emissione",
        "Data de emissão": "Data di emissione",
        "Status": "Stato",
        "Observações": "Note",

        "Salvar registro": "Salva registrazione",
        "Novo registro": "Nuova registrazione",
        "Cancelar": "Annulla",
        "Fechar": "Chiudi",
        "+ Adicionar": "+ Aggiungi",
        "Adicionar": "Aggiungi",

        "Adicionar máquina ou acessório":
            "Aggiungi macchina o accessorio",

        "Buscar máquina ou acessório":
            "Cerca macchina o accessorio",

        "Selecione um item disponível.":
            "Seleziona un articolo disponibile.",

        "Nº de série": "N. di serie",
        "Número de série": "Numero di serie",
        "Incluir item": "Aggiungi articolo",
        "Itens deste registro": "Articoli della registrazione",
        "Remover": "Rimuovi",
        "Sem código": "Senza codice",
        "Sem série": "Senza numero di serie",

        "Itens indisponíveis não podem ser adicionados. Série opcional para acessórios.":
            "Gli articoli non disponibili non possono essere aggiunti. Numero di serie facoltativo per gli accessori.",

        "Item incluído. Selecione outro, se desejar.":
            "Articolo aggiunto. Selezionane un altro, se desideri.",

        "Preencha código e número de série da máquina.":
            "Inserisci codice e numero di serie della macchina.",

        "Clique em Incluir item ou limpe os campos do item antes de salvar.":
            "Fai clic su Aggiungi articolo oppure svuota i campi dell'articolo prima di salvare.",

        "Registre a quantidade recebida por modelo.":
            "Registra la quantità ricevuta per modello.",

        "S/N (opcional na entrada)":
            "S/N (facoltativo in entrata)",

        "Estoque de destino": "Magazzino di destinazione",
        "Modelo": "Modello",
        "Selecione o modelo": "Seleziona il modello",
        "Quantidade": "Quantità",
        "Data da entrada": "Data di entrata",
        "Origem": "Origine",
        "Nota fiscal": "Fattura",
        "Responsável": "Responsabile",
        "Registrar entrada": "Registra entrata",
        "Histórico de entradas": "Storico entrate",

        "Histórico de entradas, reservas e vendas":
            "Storico di entrate, prenotazioni e vendite",

        "Todos": "Tutti",
        "Todas": "Tutte",
        "Vendas": "Vendite",
        "Expiradas": "Scadute",
        "Expirada": "Scaduta",
        "Buscar": "Cerca",

        "Máquina, cliente, matrícula, código ou S/N":
            "Macchina, cliente, matricola, codice o S/N",

        "Principal": "Principale",
        "De": "Dal",
        "Até": "Al",
        "Consultar": "Consulta",
        "Limpar": "Pulisci",
        "Exportar CSV (Excel)": "Esporta CSV (Excel)",
        "Imprimir": "Stampa",
        "Tipo": "Tipo",
        "Data": "Data",
        "Qtd.": "Qtà",
        "Limite reserva": "Scadenza prenotazione",
        "Nº NF": "N. fattura",
        "Emissão": "Emissione",
        "Ações": "Azioni",
        "Editar / vender": "Modifica / vendi",
        "Entrada": "Entrata",
        "Reserva": "Prenotazione",
        "Venda": "Vendita",
        "Cancelada": "Annullata",
        "Concluída": "Completata",
        "Ativa": "Attiva",
        "Convertida em venda": "Convertita in vendita",
        "Registrada": "Registrata",
        "Confirmada": "Confermata",

        "Nenhum registro encontrado para os filtros selecionados.":
            "Nessuna registrazione trovata con i filtri selezionati.",

        "Nenhum registro encontrado.":
            "Nessuna registrazione trovata.",

        "Reservas expiradas liberam a disponibilidade sem gerar outra entrada. Nesta versão local, os prazos são conferidos ao abrir e durante o uso do aplicativo.":
            "Le prenotazioni scadute liberano la disponibilità senza creare una nuova entrata. In questa versione locale, le scadenze vengono controllate all'apertura e durante l'uso dell'applicazione.",

        "Registros antigos sem matrícula, código ou S/N mantêm esses campos em branco. O período considera a data de cada entrada, reserva ou venda.":
            "Le registrazioni precedenti senza matricola, codice o S/N mantengono questi campi vuoti. Il periodo considera la data di ogni entrata, prenotazione o vendita.",

        "Imprimir formulário": "Stampa modulo",
        "Limpar formulário": "Pulisci modulo",
        "CLIENTE": "CLIENTE",
        "VENDEDOR": "VENDITORE",
        "CLIENTE / PROJETO": "CLIENTE / VENDITORE",
        "Máquinas": "Macchine",
        "Modelo Máquina": "Modello macchina",
        "+ Adicionar máquina": "+ Aggiungi macchina",
        "Acessórios": "Accessori",
        "ACESSÓRIO": "ACCESSORIO",
        "Acessório": "Accessorio",
        "Descrição": "Descrizione",
        "+ Adicionar acessório": "+ Aggiungi accessorio",

        "Abrir formulário de um registro salvo":
            "Apri il modulo di una registrazione salvata",

        "Selecione o registro...": "Seleziona la registrazione...",
        "Dados completos do registro": "Dati completi della registrazione",
        "Máquina / acessório": "Macchina / accessorio",
        "Número da nota fiscal": "Numero della fattura",
        "Reserva encerrada": "Prenotazione terminata",

        "Preencha o cliente ou projeto, as máquinas e os acessórios. Depois clique em imprimir.":
            "Inserisci cliente, venditore, macchine e accessori. Poi fai clic su Stampa.",

        "Exportações": "Esportazioni",
        "Exportar": "Esporta",
        "Baixar backup": "Scarica backup",

        "Baixar backup dos dados atuais":
            "Scarica backup dei dati attuali",

        "Salvar": "Salva",
        "Menu principal": "Menu principale",
        "Tipo de relatório": "Tipo di report",
        "Fechar formulário": "Chiudi modulo",
        "Visualização em grade": "Vista a griglia",
        "Visualização em lista": "Vista a elenco",

        "Aguardando carregamento.": "Caricamento in corso.",
        "Buscar registro": "Cerca registrazione",
        "Cliente / destino": "Cliente / destinazione",
        "Com reservas": "Con prenotazioni",
        "Com saldo disponível": "Con disponibilità",
        "Com vendas": "Con vendite",

        "Consulte e exporte os registros do sistema.":
            "Consulta ed esporta le registrazioni del sistema.",

        "Consulte os registros ou abra uma reserva para vender.":
            "Consulta le registrazioni o apri una prenotazione per vendere.",

        "Controle das máquinas": "Gestione delle macchine",
        "Data da saída": "Data di uscita",
        "Entradas registradas": "Entrate registrate",
        "Estoque atual": "Giacenza attuale",
        "Histórico de saídas": "Storico uscite",
        "Registrar saída": "Registra uscita",
        "Registros completos": "Registrazioni complete",
        "Registros e reservas": "Registrazioni e prenotazioni",
        "Reserva vinculada": "Prenotazione collegata",
        "Saída registrada": "Uscita registrata",
        "Saída sem reserva": "Uscita senza prenotazione",
        "Saídas registradas": "Uscite registrate",
        "Sem estoque": "Esaurito",

        "Cada registro identifica uma unidade. Reservas vencidas liberam a máquina. Vendido dá baixa imediata no estoque.":
            "Ogni registrazione identifica un'unità. Le prenotazioni scadute liberano la macchina. La vendita scarica immediatamente la giacenza.",

        "Para estoque atual, o período não se aplica. Nos registros completos, o período considera a data da reserva ou do registro da saída.":
            "Il periodo non si applica alla giacenza attuale. Per le registrazioni complete si considera la data della prenotazione o dell'uscita.",

        "Para vender com todos os dados da máquina, utilize o formulário do catálogo ou Reservas → Editar / vender.":
            "Per vendere con tutti i dati della macchina, utilizza il modulo del catalogo o Prenotazioni → Modifica / vendi.",

        "SMI Máquinas — Relatórios": "SMI Máquinas — Report",
        "Relatório de máquinas": "Report macchine",

        "A data inicial deve ser anterior ou igual à final.":
            "La data iniziale deve essere precedente o uguale alla data finale.",

        "Permita abrir a janela de impressão neste site.":
            "Consenti l'apertura della finestra di stampa su questo sito.",

        "Selecione um modelo no catálogo.":
            "Seleziona un modello nel catalogo.",

        "Preencha os campos obrigatórios.":
            "Compila i campi obbligatori.",

        "Informe uma data limite futura e igual ou posterior à data da reserva.":
            "Inserisci una scadenza futura, uguale o successiva alla data della prenotazione.",

        "Informe uma data limite futura e posterior ou igual à data da reserva.":
            "Inserisci una scadenza futura, uguale o successiva alla data della prenotazione.",

        "Confira cliente, vendedor, data e status.":
            "Controlla cliente, venditore, data e stato.",

        "Preencha modelo, código e série de cada máquina.":
            "Inserisci modello, codice e numero di serie di ogni macchina.",

        "Esta série já está cadastrada ou já teve saída. Edite o registro existente.":
            "Questo numero di serie è già registrato o è già uscito. Modifica la registrazione esistente.",

        "Registro não encontrado.": "Registrazione non trovata.",
        "Status inválido.": "Stato non valido.",

        "Este registro já possui saída.":
            "Questa registrazione ha già un'uscita.",

        "Este registro já possui saída e não pode ser vendido novamente.":
            "Questa registrazione ha già un'uscita e non può essere venduta nuovamente.",

        "Venda registrada e estoque baixado.":
            "Vendita registrata e giacenza aggiornata.",

        "Registro salvo. Consulte em Relatórios ou Exportações.":
            "Registrazione salvata. Consulta Report o Esportazioni.",

        "Para acrescentar itens, crie um novo registro. Esta edição altera apenas o item aberto.":
            "Per aggiungere articoli crea una nuova registrazione. Questa modifica riguarda soltanto l'articolo aperto.",

        "Ao informar S/N, registre uma máquina por entrada. Para um lote, deixe S/N vazio.":
            "Se indichi S/N, registra una macchina per entrata. Per un lotto lascia S/N vuoto.",

        "Sem saldo disponível neste estoque. Abra o registro existente para vender ou liberar a máquina.":
            "Nessuna disponibilità in questo magazzino. Apri la registrazione esistente per vendere o liberare la macchina."
    };

    function traduzir(texto) {
        if (
            preferencias.idioma !== "it-IT" ||
            typeof texto !== "string"
        ) {
            return texto;
        }

        const inicio = texto.match(/^\s*/)[0];
        const fim = texto.match(/\s*$/)[0];
        const base = texto.trim().replace(/\s+/g, " ");

        if (traducoes[base]) {
            return inicio + traducoes[base] + fim;
        }

        if (base.startsWith("✓ ")) {
            return inicio + "✓ " + traduzir(base.slice(2)) + fim;
        }

        if (
            base.endsWith(" *") &&
            traducoes[base.slice(0, -2)]
        ) {
            return (
                inicio +
                traducoes[base.slice(0, -2)] +
                " *" +
                fim
            );
        }

        let resultado;

        if ((resultado = base.match(/^Registrar (.+)$/))) {
            return inicio + "Registra " + resultado[1] + fim;
        }

        if (
            (resultado = base.match(
                /^(\d+) registro\(s\) encontrado\(s\)$/
            ))
        ) {
            return (
                inicio +
                resultado[1] +
                " registrazione/i trovata/e" +
                fim
            );
        }

        if (
            (resultado = base.match(
                /^(Disponível|Indisponível) · (\d+)$/
            ))
        ) {
            return (
                inicio +
                traducoes[resultado[1]] +
                " · " +
                resultado[2] +
                fim
            );
        }

        if (
            (resultado = base.match(
                /^(\d+[–-]\d+ de \d+|0) modelos$/
            ))
        ) {
            return (
                inicio +
                resultado[1].replace(" de ", " di ") +
                " modelli" +
                fim
            );
        }

        if (
            (resultado = base.match(
                /^(.+): (\d+) disponível\(is\)\. Para vender uma reserva, abra o registro em Relatórios\.$/
            ))
        ) {
            return (
                inicio +
                resultado[1] +
                ": " +
                resultado[2] +
                " disponibile/i. Per vendere una prenotazione, " +
                "apri la registrazione nei Report." +
                fim
            );
        }

        if (
            (resultado = base.match(
                /^Registro salvo com (\d+) item\(ns\)\. Formulário preenchido\.$/
            ))
        ) {
            return (
                inicio +
                "Registrazione salvata con " +
                resultado[1] +
                " articolo/i. Modulo compilato." +
                fim
            );
        }

        if ((resultado = base.match(/^Selecionado: (.+)$/))) {
            return inicio + "Selezionato: " + resultado[1] + fim;
        }

        if (
            (resultado = base.match(
                /^(Saldo insuficiente|Série repetida ou já utilizada): (.+)$/
            ))
        ) {
            const titulo =
                resultado[1] === "Saldo insuficiente"
                    ? "Giacenza insufficiente"
                    : "Numero di serie duplicato o già utilizzato";

            return inicio + titulo + ": " + resultado[2] + fim;
        }

        const prefixo = "Não foi possível concluir: ";

        if (base.startsWith(prefixo)) {
            return (
                inicio +
                "Impossibile completare: " +
                traduzir(base.slice(prefixo.length)) +
                fim
            );
        }

        return texto;
    }

    window.smiTraduzir = traduzir;

    // -------------------------------------------------
    // MONTA A TELA
    // -------------------------------------------------

    document.addEventListener("DOMContentLoaded", function () {
        if (document.getElementById("telaConfiguracoesSmi")) {
            return;
        }

        const menu = document.querySelector(".menu");
        const principal = document.querySelector("main");

        if (!menu || !principal) return;

        const tela = document.createElement("section");

        tela.id = "telaConfiguracoesSmi";
        tela.className = "tela";
        tela.hidden = true;

        tela.innerHTML = `
            <section class="cfg-card">
                <h2>Dados da Empresa</h2>

                <dl class="cfg-dados">
                    <div>
                        <dt>Empresa</dt>
                        <dd>SMI DO BRASIL</dd>
                    </div>

                    <div>
                        <dt>Sistema</dt>
                        <dd>SMI MÁQUINAS</dd>
                    </div>

                    <div>
                        <dt>Depósitos</dt>
                        <dd>
                            2 unidades — Estoque principal e SHOW ROOM
                        </dd>
                    </div>
                </dl>
            </section>

            <section class="cfg-card">
                <h2>Usuário Atual</h2>
                <p id="cfgUsuario"></p>
            </section>

            <section class="cfg-card">
                <h2>Aparência do Sistema</h2>

                <p>Escolha o tema visual do aplicativo.</p>

                <div class="cfg-opcoes">
                    <label class="cfg-opcao">
                        <input
                            type="radio"
                            name="cfgTema"
                            value="claro"
                        >

                        <span>
                            <strong>Modo Claro</strong>
                            <small>
                                Visual claro em todas as telas
                            </small>
                        </span>
                    </label>

                    <label class="cfg-opcao">
                        <input
                            type="radio"
                            name="cfgTema"
                            value="escuro"
                        >

                        <span>
                            <strong>Modo Escuro</strong>
                            <small>
                                Visual escuro em todas as telas
                            </small>
                        </span>
                    </label>
                </div>

                <div class="cfg-acoes">
                    <button
                        class="btn btn-primario"
                        type="button"
                        id="cfgSalvarTema"
                    >
                        Salvar aparência
                    </button>
                </div>
            </section>

            <section class="cfg-card">
                <h2>Idioma do Sistema</h2>

                <p>Escolha o idioma da interface.</p>

                <div class="cfg-opcoes">
                    <label class="cfg-opcao">
                        <input
                            type="radio"
                            name="cfgIdioma"
                            value="pt-BR"
                        >

                        <span>
                            <strong>Português (Brasil)</strong>
                            <small>BR</small>
                        </span>
                    </label>

                    <label class="cfg-opcao">
                        <input
                            type="radio"
                            name="cfgIdioma"
                            value="it-IT"
                        >

                        <span>
                            <strong>Italiano</strong>
                            <small>IT</small>
                        </span>
                    </label>
                </div>

                <div class="cfg-acoes">
                    <button
                        class="btn btn-primario"
                        type="button"
                        id="cfgSalvarIdioma"
                    >
                        Salvar idioma
                    </button>
                </div>
            </section>

            <p>Preferências salvas neste navegador.</p>

            <p
                id="cfgAviso"
                role="status"
                aria-live="polite"
            ></p>
        `;

        principal.append(tela);

        // -------------------------------------------------
        // BOTÃO NO MENU
        // -------------------------------------------------

        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = "menu-item";
        botao.setAttribute("aria-controls", tela.id);

        botao.innerHTML = `
            <span
                class="icone-wms cfg-icone"
                aria-hidden="true"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                >
                    <path d="
                        m10 3-.6 2.4-2 .9-2.2-.7-2 3.4
                        1.7 1.8v2.4L3.2 15l2 3.4
                        2.3-.7 2 .9.5 2.4h4l.6-2.4
                        2-.9 2.2.7 2-3.4-1.7-1.8
                        v-2.4L20.8 9l-2-3.4-2.3.7
                        -2-.9L14 3Z
                    "/>

                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </span>

            <span>Configurações</span>

            <span
                class="seta-menu-wms"
                aria-hidden="true"
            >›</span>
        `;

        menu.append(botao);

        const trocarAntes = trocarTela;

        trocarTela = function (nome) {
            tela.hidden = true;

            botao.classList.remove("ativo");
            botao.removeAttribute("aria-current");

            trocarAntes(nome);
        };

        function sincronizar() {
            tela.querySelector(
                `[name="cfgTema"][value="${preferencias.tema}"]`
            ).checked = true;

            tela.querySelector(
                `[name="cfgIdioma"][value="${preferencias.idioma}"]`
            ).checked = true;

            const usuario =
                document.getElementById("usuarioAtual")
                    ?.textContent.trim();

            document.getElementById("cfgUsuario").textContent =
                usuario || traduzir("Sessão local — sem login");
        }

        botao.onclick = function () {
            trocarTela("estoque");

            principal.querySelectorAll(
                ":scope > .tela"
            ).forEach(secao => {
                secao.hidden = true;
            });

            document.querySelectorAll(
                ".menu-item"
            ).forEach(item => {
                item.classList.remove("ativo");
                item.removeAttribute("aria-current");
            });

            tela.hidden = false;

            botao.classList.add("ativo");
            botao.setAttribute("aria-current", "page");

            document.getElementById("tituloPagina").textContent =
                "Configurações";

            sincronizar();
            aplicarTraducoes();
        };

        // -------------------------------------------------
        // SALVA AS PREFERÊNCIAS
        // -------------------------------------------------

        function salvarPreferencia(campo, valor, mensagem) {
            const proximas = {
                ...preferencias,
                [campo]: valor
            };

            try {
                localStorage.setItem(
                    CHAVE_PREFERENCIAS,
                    JSON.stringify(proximas)
                );
            } catch (_) {
                document.getElementById("cfgAviso").textContent =
                    traduzir(
                        "Não foi possível salvar as preferências neste navegador."
                    );

                return;
            }

            preferencias = proximas;

            document.documentElement.dataset.temaSmi =
                preferencias.tema;

            document.documentElement.lang =
                preferencias.idioma;

            document.getElementById("cfgAviso").textContent =
                mensagem;

            sincronizar();
            aplicarTraducoes();
        }

        document.getElementById("cfgSalvarTema").onclick =
            function () {
                const tema = tela.querySelector(
                    '[name="cfgTema"]:checked'
                ).value;

                salvarPreferencia(
                    "tema",
                    tema,
                    "Aparência salva."
                );
            };

        document.getElementById("cfgSalvarIdioma").onclick =
            function () {
                const idioma = tela.querySelector(
                    '[name="cfgIdioma"]:checked'
                ).value;

                salvarPreferencia(
                    "idioma",
                    idioma,
                    "Idioma salvo."
                );
            };

        // -------------------------------------------------
        // TRADUÇÃO DOS ELEMENTOS DA INTERFACE
        // -------------------------------------------------

        const textosOriginais = new WeakMap();
        const atributosOriginais = new WeakMap();

        function permitido(elemento) {
            if (
                !elemento ||
                elemento.closest(
                    "script, style, textarea, svg, [data-sem-traducao]"
                )
            ) {
                return false;
            }

            // Preserva as células que contêm dados cadastrados.
            const celula = elemento.closest("td");

            if (
                celula &&
                !elemento.closest(".ru-etiqueta, .status, button") &&
                !celula.hasAttribute("colspan")
            ) {
                return false;
            }

            if (
                elemento.closest(
                    ".modelo-nome, " +
                    ".modelo-titulo, " +
                    "#listaConjunto, " +
                    ".linha-conjunto, " +
                    ".detalhe-item-formulario h4, " +
                    "#cfgUsuario"
                )
            ) {
                return false;
            }

            // Preserva os nomes dos modelos nas listas.
            if (
                elemento.matches("option") &&
                /modelo|conjunto/i.test(
                    elemento.parentElement?.id || ""
                )
            ) {
                return false;
            }

            return true;
        }

        function traduzirDocumento(doc) {
            const caminhador = doc.createTreeWalker(
                doc.body,
                NodeFilter.SHOW_TEXT
            );

            const textos = [];

            while (caminhador.nextNode()) {
                textos.push(caminhador.currentNode);
            }

            textos.forEach(no => {
                if (!permitido(no.parentElement)) return;

                let anterior = textosOriginais.get(no);

                if (
                    !anterior ||
                    (
                        no.nodeValue !== anterior.portugues &&
                        no.nodeValue !== anterior.exibido
                    )
                ) {
                    anterior = {
                        portugues: no.nodeValue
                    };
                }

                const novo = traduzir(anterior.portugues);

                anterior.exibido = novo;
                textosOriginais.set(no, anterior);

                if (no.nodeValue !== novo) {
                    no.nodeValue = novo;
                }
            });

            doc.querySelectorAll(
                "[placeholder], [title], [aria-label]"
            ).forEach(elemento => {
                if (
                    elemento.closest(
                        "script, style, [data-sem-traducao]"
                    )
                ) {
                    return;
                }

                const mapa =
                    atributosOriginais.get(elemento) || {};

                [
                    "placeholder",
                    "title",
                    "aria-label"
                ].forEach(atributo => {
                    const atual = elemento.getAttribute(atributo);

                    if (atual === null) return;

                    let dado = mapa[atributo];

                    if (
                        !dado ||
                        (
                            atual !== dado.portugues &&
                            atual !== dado.exibido
                        )
                    ) {
                        dado = {
                            portugues: atual
                        };
                    }

                    dado.exibido = traduzir(dado.portugues);
                    mapa[atributo] = dado;

                    if (atual !== dado.exibido) {
                        elemento.setAttribute(
                            atributo,
                            dado.exibido
                        );
                    }
                });

                atributosOriginais.set(elemento, mapa);
            });

            doc.documentElement.lang = preferencias.idioma;
        }

        let traducaoPendente = false;

        const observador = new MutationObserver(function () {
            if (traducaoPendente) return;

            traducaoPendente = true;

            queueMicrotask(function () {
                traducaoPendente = false;
                aplicarTraducoes();
            });
        });

        function aplicarTraducoes() {
            observador.disconnect();

            traduzirDocumento(document);

            observador.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: [
                    "placeholder",
                    "title",
                    "aria-label"
                ]
            });
        }

        window.smiTraduzirDocumento = traduzirDocumento;

        // Mensagens e confirmações.
        const alertaOriginal = window.alert.bind(window);
        const confirmarOriginal = window.confirm.bind(window);

        window.alert = function (texto) {
            alertaOriginal(traduzir(texto));
        };

        window.confirm = function (texto) {
            return confirmarOriginal(traduzir(texto));
        };

        // Sincroniza as preferências entre abas.
        window.addEventListener("storage", function (evento) {
            if (evento.key !== CHAVE_PREFERENCIAS) return;

            try {
                const salvas = JSON.parse(
                    evento.newValue || "{}"
                );

                preferencias = {
                    tema: salvas.tema === "claro"
                        ? "claro"
                        : "escuro",

                    idioma: salvas.idioma === "it-IT"
                        ? "it-IT"
                        : "pt-BR"
                };

                document.documentElement.dataset.temaSmi =
                    preferencias.tema;

                sincronizar();
                aplicarTraducoes();
            } catch (_) {
                // Mantém a preferência atual.
            }
        });

        sincronizar();
        aplicarTraducoes();
    });
})();

