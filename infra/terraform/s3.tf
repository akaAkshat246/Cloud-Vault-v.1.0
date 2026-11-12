# ==============================================================================
# CloudVault Production AWS S3 Infrastructure Definition (Terraform)
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment (staging, production)"
  default     = "production"
}

variable "bucket_name" {
  type        = string
  description = "Unique S3 bucket name for encrypted object storage"
  default     = "cloudvault-storage-prod"
}

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Permitted origins for direct browser-to-S3 multipart uploads"
  default     = ["https://cloudvault.app", "https://*.cloudvault.app"]
}

variable "abort_incomplete_multipart_days" {
  type        = number
  description = "Days after which abandoned multipart uploads are automatically purged"
  default     = 2
}

# 1. Primary S3 Storage Bucket
resource "aws_s3_bucket" "cloudvault_storage" {
  bucket = var.bucket_name

  tags = {
    Project     = "CloudVault"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Security    = "ZeroKnowledge"
  }
}

# 2. Strict Block Public Access (Zero Public Exposure)
resource "aws_s3_bucket_public_access_block" "storage_pab" {
  bucket = aws_s3_bucket.cloudvault_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 3. Server-Side Encryption (SSE-S3 AES-256 at Rest)
# Note: Zero-Knowledge invariant means data is ALREADY encrypted client-side with AES-256-GCM.
# S3 server-side encryption provides a secondary layer of defense-in-depth.
resource "aws_s3_bucket_server_side_encryption_configuration" "storage_encryption" {
  bucket = aws_s3_bucket.cloudvault_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# 4. S3 CORS Configuration for Direct-to-S3 Multipart Uploads
# NOTE ON S3 VS MINIO CORS DIFFERENCES:
# AWS S3 enforces strict case-sensitive CORS parsing and XML/JSON schemas via PutBucketCors.
# In AWS S3, ExposeHeaders MUST explicitly include "ETag" so browser Fetch/XHR can read
# the part ETag header to assemble CompleteMultipartUpload payloads.
# MinIO allows wildcard origins and relaxed header matching by default.
resource "aws_s3_bucket_cors_configuration" "storage_cors" {
  bucket = aws_s3_bucket.cloudvault_storage.id

  cors_rule {
    id              = "DirectClientMultipartUploads"
    allowed_methods = ["GET", "PUT", "POST", "HEAD", "DELETE"]
    allowed_origins = var.cors_allowed_origins
    allowed_headers = ["Range", "Authorization", "Content-Type", "x-amz-*", "*"]
    expose_headers  = ["ETag", "Content-Length", "Date", "Content-Range", "Accept-Ranges"]
    max_age_seconds = 3600
  }
}

# 5. S3 Lifecycle Rule: Abort Incomplete Multipart Uploads
# Ensures partial upload chunks do not accumulate storage costs if client drops connection.
resource "aws_s3_bucket_lifecycle_configuration" "storage_lifecycle" {
  bucket = aws_s3_bucket.cloudvault_storage.id

  rule {
    id     = "AbortIncompleteMultipartUploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = var.abort_incomplete_multipart_days
    }
  }
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.cloudvault_storage.id
  description = "Target S3 bucket name"
}

output "s3_bucket_arn" {
  value       = aws_s3_bucket.cloudvault_storage.arn
  description = "Target S3 bucket ARN"
}

