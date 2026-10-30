const somenteDigitos = (v) => String(v ?? '').replace(/\D/g, '');

/**
 * Validação completa de CPF (dígitos verificadores).
 */
function cpfValido(cpf) {
  const c = somenteDigitos(cpf);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false; // rejeita 000..., 111..., etc.

  const calcDigito = (base, pesoInicial) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = calcDigito(c.slice(0, 9), 10);
  const d2 = calcDigito(c.slice(0, 10), 11);
  return d1 === Number(c[9]) && d2 === Number(c[10]);
}

function cepValido(cep) {
  return somenteDigitos(cep).length === 8;
}

/**
 * Valida o payload de cadastro e devolve a lista de erros encontrados
 * junto com os dados já normalizados (prontos para gravar no banco).
 */
function validarPessoa(body = {}) {
  const erros = [];

  const nome = String(body.nome ?? '').trim();
  const cpf = somenteDigitos(body.cpf);
  const cep = somenteDigitos(body.cep);
  const numero = String(body.numero ?? '').trim();

  if (nome.length < 3) erros.push('Nome deve ter ao menos 3 caracteres.');
  if (nome.length > 150) erros.push('Nome deve ter no máximo 150 caracteres.');
  if (!cpfValido(cpf)) erros.push('CPF inválido.');
  if (!cepValido(cep)) erros.push('CEP deve conter 8 dígitos.');
  if (!numero) erros.push('Número é obrigatório.');

  const dados = {
    nome,
    cpf,
    cep,
    numero,
    complemento: String(body.complemento ?? '').trim() || null,
    logradouro: String(body.logradouro ?? '').trim() || null,
    bairro: String(body.bairro ?? '').trim() || null,
    localidade: String(body.localidade ?? '').trim() || null,
    uf: String(body.uf ?? '').trim().toUpperCase().slice(0, 2) || null,
    estado: String(body.estado ?? '').trim() || null,
  };

  return { erros, dados };
}

module.exports = { validarPessoa, cpfValido, cepValido, somenteDigitos };
