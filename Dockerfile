FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json ./
RUN pnpm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/server.js"]
