data "aws_subnet" "subnet" {
  id = var.subnet_id
}

resource "aws_iam_role" "bastion_host_role" {
  name = "${var.bastion_host_name}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_instance_profile" "bastion_host_profile" {
  name = "${var.bastion_host_name}-profile"
  role = aws_iam_role.bastion_host_role.name
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*"]
  }
}

resource "aws_security_group" "bastion_sg" {
  name        = "${module.label_ec2_sg.id}-${var.bastion_host_name}-sg"
  description = "Allow SSH from developer IP"
  vpc_id      = data.aws_subnet.subnet.vpc_id

  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "allow_bastion_to_rds" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = var.rds_security_group_id
  source_security_group_id = aws_security_group.bastion_sg.id
  description              = "Allow RDS access from bastion host"
}

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = "t2.micro"
  subnet_id                   = var.subnet_id
  associate_public_ip_address = true
  key_name                    = var.key_name
  iam_instance_profile        = aws_iam_instance_profile.bastion_host_profile.name
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]

  metadata_options {
    http_put_response_hop_limit = 2
  }

  tags = merge(module.label_ec2.tags, {
    Name = "${module.label_ec2.id}-bastion"
  })
}
