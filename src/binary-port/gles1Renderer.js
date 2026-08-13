const GL = Object.freeze({
  MODELVIEW: 0x1700,
  PROJECTION: 0x1701,
  TEXTURE: 0x1702,
  TEXTURE_2D: 0x0de1,
  VERTEX_ARRAY: 0x8074,
  COLOR_ARRAY: 0x8076,
  TEXTURE_COORD_ARRAY: 0x8078,
  FLOAT: 0x1406,
  FIXED: 0x140c,
  BYTE: 0x1400,
  UNSIGNED_BYTE: 0x1401,
  SHORT: 0x1402,
  UNSIGNED_SHORT: 0x1403,
});

function identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function multiply(left, right) {
  const output = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      output[column * 4 + row] =
        left[row] * right[column * 4] +
        left[4 + row] * right[column * 4 + 1] +
        left[8 + row] * right[column * 4 + 2] +
        left[12 + row] * right[column * 4 + 3];
    }
  }
  return output;
}

function orthographic(left, right, bottom, top, near, far) {
  const matrix = identity();
  matrix[0] = 2 / (right - left);
  matrix[5] = 2 / (top - bottom);
  matrix[10] = -2 / (far - near);
  matrix[12] = -(right + left) / (right - left);
  matrix[13] = -(top + bottom) / (top - bottom);
  matrix[14] = -(far + near) / (far - near);
  return matrix;
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'GLES shader compilation failed');
  return shader;
}

