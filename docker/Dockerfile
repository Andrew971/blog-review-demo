FROM node:12
ENV PORT $PORT
WORKDIR /app

COPY ./package.json .

RUN npm install --no-optional && npm cache clean --force
RUN mkdir ./logs
COPY . .
HEALTHCHECK --interval=30s CMD node healthcheck.js
RUN npm run build
EXPOSE $PORT
CMD npm start