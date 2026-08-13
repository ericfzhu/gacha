const PAD_PRIVATE_ROOT = '/data/user/0/jp.gungho.pad';

export function canonicalPadRuntimePath(name) {
  const basename = String(name || '').replaceAll('\\', '/').split('/').filter(Boolean).at(-1)?.toLowerCase();
  if (!basename || !basename.endsWith('.bin')) {
    throw new Error(`Unsupported PAD runtime file name: ${name || '(empty)'}`);
  }
  const directory = basename === 'data030.bin' ? 'cache' : 'files';
  return `${PAD_PRIVATE_ROOT}/${directory}/${basename}`;
}

export function mountPadRuntimeFiles(linux, files = []) {
  return files.map((file) => {
    const path = canonicalPadRuntimePath(file.name);
    linux.mount(path, file.bytes);
    return path;
  });
}
