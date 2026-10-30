-- Executado automaticamente pela imagem oficial do MySQL
-- na PRIMEIRA inicialização (quando o volume db_data está vazio).

CREATE TABLE IF NOT EXISTS pessoas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(150) NOT NULL,
  cpf          VARCHAR(11)  NOT NULL,
  cep          VARCHAR(8)   NOT NULL,
  numero       VARCHAR(20)  NOT NULL,
  complemento  VARCHAR(100),
  logradouro   VARCHAR(150),
  bairro       VARCHAR(100),
  localidade   VARCHAR(100),
  uf           CHAR(2),
  estado       VARCHAR(50),
  criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cpf (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
