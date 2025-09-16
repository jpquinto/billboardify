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

variable "route_table_ids" {
  type = list(string)
  description = "List of route table IDs to associate with the VPC endpoint."
  default = null
}

variable "policy" {
  type        = string
  description = "IAM policy document to attach to the VPC endpoint."
  default     = null
}
