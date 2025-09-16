###########
# General
###########

variable "from_name" {
  type        = string
  description = "Name for the source security group identification."
}

variable "to_name" {
  type        = string
  description = "Name for the target security group identification."
}

###########
# Networking
###########

variable "from_security_group_id" {
  type        = string
  description = "The ID of the source security group."
}

variable "to_security_group_id" {
  type        = string
  description = "The ID of the target security group."
}

variable "port" {
  type        = number
  description = "Port number to allow. Valid values: 0-65535."

  validation {
    condition     = var.port >= 0 && var.port <= 65535
    error_message = "Valid values for `port`: 0-65535."
  }
}

variable "protocol" {
  type        = string
  description = "Protocol for the rule. Valid values: [tcp, udp]."
  default     = "tcp"

  validation {
    condition     = contains(["tcp", "udp"], var.protocol)
    error_message = "Valid values for `protocol`: [tcp, udp]."
  }
}
