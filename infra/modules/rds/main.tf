

resource "aws_db_instance" "this" {
  identifier = module.label_rds.id

  engine            = var.engine
  engine_version    = var.engine_version
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage

  db_name  = var.db_name
  username = var.username
  password = var.manage_master_user_password ? null : var.password
  port     = local.port

  manage_master_user_password   = var.manage_master_user_password ? true : null
  master_user_secret_kms_key_id = var.master_user_secret_kms_key_id

  vpc_security_group_ids = local.security_group_ids
  db_subnet_group_name   = local.create_db_subnet_group ? aws_db_subnet_group.this[0].name : var.db_subnet_group_name
  parameter_group_name   = local.create_parameter_group ? aws_db_parameter_group.this[0].name : var.parameter_group_name
  option_group_name      = var.option_group_name

  network_type        = var.ip_address_type
  availability_zone   = var.multi_az == false ? data.aws_subnet.rds_subnet[0].availability_zone : null
  multi_az            = var.multi_az
  publicly_accessible = var.public_access

  storage_type          = var.storage_type
  storage_encrypted     = var.storage_encrypted
  kms_key_id            = var.kms_key_id
  max_allocated_storage = var.max_allocated_storage
  iops                  = var.iops

  backup_retention_period   = var.backup_retention_period
  backup_window             = var.backup_window
  maintenance_window        = var.maintenance_window
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.final_snapshot_identifier_prefix}-${module.label_rds.id}-${formatdate("YYYYMMDDhhmmss", timestamp())}"

  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_period : null
  performance_insights_kms_key_id       = var.performance_insights_enabled ? var.performance_insights_kms_key_id : null

  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? var.create_monitoring_role ? aws_iam_role.enhanced_monitoring[0].arn : var.monitoring_role_arn : null

  apply_immediately = var.apply_immediately

  tags = module.label_rds.tags

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}
