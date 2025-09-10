
module "listening_history_ingestor_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "listening-history-ingestor-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/listening_history_ingestor"
  build_path      = "${path.root}/../backend/build/listening_history_ingestor/listening_history_ingestor.zip"
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
    LISTENING_HISTORY_TABLE_NAME : module.listening_history_table.name
    SPOTIFY_REFRESH_TOKEN = local.spotify_secrets.SPOTIFY_REFRESH_TOKEN
    SPOTIFY_CLIENT_ID     = local.spotify_secrets.SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET = local.spotify_secrets.SPOTIFY_CLIENT_SECRET
  }
}

resource "aws_iam_policy" "listening_history_ingestor_policy" {
  name        = "listening-history-ingestor-policy"
  description = "Allows the listening history ingestor Lambda to write to the DynamoDB table."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:PutItem",
          "dynamodb:BatchWriteItem",
        ],
        Resource = module.listening_history_table.arn
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ],
        Resource = module.status_timestamps_table.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "listening_history_ingestor_attach" {
  role       = module.listening_history_ingestor_lambda.role_name
  policy_arn = aws_iam_policy.listening_history_ingestor_policy.arn
}
