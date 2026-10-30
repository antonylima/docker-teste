import { useEffect, useState, useCallback } from 'react';
import { buscarEndereco } from './services/cep';
import { listarPessoas, cadastrarPessoa } from './services/api';

const FORM_VAZIO = {
  nome: '',
  cpf: '',
  cep: '',
  numero: '',
  complemento: '',
  logradouro: '',
  bairro: '',
  localidade: '',
  uf: '',
  estado: '',
};

function mascaraCpf(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function mascaraCep(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function App() {
  const [form, setForm] = useState(FORM_VAZIO);
  const [pessoas, setPessoas] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'erro'|'sucesso', texto }

  const carregarLista = useCallback(async () => {
    setCarregandoLista(true);
    try {
      const dados = await listarPessoas();
      setPessoas(dados);
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message });
    } finally {
      setCarregandoLista(false);
    }
  }, []);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleCepBlur() {
    const cepLimpo = form.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    setAviso(null);
    try {
      const endereco = await buscarEndereco(cepLimpo);
      setForm((prev) => ({ ...prev, ...endereco }));
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message });
      setForm((prev) => ({
        ...prev,
        logradouro: '', bairro: '', localidade: '', uf: '', estado: '',
      }));
    } finally {
      setBuscandoCep(false);
    }
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      await cadastrarPessoa({
        ...form,
        cpf: form.cpf.replace(/\D/g, ''),
        cep: form.cep.replace(/\D/g, ''),
      });
      setForm(FORM_VAZIO);
      setAviso({ tipo: 'sucesso', texto: 'Cadastro realizado com sucesso.' });
      await carregarLista();
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Cadastro de Pessoas e Endereços</h1>
        <p className="sub">
          Frontend · API REST · MySQL — em containers Docker separados
        </p>
      </header>

      {aviso && (
        <div className={`aviso aviso-${aviso.tipo}`}>{aviso.texto}</div>
      )}

      <section className="card">
        <h2>Novo cadastro</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid">
            <div className="campo col-6">
              <label htmlFor="nome">Nome *</label>
              <input
                id="nome"
                value={form.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="campo col-3">
              <label htmlFor="cpf">CPF *</label>
              <input
                id="cpf"
                value={form.cpf}
                onChange={(e) => handleChange('cpf', mascaraCpf(e.target.value))}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="campo col-3">
              <label htmlFor="cep">CEP *</label>
              <input
                id="cep"
                value={form.cep}
                onChange={(e) => handleChange('cep', mascaraCep(e.target.value))}
                onBlur={handleCepBlur}
                placeholder="00000-000"
                required
              />
              {buscandoCep && <small className="hint">Buscando endereço...</small>}
            </div>

            <div className="campo col-3">
              <label htmlFor="numero">Número *</label>
              <input
                id="numero"
                value={form.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                placeholder="123"
                required
              />
            </div>

            <div className="campo col-9">
              <label htmlFor="complemento">Complemento</label>
              <input
                id="complemento"
                value={form.complemento}
                onChange={(e) => handleChange('complemento', e.target.value)}
                placeholder="Apto, bloco, referência..."
              />
            </div>
          </div>

          <h3>Endereço preenchido automaticamente pelo CEP</h3>
          <div className="grid">
            <div className="campo col-6">
              <label>Logradouro / Rua</label>
              <input value={form.logradouro} readOnly />
            </div>
            <div className="campo col-6">
              <label>Bairro</label>
              <input value={form.bairro} readOnly />
            </div>
            <div className="campo col-5">
              <label>Localidade (cidade)</label>
              <input value={form.localidade} readOnly />
            </div>
            <div className="campo col-2">
              <label>UF</label>
              <input value={form.uf} readOnly />
            </div>
            <div className="campo col-5">
              <label>Estado</label>
              <input value={form.estado} readOnly />
            </div>
          </div>

          <button type="submit" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Cadastrar'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Cadastros ({pessoas.length})</h2>

        {carregandoLista ? (
          <p className="vazio">Carregando...</p>
        ) : pessoas.length === 0 ? (
          <p className="vazio">Nenhum cadastro ainda.</p>
        ) : (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Endereço</th>
                  <th>Cidade/UF</th>
                </tr>
              </thead>
              <tbody>
                {pessoas.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.nome}</td>
                    <td>{mascaraCpf(p.cpf)}</td>
                    <td>
                      {[p.logradouro, p.numero, p.complemento, p.bairro]
                        .filter(Boolean)
                        .join(', ')}
                      <br />
                      <small>CEP {mascaraCep(p.cep)}</small>
                    </td>
                    <td>
                      {p.localidade}/{p.uf}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
