module "recent_listening_history_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "recent-listening-history"

  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "user_id"
  range_key = "timestamp"

  attributes = [
    {
      name = "user_id"
      type = "S"
    },
    {
      name = "timestamp"
      type = "S"
    }
  ]
  ttl_enabled   = true
  ttl_attribute = "ttl"
}
