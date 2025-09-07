FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

RUN npm run build
RUN npx prisma generate

EXPOSE 8080

CMD npx prisma migrate deploy && npm start
