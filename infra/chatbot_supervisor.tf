module "chatbot_supervisor_tools_packager" {
  source = "./modules/util_packager"

  entry_file_path = "${path.root}/../python/api_gateway/supervisor/handler.py"
  export_dir      = "${path.root}/dist/api_gateway/supervisor"
  sys_paths       = ["${path.root}/../python/api_gateway/supervisor"]
  no_reqs         = true
}

module "chatbot_supervisor_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name = "chatbot-supervisor-lambda"

  source_dir = module.chatbot_supervisor_tools_packager.result.build_directory

  build_path = "${path.root}/dist/api_gateway/supervisor/supervisor.zip"

  handler         = "handler.handler"
  runtime         = "python3.12"
  memory          = 512
  time_limit      = 900
  deployment_type = "zip"
  zip_project     = true
  s3_bucket       = local.s3_bucket_layers
  s3_key          = "lambda/api_gateway/supervisor/supervisor.zip"

  enable_vpc_access           = false
  create_sg                   = false
  ipv6_allowed_for_dual_stack = false

  environment_variables = {
    QUERY_LISTENING_DATA_LAMBDA_ARN : module.query_listening_data_lambda.name
    PLAYBACK_CONTROLLER_LAMBDA_ARN : module.playback_controller_tool_lambda.name
    BEDROCK_LLM_MODEL_ID : "us.amazon.nova-pro-v1:0"
  }

  layers = [
    module.python_dependencies_layer.layer_arn,
    module.rag_layer.layer_arn,
    data.aws_lambda_layer_version.spotify_langgraph.arn
  ]
}

resource "aws_iam_policy" "chatbot_supervisor_policy" {
  name        = "chatbot-supervisor-policy"
  description = "Allows the ask question Lambda to read from Secrets Manager."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "bedrock:InvokeModel"
        ],
        Resource = [
          "*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = [
          "*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "chatbot_supervisor_attach" {
  role       = module.chatbot_supervisor_lambda.role_name
  policy_arn = aws_iam_policy.chatbot_supervisor_policy.arn
}
