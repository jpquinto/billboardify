module "public_assets_bucket" {
  source = "./modules/s3_bucket"
  name   = "public-assets-bucket"

  context = module.null_label.context

  force_destroy = true

  enable_bucket_versioning      = false
  enable_server_side_encryption = false

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  enable_website_configuration = false
}

resource "aws_s3_bucket_policy" "public_assets_read" {
  bucket = module.public_assets_bucket.bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::${module.public_assets_bucket.bucket_name}/*"
      }
    ]
  })
}
