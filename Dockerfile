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

    COPY server /opt/server
    COPY --from=frontend /opt/frontend/build ./public

    CMD node server.js