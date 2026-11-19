variable "aws_region" {
  type        = string
  description = "Approved AWS region (evaluate ap-south-1 Mumbai / ap-south-2 Hyderabad per data-residency review)"
  default     = "ap-south-1"
}

variable "environment" {
  type        = string
  description = "Environment isolation name (dev | staging | prod)"
  default     = "staging"
}

variable "project_name" {
  type    = string
  default = "cas-erp"
}

