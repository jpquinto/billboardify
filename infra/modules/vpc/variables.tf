variable "context" {
  type = any
}

// -------------------- Module specific variables --------------------


variable "public_cidr_ranges" {
  type        = map(list(string))
  description = "CIDR ranges by availability zone, for public subnet, example: {us-east-1a = [\"<subnet_CIDR_1>\",\"<subnet_CIDR_2>\"]}"
  default     = {}
  nullable    = false

  validation {
    condition = alltrue([
      for o in flatten(values(var.public_cidr_ranges)) : can(cidrhost(o, 32))
    ])
    error_message = "Must be valid IPv4 CIDR."
  }
}

variable "private_cidr_ranges" {
  type        = map(list(string))
  description = "CIDR ranges by availability zone, for private subnet, example: {us-east-1a = [\"<subnet_CIDR_1>\",\"<subnet_CIDR_2>\"]}"
  default     = {}
  nullable    = false

  validation {
    condition = alltrue([
      for o in flatten(values(var.private_cidr_ranges)) : can(cidrhost(o, 32))
    ])
    error_message = "Must be valid IPv4 CIDR."
  }
}

variable "vpc_cidr_range" {
  type        = string
  description = "CIDR range for the given vpc"
  default     = null
}

variable "create_nat_gateways" {
  type        = bool
  description = "Creates NAT gateways for each private subnet AZs"
}

variable "route_table_by_env" {
  type        = bool
  description = "If true, create sommon route tables for each environment. If false, create a route table for every subnets and every AZ."
  default     = true
}
