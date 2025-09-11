module "listening_history_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "listening-history"

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
  ]
}

module "artist_history_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "artist-history"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "artist_id"

  attributes = [
    {
      name = "artist_id"
      type = "S"
    },
  ]
}
