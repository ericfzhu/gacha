#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
compiler="${LLVM_CLANG:-}"

if [[ -z "$compiler" && -x /opt/homebrew/opt/llvm/bin/clang ]]; then
  compiler=/opt/homebrew/opt/llvm/bin/clang
elif [[ -z "$compiler" ]]; then
  compiler="$(command -v clang)"
fi

linker_dir="$(dirname "$compiler")"
if [[ ! -x "$linker_dir/wasm-ld" ]]; then
  echo "A matching wasm-ld was not found beside $compiler" >&2
  exit 1
fi

mkdir -p "$project_dir/public/wasm"
PATH="$linker_dir:$PATH" "$compiler" \
  --target=wasm32 \
  -O3 \
  -ffreestanding \
  -fno-builtin \
  -nostdlib \
  -Wl,--no-entry \
  -Wl,--import-memory \
  -Wl,--strip-all \
  "$project_dir/src/binary-port/arm64_core.c" \
  -o "$project_dir/public/wasm/arm64_core.wasm"

echo "Built public/wasm/arm64_core.wasm"
