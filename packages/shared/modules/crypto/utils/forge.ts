import { util } from 'node-forge';

const bytesTobase64 = (bytes: string): string => {
  return util.encode64(bytes);
};

const bytesToHex = (bytes: string): string => {
  return util.bytesToHex(bytes);
};

const bytesToUtf8 = (bytes: string): string => {
  return util.decodeUtf8(bytes);
};

const bytesToUtf16 = (bytes: Uint8Array<ArrayBufferLike>): string => {
  return util.text.utf16.decode(bytes);
};

const hexToBytes = (str: string): string => {
  return util.hexToBytes(str);
};

const base64ToBytes = (str: string): string => {
  return util.decode64(str);
};

const utf8ToBytes = (str: string): string => {
  return util.encodeUtf8(str);
};

const utf16ToBytes = (str: string): Uint8Array => {
  return util.text.utf16.encode(str);
};

export const parse = {
  utf8: utf8ToBytes,
  utf16: utf16ToBytes,
  hex: hexToBytes,
  base64: base64ToBytes,
};

export const stringify = {
  utf8: bytesToUtf8,
  utf16: bytesToUtf16,
  hex: bytesToHex,
  base64: bytesTobase64,
};

export const cloneBytes = (buffer: util.ByteBuffer): util.ByteBuffer => {
  const clonedBuffer = util.createBuffer();
  const data = buffer.getBytes();
  clonedBuffer.putBytes(data);

  return clonedBuffer;
};

export const arrayToBytes = (
  array: string | ArrayBuffer | util.ArrayBufferView | util.ByteStringBuffer,
): util.ByteBuffer => {
  return util.createBuffer(array);
};

export const bytesToArray = (buffer: util.ByteBuffer): Uint8Array => {
  const clonedData = cloneBytes(buffer);
  const bytesStr = clonedData.getBytes();
  const uint8Array = new Uint8Array(bytesStr.length);
  for (let i = 0; i < bytesStr.length; i++) {
    uint8Array[i] = bytesStr.charCodeAt(i);
  }
  return uint8Array;
};

export default { parse, stringify, arrayToBytes, bytesToArray };
