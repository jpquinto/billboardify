###########
# General
###########

variable "context" {
  type        = any
  description = "Null label context."
}

###########
# Networking
###########

variable "aws_region" {
  type        = string
  description = "AWS region where resources will be created. Valid values: [us-east-1, us-east-2, us-west-1, etc.]."
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC where the endpoint will be created."
}

variable "service" {
  type        = string
  description = "Name of the AWS service for the VPC endpoint (e.g., `s3`, `dynamodb`)."
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs where the VPC endpoint will be created."
}

variable "create_sg" {
  type        = bool
  description = "Whether to create a security group for the VPC endpoint."
  default     = false
}

variable "security_group_ids" {
  type        = list(string)
  description = "List of security group IDs to associate with the VPC endpoint. Required when `create_sg` is false."
  default     = null

  validation {
    condition     = !(!var.create_sg && length(coalesce(var.security_group_ids, [])) == 0)
    error_message = "`security_group_ids` is required if `create_sg` is false."
  }
}

variable "private_dns_enabled" {
  type        = bool
  description = "Whether to associate a private hosted zone with the VPC endpoint."
  default     = true
}
