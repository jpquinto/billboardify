resource "aws_cloudwatch_event_rule" "listening_history_ingestor_trigger" {
  name                = "listening-history-ingestor-trigger"
  description         = "Triggers listening history ingestor Lambda every hour"
  schedule_expression = "cron(0 * * * ? *)"
}

resource "aws_cloudwatch_event_target" "trigger_synthetic_lambda" {
  rule      = aws_cloudwatch_event_rule.listening_history_ingestor_trigger.name
  target_id = "ListeningHistoryIngestorLambda"
  arn       = module.listening_history_ingestor_lambda.arn

  input = jsonencode({
    trigger : "daily"
  })
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.listening_history_ingestor_lambda.name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.listening_history_ingestor_trigger.arn
}

resource "aws_cloudwatch_event_rule" "listening_history_aggregator_trigger" {
  name                = "listening-history-aggregator-trigger"
  description         = "Triggers listening history aggregator Lambda every 6 hours"
  schedule_expression = "cron(5 1,7,13,19 * * ? *)"
}

resource "aws_cloudwatch_event_target" "trigger_listening_history_aggregator_lambda" {
  rule      = aws_cloudwatch_event_rule.listening_history_aggregator_trigger.name
  target_id = "ListeningHistoryAggregatorLambda"
  arn       = module.listening_history_aggregator_lambda.arn

  input = jsonencode({
    trigger : "daily"
  })
}

resource "aws_lambda_permission" "allow_eventbridge_aggregator" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.listening_history_aggregator_lambda.name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.listening_history_aggregator_trigger.arn
}

resource "aws_cloudwatch_event_rule" "chart_generator_trigger" {
  name                = "chart-generator-trigger"
  description         = "Chart generator Lambda every Friday at 1am"
  schedule_expression = "cron(0 9 ? * FRI *)"
}

resource "aws_cloudwatch_event_target" "trigger_chart_generator_lambda" {
  rule      = aws_cloudwatch_event_rule.chart_generator_trigger.name
  target_id = "ChartGeneratorLambda"
  arn       = module.chart_generator_lambda.arn

  input = jsonencode({
    trigger : "daily"
  })
}

resource "aws_lambda_permission" "allow_eventbridge_chart_generator" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.chart_generator_lambda.name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.chart_generator_trigger.arn
}

resource "aws_cloudwatch_event_rule" "song_chart_playlist_generator_trigger" {
  name                = "playlist-generator-trigger"
  description         = "Playlist Generator Lambda every Friday at 1:05am"
  schedule_expression = "cron(5 9 ? * FRI *)"
}

resource "aws_cloudwatch_event_target" "trigger_song_chart_playlist_generator_lambda" {
  rule      = aws_cloudwatch_event_rule.song_chart_playlist_generator_trigger.name
  target_id = "SongChartPlaylistGeneratorLambda"
  arn       = module.song_chart_playlist_generator_lambda.arn

  depends_on = [aws_cloudwatch_event_rule.song_chart_playlist_generator_trigger]
  input = jsonencode({
    trigger : "daily"
  })
}

resource "aws_lambda_permission" "allow_eventbridge_song_chart_playlist_generator" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.song_chart_playlist_generator_lambda.name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.song_chart_playlist_generator_trigger.arn
}
