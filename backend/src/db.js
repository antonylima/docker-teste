const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,           // 'db' -> nome do serviço no docker-compose.yml
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

/**
 * O container do banco pode demorar alguns segundos a mais para aceitar
 * conexões, mesmo depois de "iniciado". Por isso tentamos algumas vezes.
 */
async function conectarComRetry(tentativas = 15, intervaloMs = 3000) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[db] Conectado ao MySQL com sucesso.');
      return;
    } catch (erro) {
      console.log(
        `[db] Tentativa ${i}/${tentativas} falhou (${erro.code || erro.message}). ` +
        `Nova tentativa em ${intervaloMs}ms...`
      );
      await new Promise((r) => setTimeout(r, intervaloMs));
    }
  }
  throw new Error('[db] Não foi possível conectar ao banco de dados.');
}

module.exports = { pool, conectarComRetry };
