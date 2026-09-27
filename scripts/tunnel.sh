#!/usr/bin/env bash
# Abre un tunel SSH hacia el MySQL del servidor para usarlo desde clientes
# externos (DBeaver, TablePlus, HeidiSQL). Dejar corriendo mientras se usa.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "No existe .env. Copia .env.example y llena los valores." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

LOCAL_TUNNEL_PORT="${LOCAL_TUNNEL_PORT:-3307}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
SSH_PORT="${SSH_PORT:-22}"

echo "Tunel: 127.0.0.1:${LOCAL_TUNNEL_PORT} -> ${DB_HOST}:${DB_PORT} (via ${SSH_USER}@${SSH_HOST})"
echo "Conecta tu cliente MySQL a 127.0.0.1:${LOCAL_TUNNEL_PORT} con el usuario ${DB_USER}."
echo "Ctrl+C para cerrar."

# La llave es RSA antigua, por eso se habilitan explicitamente los algoritmos ssh-rsa.
exec ssh -N \
  -L "${LOCAL_TUNNEL_PORT}:${DB_HOST}:${DB_PORT}" \
  -p "${SSH_PORT}" \
  -i "${SSH_KEY_PATH}" \
  -o PubkeyAcceptedAlgorithms=+ssh-rsa \
  -o HostKeyAlgorithms=+ssh-rsa \
  -o ServerAliveInterval=20 \
  "${SSH_USER}@${SSH_HOST}"
