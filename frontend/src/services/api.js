// URL da API injetada em tempo de build (ver Dockerfile / docker-compose.yml).
// Como o fetch roda no NAVEGADOR do usuário, o valor aponta para a porta
// publicada do backend no host (ex.: http://localhost:3001), e não para o
// nome interno do serviço Docker.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function listarPessoas() {
  const resposta = await fetch(`${API_URL}/pessoas`);
  if (!resposta.ok) {
    throw new Error('Não foi possível carregar a lista de cadastros.');
  }
  return resposta.json();
}

export async function cadastrarPessoa(dados) {
  const resposta = await fetch(`${API_URL}/pessoas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

  const corpo = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const mensagem = Array.isArray(corpo.erros)
      ? corpo.erros.join(' ')
      : 'Não foi possível concluir o cadastro.';
    throw new Error(mensagem);
  }

  return corpo;
}
