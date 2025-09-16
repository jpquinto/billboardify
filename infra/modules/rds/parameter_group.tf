resource "aws_db_parameter_group" "this" {
  count = local.create_parameter_group ? 1 : 0

  name        = module.label_rds_parameter_group.id
  description = "Parameter group for ${module.label_rds.id} RDS instance"
  family      = var.parameter_group_family

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = lookup(parameter.value, "apply_method", null)
    }
  }

  tags = module.label_rds_parameter_group.tags
}
