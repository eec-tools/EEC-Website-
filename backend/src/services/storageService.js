const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const config = require("../config/env");
const logger = require("../utils/logger");
const HttpError = require("../utils/httpError");

let s3Client = null;
let s3Ready = false;

function initStorage() {
  if (s3Client) return s3Ready;
  const { awsAccessKeyId, awsSecretAccessKey, awsS3BucketName, awsRegion } = config;
  if (!(awsAccessKeyId && awsSecretAccessKey && awsS3BucketName && awsRegion)) {
    logger.warning("AWS S3 env vars not fully set; storage disabled");
    return false;
  }
  try {
    s3Client = new S3Client({
      region: awsRegion,
      credentials: { accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretAccessKey },
      endpoint: `https://s3.${awsRegion}.amazonaws.com`,
    });
    s3Ready = true;
    logger.info(`AWS S3 client initialized (bucket=${awsS3BucketName}, region=${awsRegion})`);
    return true;
  } catch (e) {
    logger.error(`S3 init failed: ${e.message}`);
    s3Client = null;
    s3Ready = false;
    return false;
  }
}

async function putObject(objectPath, data, contentType) {
  if (!initStorage()) {
    const localPath = path.join(config.localUploadDir, objectPath);
    await fsp.mkdir(path.dirname(localPath), { recursive: true });
    await fsp.writeFile(localPath, data);
    return {
      path: `local://${objectPath}`,
      size: data.length,
      etag: crypto.createHash("md5").update(objectPath).digest("hex"),
      provider: "local",
    };
  }

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.awsS3BucketName,
        Key: objectPath,
        Body: data,
        ContentType: contentType,
      })
    );
    return { path: objectPath, size: data.length, etag: null, provider: "s3" };
  } catch (e) {
    throw new HttpError(502, `Storage upload failed: ${e.message}`);
  }
}

async function generatePresignedGetUrl(objectPath, originalFilename, contentType, expiresIn = 3600) {
  if (objectPath.startsWith("local://")) {
    throw new HttpError(400, "Local files are not presigned");
  }
  if (!initStorage()) {
    throw new HttpError(503, "Storage is not configured");
  }
  try {
    const command = new GetObjectCommand({
      Bucket: config.awsS3BucketName,
      Key: objectPath,
      ResponseContentDisposition: originalFilename
        ? `attachment; filename="${originalFilename}"`
        : undefined,
      ResponseContentType: contentType || undefined,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (e) {
    throw new HttpError(502, `Presigned URL generation failed: ${e.message}`);
  }
}

async function deleteObject(objectPath) {
  if (objectPath.startsWith("local://")) {
    const localPath = path.join(config.localUploadDir, objectPath.replace("local://", ""));
    if (fs.existsSync(localPath)) await fsp.unlink(localPath);
    return;
  }
  if (!initStorage()) return;
  await s3Client.send(new DeleteObjectCommand({ Bucket: config.awsS3BucketName, Key: objectPath }));
}

async function readLocalFile(objectPath) {
  const localPath = path.join(config.localUploadDir, objectPath.replace("local://", ""));
  if (!fs.existsSync(localPath)) throw new HttpError(404, "File not found");
  return localPath;
}

module.exports = {
  initStorage,
  putObject,
  generatePresignedGetUrl,
  deleteObject,
  readLocalFile,
};
