#!/usr/bin/env bash
#   Use this script to test if a given TCP host/port are available
#   https://github.com/vishnubob/wait-for-it

set -e

host="$1"
shift
port="$1"
shift

for i in {1..30}; do
  if nc -z "$host" "$port"; then
    echo "Database is up!"
    exec "$@"
    exit 0
  fi
  echo "Waiting for $host:$port... ($i)"
  sleep 1
done

echo "Timeout waiting for $host:$port"
exit 1
