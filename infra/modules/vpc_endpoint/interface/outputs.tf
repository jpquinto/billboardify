output "id" {
  value = aws_vpc_endpoint.interface_vpc_endpoint.id
}

output "arn" {
  value = aws_vpc_endpoint.interface_vpc_endpoint.arn
}

output "network_interface_ids" {
  value = aws_vpc_endpoint.interface_vpc_endpoint.network_interface_ids
}

output "dns_entry" {
  value = aws_vpc_endpoint.interface_vpc_endpoint.dns_entry
}

output "security_group_ids" {
  value = local.security_group_ids
}
