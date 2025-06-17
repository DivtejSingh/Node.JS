import fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage'; // Import Upload from lib-storage
import path from 'path';

// Initialize S3Client
const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadFileToS3 = async (filePath, fileName, folder) => {
  const fileStream = fs.createReadStream(filePath);

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_BUCKET,
      Key: `${folder}/${fileName}`, // S3 file path
      Body: fileStream,
    },
  });

  try {
    // Optional: You can track progress if needed
    upload.on("httpUploadProgress", (progress) => {
      console.log("Progress:", progress);
    });

    // Perform the upload
    const result = await upload.done();
    console.log(`Uploaded to S3: ${folder}/${fileName}`);
  } catch (error) {
    console.error(`Error uploading to S3: ${fileName}`);
    throw error;
  } finally {
    // Remove the file from local storage
    fs.unlinkSync(filePath);
  }
};
