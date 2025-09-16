output "subnet_ids" {
  value = {
    private = [for i in aws_subnet.private_subnets : i.id]
    public  = [for i in aws_subnet.public_subnets : i.id]
  }
}
output "route_table_ids" {
  value = {
    private = [for i in aws_route_table.private_rts : i.id]
    public  = [for i in aws_route_table.public_rts : i.id]
  }
}

output "vpc" {
  value = aws_vpc.this
}

output "private_subnets" {
  value = aws_subnet.private_subnets
}

output "public_subnets" {
  value = aws_subnet.public_subnets
}


