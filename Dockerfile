FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

# RUN npm run build
# RUN npx prisma migrate deploy

EXPOSE 5000

CMD ["npm", "start",]
