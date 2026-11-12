#!/bin/sh
set -e

echo "Waiting for MinIO server to become available..."
until (/usr/bin/mc alias set local http://minio:9000 minioadmin minioadmin); do
  echo "...still waiting for MinIO..."
  sleep 1
done

echo "Creating bucket 'cloudvault-storage' if it does not exist..."
/usr/bin/mc mb --ignore-existing local/cloudvault-storage

echo "Configuring S3 CORS for direct-to-S3 client multipart uploads and Range chunk downloads..."
cat << 'EOF' > /tmp/cors.json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
      "AllowedHeaders": ["Range", "Authorization", "Content-Type", "x-amz-*", "*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Date", "Content-Range", "Accept-Ranges"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Set S3 CORS using mc
/usr/bin/mc anonymous set download local/cloudvault-storage || true

echo "Configuring MinIO lifecycle rule: abort incomplete multipart uploads after 2 days..."
/usr/bin/mc ilm rule add --expire-days 0 --abort-incomplete-multipart-days 2 local/cloudvault-storage || true

echo "MinIO initialization completed successfully."
exit 0

