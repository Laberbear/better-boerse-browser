FROM node:20-alpine as frontend
ADD frontend/package.json /opt/frontend/package.json
ADD package.json /opt/package.json
RUN corepack enable
ADD pnpm-lock.yaml /opt/pnpm-lock.yaml
ADD pnpm-workspace.yaml /opt/pnpm-workspace.yaml
WORKDIR /opt/frontend
RUN pnpm install

ADD frontend/src /opt/frontend/src
ADD frontend/public /opt/frontend/public
RUN npm run build
FROM node:20-alpine as server
ADD package.json /opt/package.json
ADD server/package.json /opt/server/package.json
RUN corepack enable
ADD pnpm-lock.yaml /opt/pnpm-lock.yaml
ADD pnpm-workspace.yaml /opt/pnpm-workspace.yaml
WORKDIR /opt/server

RUN pnpm --filter "bbb-server" install --prod --frozen-lockfile


ADD server/server.js ./server.js
ADD server/hetznerSB.js ./hetznerSB.js
ADD server/technicalCityWrapper.js ./technicalCityWrapper.js
COPY --from=frontend /opt/frontend/build ./public

# Add predownloaded caches if available
ADD server/cpuCache.json ./cpuCache.json
ADD server/compareCache.json ./compareCache.json
ADD server/websiteCache.json ./websiteCache.json
CMD node server.js