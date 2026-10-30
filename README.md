# Cadastro de Pessoas e Endereços

Sistema de cadastro e listagem de pessoas com preenchimento automático de endereço
a partir do CEP. Projeto de estudo de **arquitetura multi-container com Docker**:
frontend, backend e banco de dados rodam em containers separados, comunicando-se
por uma rede Docker interna, com os dados persistidos em um volume nomeado.

---

## Arquitetura

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   frontend   │        │   backend    │        │      db      │
│ React + Vite │ ─────► │   Node.js    │ ─────► │   MySQL 8    │
│    Nginx     │  REST  │   Express    │  SQL   │              │
│   :80 (3000) │        │    :3001     │        │    :3306     │
└──────────────┘        └──────────────┘        └──────┬───────┘
                                                       │
                                               ┌───────▼───────┐
                                               │ volume db_data│
                                               └───────────────┘

         todos na mesma rede Docker: app-network (bridge)
```

| Container  | Responsabilidade                                           | Porta publicada |
|------------|------------------------------------------------------------|-----------------|
| `frontend` | Interface: formulário de cadastro e listagem               | `3000` → `80`   |
| `backend`  | API REST (`POST /pessoas`, `GET /pessoas`)                 | `3001` → `3001` |
| `db`       | MySQL 8, dados persistidos no volume `db_data`             | não publicada   |

> A porta do banco **não é publicada no host** de propósito: apenas o backend
> precisa acessá-lo, e isso acontece pela rede interna do Docker.

---

## Tecnologias e justificativas

| Escolha | Por quê |
|---|---|
| **Node.js + Express** | Leve e direto para expor uma API REST simples; mesma linguagem do frontend, reduzindo o custo de contexto entre as camadas. |
| **MySQL 8** | Banco relacional maduro, adequado a dados estruturados (pessoa/endereço); imagem oficial estável no Docker Hub, com suporte nativo a script de inicialização. |
| **React + Vite** | Componentização separa bem formulário e listagem; Vite tem build rápido e gera arquivos estáticos prontos para servir. |
| **Nginx** (etapa final do frontend) | Servidor estático leve e padrão de mercado; a imagem final não carrega Node nem `node_modules`. |
| **ViaCEP** | API pública brasileira de CEP, gratuita e sem necessidade de chave de acesso. |

---

## Pré-requisitos

- Docker
- Docker Compose (v2, embutido no Docker moderno como `docker compose`)

---

## Como executar

```bash
# 1. Clone o repositório
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO

# 2. Crie o arquivo .env a partir do exemplo
cp .env.example .env

# 3. Suba os três containers
docker compose up --build
```

Acesse: **http://localhost:3000**

Para parar:

```bash
docker compose down        # mantém os dados (volume preservado)
docker compose down -v     # APAGA os dados (remove o volume)
```

---

## Variáveis de ambiente (`.env`)

| Variável | Descrição |
|---|---|
| `MYSQL_ROOT_PASSWORD` | Senha do usuário root do MySQL |
| `MYSQL_DATABASE` | Nome do banco criado na inicialização |
| `MYSQL_USER` | Usuário da aplicação (não-root) |
| `MYSQL_PASSWORD` | Senha do usuário da aplicação |
| `VITE_API_URL` | URL da API usada pelo navegador (padrão `http://localhost:3001`) |

> O `.env` **não é versionado** (está no `.gitignore`). O `.env.example` serve
> de modelo para quem clonar o projeto.

---

## API REST

### `POST /pessoas` — cadastra uma pessoa

```bash
curl -X POST http://localhost:3001/pessoas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva",
    "cpf": "52998224725",
    "cep": "01001000",
    "numero": "100",
    "complemento": "Apto 12",
    "logradouro": "Praça da Sé",
    "bairro": "Sé",
    "localidade": "São Paulo",
    "uf": "SP",
    "estado": "São Paulo"
  }'
```

