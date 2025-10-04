module "ask_question_tools_packager" {
  source = "./modules/util_packager"

  entry_file_path = "${path.root}/../python/api_gateway/ask_question/handler.py"
  export_dir      = "${path.root}/dist/api_gateway/ask_question"
  sys_paths       = ["${path.root}/../python/api_gateway/ask_question"]
  no_reqs         = true
}

module "ask_question_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name = "ask-question-lambda"

  source_dir = module.ask_question_tools_packager.result.build_directory

  build_path = "${path.root}/dist/api_gateway/ask_question/ask_question.zip"

  handler         = "handler.handler"
  runtime         = "python3.12"
  memory          = 512
  time_limit      = 900
  deployment_type = "zip"
  zip_project     = true
  s3_bucket       = local.s3_bucket_layers
  s3_key          = "lambda/api_gateway/ask_question/ask_question.zip"

  enable_vpc_access           = true
  subnet_ids                  = [module.vpc.subnet_ids.private[0]]
  create_sg                   = true
  ipv6_allowed_for_dual_stack = false

  environment_variables = {
    RAG_RDS_CREDENTIALS_SECRET_NAME = aws_secretsmanager_secret.spotify_rds_credentials.name
    DB_USER : local.rds_secrets.username
    DB_PASSWORD : local.rds_secrets.password
    DB_HOST : local.rds_secrets.host
    BEDROCK_LLM_MODEL_ID : "us.amazon.nova-pro-v1:0"
  }

  layers = [
    module.python_dependencies_layer.layer_arn,
    module.rag_layer.layer_arn,
    data.aws_lambda_layer_version.spotify_langgraph.arn
  ]
}

resource "aws_iam_policy" "ask_question_policy" {
  name        = "ask-question-policy"
  description = "Allows the ask question Lambda to read from Secrets Manager."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue",
        ],
        Resource = aws_secretsmanager_secret.spotify_rds_credentials.arn
      },
      {
        Effect = "Allow",
        Action = [
          "bedrock:InvokeModel"
        ],
        Resource = [
          "*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ask_question_attach" {
  role       = module.ask_question_lambda.role_name
  policy_arn = aws_iam_policy.ask_question_policy.arn
}

module "sg_ask_question_lambda_to_rds" {
  source                 = "./modules/sg/each_other"
  from_name              = module.ask_question_lambda.name
  to_name                = "RDS"
  from_security_group_id = module.ask_question_lambda.security_group_ids[0]

  to_security_group_id = module.spotify_rds.security_group_ids[0]
  port                 = 5432
}

module "sg_ask_question_lambda_to_bedrock" {
  source                 = "./modules/sg/each_other"
  from_name              = module.ask_question_lambda.name
  to_name                = "Bedrock VPC Endpoint"
  from_security_group_id = module.ask_question_lambda.security_group_ids[0]

  to_security_group_id = module.vpc_endpoint_interface_bedrock.security_group_ids[0]
  port                 = 443
}