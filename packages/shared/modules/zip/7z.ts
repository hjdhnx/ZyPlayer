import { isStrEmpty, isString } from '@shared/modules/validate';
import sevenZipBin from '7zip-bin-full';
import sevenZip from 'node-7z';

const sevenZipPath = sevenZipBin.path7z;

/**
 * Compressing to 7z file
 */
export async function compress7z(src: string, dest: string): Promise<boolean> {
  if (!isString(src) || isStrEmpty(src) || !isString(dest) || isStrEmpty(dest)) return false;

  try {
    const stream = sevenZip.add(dest, src, {
      recursive: true,
      $bin: sevenZipPath,
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => resolve());
      stream.on('error', (err: Error) => reject(err));
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Decompress 7z file
 * @param src - The path of the .7z file
 * @param dest - The destination directory to extract the contents
 * @returns Whether the decompression was successful
 */
export async function decompress7z(src: string, dest: string): Promise<boolean> {
  if (!isString(src) || isStrEmpty(src) || !isString(dest) || isStrEmpty(dest)) return false;

  if (!src.endsWith('.7z')) return false;

  try {
    const stream = sevenZip.extractFull(src, dest, {
      recursive: true,
      $bin: sevenZipPath,
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => resolve());
      stream.on('error', (err: Error) => reject(err));
    });

    return true;
  } catch {
    return false;
  }
}
