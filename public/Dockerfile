FROM node:carbon
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y \
        curl \
        python \
        make \
        g++
RUN curl -sL https://deb.nodesource.com/setup_0.12 | bash -
RUN apt-get update && apt-get install -y \
        nodejs
VOLUME ["/usr/src/app"]
RUN npm install
RUN npm install pm2 -g
EXPOSE 8000
CMD npm install; pm2 start app.js --watch --no-daemon