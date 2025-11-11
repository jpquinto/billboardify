

module "get_artist_metadata_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "get-artist-metadata-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/api_gateway/get_artist_metadata"
  build_path      = "${path.root}/../backend/build/api_gateway/get_artist_metadata/get_artist_metadata.zip"
  runtime         = "nodejs20.x"
  memory          = 1536
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = [
    module.shared_lambda_layer.layer_arn,
    data.aws_lambda_layer_version.spotify_sharp.arn,
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    PUBLIC_ASSETS_BUCKET_NAME : module.public_assets_bucket.bucket_name
    ARTIST_HISTORY_TABLE_NAME : module.artist_history_table.name
  }
}

resource "aws_iam_policy" "get_artist_metadata_policy" {
  name        = "get-artist-metadata-policy"
  description = "Allows the listening get artist metadata Lambda to write to the DynamoDB table."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ],
        Resource = module.artist_history_table.arn
      },
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject"
        ],
        Resource = ["${module.public_assets_bucket.bucket_arn}/*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "get_artist_metadata_attach" {
  role       = module.get_artist_metadata_lambda.role_name
  policy_arn = aws_iam_policy.get_artist_metadata_policy.arn
}
