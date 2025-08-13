
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { MediaConvertClient, CreateJobCommand } = require('@aws-sdk/client-mediaconvert');
const { CloudFrontClient } = require('@aws-sdk/client-cloudfront');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');

// Configure AWS clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_MEDIACONVERT_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const awsService = {
  /**
   * Generate signed CloudFront URL for video streaming
   */
  async generateSignedUrl(s3Key, quality = '720p') {
    try {
      // For CloudFront signed URLs, you'll need to implement custom signing
      // This is a simplified version - you may need CloudFront key pair for production
      const videoPath = `${s3Key}/${quality}/index.m3u8`;
      const url = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${videoPath}`;
      
      // Note: For production, implement proper CloudFront URL signing
      // This is a temporary solution
      return url;
    } catch (error) {
      console.error('Generate signed URL error:', error);
      throw new Error('Failed to generate streaming URL');
    }
  },

  /**
   * Create MediaConvert job for video transcoding
   */
  async createTranscodingJob(inputFile, outputPath, contentId) {
    try {
      const jobSettings = {
        Role: process.env.AWS_MEDIACONVERT_ROLE,
        Settings: {
          Inputs: [{
            FileInput: `s3://${process.env.AWS_S3_BUCKET}/${inputFile}`,
            AudioSelectors: {
              "Audio Selector 1": {
                Offset: 0,
                DefaultSelection: "DEFAULT",
                ProgramSelection: 1
              }
            },
            VideoSelector: {
              ColorSpace: "FOLLOW"
            }
          }],
          OutputGroups: [
            {
              Name: "HLS",
              Outputs: [
                {
                  NameModifier: "_240p",
                  VideoDescription: {
                    Width: 426,
                    Height: 240,
                    CodecSettings: {
                      Codec: "H_264",
                      H264Settings: {
                        Bitrate: 400000,
                        RateControlMode: "CBR"
                      }
                    }
                  },
                  AudioDescriptions: [{
                    AudioTypeControl: "FOLLOW_INPUT",
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: {
                        AudioDescriptionBroadcasterMix: "NORMAL",
                        Bitrate: 96000,
                        RateControlMode: "CBR",
                        CodecProfile: "LC",
                        CodingMode: "CODING_MODE_2_0",
                        RawFormat: "NONE",
                        SampleRate: 48000,
                        Specification: "MPEG4"
                      }
                    }
                  }],
                  ContainerSettings: {
                    Container: "M3U8",
                    M3u8Settings: {}
                  }
                },
                {
                  NameModifier: "_480p",
                  VideoDescription: {
                    Width: 854,
                    Height: 480,
                    CodecSettings: {
                      Codec: "H_264",
                      H264Settings: {
                        Bitrate: 1000000,
                        RateControlMode: "CBR"
                      }
                    }
                  },
                  AudioDescriptions: [{
                    AudioTypeControl: "FOLLOW_INPUT",
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: {
                        AudioDescriptionBroadcasterMix: "NORMAL",
                        Bitrate: 96000,
                        RateControlMode: "CBR",
                        CodecProfile: "LC",
                        CodingMode: "CODING_MODE_2_0",
                        RawFormat: "NONE",
                        SampleRate: 48000,
                        Specification: "MPEG4"
                      }
                    }
                  }],
                  ContainerSettings: {
                    Container: "M3U8",
                    M3u8Settings: {}
                  }
                },
                {
                  NameModifier: "_720p",
                  VideoDescription: {
                    Width: 1280,
                    Height: 720,
                    CodecSettings: {
                      Codec: "H_264",
                      H264Settings: {
                        Bitrate: 2500000,
                        RateControlMode: "CBR"
                      }
                    }
                  },
                  AudioDescriptions: [{
                    AudioTypeControl: "FOLLOW_INPUT",
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: {
                        AudioDescriptionBroadcasterMix: "NORMAL",
                        Bitrate: 96000,
                        RateControlMode: "CBR",
                        CodecProfile: "LC",
                        CodingMode: "CODING_MODE_2_0",
                        RawFormat: "NONE",
                        SampleRate: 48000,
                        Specification: "MPEG4"
                      }
                    }
                  }],
                  ContainerSettings: {
                    Container: "M3U8",
                    M3u8Settings: {}
                  }
                },
                {
                  NameModifier: "_1080p",
                  VideoDescription: {
                    Width: 1920,
                    Height: 1080,
                    CodecSettings: {
                      Codec: "H_264",
                      H264Settings: {
                        Bitrate: 5000000,
                        RateControlMode: "CBR"
                      }
                    }
                  },
                  AudioDescriptions: [{
                    AudioTypeControl: "FOLLOW_INPUT",
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: {
                        AudioDescriptionBroadcasterMix: "NORMAL",
                        Bitrate: 96000,
                        RateControlMode: "CBR",
                        CodecProfile: "LC",
                        CodingMode: "CODING_MODE_2_0",
                        RawFormat: "NONE",
                        SampleRate: 48000,
                        Specification: "MPEG4"
                      }
                    }
                  }],
                  ContainerSettings: {
                    Container: "M3U8",
                    M3u8Settings: {}
                  }
                }
              ],
              OutputGroupSettings: {
                Type: "HLS_GROUP_SETTINGS",
                HlsGroupSettings: {
                  Destination: `s3://${process.env.AWS_S3_BUCKET}/${outputPath}/`,
                  SegmentLength: 10,
                  MinSegmentLength: 0
                }
              }
            }
          ]
        }
      };

      const command = new CreateJobCommand(jobSettings);
      const result = await mediaConvertClient.send(command);
      
      console.log(`MediaConvert job created: ${result.Job.Id} for content: ${contentId}`);
      
      return result.Job;
    } catch (error) {
      console.error('Create transcoding job error:', error);
      throw new Error('Failed to create transcoding job');
    }
  },

  /**
   * Upload file to S3
   */
  async uploadToS3(file, key) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer || fs.createReadStream(file.path),
        ContentType: file.mimetype
      });

      const result = await s3Client.send(command);
      
      console.log(`File uploaded to S3: ${key}`);
      
      return result;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }
};

module.exports = awsService;
