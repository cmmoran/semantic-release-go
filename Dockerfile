# Stage 1: build goimports with Go 1.25
FROM golang:1.25-alpine AS gobuilder
RUN go install golang.org/x/tools/cmd/goimports@latest

# Stage 2: main runtime with Node 24 LTS + semantic-release
FROM node:24-alpine

# Copy goimports binary from stage 1
COPY --from=gobuilder /go/bin/goimports /usr/local/bin/goimports

# Install semantic-release + plugins
RUN npm install -g \
    semantic-release \
    @semantic-release/commit-analyzer \
    @semantic-release/release-notes-generator \
    @semantic-release/changelog \
    @semantic-release/github \
    @semantic-release/git \
    conventional-changelog-conventionalcommits

COPY release.config.js /opt/release.config.js
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
