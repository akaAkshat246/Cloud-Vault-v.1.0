#!/usr/bin/env bash
# ==============================================================================
# CloudVault Production AWS S3 Provisioning & Configuration Script
# ==============================================================================
set -euo pipefail

BUCKET_NAME="${1:-cloudvault-storage-prod}"
REGION="${AWS_REGION:-us-east-1}"
CORS_ORIGIN="${CORS_ORIGIN:-https://cloudvault.app}"
ABORT_DAYS="${S3_ABORT_INCOMPLETE_MULTIPART_DAYS:-2}"

echo "=========================================================="
echo "Configuring Production S3 Bucket: ${BUCKET_NAME} (${REGION})"
echo "=========================================================="

# 1. Create S3 Bucket
if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
  echo "Bucket '${BUCKET_NAME}' already exists."
else
  echo "Creating bucket '${BUCKET_NAME}'..."
  if [ "${REGION}" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "${BUCKET_NAME}" --region "${REGION}"
  else
    aws s3api create-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" \
      --create-bucket-configuration LocationConstraint="${REGION}"
  fi
fi

# 2. Enforce Block Public Access (Zero Public Objects)
echo "Enforcing strict Public Access Block..."
aws s3api put-public-access-block --bucket "${BUCKET_NAME}" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 3. Enforce Server-Side Encryption (SSE-S3 AES-256)
echo "Enforcing Server-Side Encryption (SSE-S3 AES-256)..."
aws s3api put-bucket-encryption --bucket "${BUCKET_NAME}" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        },
        "BucketKeyEnabled": true
      }
    ]
  }'

# 4. Enforce CORS Configuration
# Invariant: Browser fetch/XHR direct-to-S3 uploads require ExposeHeaders "ETag"
# AWS S3 requires exact schema structure:
echo "Configuring S3 CORS with exposed ETag header..."
aws s3api put-bucket-cors --bucket "${BUCKET_NAME}" --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["'${CORS_ORIGIN}'", "https://*.cloudvault.app"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Date"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

# 5. Enforce Lifecycle Rule: Abort incomplete multipart uploads after 2 days
echo "Configuring S3 Lifecycle Rule (Abort incomplete multipart after ${ABORT_DAYS} days)..."
aws s3api put-bucket-lifecycle-configuration --bucket "${BUCKET_NAME}" --lifecycle-configuration '{
  "Rules": [
    {
      "ID": "AbortIncompleteMultipartUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": '${ABORT_DAYS}'
      }
    }
  ]
}'

echo "Production S3 bucket '${BUCKET_NAME}' configured successfully."

