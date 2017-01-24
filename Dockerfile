# node:argon is node 4.2.0, a long term support release
FROM node:argon
ADD . /code
WORKDIR /code
RUN npm install
