/**
 * Consulta a API pública ViaCEP e devolve os campos de endereço.
 * Lança erro quando o CEP é inválido ou não existe.
 */
export async function buscarEndereco(cep) {
  const cepLimpo = String(cep ?? '').replace(/\D/g, '');

  if (cepLimpo.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos.');
  }

  const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

  if (!resposta.ok) {
    throw new Error('Falha ao consultar o serviço de CEP.');
  }

  const dados = await resposta.json();

  // A ViaCEP responde 200 com { erro: true } quando o CEP não existe
  if (dados.erro) {
    throw new Error('CEP não encontrado.');
  }

  return {
    logradouro: dados.logradouro || '',
    bairro: dados.bairro || '',
    localidade: dados.localidade || '',
    uf: dados.uf || '',
    estado: dados.estado || '',
  };
}
