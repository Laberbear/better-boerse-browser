FROM node:18-alpine as frontend

ADD frontend/package.json /opt/react/package.json
ADD frontend/package-lock.json /opt/react/package-lock.json
WORKDIR /opt/react
RUN npm ci

ADD frontend/src /opt/react/src
ADD frontend/public /opt/react/public
RUN npm run build
FROM node:18-alpine as server
ADD server/package.json /opt/server/package.json
ADD server/package-lock.json /opt/server/package-lock.json
WORKDIR /opt/server
RUN npm install -g forever
RUN npm ci --production


ADD server/server.js ./server.js
ADD server/hetznerSB.js ./hetznerSB.js
ADD server/technicalCityWrapper.js ./technicalCityWrapper.js
COPY --from=frontend /opt/react/build ./public
# Add predownloaded caches if available
ADD server/cpuCache.json ./cpuCache.json
ADD server/compareCache.json ./compareCache.json
ADD server/websiteCache.json ./websiteCache.json
CMD forever server.js