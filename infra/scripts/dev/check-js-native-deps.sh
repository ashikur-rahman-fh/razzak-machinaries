#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

log_error() {
  echo "error: $1" >&2
}

log_success() {
  echo "==> $1"
}

detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "${os}-${arch}" in
    darwin-arm64) echo "darwin-arm64" ;;
    darwin-x86_64) echo "darwin-x64" ;;
    linux-aarch64 | linux-arm64) echo "linux-arm64-gnu" ;;
    linux-x86_64) echo "linux-x64-gnu" ;;
    *)
      echo "unknown"
      ;;
  esac
}

require_native_glob() {
  local path_glob="$1"
  local label="$2"

  if compgen -G "node_modules/.pnpm/${path_glob}" >/dev/null 2>&1; then
    log_success "${label} native binding present."
    return 0
  fi

  log_error "Missing ${label} native binding for this platform."
  log_error "Run: make editor-happy   (or: pnpm install from repo root)"
  log_error "See docs/runbook-troubleshooting.md and docs/development.md"
  return 1
}

PLATFORM="$(detect_platform)"
if [[ "${PLATFORM}" == "unknown" ]]; then
  log_error "Unsupported platform for native JS dependency check: $(uname -s) $(uname -m)"
  exit 1
fi

FAILED=0

if ! require_native_glob \
  "lightningcss-${PLATFORM}@*/node_modules/lightningcss-${PLATFORM}/lightningcss.${PLATFORM}.node" \
  "lightningcss"; then
  FAILED=1
fi

if ! require_native_glob \
  "@tailwindcss+oxide-${PLATFORM}@*/node_modules/@tailwindcss/oxide-${PLATFORM}/tailwindcss-oxide.${PLATFORM}.node" \
  "@tailwindcss/oxide"; then
  FAILED=1
fi

if [[ "${FAILED}" -ne 0 ]]; then
  exit 1
fi

log_success "JavaScript native dependencies look healthy for ${PLATFORM}."
