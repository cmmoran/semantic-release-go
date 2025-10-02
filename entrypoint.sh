#!/bin/sh
set -e

if [ -f release.config.js ]; then
  CONFIG=release.config.js
else
  CONFIG=/opt/release.config.js
fi

echo ">>> Running semantic-release with Go profile"
semantic-release --no-ci --config $CONFIG
