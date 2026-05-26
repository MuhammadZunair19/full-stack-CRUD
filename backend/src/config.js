import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  dynamoTable: process.env.DYNAMODB_TABLE || 'crud-items',
  s3Bucket: process.env.S3_BUCKET || 'crud-item-attachments',
  signedUrlExpiresSeconds: Number(process.env.SIGNED_URL_EXPIRES_SECONDS || 3600),
  maxUploadBytes: 10 * 1024 * 1024
};
