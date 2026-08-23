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
  } catch (err) {
    console.warn('[ImageKit] Initialization error:', err.message);
  }
}

/**
 * Upload a file buffer to ImageKit
 * @param {Buffer} fileBuffer - The binary buffer of the file
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @param {string} folder - Destination folder on ImageKit
 * @returns {Promise<{url: string, fileId: string, name: string, type: string, size: number, mimeType: string}>}
 */
export const uploadToImageKit = async (
  fileBuffer,
  fileName = 'upload',
  mimeType = '',
  folder = '/teamforge/community'
) => {
  const isVideo = (mimeType && mimeType.startsWith('video/')) || /\.(mp4|webm|mov|mkv)$/i.test(fileName);
  const mediaType = isVideo ? 'video' : 'image';
  const sanitizedFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (imagekit) {
    try {
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: sanitizedFileName,
        folder,
        useUniqueFileName: true
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
      console.error('[ImageKit Upload Error]:', uploadError);
      throw new Error(`ImageKit upload failed: ${uploadError.message || 'Unknown error'}`);
    }
  }

  // Graceful fallback if ImageKit credentials are not set
  const base64Data = fileBuffer.toString('base64');
  const fallbackMime = mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
  const dataUri = `data:${fallbackMime};base64,${base64Data}`;

  return {
    url: dataUri,
    thumbnailUrl: dataUri,
    fileId: `local_${Date.now()}`,
    name: fileName,
    type: mediaType,
    size: fileBuffer ? fileBuffer.length : 0,
    mimeType: fallbackMime
  };
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
