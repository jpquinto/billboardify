module "vpc_endpoint_gateway_dynamodb" {
  source  = "./modules/vpc_endpoint/gateway"
  context = module.null_label.context

  aws_region      = "us-west-1"
  service         = "dynamodb"
  vpc_id          = module.vpc.vpc.id
  route_table_ids = module.vpc.route_table_ids.private
}

# TODO: Update endpoint policies once the services are implemented
resource "aws_vpc_endpoint_policy" "vpc_endpoint_gateway_dynamodb_policy" {
  vpc_endpoint_id = module.vpc_endpoint_gateway_dynamodb.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : "*",
        "Action" : "*",
        "Resource" : "*"
      }
    ]
  })
}

module "vpc_endpoint_interface_bedrock" {
  source  = "./modules/vpc_endpoint/interface"
  context = module.null_label.context

  aws_region = data.aws_region.current.name
  service    = "bedrock-runtime"
  vpc_id     = module.vpc.vpc.id
  subnet_ids = module.vpc.subnet_ids.private
  create_sg  = true
}

resource "aws_vpc_endpoint_policy" "vpc_endpoint_interface_bedrock_policy" {
  vpc_endpoint_id = module.vpc_endpoint_interface_bedrock.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : "*",
        "Action" : "*",
        "Resource" : "*"
      }
    ]
  })
}