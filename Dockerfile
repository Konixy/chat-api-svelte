FROM node:19-alpine as builder

COPY . .

RUN apk update

RUN npx tsc

EXPOSE 1000

CMD [ "node", "./dist/index.js" ]