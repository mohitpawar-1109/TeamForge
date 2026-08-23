import ImageKit from 'imagekit';
import dotenv from 'dotenv';
dotenv.config();

let imagekit = null;

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

if (publicKey && privateKey && urlEndpoint) {
  try {
    imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    });
    console.log('[ImageKit] Initialized successfully with endpoint:', urlEndpoint);
  } catch (err) {
    console.error('[ImageKit] Initialization error:', err.message);
  }
} else {
  const missing = [];
  if (!publicKey) missing.push('IMAGEKIT_PUBLIC_KEY');
  if (!privateKey) missing.push('IMAGEKIT_PRIVATE_KEY');
  if (!urlEndpoint) missing.push('IMAGEKIT_URL_ENDPOINT');
  console.warn(`[ImageKit] Configuration missing: ${missing.join(', ')}`);
}

/**
 * Upload a file buffer to ImageKit
 * @param {Buffer} fileBuffer - The binary buffer of the file
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @param {string} folder - Destination folder on ImageKit
 * @returns {Promise<{url: string, thumbnailUrl: string, fileId: string, name: string, type: string, size: number, mimeType: string}>}
 */
export const uploadToImageKit = async (
  fileBuffer,
  fileName = 'upload',
  mimeType = '',
  folder = '/teamforge/community'
) => {
  if (!imagekit) {
    const missing = [];
    if (!process.env.IMAGEKIT_PUBLIC_KEY) missing.push('IMAGEKIT_PUBLIC_KEY');
    if (!process.env.IMAGEKIT_PRIVATE_KEY) missing.push('IMAGEKIT_PRIVATE_KEY');
    if (!process.env.IMAGEKIT_URL_ENDPOINT) missing.push('IMAGEKIT_URL_ENDPOINT');
    throw new Error(`ImageKit server configuration missing: ${missing.join(', ')}. Please set environment variables.`);
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Upload failed: File buffer is empty or invalid.');
  }

  const isVideo = (mimeType && mimeType.startsWith('video/')) || /\.(mp4|webm|mov|mkv)$/i.test(fileName);
  const mediaType = isVideo ? 'video' : 'image';
  const sanitizedFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: sanitizedFileName,
      folder,
      useUniqueFileName: true
    });

    console.log('[IMAGEKIT UPLOAD SUCCESS]:', {
      fileId: response.fileId,
      url: response.url,
      name: response.name,
      size: response.size
    });

    return {
      url: response.url,
      thumbnailUrl: response.thumbnailUrl || response.url,
      fileId: response.fileId,
      name: response.name || fileName,
      type: mediaType,
      size: response.size || (fileBuffer ? fileBuffer.length : 0),
      mimeType: mimeType || (isVideo ? 'video/mp4' : 'image/jpeg')
    };
  } catch (uploadError) {
    console.error('[IMAGEKIT UPLOAD ERROR]:', uploadError);
    throw new Error(`ImageKit upload failed: ${uploadError.message || 'Unknown storage error'}`);
  }
};

/**
 * Delete a file from ImageKit by fileId
 * @param {string} fileId
 * @returns {Promise<boolean>}
 */
export const deleteFromImageKit = async (fileId) => {
  if (!imagekit || !fileId || fileId.startsWith('local_')) return true;
  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (err) {
    console.warn('[ImageKit Delete Error]:', err.message);
    return false;
  }
};

export default imagekit;

