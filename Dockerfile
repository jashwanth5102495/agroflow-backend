FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN node ./node_modules/typescript/bin/tsc

EXPOSE 5000

CMD ["npm", "start"]