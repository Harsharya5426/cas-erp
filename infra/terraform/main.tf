terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Institution = "Centre-for-Advanced-Studies-AKTU"
    }
  }
}

# Private S3 Bucket for Documents & Certificates (Encrypted at Rest, Public Access Blocked)
resource "aws_kms_key" "erp_data" {
  description             = "${var.project_name}-${var.environment} KMS key"
  enable_key_rotation     = true
  deletion_window_in_days = 30
}

resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-${var.environment}-private-docs"
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.erp_data.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Static Web Portal Hosting Bucket (Served via CloudFront + OAC + WAF)
resource "aws_s3_bucket" "web" {
  bucket = "${var.project_name}-${var.environment}-web-portal"
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket                  = aws_s3_bucket.web.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Async Notification & Report Export Queue + DLQ
resource "aws_sqs_queue" "jobs_dlq" {
  name              = "${var.project_name}-${var.environment}-jobs-dlq"
  kms_master_key_id = aws_kms_key.erp_data.id
}

resource "aws_sqs_queue" "jobs" {
  name              = "${var.project_name}-${var.environment}-jobs"
  kms_master_key_id = aws_kms_key.erp_data.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.jobs_dlq.arn
    maxReceiveCount     = 5
  })
}

# Managed Secrets Container (Values populated securely outside Terraform state)
resource "aws_secretsmanager_secret" "api_runtime" {
  name       = "${var.project_name}/${var.environment}/api-runtime"
  kms_key_id = aws_kms_key.erp_data.arn
}

# ECS Cluster for Modular Monolith API + Python ML Sidecar
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}/${var.environment}/api"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.erp_data.arn
}

