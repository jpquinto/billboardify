locals {
  create_db_subnet_group = var.db_subnet_group_name == null && length(var.subnet_ids) > 0
  create_parameter_group = var.parameter_group_name == null && var.parameter_group_family != null
  port = var.port == null ? lookup({
    mysql         = 3306,
    postgres      = 5432,
    oracle-ee     = 1521,
    oracle-se2    = 1521,
    oracle-se1    = 1521,
    oracle-se     = 1521,
    sqlserver-ee  = 1433,
    sqlserver-se  = 1433,
    sqlserver-ex  = 1433,
    sqlserver-web = 1433,
    mariadb       = 3306
  }, var.engine, null) : var.port

  # Define security group IDs based on create_sg flag
  security_group_ids = var.create_sg ? aws_security_group.sg[*].id : var.security_group_ids
}
