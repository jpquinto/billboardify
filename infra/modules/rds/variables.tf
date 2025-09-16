###########
# General
###########

variable "context" {
  type        = any
  description = "Null label context."
}

###########
# Database Configuration
###########

variable "engine" {
  type        = string
  description = "The database engine to use. Valid values: mysql, postgres, oracle-ee, oracle-se2, oracle-se1, oracle-se, sqlserver-ee, sqlserver-se, sqlserver-ex, sqlserver-web, aurora, aurora-mysql, aurora-postgresql, mariadb."
}

variable "engine_version" {
  type        = string
  description = "The engine version to use."
  default     = null
}

variable "instance_class" {
  type        = string
  description = "The instance type of the RDS instance."
}

variable "allocated_storage" {
  type        = number
  description = "The amount of allocated storage in GB."
  default     = 20
}

variable "max_allocated_storage" {
  type        = number
  description = "The upper limit to which Amazon RDS can automatically scale the storage. Set to 0 to disable storage autoscaling."
  default     = 0
}

variable "storage_type" {
  type        = string
  description = "One of 'standard' (magnetic), 'gp2' (general purpose SSD), 'gp3' (new generation of general purpose SSD), or 'io1' (provisioned IOPS SSD)."
  default     = "gp2"
}

variable "iops" {
  type        = number
  description = "The amount of provisioned IOPS. Setting this implies a storage_type of 'io1' or 'gp3'."
  default     = null
}

variable "storage_encrypted" {
  type        = bool
  description = "Specifies whether the DB instance is encrypted."
  default     = true
}

variable "kms_key_id" {
  type        = string
  description = "The ARN for the KMS encryption key."
  default     = null
}

###########
# Database Credentials
###########

variable "username" {
  type        = string
  description = "Username for the master DB user."
  default     = "admin"
}

variable "password" {
  type        = string
  description = "Password for the master DB user."
  sensitive   = true
  default     = null

  validation {
    condition     = !(var.manage_master_user_password && var.password != null)
    error_message = "Cannot set `password` when `manage_master_user_password` is true."
  }
}

variable "manage_master_user_password" {
  type        = bool
  description = "Set to true to allow RDS to manage the master user password in Secrets Manager."
  default     = false
}

variable "master_user_secret_kms_key_id" {
  type        = string
  description = "The KMS key ID to encrypt the master user password secret in Secrets Manager."
  default     = null

  validation {
    condition     = !(!var.manage_master_user_password && var.master_user_secret_kms_key_id != null)
    error_message = "Cannot set `master_user_secret_kms_key_id` when `manage_master_user_password` is false."
  }
}

###########
# Database Parameters
###########

variable "db_name" {
  type        = string
  description = "The name of the database to create when the DB instance is created."
  default     = null
}

variable "port" {
  type        = number
  description = "The port on which the DB accepts connections."
  default     = null
}

variable "parameter_group_name" {
  type        = string
  description = "Name of the DB parameter group to associate."
  default     = null
}

variable "parameter_group_family" {
  type        = string
  description = "The family of the DB parameter group."
  default     = null
}

variable "parameters" {
  type        = list(map(string))
  description = "A list of DB parameter maps to apply."
  default     = [
    {
      name = "shared_preload_libraries"
      value = "pg_stat_statements,pg_tle,pg_cron"
      apply_method = "pending_reboot"
    }
  ]
}

variable "option_group_name" {
  type        = string
  description = "Name of the DB option group to associate."
  default     = null
}

###########
# Maintenance and Backup
###########

variable "backup_retention_period" {
  type        = number
  description = "The days to retain backups for."
  default     = 7
}

variable "backup_window" {
  type        = string
  description = "The daily time range during which automated backups are created."
  default     = "03:00-06:00"
}

variable "maintenance_window" {
  type        = string
  description = "The window to perform maintenance in."
  default     = "Mon:00:00-Mon:03:00"
}

variable "apply_immediately" {
  type        = bool
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window."
  default     = false
}

variable "skip_final_snapshot" {
  type        = bool
  description = "Determines whether a final DB snapshot is created before the DB instance is deleted."
  default     = false
}

variable "final_snapshot_identifier_prefix" {
  type        = string
  description = "The name which is prefixed to the final snapshot on database deletion."
  default     = "final"
}

variable "deletion_protection" {
  type        = bool
  description = "If the DB instance should have deletion protection enabled."
  default     = true
}

###########
# Enhanced Monitoring
###########

variable "monitoring_interval" {
  type        = number
  description = "The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance."
  default     = 0
}

variable "monitoring_role_arn" {
  type        = string
  description = "The ARN for the IAM role that permits RDS to send enhanced monitoring metrics to CloudWatch Logs."
  default     = null
}

variable "create_monitoring_role" {
  type        = bool
  description = "Create IAM role with a defined name that permits RDS to send enhanced monitoring metrics to CloudWatch Logs."
  default     = false
}

###########
# Networking
###########

variable "ip_address_type" {
  type        = string
  description = "IP address type for the domain endpoint. Valid values: [ipv4, dualstack]."
  default     = "IPV4"

  validation {
    condition     = contains(["IPV4", "DUAL"], var.ip_address_type)
    error_message = "Valid values for `ip_address_type`: [IPV4, DUAL]."
  }

  validation {
    condition     = !(var.public_access && var.ip_address_type == "DUAL")
    error_message = "`ip_address_type` cannot be DUAL when `public_access` is true."
  }
}

variable "public_access" {
  type        = bool
  description = "Whether to enable public access to the RDS instance."
  default     = false
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs where the instance will be deployed. Required when `public_access` is false. Must contain exactly 3 subnets when `multi_az_with_standby_enabled` is true."
  default     = []
}

variable "create_sg" {
  type        = bool
  description = "Whether to create a security group for the instance. Cannot be true when `public_access` is true."
  default     = false

  # validation {
  #   condition     = !(var.public_access && var.create_sg)
  #   error_message = "`create_sg` cannot be true when `public_access` is true."
  # }
}

variable "security_group_ids" {
  type        = list(string)
  description = "List of security group IDs for the instance. Required when `public_access` is false and `create_sg` is false."
  default     = null

  # validation {
  #   condition     = !(var.public_access && var.security_group_ids != null)
  #   error_message = "`security_group_ids` cannot be set when `public_access` is true."
  # }

  # validation {
  #   condition     = !(!var.public_access && !var.create_sg && length(coalesce(var.security_group_ids, [])) == 0)
  #   error_message = "`security_group_ids` is required when `public_access` is false and `create_sg` is false."
  # }
}

variable "multi_az" {
  type        = bool
  description = "Whether to enable Multi-AZ mode."
  default     = false
}

variable "db_subnet_group_name" {
  type        = string
  description = "Name of DB subnet group."
  default     = null
}

###########
# Performance Insights
###########

variable "performance_insights_enabled" {
  type        = bool
  description = "Specifies whether Performance Insights are enabled."
  default     = false
}

variable "performance_insights_retention_period" {
  type        = number
  description = "The amount of time in days to retain Performance Insights data."
  default     = 7
}

variable "performance_insights_kms_key_id" {
  type        = string
  description = "The ARN for the KMS key to encrypt Performance Insights data."
  default     = null
}
