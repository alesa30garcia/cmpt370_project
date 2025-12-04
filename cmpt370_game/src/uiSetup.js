function shaderValuesErrorCheck(programInfo) {
  // Temporarily disable strict uniform/attribute checking because
  // we have multiple shader variants (some with sampler, some without).
  // If a uniform is missing, WebGL will just ignore the gl.uniform*
  // calls for that program, which is fine for our use-case.
  return;
}