
const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const s3Service = {
  /**
   * Generate signed POST URL for direct upload to S3
   */
  async generateSignedPostUrl(fileType, fileSize, folder = 'uploads') {
    try {
      const fileExtension = fileType.split('/')[1];
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
      
      const conditions = [
        ['content-length-range', 0, fileSize], // Max file size
        ['starts-with', '$Content-Type', fileType.split('/')[0]] // File type validation
      ];

      const fields = {
        'Content-Type': fileType
      };

      const { url, fields: formFields } = await createPresignedPost(s3Client, {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Conditions: conditions,
        Fields: fields,
        Expires: 3600 // 1 hour
      });

      return {
        uploadUrl: url,
        fields: formFields,
        fileName,
        expiresIn: 3600
      };
    } catch (error) {
      console.error('Generate signed POST URL error:', error);
      throw new Error('Failed to generate upload URL');
    }
  },

  /**
   * Generate signed POST URL for video uploads
   */
  async generateVideoUploadUrl(fileSize) {
    return this.generateSignedPostUrl('video/mp4', fileSize, 'videos');
  },

  /**
   * Generate signed POST URL for image uploads
   */
  async generateImageUploadUrl(fileSize, fileType = 'image/jpeg') {
    return this.generateSignedPostUrl(fileType, fileSize, 'images');
  },

  /**
   * Generate signed POST URL for thumbnail uploads
   */
  async generateThumbnailUploadUrl(fileSize, fileType = 'image/jpeg') {
    return this.generateSignedPostUrl(fileType, fileSize, 'thumbnails');
  }
};

module.exports = s3Service;
