# ---------- Etapa 1: build da aplicação React ----------
FROM node:20-alpine AS build

WORKDIR /app

# A URL da API precisa existir em tempo de BUILD (Vite injeta no bundle)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Etapa 2: servidor estático com Nginx ----------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
