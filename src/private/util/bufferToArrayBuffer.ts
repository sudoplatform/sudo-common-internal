export const bufferToArrayBuffer = (buf: Buffer): ArrayBuffer => {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}
