#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
compiler="${LLVM_CLANG:-/opt/homebrew/opt/llvm/bin/clang}"
linker="${LLVM_LLD:-/opt/homebrew/opt/llvm/bin/ld.lld}"
output_dir="${ANDROID_STUB_DIR:-/tmp}"
browser_output_dir="$project_dir/public/android-stubs"
mkdir -p "$output_dir" "$browser_output_dir"

libraries=(
  libz.so
  libm.so
  liblog.so
  libandroid.so
  libEGL.so
  libGLESv1_CM.so
  libOpenSLES.so
  libjnigraphics.so
  libdl.so
  libc.so
  libstdc++.so
)

for library in "${libraries[@]}"; do
  browser_libc=0
  if [[ "$library" == "libc.so" ]]; then
    browser_libc=1
  fi
  "$compiler" \
    -target aarch64-linux-android24 \
    -fuse-ld="$linker" \
    -nostdlib \
    -ffreestanding \
    -fno-builtin \
    -fPIC \
    -fvisibility=hidden \
    -shared \
    -Wl,-soname,"$library" \
    -Wl,--hash-style=gnu \
    -DBROWSER_LIBC="$browser_libc" \
    -o "$output_dir/browser-$library" \
    "$project_dir/src/binary-port/android_stub.c"
  cp "$output_dir/browser-$library" "$browser_output_dir/$library"
done

echo "Built ${#libraries[@]} AArch64 Android ABI stubs in $output_dir and $browser_output_dir"
