###########
# General
###########

variable "name" {
  type        = string
  description = "Name for resource identification."
}

variable "security_group_id" {
  type        = string
  description = "The ID of the security group to add rules to."
}

###########
# Networking
###########

variable "from_port" {
  type        = number
  description = "Start of port range for the rule. Valid values: 0-65535."
  default     = 0

  validation {
    condition     = var.from_port >= 0 && var.from_port <= 65535
    error_message = "Valid values for `from_port`: 0-65535."
  }
}

variable "to_port" {
  type        = number
  description = "End of port range for the rule. Valid values: 0-65535."
  default     = 65535

  validation {
    condition     = var.to_port >= 0 && var.to_port <= 65535
    error_message = "Valid values for `to_port`: 0-65535."
  }
}

variable "protocol" {
  type        = string
  description = "Protocol for the rule. Valid values: [-1 (all), tcp, udp, icmp]."
  default     = "-1"

  validation {
    condition     = contains(["-1", "tcp", "udp", "icmp"], var.protocol)
    error_message = "Valid values for `protocol`: [-1, tcp, udp, icmp]."
  }
}

variable "ipv4_cidr_range" {
  type        = list(string)
  description = "List of IPv4 CIDR ranges to allow outbound connections to."
  default     = ["0.0.0.0/0"]
}

variable "ipv6_cidr_range" {
  type        = list(string)
  description = "List of IPv6 CIDR ranges to allow outbound connections to."
  default     = ["::/0"]
}
