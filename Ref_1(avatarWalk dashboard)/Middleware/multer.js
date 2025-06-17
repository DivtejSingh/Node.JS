// import multer from 'multer';
// import multerS3 from 'multer-s3';
// import { S3Client } from '@aws-sdk/client-s3';

// // Initialize S3Client
// const s3 = new S3Client({
//   region: process.env.AWS_DEFAULT_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// // Multer configuration with S3 storage (no ACL)
// export const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_BUCKET,
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req, file, cb) => {
//       const folder =
//         file.fieldname === 'thumbnail'
//           ? 'thumbnails'
//           : file.fieldname === 'images'
//           ? 'images'
//           : 'videos';
//       const fileName = `${folder}/${Date.now()}_${file.originalname}`;
//       cb(null, fileName);
//     },
//   }),
//   limits: {
//     fileSize: 100 * 1024 * 1024, // Limit file size to 100MB
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       'image/jpeg',
//       'image/png',
//       'image/webp',
//       'video/mp4',
//       'video/mov',
//     ];
//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
//     }
//     cb(null, true);
//   },
// });

// export const uploadMiddleware = upload.fields([
//   { name: 'thumbnail', maxCount: 1 }, // Single thumbnail
//   { name: 'images', maxCount: 10 }, // Up to 10 images
//   { name: 'video', maxCount: 1 }, // Single video
// ]);

// export default uploadMiddleware;

import multer from 'multer';
import path from 'path';

// Configure Multer for local storage
export const upload = multer({

  dest: 'uploads/', // Temporary storage location
  limits: {
    fileSize: 100 * 1024 * 1024, // Limit file size to 100MB
  },
  fileFilter: (req, file, cb) => {

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/mov',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
    cb(null, true);
  },
});

export const uploadMiddleware = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 }, // Up to 10 images
  { name: 'video', maxCount: 1 },// Single video// Single video
  { name: 'file', maxCount: 1 }// Single video// Single video
]);

export default uploadMiddleware;
