module "lambda_layer" {
  source  = "../"
  context = var.context

  name         = var.name
  description  = var.description
  runtime      = var.runtime
  architecture = var.architecture

  deployment_type   = var.deployment_type
  zip_project       = var.zip_project
  filename          = var.filename
  source_dir        = var.source_dir
  build_path        = var.build_path
  upload_to_s3      = var.upload_to_s3
  s3_bucket         = var.s3_bucket
  s3_key            = var.s3_key
  s3_object_version = var.s3_object_version

  depends_on = [data.external.install_dependencies]
}
