FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public ./public

ENV PORT=8080
ENV DB_PATH=/data/leaderboard.db

EXPOSE 8080
VOLUME ["/data"]

# /data must exist and be writable by the "node" user *before* the volume is
# populated - otherwise Docker (or a bind mount to an empty host directory)
# creates it root-owned and DatabaseSync fails with "unable to open database
# file" once we drop privileges below.
RUN mkdir -p /data && chown -R node:node /data

USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/healthz', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
