# The app image (spec 037): the Node of CI (22.22.2) builds the app, and nginx serves the build on
# port 80, sends /api to the API container (http://api:3000), and answers unknown paths with
# index.html, so the client router handles them.
#
# The yarn lock file is at the root of the repository, so the build context is the ROOT:
#
#   docker build -f apps/app/Dockerfile -t coffee-delivery-app .
#
# The ignore rules are in Dockerfile.dockerignore next to this file (BuildKit reads it for this
# Dockerfile).

FROM node:22.22.2-alpine AS build
WORKDIR /workspace
COPY package.json yarn.lock ./
COPY apps/app/package.json apps/app/
# --ignore-scripts: the git hooks and the skill links of the root `prepare` are not needed here.
RUN yarn install --frozen-lockfile --ignore-scripts
COPY apps/app apps/app
RUN yarn --cwd apps/app build

FROM nginx:1.30.6-alpine
COPY apps/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=6 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
