module "chart_generator_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "chart-generator-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/chart_generator"
  build_path      = "${path.root}/../backend/build/chart_generator/chart_generator.zip"
  runtime         = "nodejs20.x"
  memory          = 256
  time_limit      = 60
  deployment_type = "zip"
  zip_project     = true

  layers = [
    module.shared_lambda_layer.layer_arn,
  ]

  environment_variables = {
    REGION : var.aws_region
    AWS_ACCOUNT_ID : local.account_id
    INGESTION_STATUS_TABLE_NAME : module.status_timestamps_table.name
    RECENT_LISTENING_HISTORY_TABLE_NAME : module.recent_listening_history_table.name
    SONG_HISTORY_TABLE_NAME : module.song_history_table.name
    SONG_CHART_HISTORY_BUCKET_NAME : module.song_chart_history_bucket.bucket_name
  }
}

resource "aws_iam_policy" "chart_generator_policy" {
  name        = "chart-generator-policy"
  description = "Allows the listening history ingestor Lambda to write to the DynamoDB table."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:Query"
        ],
        Resource = module.recent_listening_history_table.arn
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ],
        Resource = module.status_timestamps_table.arn
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ],
        Resource = module.song_history_table.arn
      },
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject"
        ],
        Resource = "${module.song_chart_history_bucket.bucket_arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "chart_generator_attach" {
  role       = module.chart_generator_lambda.role_name
  policy_arn = aws_iam_policy.chart_generator_policy.arn
}
