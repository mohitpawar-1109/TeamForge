import multer from 'multer';

// Memory storage to process file buffers in RAM and stream to ImageKit
const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-matroska' // .mkv
];

const fileFilter = (req, file, cb) => {
  const isImage = (file.mimetype && file.mimetype.startsWith('image/')) || ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isVideo = (file.mimetype && file.mimetype.startsWith('video/')) || ALLOWED_VIDEO_TYPES.includes(file.mimetype);

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type (${file.mimetype}). Supported formats: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max overall per file (25MB images / 100MB videos enforced in controller)
    files: 6
  }
});

// Accepts array of media attachments under field name 'media'
export const uploadMedia = upload.array('media', 6);

// Multer error handler middleware
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 25MB for images and 100MB for videos.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 6 images or 1 video per post.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }

  next();
};
