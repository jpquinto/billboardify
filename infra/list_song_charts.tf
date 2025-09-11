module "list_charts_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "list-charts-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/api_gateway/list_charts"
  build_path      = "${path.root}/../backend/build/api_gateway/list_charts/list_charts.zip"
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
    SONG_CHART_HISTORY_BUCKET_NAME : module.song_chart_history_bucket.bucket_name
  }
}

resource "aws_iam_policy" "list_charts_policy" {
  name        = "list-charts-policy"
  description = "Allows the list charts Lambda to read from S3."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:ListBucket"
        ],
        Resource = module.song_chart_history_bucket.bucket_arn
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "list_charts_attach" {
  role       = module.list_charts_lambda.role_name
  policy_arn = aws_iam_policy.list_charts_policy.arn
}
