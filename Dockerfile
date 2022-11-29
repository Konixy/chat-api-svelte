FROM node:19-alpine as builder

COPY . .

WORKDIR /app

RUN apk update

# RUN npm run build

EXPOSE 1000

CMD [ "npm", "start" ]