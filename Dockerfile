FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

RUN npm run build
RUN npx prisma generate
RUN npx prisma migrate deploy

EXPOSE 8000

CMD ["npm", "start"]
