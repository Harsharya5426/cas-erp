output "documents_bucket" {
  value = aws_s3_bucket.documents.bucket
}

output "web_bucket" {
  value = aws_s3_bucket.web.bucket
}

output "jobs_queue_url" {
  value = aws_sqs_queue.jobs.url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "secrets_arn" {
  value = aws_secretsmanager_secret.api_runtime.arn
}

