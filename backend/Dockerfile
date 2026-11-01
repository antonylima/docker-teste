FROM node:20-alpine

WORKDIR /app

# Copia apenas os manifestos primeiro para aproveitar o cache de camadas:
# as dependências só são reinstaladas se package.json mudar.
COPY package*.json ./
RUN npm install --omit=dev

# Copia o restante do código-fonte
COPY . .

EXPOSE 3002

CMD ["node", "src/server.js"]
