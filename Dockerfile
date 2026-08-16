# gitcrew — Render deployment image.
# Needs git (server spawns git) which the native Node runtime doesn't guarantee,
# so we bake it in.
FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install server deps first for better layer caching
COPY server/package.json server/package-lock.json ./server/
COPY scripts/patch-sdk.mjs ./scripts/patch-sdk.mjs
RUN cd server && npm install --production=false

# Everything else (web/, crew-template/, server code)
COPY . .

# The publish step needs /app to be a git repo with a remote, plus an identity
# for commits (the Docker context excludes .git).
RUN git init -q -b main . \
    && git remote add origin https://github.com/digvijaybind/gitcrew.git \
    && git config --global user.name "gitcrew crew" \
    && git config --global user.email "crew@gitcrew.dev"

ENV PORT=4173
EXPOSE 4173

CMD ["node", "server/index.js"]
