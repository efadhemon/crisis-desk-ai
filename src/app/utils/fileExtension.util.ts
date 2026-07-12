/** Extracts the extension from a URL or storage key basename (e.g. `photo.jpg` → `jpg`). */
export const extractExtensionFromSource = (source?: string): string | undefined => {
  if (!source?.trim()) return undefined;

  const normalized = source.trim();
  let pathPart = normalized;

  try {
    pathPart = new URL(normalized).pathname;
  } catch {
    pathPart = normalized.split('?')[0].split('#')[0];
  }

  const basename = pathPart.replace(/\\/g, '/').split('/').pop() ?? '';
  const dotIndex = basename.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === basename.length - 1) return undefined;

  const ext = basename.slice(dotIndex + 1).toLowerCase();
  if (ext.length <= 6 && /^[a-z0-9]+$/.test(ext)) {
    return ext;
  }

  return undefined;
};

export const inferExtensionFromUrl = (url?: string, fallback = 'bin'): string => {
  return extractExtensionFromSource(url) ?? fallback;
};

export const extensionFromContentType = (contentType?: string): string | undefined => {
  if (!contentType?.trim()) return undefined;

  const normalized = contentType.split(';')[0].trim().toLowerCase();
  const mimeTypeToExtension: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };

  return mimeTypeToExtension[normalized];
};

export const inferExtensionFromBuffer = (buffer: Buffer, fallback = 'bin'): string => {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'pdf';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }
  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
  ) {
    return 'gif';
  }
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'mp4';
  }
  if (buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return 'bmp';
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF') {
    return 'webp';
  }

  return fallback;
};

export const extensionFromPath = (filePath: string): string | undefined => {
  const match = filePath.match(/\.([a-z0-9]{1,6})$/i);
  return match?.[1]?.toLowerCase();
};

export const applyFileExtension = (filePath: string, extension: string): string => {
  const ext = extension.replace(/^\./, '').toLowerCase() || 'bin';
  const base = filePath.replace(/\.[^./\\]+$/, '');
  return `${base}.${ext}`;
};

/**
 * Resolves the final path inside the ZIP.
 * Original extension (from URL/key) is always preserved when available.
 * Content sniffing is only used when the source has no extension.
 */
export const resolveArchiveEntryPath = (
  filePath: string,
  buffer: Buffer,
  contentType?: string,
  originalExtension?: string,
): string => {
  const normalizedOriginal = originalExtension?.replace(/^\./, '').toLowerCase();
  if (normalizedOriginal) {
    return applyFileExtension(filePath, normalizedOriginal);
  }

  const pathExt = extensionFromPath(filePath);
  if (pathExt && pathExt !== 'bin') {
    return filePath;
  }

  const detectedExt =
    extensionFromContentType(contentType) ?? inferExtensionFromBuffer(buffer, pathExt ?? 'bin');

  return applyFileExtension(filePath, detectedExt);
};
