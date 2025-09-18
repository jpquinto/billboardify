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
    },
    {
      name = "track_id"
      type = "S"
    },
    {
      name = "artist_id"
      type = "S"
    },
    {
      name = "album_id"
      type = "S"
    }
  ]

  global_secondary_indexes = [
    {
      name            = "track_id_timestamp_index"
      hash_key        = "track_id"
      range_key       = "timestamp"
      projection_type = "KEYS_ONLY"
    },
    {
      name            = "artist_id_timestamp_index"
      hash_key        = "artist_id"
      range_key       = "timestamp"
      projection_type = "KEYS_ONLY"
    },
    {
      name            = "album_id_timestamp_index"
      hash_key        = "album_id"
      range_key       = "timestamp"
      projection_type = "KEYS_ONLY"
    },
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
  ]

  global_secondary_indexes = [
    {
      name            = "track_id_index"
      hash_key        = "track_id"
      projection_type = "ALL"
      read_capacity   = 5
      write_capacity  = 5
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

module "album_history_table" {
  source  = "./modules/dynamodb_table"
  context = module.null_label.context

  name = "album-history"

  billing_mode = "PAY_PER_REQUEST"

  hash_key = "album_id"

  attributes = [
    {
      name = "album_id"
      type = "S"
    },
  ]
}
