module "playback_controller_tool_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "playback-controller-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/playback_controller_tool"
  build_path      = "${path.root}/../backend/build/playback_controller_tool/playback_controller_tool.zip"
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
    SPOTIFY_REFRESH_TOKEN = local.spotify_secrets.SPOTIFY_REFRESH_TOKEN
    SPOTIFY_CLIENT_ID     = local.spotify_secrets.SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET = local.spotify_secrets.SPOTIFY_CLIENT_SECRET
  }
}

resource "aws_iam_policy" "playback_controller_tool_policy" {
  name        = "playback-controller-policy"
  description = "Allows the playback controller tool Lambda to read from S3."

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

resource "aws_iam_role_policy_attachment" "playback_controller_tool_attach" {
  role       = module.playback_controller_tool_lambda.role_name
  policy_arn = aws_iam_policy.playback_controller_tool_policy.arn
}
