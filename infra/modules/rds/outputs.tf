output "arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.this.arn
}

output "id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.this.id
}

output "identifier" {
  description = "The RDS instance identifier"
  value       = aws_db_instance.this.identifier
}

output "name" {
  description = "The database name"
  value       = aws_db_instance.this.db_name
}

output "resource_id" {
  description = "The RDS Resource ID of this instance"
  value       = aws_db_instance.this.resource_id
}

output "endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.this.endpoint
}

output "address" {
  description = "The hostname of the RDS instance"
  value       = aws_db_instance.this.address
}

output "port" {
  description = "The database port"
  value       = aws_db_instance.this.port
}

output "master_username" {
  description = "The master username for the database"
  value       = aws_db_instance.this.username
  sensitive   = true
}

output "master_user_secret" {
  description = "The master user secret details if manage_master_user_password is set to true"
  value = var.manage_master_user_password ? {
    secret_arn = aws_db_instance.this.master_user_secret[0].secret_arn
    kms_key_id = aws_db_instance.this.master_user_secret[0].kms_key_id
  } : null
  sensitive = true
}

output "db_subnet_group_name" {
  description = "The db subnet group name"
  value       = local.create_db_subnet_group ? aws_db_subnet_group.this[0].name : var.db_subnet_group_name
}

output "parameter_group_name" {
  description = "The name of the DB parameter group"
  value       = local.create_parameter_group ? aws_db_parameter_group.this[0].name : var.parameter_group_name
}

output "monitoring_role_arn" {
  description = "The ARN of the IAM role used for enhanced monitoring"
  value       = var.create_monitoring_role ? aws_iam_role.enhanced_monitoring[0].arn : var.monitoring_role_arn
}

output "engine" {
  description = "The database engine"
  value       = aws_db_instance.this.engine
}

output "engine_version" {
  description = "The database engine version"
  value       = aws_db_instance.this.engine_version_actual
}

output "multi_az" {
  description = "If the RDS instance is multi AZ"
  value       = aws_db_instance.this.multi_az
}

output "security_group_ids" {
  description = "The security group IDs associated with the RDS instance"
  value       = local.security_group_ids
}
