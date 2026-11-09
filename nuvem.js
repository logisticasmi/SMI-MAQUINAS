(() => {
  "use strict";

  async function lerEstoque() {
    const cliente = window.smiSupabase;

    if (!cliente) {
      throw new Error("A conexão com o Supabase não foi carregada.");
    }

    const { data: acesso, error: erroAcesso } =
      await cliente.auth.getSession();

    if (erroAcesso) throw erroAcesso;

    if (!acesso.session) {
      throw new Error("Entre no sistema para carregar o estoque.");
    }

    const { data, error } = await cliente
      .from("maquinas_estado")
      .select("id,dados,revisao")
      .eq("id", "principal")
      .single();

    if (error) throw error;

    if (
      data?.dados?.versao !== 1 ||
      !Array.isArray(data.dados.entradas) ||
      !Array.isArray(data.dados.saidas) ||
      !Array.isArray(data.dados.reservas) ||
      !Number.isSafeInteger(data.revisao) ||
      data.revisao < 1
    ) {
      throw new Error("O estoque da nuvem está em formato inválido.");
    }

    return {
      dados: data.dados,
      revisao: data.revisao
    };
  }

    async function salvarEstoque(dados, revisao) {
    if (
      dados?.versao !== 1 ||
      !Array.isArray(dados.entradas) ||
      !Array.isArray(dados.saidas) ||
      !Array.isArray(dados.reservas) ||
      !Number.isSafeInteger(revisao) ||
      revisao < 1
    ) {
      throw new Error("Dados ou revisão inválidos para salvar.");
    }

    const cliente = window.smiSupabase;

    if (!cliente) {
      throw new Error("A conexão com o Supabase não foi carregada.");
    }

    const copia = JSON.parse(JSON.stringify(dados));

    const { data, error } = await cliente.rpc(
      "maquinas_salvar_estado",
      {
        p_dados: copia,
        p_revisao: revisao
      }
    );

    if (error) throw error;

    const registro = data?.[0];

    if (
      registro?.id !== "principal" ||
      registro.revisao !== revisao + 1 ||
      !Array.isArray(registro.dados?.entradas) ||
      !Array.isArray(registro.dados?.saidas) ||
      !Array.isArray(registro.dados?.reservas)
    ) {
      throw new Error(
        "Salvamento sem confirmação. Confira a nuvem antes de repetir."
      );
    }

    return {
      dados: registro.dados,
      revisao: registro.revisao
    };
  }

  window.smiRepositorio = Object.freeze({
    lerEstoque,
    salvarEstoque
  });
})();