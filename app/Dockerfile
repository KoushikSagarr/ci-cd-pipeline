FROM node:18-alpine
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
