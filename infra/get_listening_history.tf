module "get_listening_history_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name            = "get-listening-history-lambda"
  handler         = "handler.handler"
  source_dir      = "${path.root}/../backend/dist/api_gateway/get_listening_history"
  build_path      = "${path.root}/../backend/build/api_gateway/get_listening_history/get_listening_history.zip"
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
    LISTENING_HISTORY_TABLE_NAME : module.listening_history_table.name
  }
}

resource "aws_iam_policy" "get_listening_history_policy" {
  name        = "get-listening-history-policy"
  description = "Allows the get chart Lambda to query the DynamoDB table."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:Query",
        ],
        Resource = [
          module.listening_history_table.arn,
          "${module.listening_history_table.arn}/index/track_id_timestamp_index",
          "${module.listening_history_table.arn}/index/artist_id_timestamp_index",
          "${module.listening_history_table.arn}/index/album_id_timestamp_index"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "get_listening_history_attach" {
  role       = module.get_listening_history_lambda.role_name
  policy_arn = aws_iam_policy.get_listening_history_policy.arn
}
