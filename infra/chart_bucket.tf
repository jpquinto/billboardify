module "song_chart_history_bucket" {
  source = "./modules/s3_bucket"
  name   = "song-chart-history-bucket"

  context = module.null_label.context

  force_destroy = true

  enable_bucket_versioning      = false
  enable_server_side_encryption = false

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  enable_website_configuration = false
  lifecycle_config             = "true"
}
