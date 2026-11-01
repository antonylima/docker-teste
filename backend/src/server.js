const express = require('express');
const cors = require('cors');

const { pool, conectarComRetry } = require('./db');
const { validarPessoa } = require('./validacao');

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// Healthcheck simples
// ------------------------------------------------------------------
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', banco: 'conectado' });
  } catch (erro) {
    res.status(503).json({ status: 'erro', banco: 'indisponível' });
  }
});

// ------------------------------------------------------------------
// POST /pessoas - cadastro
// ------------------------------------------------------------------
app.post('/pessoas', async (req, res) => {
  const { erros, dados } = validarPessoa(req.body);

  if (erros.length > 0) {
    return res.status(400).json({ erros });
  }

  try {
    const [resultado] = await pool.query(
      `INSERT INTO pessoas
         (nome, cpf, cep, numero, complemento, logradouro, bairro, localidade, uf, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dados.nome, dados.cpf, dados.cep, dados.numero, dados.complemento,
        dados.logradouro, dados.bairro, dados.localidade, dados.uf, dados.estado,
      ]
    );

    const [linhas] = await pool.query('SELECT * FROM pessoas WHERE id = ?', [resultado.insertId]);
    res.status(201).json(linhas[0]);
  } catch (erro) {
    console.error('[POST /pessoas]', erro);
    res.status(500).json({ erros: ['Erro interno ao cadastrar pessoa.'] });
  }
});

// ------------------------------------------------------------------
// GET /pessoas - listagem
// ------------------------------------------------------------------
app.get('/pessoas', async (req, res) => {
  try {
    const [linhas] = await pool.query(
      'SELECT * FROM pessoas ORDER BY id DESC'
    );
    res.json(linhas);
  } catch (erro) {
    console.error('[GET /pessoas]', erro);
    res.status(500).json({ erros: ['Erro interno ao listar pessoas.'] });
  }
});

// ------------------------------------------------------------------
// Rota não encontrada
// ------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ erros: ['Rota não encontrada.'] });
});

// ------------------------------------------------------------------
// Inicialização: só sobe o servidor depois que o banco responde
// ------------------------------------------------------------------
(async () => {
  try {
    await conectarComRetry();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[api] Backend rodando na porta ${PORT}`);
    });
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }
})();
