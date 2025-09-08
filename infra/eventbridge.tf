resource "aws_cloudwatch_event_rule" "listening_history_ingestor_trigger" {
  name                = "listening-history-ingestor-trigger"
  description         = "Triggers listening history ingestor Lambda every hour"
  schedule_expression = "cron(0 * * * ? *)"
}

resource "aws_cloudwatch_event_target" "trigger_synthetic_lambda" {
  rule      = aws_cloudwatch_event_rule.listening_history_ingestor_trigger.name
  target_id = "SyntheticDataLambda"
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
