module "tools_packager" {
  source = "./modules/util_packager"

  entry_file_path = "${path.root}/../python/train_rag/handler.py"
  export_dir      = "${path.root}/dist/rag_trainer"
  sys_paths       = ["${path.root}/../python/train_rag"]
  no_reqs         = true
}

module "rag_trainer_lambda" {
  source  = "./modules/lambda"
  context = module.null_label.context

  name = "rag-trainer-lambda"

  source_dir = module.tools_packager.result.build_directory

  build_path = "${path.root}/dist/rag-trainer/rag-trainer.zip"

  handler         = "handler.handler"
  runtime         = "python3.12"
  memory          = 512
  time_limit      = 900
  deployment_type = "zip"
  zip_project     = true
  s3_bucket       = local.s3_bucket_layers
  s3_key          = "lambda/rag_trainer/rag_trainer.zip"

  enable_vpc_access           = true
  subnet_ids                  = [module.vpc.subnet_ids.private[0]]
  create_sg                   = true
  ipv6_allowed_for_dual_stack = false

  environment_variables = {
    RAG_RDS_CREDENTIALS_SECRET_NAME = aws_secretsmanager_secret.spotify_rds_credentials.name
    DB_USER : local.rds_secrets.username
    DB_PASSWORD : local.rds_secrets.password
    DB_HOST : local.rds_secrets.host
  }

  layers = [
    module.python_dependencies_layer.layer_arn,
    module.rag_layer.layer_arn
  ]
}

resource "aws_iam_policy" "rag_trainer_policy" {
  name        = "rag-trainer-policy"
  description = "Allows the rag trainer Lambda to read from Secrets Manager."

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

resource "aws_iam_role_policy_attachment" "rag_trainer_attach" {
  role       = module.rag_trainer_lambda.role_name
  policy_arn = aws_iam_policy.rag_trainer_policy.arn
}

module "sg_trainer_lambda_to_rds" {
  source                 = "./modules/sg/each_other"
  from_name              = module.rag_trainer_lambda.name
  to_name                = "RDS"
  from_security_group_id = module.rag_trainer_lambda.security_group_ids[0]

  to_security_group_id = module.spotify_rds.security_group_ids[0]
  port                 = 5432
}

module "sg_trainer_lambda_to_bedrock" {
  source                 = "./modules/sg/each_other"
  from_name              = module.rag_trainer_lambda.name
  to_name                = "Bedrock VPC Endpoint"
  from_security_group_id = module.rag_trainer_lambda.security_group_ids[0]

  to_security_group_id = module.vpc_endpoint_interface_bedrock.security_group_ids[0]
  port                 = 443
}