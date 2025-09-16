
resource "aws_subnet" "private_subnets" {
  for_each = transpose(var.private_cidr_ranges)

  vpc_id            = aws_vpc.this.id
  availability_zone = each.value[0]
  cidr_block        = each.key
  tags = merge({
    type = "private"
  }, module.label_private_subnet_resource[index(keys(var.private_cidr_ranges), each.value[0])].tags)
}

resource "aws_subnet" "public_subnets" {
  for_each = transpose(var.public_cidr_ranges)

  vpc_id            = aws_vpc.this.id
  availability_zone = each.value[0]
  cidr_block        = each.key
  tags = merge({
    type = "public"
  }, module.label_public_subnet_resource[index(keys(var.public_cidr_ranges), each.value[0])].tags)
}

/// CHECKS

//check if valid AZs are given
data "aws_availability_zones" "zones" {
  state = "available"
}

data "aws_region" "current" {}

check "aws_availability_zones" {
  assert {
    condition     = length(data.aws_availability_zones.zones.names) == length(distinct(concat(data.aws_availability_zones.zones.names, keys(var.private_cidr_ranges), keys(var.public_cidr_ranges))))
    error_message = "All AZs must be valid AZ in ${data.aws_region.current.name}."
  }
}
