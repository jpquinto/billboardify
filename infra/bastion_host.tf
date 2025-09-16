module "spotify_bastion_host" {
  source  = "./modules/bastion_host"
  context = module.null_label.context

  vpc_id    = module.vpc.vpc.id
  subnet_id = module.vpc.subnet_ids.public[0]

  key_name          = "spotify-jeremy-bastion-key"
  bastion_host_name = "spotify-jeremy-bastion-host"

  rds_security_group_id = module.spotify_rds.security_group_ids[0]
}
