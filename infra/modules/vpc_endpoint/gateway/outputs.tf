output "id" {
  value = aws_vpc_endpoint.gateway_vpc_endpoint.id
}

output "arn" {
  value = aws_vpc_endpoint.gateway_vpc_endpoint.arn
}

output "prefix_list_id" {
  value = aws_vpc_endpoint.gateway_vpc_endpoint.prefix_list_id
}

output "cidr_blocks" {
  value = aws_vpc_endpoint.gateway_vpc_endpoint.cidr_blocks
}
