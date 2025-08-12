
const AWS = require('aws-sdk');
const fs = require('fs');
const logger = require('../../../shared/utils/logger');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const mediaConvert = new AWS.MediaConvert({
  endpoint: process.env.AWS_MEDIACONVERT_ENDPOINT
});

const awsService = {
  /**
   * Generate signed CloudFront URL for video streaming
   */
  async generateSignedUrl(s3Key, quality = '720p') {
    try {
      const cloudFront = new AWS.CloudFront.Signer(
        process.env.AWS_CLOUDFRONT_KEY_PAIR_ID,
        process.env.AWS_CLOUDFRONT_PRIVATE_KEY
      );

      const videoPath = `${s3Key}/${quality}/index.m3u8`;
      const url = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${videoPath}`;
      
      const signedUrl = cloudFront.getSignedUrl({
        url,
        expires: Math.floor(Date.now() / 1000) + (60 * 60 * 2) // 2 hours
      });

      return signedUrl;
    } catch (error) {
      logger.error('Generate signed URL error:', error);
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

      const result = await mediaConvert.createJob(jobSettings).promise();
      
      logger.info(`MediaConvert job created: ${result.Job.Id} for content: ${contentId}`);
      
      return result.Job;
    } catch (error) {
      logger.error('Create transcoding job error:', error);
      throw new Error('Failed to create transcoding job');
    }
  },

  /**
   * Upload file to S3
   */
  async uploadToS3(file, key) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer || fs.createReadStream(file.path),
        ContentType: file.mimetype
      };

      const result = await s3.upload(params).promise();
      
      logger.info(`File uploaded to S3: ${result.Location}`);
      
      return result;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }
};

module.exports = awsService;
