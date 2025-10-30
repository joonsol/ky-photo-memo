// 📦 s3.js
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// ✅ 환경변수 필수값 검사 (기존과 동일)
const required = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "S3_BUCKET",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("[S3 ENV Missing]", missing);
}

// ✅ S3 클라이언트 생성 (기존과 동일)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const Bucket = process.env.S3_BUCKET;

// ----------------------------------------------------
// ✅ presignPut : 업로드용 URL (프론트에서 PUT)
// ----------------------------------------------------
async function presignPut(Key, ContentType, sec = 300) {
  if (!Bucket) throw new Error("s3 bucket is undefined");
  if (!Key) throw new Error("Key is required");

  const cmd = new PutObjectCommand({ Bucket, Key, ContentType });
  return getSignedUrl(s3, cmd, { expiresIn: sec });
}

// ----------------------------------------------------
// ✅ presignGet : 다운로드/조회용 URL (프론트에서 GET)
// ----------------------------------------------------
async function presignGet(Key, sec = 300) {
  if (!Bucket) throw new Error("s3 bucket is undefined");
  if (!Key) throw new Error("Key is required");

  const cmd = new GetObjectCommand({ Bucket, Key });
  return getSignedUrl(s3, cmd, { expiresIn: sec });
}

// ----------------------------------------------------
// ✅ deleteObject : 서버에서 직접 S3 객체 삭제
// ----------------------------------------------------
async function deleteObject(Key) { 
  if (!Bucket) throw new Error("s3 bucket is undefined");
  if (!Key) throw new Error("Key is required");

  const cmd = new DeleteObjectCommand({ Bucket, Key }); 
  await s3.send(cmd); 
  console.log(`[S3] Deleted: ${Key}`); 
  return { ok: true, message: `Deleted: ${Key}` }; 
}

// ----------------------------------------------------
// ✅ updateObject : 기존 Key에 새 파일 덮어쓰기 (업데이트)
// ----------------------------------------------------
async function updateObject(Key, Body, ContentType) { 
  if (!Bucket) throw new Error("s3 bucket is undefined");
  if (!Key) throw new Error("Key is required");

  const cmd = new PutObjectCommand({ 
    Bucket,
    Key,
    Body,
    ContentType,
  });

  await s3.send(cmd); 
  console.log(`[S3] Updated (overwritten): ${Key}`); 
  return { ok: true, message: `Updated: ${Key}` }; 
}

// ----------------------------------------------------
// ✅ 전체 export
// ----------------------------------------------------
module.exports = {
  s3,
  Bucket,
  presignPut,
  presignGet,
  deleteObject, 
  updateObject, 
};
