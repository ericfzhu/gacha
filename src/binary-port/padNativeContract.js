export const PAD_APP_DELEGATE_CLASS = 'jp/gungho/pad/AppDelegate';

// Recovered from classes3.dex. These are the native calls that define the
// browser-facing engine lifecycle; the remaining AppDelegate natives are
// platform services such as purchases, storage, text fields, and social APIs.
export const PAD_CORE_NATIVE_METHODS = Object.freeze([
  { name: 'didFinishLaunchingWithOptions', descriptor: '()V', role: 'launch' },
  { name: 'onSurfaceCreated', descriptor: '(Landroid/content/res/AssetManager;)V', role: 'surface-create' },
  { name: 'onSurfaceChanged', descriptor: '(IIIIFFFF)V', role: 'surface-resize' },
  { name: 'onDrawFrame', descriptor: '()V', role: 'frame' },
  { name: 'onSurfacePause', descriptor: '()V', role: 'pause' },
  { name: 'onSurfaceResume', descriptor: '()V', role: 'resume' },
  { name: 'onSurfaceDestroy', descriptor: '()V', role: 'surface-destroy' },
  { name: 'onTouchEvent', descriptor: '(FFIIIIJI)V', role: 'touch' },
  { name: 'onKeyEvent', descriptor: '(IIJ)Z', role: 'key' },
]);

export const PAD_ANDROID_LOAD_SEQUENCE = Object.freeze([
  { owner: 'util001/framework/load', library: '__6dba__', phase: 'application-attach' },
  { owner: PAD_APP_DELEGATE_CLASS, library: 'openal', phase: 'app-delegate-init' },
  { owner: PAD_APP_DELEGATE_CLASS, library: 'pad', phase: 'app-delegate-init' },
]);
