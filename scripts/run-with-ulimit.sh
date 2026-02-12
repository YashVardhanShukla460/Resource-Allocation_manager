#!/usr/bin/env bash
set -euo pipefail

# 1GB virtual memory and 120s CPU time for current shell process tree
ulimit -Sv 1048576
ulimit -t 120

node src/server.js
