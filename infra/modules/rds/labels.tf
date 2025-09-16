module "main_ctx" {
  source = "cloudposse/label/null"

  context = var.context

  tags = {
    component = "rds"
  }
}

module "label_rds" {
  source = "cloudposse/label/null"

  context = module.main_ctx.context

  attributes = ["rds"]
}

module "label_rds_monitoring_role" {
  source = "cloudposse/label/null"

  context = module.label_rds.context

  attributes = ["monitoring", "role"]
}

module "label_rds_parameter_group" {
  source = "cloudposse/label/null"

  context = module.label_rds.context

  attributes = ["pg"]
}

module "label_rds_sg" {
  count = var.create_sg ? 1 : 0
  source = "cloudposse/label/null"

  context = module.label_rds.context

  attributes = ["sg"]
}
module "label_rds_sg_ingress" {
  count = var.create_sg ? 1 : 0
  source = "cloudposse/label/null"

  context = module.label_rds_sg[0].context

  attributes = ["ingress"]
}
module "label_rds_sg_egress" {
  count = var.create_sg ? 1 : 0
  source = "cloudposse/label/null"

  context = module.label_rds_sg[0].context

  attributes = ["egress"]
}