**201 Created** — retorna o registro criado.
**400 Bad Request** — retorna `{ "erros": ["..."] }` quando a validação falha
(nome curto, CPF inválido pelos dígitos verificadores, CEP fora do formato, número ausente).

### `GET /pessoas` — lista os cadastros

```bash
curl http://localhost:3001/pessoas
```

Retorna um array JSON ordenado do mais recente para o mais antigo.

### `GET /health` — verificação de saúde

Retorna o status da API e da conexão com o banco.

---

## Fluxo de uma requisição

1. O usuário digita o **CEP** no formulário e sai do campo (`onBlur`).
2. O navegador consulta a **ViaCEP** e preenche logradouro, bairro, localidade, UF e estado.
3. Ao enviar, o frontend faz `POST /pessoas` para o **backend**.
4. O backend **valida** os dados (incluindo dígitos verificadores do CPF) e executa o `INSERT` no **MySQL**.
5. O frontend recarrega a lista via `GET /pessoas` e exibe o novo registro.

---

## Comunicação entre containers

O Docker Compose conecta os três serviços à rede `app-network`. Dentro dessa rede,
o DNS interno do Docker resolve o **nome do serviço** para o IP do container
correspondente — por isso o backend se conecta ao banco usando o host `db`
(definido em `DB_HOST`), sem depender de IPs fixos.

**Detalhe importante:** as chamadas do frontend para a API partem do *navegador
do usuário*, que está **fora** da rede Docker. Por isso a `VITE_API_URL` aponta
para a porta publicada no host (`http://localhost:3001`) e não para `http://backend:3001`,
que só funcionaria em comunicação container-a-container.

---

## Persistência de dados

O MySQL grava seus arquivos em `/var/lib/mysql` dentro do container. Esse caminho
está mapeado para o volume nomeado `db_data`, gerenciado pelo Docker **fora** do
ciclo de vida do container.

Teste prático:

```bash
docker compose up -d
# cadastre uma pessoa pelo frontend

docker compose down      # remove os containers, mas preserva o volume
docker compose up -d     # sobe tudo de novo

# o cadastro anterior continua na listagem
```

Somente `docker compose down -v` (ou a remoção explícita do volume) apaga os dados.

A tabela é criada pelo script `db/init.sql`, executado automaticamente pela imagem
oficial do MySQL na **primeira** inicialização — ou seja, enquanto o volume `db_data`
ainda está vazio.

---

## Estrutura do projeto

```
.
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       ├── server.js          # rotas POST e GET
│       ├── db.js              # pool MySQL + retry de conexão
│       └── validacao.js       # validação de nome, CPF e CEP
├── frontend/
│   ├── Dockerfile             # multi-stage: build Vite + Nginx
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # formulário + listagem
│       ├── styles.css
│       └── services/
│           ├── api.js         # comunicação com o backend
│           └── cep.js         # consulta à ViaCEP
└── db/
    └── init.sql               # criação da tabela `pessoas`
```

---

## Decisões técnicas relevantes

- **Healthcheck no banco + `condition: service_healthy`**: o `depends_on` sozinho
  garante apenas a ordem de inicialização, não que o MySQL já aceite conexões.
  O healthcheck resolve isso, e o backend ainda tem uma rotina de *retry* como
  segunda camada de proteção.
- **Dockerfile multi-stage no frontend**: a imagem final contém apenas os arquivos
  estáticos compilados e o Nginx — sem Node.js, sem `node_modules`, sem código-fonte.
- **Validação de CPF com dígitos verificadores**: vai além da checagem de tamanho,
  rejeitando sequências repetidas e CPFs matematicamente inválidos.
- **Usuário não-root no MySQL**: a aplicação se conecta com `MYSQL_USER`, e não
  com o root.
- **`.dockerignore`**: evita copiar `node_modules`, `.git` e `.env` para dentro
  das imagens, reduzindo tamanho e evitando vazamento de segredos.
