#!/usr/bin/env bash
# Abre un tunel SSH hacia el MySQL del servidor para usarlo desde clientes
# externos (DBeaver, TablePlus, HeidiSQL). Dejar corriendo mientras se usa.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/tunnel.js