export class Gles1Renderer {
  constructor(canvas, runtime, { width = 900, height = 560 } = {}) {
    this.canvas = canvas;
    this.runtime = runtime;
    canvas.width = width;
    canvas.height = height;
    this.width = width;
    this.height = height;
    this.gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: true,
      preserveDrawingBuffer: true,
    });
    if (!this.gl) throw new Error('WebGL is unavailable for the native GLES renderer.');
    const gl = this.gl;
    const vertex = compile(gl, gl.VERTEX_SHADER, `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      uniform mat4 u_matrix;
      varying vec2 v_texCoord;
      varying vec4 v_color;
      void main() {
        gl_Position = u_matrix * a_position;
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform bool u_useTexture;
      uniform bool u_modulate;
      varying vec2 v_texCoord;
      varying vec4 v_color;
      void main() {
        vec4 texel = u_useTexture ? texture2D(u_texture, v_texCoord) : vec4(1.0);
        gl_FragColor = u_useTexture ? (u_modulate ? texel * v_color : texel) : v_color;
      }
    `);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertex);
    gl.attachShader(this.program, fragment);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program) || 'GLES shader link failed');
    this.locations = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      texCoord: gl.getAttribLocation(this.program, 'a_texCoord'),
      color: gl.getAttribLocation(this.program, 'a_color'),
      matrix: gl.getUniformLocation(this.program, 'u_matrix'),
      texture: gl.getUniformLocation(this.program, 'u_texture'),
      useTexture: gl.getUniformLocation(this.program, 'u_useTexture'),
      modulate: gl.getUniformLocation(this.program, 'u_modulate'),
    };
    this.buffers = {
      position: gl.createBuffer(),
      texCoord: gl.createBuffer(),
      color: gl.createBuffer(),
      indices: gl.createBuffer(),
    };
    this.textures = new Map();
    this.framebuffers = new Map();
    this.renderbuffers = new Map();
    this.boundTexture = 0;
    this.textureCrop = new Map();
    this.textureSizes = new Map();
    this.boundFramebuffer = 0;
    this.boundRenderbuffer = 0;
    this.matrixMode = GL.MODELVIEW;
    this.matrices = new Map([[GL.MODELVIEW, identity()], [GL.PROJECTION, identity()], [GL.TEXTURE, identity()]]);
    this.matrixStacks = new Map([[GL.MODELVIEW, []], [GL.PROJECTION, []], [GL.TEXTURE, []]]);
    this.arrays = new Map();
    this.enabledArrays = new Set();
    this.enabledCapabilities = new Set();
    this.currentColor = [1, 1, 1, 1];
    this.textureEnvMode = 0x2100; // GL_MODULATE
    this.drawCalls = 0;
    this.errors = new Map();
    this.recentDraws = [];
    gl.useProgram(this.program);
    gl.uniform1i(this.locations.texture, 0);
    gl.uniform1i(this.locations.modulate, true);
    gl.viewport(0, 0, width, height);
  }

  integer(snapshot, index) {
    return Number(snapshot.arguments[index] ?? 0n);
  }

  float(index) {
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, BigInt.asUintN(64, this.runtime.exports.arm64_get_vector_lo(index)), true);
    return view.getFloat32(0, true);
  }

  stackInteger(index = 0) {
    const sp = Number(this.runtime.exports.arm64_get_sp());
    return Number(new DataView(this.runtime.readBytes(sp + index * 8, 8).buffer).getBigUint64(0, true));
  }

  currentMatrix() { return this.matrices.get(this.matrixMode); }
  setCurrentMatrix(matrix) { this.matrices.set(this.matrixMode, matrix); }

  textureFor(handle) {
    if (!handle) return null;
    if (!this.textures.has(handle)) this.textures.set(handle, this.gl.createTexture());
    return this.textures.get(handle);
  }

  framebufferFor(handle) {
    if (!handle) return null;
    if (!this.framebuffers.has(handle)) this.framebuffers.set(handle, this.gl.createFramebuffer());
    return this.framebuffers.get(handle);
  }

  renderbufferFor(handle) {
    if (!handle) return null;
    if (!this.renderbuffers.has(handle)) this.renderbuffers.set(handle, this.gl.createRenderbuffer());
    return this.renderbuffers.get(handle);
  }

  readArray(descriptor, first, count) {
    if (!descriptor || !count) return null;
    const componentBytes = descriptor.type === GL.FLOAT || descriptor.type === GL.FIXED ? 4
      : descriptor.type === GL.SHORT || descriptor.type === GL.UNSIGNED_SHORT ? 2 : 1;
    const stride = descriptor.stride || descriptor.size * componentBytes;
    const output = new Float32Array(count * descriptor.size);
    const bytes = this.runtime.readBytes(descriptor.pointer + first * stride, Math.max(0, (count - 1) * stride + descriptor.size * componentBytes));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let vertex = 0; vertex < count; vertex += 1) {
      for (let component = 0; component < descriptor.size; component += 1) {
        const offset = vertex * stride + component * componentBytes;
        let value;
        if (descriptor.type === GL.FLOAT) value = view.getFloat32(offset, true);
        else if (descriptor.type === GL.FIXED) value = view.getInt32(offset, true) / 65536;
        else if (descriptor.type === GL.SHORT) value = view.getInt16(offset, true);
        else if (descriptor.type === GL.UNSIGNED_SHORT) value = view.getUint16(offset, true);
        else if (descriptor.type === GL.BYTE) value = view.getInt8(offset);
        else value = view.getUint8(offset);
        if (descriptor.normalized) value /= descriptor.type === GL.UNSIGNED_BYTE ? 255 : descriptor.type === GL.BYTE ? 127 : 1;
        output[vertex * descriptor.size + component] = value;
      }
    }
    return output;
  }

  bindAttribute(location, buffer, values, size, fallback) {
    const gl = this.gl;
    if (values) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, values, gl.STREAM_DRAW);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    } else {
      gl.disableVertexAttribArray(location);
      if (size === 2) gl.vertexAttrib2f(location, fallback[0], fallback[1]);
      else gl.vertexAttrib4f(location, fallback[0], fallback[1], fallback[2], fallback[3]);
    }
  }

  prepareDraw(first, count) {
    const gl = this.gl;
    gl.useProgram(this.program);
    const position = this.readArray(this.arrays.get(GL.VERTEX_ARRAY), first, count);
    if (!position) return false;
    const textureCoordinates = this.enabledArrays.has(GL.TEXTURE_COORD_ARRAY)
      ? this.readArray(this.arrays.get(GL.TEXTURE_COORD_ARRAY), first, count) : null;
    const colors = this.enabledArrays.has(GL.COLOR_ARRAY) ? this.readArray(this.arrays.get(GL.COLOR_ARRAY), first, count) : null;
    this.bindAttribute(this.locations.position, this.buffers.position, position, this.arrays.get(GL.VERTEX_ARRAY).size, [0, 0, 0, 1]);
    this.bindAttribute(this.locations.texCoord, this.buffers.texCoord, textureCoordinates, 2, [0, 0]);
    this.bindAttribute(this.locations.color, this.buffers.color, colors, 4, this.currentColor);
    gl.uniformMatrix4fv(this.locations.matrix, false, multiply(this.matrices.get(GL.PROJECTION), this.matrices.get(GL.MODELVIEW)));
    gl.uniform1i(this.locations.useTexture, this.enabledCapabilities.has(GL.TEXTURE_2D) && Boolean(this.boundTexture));
    gl.uniform1i(this.locations.modulate, this.textureEnvMode !== 0x1e01); // GL_REPLACE
    const finitePositions = [...position].filter(Number.isFinite);
    this.pendingDraw = {
      first,
      count,
      positionSize: this.arrays.get(GL.VERTEX_ARRAY).size,
      positionRange: finitePositions.length ? [Math.min(...finitePositions), Math.max(...finitePositions)] : null,
      positionSample: [...position.slice(0, 12)],
      projection: [...this.matrices.get(GL.PROJECTION)],
      modelview: [...this.matrices.get(GL.MODELVIEW)],
      color: this.currentColor,
      texture: this.boundTexture,
      textureEnabled: this.enabledCapabilities.has(GL.TEXTURE_2D),
      framebuffer: this.boundFramebuffer,
    };
    return true;
  }

  recordDraw(mode) {
    this.recentDraws.push({ ...this.pendingDraw, mode });
    if (this.recentDraws.length > 12) this.recentDraws.shift();
  }

  call(name, snapshot) {
    const gl = this.gl;
    const a = (index) => this.integer(snapshot, index);
    // WebGL rejects a few legal GLES1 compatibility enums that are translated
    // or intentionally ignored here. Do not leak those host-only errors back
    // into libpad's Android fatal-error path.
    if (name === 'glGetError') { gl.getError(); return { handled: true, result: 0n }; }
    if (name === 'glCheckFramebufferStatusOES') return { handled: true, result: 0x8cd5n };
    if (/^glGenTextures$/.test(name)) {
      for (let index = 0; index < a(0); index += 1) this.textureFor(new DataView(this.runtime.readBytes(a(1) + index * 4, 4).buffer).getUint32(0, true));
    } else if (name === 'glDeleteTextures') {
      for (let index = 0; index < a(0); index += 1) {
        const handle = new DataView(this.runtime.readBytes(a(1) + index * 4, 4).buffer).getUint32(0, true);
        gl.deleteTexture(this.textures.get(handle)); this.textures.delete(handle);
      }
    } else if (name === 'glBindTexture') {
      this.boundTexture = a(1); gl.bindTexture(gl.TEXTURE_2D, this.textureFor(this.boundTexture));
    } else if (name === 'glTexParameteri' || name === 'glTexParameterx') {
      gl.texParameteri(a(0), a(1), a(2));
    } else if (name === 'glTexParameteriv') {
      if (a(1) === 0x8b9d) { // GL_TEXTURE_CROP_RECT_OES
        const view = new DataView(this.runtime.readBytes(a(2), 16).buffer);
        this.textureCrop.set(this.boundTexture, Array.from({ length: 4 }, (_, index) => view.getInt32(index * 4, true)));
      } else gl.texParameteri(a(0), a(1), new DataView(this.runtime.readBytes(a(2), 4).buffer).getInt32(0, true));
    } else if (name === 'glTexImage2D' || name === 'glTexSubImage2D') {
      const width = a(name === 'glTexImage2D' ? 3 : 4);
      const height = a(name === 'glTexImage2D' ? 4 : 5);
      const format = a(name === 'glTexImage2D' ? 6 : 6);
      const type = a(7);
      const pointer = this.stackInteger(0);
      const components = format === gl.RGBA ? 4 : format === gl.RGB ? 3 : format === gl.LUMINANCE_ALPHA ? 2 : 1;
      const packed = type === 0x8363 || type === 0x8033 || type === 0x8034;
      const length = width * height * (packed ? 2 : components);
      const rawPixels = pointer && length > 0 ? this.runtime.readBytes(pointer, length) : null;
      const pixels = rawPixels && packed
        ? new Uint16Array(rawPixels.slice().buffer)
        : rawPixels;
      if (name === 'glTexImage2D') {
        gl.texImage2D(a(0), a(1), format, width, height, a(5), format, type, pixels);
        if (a(1) === 0) this.textureSizes.set(this.boundTexture, [width, height]);
      }
      else gl.texSubImage2D(a(0), a(1), a(2), a(3), width, height, format, type, pixels);
    } else if (name === 'glEnableClientState') this.enabledArrays.add(a(0));
    else if (name === 'glDisableClientState') this.enabledArrays.delete(a(0));
    else if (name === 'glVertexPointer') this.arrays.set(GL.VERTEX_ARRAY, { size: a(0), type: a(1), stride: a(2), pointer: a(3) });
    else if (name === 'glTexCoordPointer') this.arrays.set(GL.TEXTURE_COORD_ARRAY, { size: a(0), type: a(1), stride: a(2), pointer: a(3) });
    else if (name === 'glColorPointer') this.arrays.set(GL.COLOR_ARRAY, { size: a(0), type: a(1), stride: a(2), pointer: a(3), normalized: true });
    else if (name === 'glMatrixMode') this.matrixMode = a(0);
    else if (name === 'glLoadIdentity') this.setCurrentMatrix(identity());
    else if (name === 'glPushMatrix') this.matrixStacks.get(this.matrixMode).push(new Float32Array(this.currentMatrix()));
    else if (name === 'glPopMatrix') this.setCurrentMatrix(this.matrixStacks.get(this.matrixMode).pop() || identity());
    else if (name === 'glOrthof' || name === 'glOrthox') {
      const values = name === 'glOrthof' ? [0, 1, 2, 3, 4, 5].map((index) => this.float(index))
        : [0, 1, 2, 3, 4, 5].map((index) => a(index) / 65536);
      this.setCurrentMatrix(multiply(this.currentMatrix(), orthographic(...values)));
    } else if (name === 'glTranslatef' || name === 'glTranslatex') {
      const values = name === 'glTranslatef' ? [this.float(0), this.float(1), this.float(2)] : [a(0) / 65536, a(1) / 65536, a(2) / 65536];
      const matrix = identity(); matrix[12] = values[0]; matrix[13] = values[1]; matrix[14] = values[2];
      this.setCurrentMatrix(multiply(this.currentMatrix(), matrix));
    } else if (name === 'glScalef' || name === 'glScalex') {
      const values = name === 'glScalef' ? [this.float(0), this.float(1), this.float(2)] : [a(0) / 65536, a(1) / 65536, a(2) / 65536];
      const matrix = identity(); matrix[0] = values[0]; matrix[5] = values[1]; matrix[10] = values[2];
      this.setCurrentMatrix(multiply(this.currentMatrix(), matrix));
    } else if (name === 'glEnable' || name === 'glDisable') {
      const enabled = name === 'glEnable';
      if (enabled) this.enabledCapabilities.add(a(0)); else this.enabledCapabilities.delete(a(0));
      if (a(0) !== GL.TEXTURE_2D && [gl.BLEND, gl.DEPTH_TEST, gl.CULL_FACE, gl.SCISSOR_TEST, gl.STENCIL_TEST, gl.POLYGON_OFFSET_FILL].includes(a(0))) {
        if (enabled) gl.enable(a(0)); else gl.disable(a(0));
      }
    } else if (name === 'glBlendFunc') gl.blendFunc(a(0), a(1));
    else if (name === 'glBlendEquationOES') gl.blendEquation(a(0));
    else if (name === 'glDepthFunc') gl.depthFunc(a(0));
    else if (name === 'glDepthMask') gl.depthMask(Boolean(a(0)));
    else if (name === 'glColorMask') gl.colorMask(Boolean(a(0)), Boolean(a(1)), Boolean(a(2)), Boolean(a(3)));
    else if (name === 'glCullFace') gl.cullFace(a(0));
    else if (name === 'glScissor') gl.scissor(a(0), a(1), a(2), a(3));
    else if (name === 'glViewport') gl.viewport(a(0), a(1), a(2), a(3));
    else if (name === 'glClearColor') gl.clearColor(this.float(0), this.float(1), this.float(2), this.float(3));
    else if (name === 'glClearDepthf') gl.clearDepth(this.float(0));
    else if (name === 'glClear') gl.clear(a(0));
    else if (name === 'glColor4ub') this.currentColor = [a(0) / 255, a(1) / 255, a(2) / 255, a(3) / 255];
    else if (name === 'glColor4x') this.currentColor = [0, 1, 2, 3]
      .map((index) => Number(BigInt.asIntN(32, snapshot.arguments[index])) / 65536);
    else if ((name === 'glTexEnvi' || name === 'glTexEnvx') && a(1) === 0x2200) this.textureEnvMode = a(2);
    else if (name === 'glDrawArrays') {
      if (this.prepareDraw(a(1), a(2))) { gl.drawArrays(a(0), 0, a(2)); this.drawCalls += 1; this.recordDraw(a(0)); }
    } else if (name === 'glDrawElements') {
      const count = a(1); const type = a(2); const pointer = a(3);
      const elementBytes = type === GL.UNSIGNED_BYTE ? 1 : 2;
      const indices = this.runtime.readBytes(pointer, count * elementBytes);
      let maxIndex = 0;
      const view = new DataView(indices.buffer, indices.byteOffset, indices.byteLength);
      for (let index = 0; index < count; index += 1) maxIndex = Math.max(maxIndex, elementBytes === 1 ? view.getUint8(index) : view.getUint16(index * 2, true));
      if (this.prepareDraw(0, maxIndex + 1)) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);
        gl.drawElements(a(0), count, type, 0); this.drawCalls += 1; this.recordDraw(a(0));
      }
    } else if (name === 'glGenFramebuffersOES') {
      for (let index = 0; index < a(0); index += 1) this.framebufferFor(new DataView(this.runtime.readBytes(a(1) + index * 4, 4).buffer).getUint32(0, true));
    } else if (name === 'glBindFramebufferOES') {
      this.boundFramebuffer = a(1); gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebufferFor(this.boundFramebuffer));
    } else if (name === 'glFramebufferTexture2DOES') {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, a(1), a(2), this.textureFor(a(3)), a(4));
    } else if (name === 'glGenRenderbuffersOES') {
      for (let index = 0; index < a(0); index += 1) this.renderbufferFor(new DataView(this.runtime.readBytes(a(1) + index * 4, 4).buffer).getUint32(0, true));
    } else if (name === 'glBindRenderbufferOES') {
      this.boundRenderbuffer = a(1); gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbufferFor(this.boundRenderbuffer));
    } else if (name === 'glRenderbufferStorageOES') {
      gl.renderbufferStorage(gl.RENDERBUFFER, a(1), a(2), a(3));
    } else if (name === 'glFramebufferRenderbufferOES') {
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, a(1), gl.RENDERBUFFER, this.renderbufferFor(a(3)));
    } else if (name === 'glDrawTexiOES') {
      const [x, y, , width, height] = [a(0), a(1), a(2), a(3), a(4)];
      const positions = new Float32Array([x, y, x + width, y, x, y + height, x + width, y + height]);
      const crop = this.textureCrop.get(this.boundTexture);
      const [textureWidth, textureHeight] = this.textureSizes.get(this.boundTexture) || [width, height];
      const u0 = crop ? crop[0] / textureWidth : 0;
      const v0 = crop ? crop[1] / textureHeight : 0;
      const u1 = crop ? (crop[0] + crop[2]) / textureWidth : 1;
      const v1 = crop ? (crop[1] + crop[3]) / textureHeight : 1;
      const texCoords = new Float32Array([u0, v0, u1, v0, u0, v1, u1, v1]);
      const savedProjection = this.matrices.get(GL.PROJECTION); const savedModel = this.matrices.get(GL.MODELVIEW);
      this.matrices.set(GL.PROJECTION, orthographic(0, this.width, 0, this.height, -1, 1)); this.matrices.set(GL.MODELVIEW, identity());
      this.bindAttribute(this.locations.position, this.buffers.position, positions, 2, [0, 0, 0, 1]);
      this.bindAttribute(this.locations.texCoord, this.buffers.texCoord, texCoords, 2, [0, 0]);
      this.bindAttribute(this.locations.color, this.buffers.color, null, 4, this.currentColor);
      gl.uniformMatrix4fv(this.locations.matrix, false, this.matrices.get(GL.PROJECTION));
      gl.uniform1i(this.locations.useTexture, true);
      gl.uniform1i(this.locations.modulate, this.textureEnvMode !== 0x1e01);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); this.drawCalls += 1;
      this.matrices.set(GL.PROJECTION, savedProjection); this.matrices.set(GL.MODELVIEW, savedModel);
    }
    const error = gl.getError();
    if (error) this.errors.set(`${name}:0x${error.toString(16)}`, (this.errors.get(`${name}:0x${error.toString(16)}`) || 0) + 1);
    return { handled: true, result: 0n };
  }

  diagnostics() {
    const gl = this.gl;
    const previous = this.boundFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const points = [
      [Math.floor(this.width / 2), Math.floor(this.height / 2)],
      [Math.floor(this.width / 4), Math.floor(this.height / 4)],
      [Math.floor(this.width * 3 / 4), Math.floor(this.height * 3 / 4)],
    ].map(([x, y]) => {
      const pixel = new Uint8Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      return [...pixel];
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebufferFor(previous));
    return {
      drawCalls: this.drawCalls,
      boundFramebuffer: this.boundFramebuffer,
      boundTexture: this.boundTexture,
      textures: this.textures.size,
      framebuffers: this.framebuffers.size,
      renderbuffers: this.renderbuffers.size,
      pixels: points,
      errors: Object.fromEntries(this.errors),
      recentDraws: this.recentDraws,
    };
  }
}
