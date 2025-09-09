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

module "status_timestamps_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "status-timestamps-table"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "metric_name"

  attributes = [
    {
      name = "metric_name"
      type = "S"
    }
  ]
}

module "song_history_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "song-history"

  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "artist_id"
  range_key = "track_id"

  attributes = [
    {
      name = "artist_id"
      type = "S"
    },
    {
      name = "track_id"
      type = "S"
    }
    // Other attributes:
    // track_name
    // album_cover_url
    // artist_name
    // play_count
  ]
}
