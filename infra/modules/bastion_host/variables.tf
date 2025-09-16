variable "context" {
  type        = any
  description = "Context object"
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID where to deploy the bastion host"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where to deploy the bastion host"
}

variable "key_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
}

variable "allowed_ssh_cidrs" {
  description = "List of CIDR blocks allowed to SSH into the bastion"
  type        = list(string)
  default     = ["0.0.0.0/0"] # TODO: Change this to a more restrictive CIDR block
}

variable "rds_security_group_id" {
  type        = string
  description = "Security group ID of the tenant RDS instance"
}

variable "bastion_host_name" {
  type        = string
  description = "IAM role name for the bastion host"
}
