module "get_song_chart_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "get-song-chart-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/api_gateway/get_song_chart"
  build_path      = "${path.root}/../backend/build/api_gateway/get_song_chart/get_song_chart.zip"
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

resource "aws_iam_policy" "get_song_chart_policy" {
  name        = "get-song-chart-policy"
  description = "Allows the get song chart Lambda to write to the DynamoDB table."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject"
        ],
        Resource = "${module.song_chart_history_bucket.bucket_arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "get_song_chart_attach" {
  role       = module.get_song_chart_lambda.role_name
  policy_arn = aws_iam_policy.get_song_chart_policy.arn
}
