module "label_module" {
  source  = "cloudposse/label/null"
  context = var.context
  tags = {
    "component" = "aws-vpc"
  }
}

module "label_vpc_resource" {
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["vpc"]
}

module "label_igw" {
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["igw"]
}

module "label_nat" {
  for_each   = toset(local.public_subnet_azs)
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = [each.value, "nat"]
}

module "label_eip" {
  for_each   = toset(local.public_subnet_azs)
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = [each.value, "eip"]
}

module "label_public_subnet_resource" {
  count      = length(local.public_subnet_azs)
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["public", "subnet", "az${count.index + 1}"]
}

module "label_private_subnet_resource" {
  count      = length(local.private_subnet_azs)
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["private", "subnet", "az${count.index + 1}"]
}

module "label_rtb_resource" {
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["main", "route-table"]
}

module "label_rtb_public_resource" {
  for_each   = toset(local.public_subnet_azs)
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["public", each.value, "route-table"]
}

module "label_rtb_public_env_resource" {
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["public", "route-table"]
}

module "label_rtb_private_resource" {
  for_each   = toset(local.private_subnet_azs)
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["private", each.value, "route-table"]
}
module "label_rtb_private_env_resource" {
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["private", "route-table"]
}

module "label_rtb_db_env_resource" {
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["db", "route-table"]
}

module "label_default_security_group_resource" {
  source     = "cloudposse/label/null"
  context    = module.label_module.context
  attributes = ["default", "security-group"]
}
