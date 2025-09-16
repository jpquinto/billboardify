resource "aws_db_subnet_group" "this" {
  count = local.create_db_subnet_group ? 1 : 0

  name        = module.label_rds.id
  description = "Subnet group for ${module.label_rds.id} RDS instance"
  subnet_ids  = var.subnet_ids

  tags = module.label_rds.tags
}
