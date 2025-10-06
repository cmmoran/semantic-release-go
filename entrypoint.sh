#!/bin/sh
set -e

# Drone env fallbacks
export GIT_AUTHOR_NAME="${PLUGIN_GIT_USER_NAME:-${GIT_AUTHOR_NAME:-ci-bot}}"
export GIT_AUTHOR_EMAIL="${PLUGIN_GIT_USER_EMAIL:-${GIT_AUTHOR_EMAIL:-ci@example.com}}"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

export GITHUB_TOKEN="${GITHUB_TOKEN:-$PLUGIN_GITHUB_TOKEN}"

if [ -n "$PLUGIN_GIT_LOGIN" ] && [ -n "$PLUGIN_GIT_PASSWORD" ]; then
  export GIT_CREDENTIALS="$(node /opt/create-credentials.js || true)"
fi

# Ensure config is in cwd
if [ ! -f release.config.cjs ] && [ ! -f release.config.js ]; then
  echo ">>> No release.config.{cjs,js} found, using default from /opt"
  cp /opt/default.release.config.js release.config.js
fi

echo ">>> Running semantic-release (auto-detect config in cwd) $(pwd)"
semantic-release --no-ci
