import multer from "multer";

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
]);

const fileFilter = (req, file, cb) => {
  const mimetype = file.mimetype?.toLowerCase();

  if (
    ALLOWED_IMAGE_TYPES.has(mimetype) ||
    ALLOWED_VIDEO_TYPES.has(mimetype)
  ) {
    return cb(null, true);
  }

  return cb(
    new Error(
      `Unsupported file type: ${file.mimetype}. ` +
      `Supported formats: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, MKV.`
    ),
    false
  );
};

const upload = multer({
  storage,
  fileFilter,

  // Multer only needs to allow up to the largest supported file.
  // Image/video-specific limits are checked below.
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 6,
  },
});

export const uploadMedia = upload.array("media", 6);

export const validateMediaFiles = (req, res, next) => {
  const files = req.files || [];

  if (files.length === 0) {
    return next();
  }

  const images = files.filter((file) =>
    file.mimetype?.startsWith("image/")
  );

  const videos = files.filter((file) =>
    file.mimetype?.startsWith("video/")
  );

  // Maximum 1 video
  if (videos.length > 1) {
    return res.status(400).json({
      success: false,
      message: "Only 1 video is allowed per post.",
    });
  }

  // Do not allow images + video in same post
  if (videos.length > 0 && images.length > 0) {
    return res.status(400).json({
      success: false,
      message: "A post can contain either images or one video, not both.",
    });
  }

  // Image limit: 25MB each
  for (const file of images) {
    if (file.size > 25 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: `"${file.originalname}" is larger than the 25MB image limit.`,
      });
    }
  }

  // Video limit: 100MB
  for (const file of videos) {
    if (file.size > 100 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: `"${file.originalname}" is larger than the 100MB video limit.`,
      });
    }
  }

  next();
};

export const handleUploadError = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  console.error("❌ MULTER ERROR:", err);

  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message:
            "File exceeds the 100MB maximum upload size.",
        });

      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message:
            "Too many files. Maximum 6 images or 1 video per post.",
        });

      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message:
            'Unexpected file field. Files must be uploaded using the "media" field.',
        });

      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
    }
  }

  return res.status(400).json({
    success: false,
    message: err.message || "File upload failed",
  });
};