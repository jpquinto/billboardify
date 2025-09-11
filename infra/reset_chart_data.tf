module "reset_chart_data_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "reset-chart-data-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/reset_chart_data"
  build_path      = "${path.root}/../backend/build/reset_chart_data/reset_chart_data.zip"
  runtime         = "nodejs20.x"
  memory          = 1536
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
    SONG_HISTORY_TABLE_NAME : module.song_history_table.name
    SONG_CHART_HISTORY_BUCKET_NAME : module.song_chart_history_bucket.bucket_name
  }
}

resource "aws_iam_policy" "reset_chart_data_policy" {
  name        = "reset-chart-data-policy"
  description = "Allows the reset chart data Lambda to write to the DynamoDB table."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem"
        ],
        Resource = module.song_history_table.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "reset_chart_data_attach" {
  role       = module.reset_chart_data_lambda.role_name
  policy_arn = aws_iam_policy.reset_chart_data_policy.arn
}
