FROM node:6-alpine
ADD public /app/public
ADD views /app/views
ADD package.json /app
ADD server.js /app/server.js
ADD vcap-local.json /app/vcap-local.json

RUN cd /app; npm install

ENV NODE_ENV production
ENV PORT 8080
EXPOSE 8080

# WORKDIR "/app"
# CMD [ "npm", "start" ]
CMD ["node", "/app/server.js"]
