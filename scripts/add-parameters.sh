#!/bin/bash

# Read the current .env file
source .env

# Configure AWS CLI to use the UnifiedServicesRole
export AWS_ROLE_ARN="arn:aws:iam::474668398195:role/UnifiedServicesRole"
export AWS_WEB_IDENTITY_TOKEN_FILE="/var/run/secrets/eks.amazonaws.com/serviceaccount/token"

# Use AWS CLI with role assumption
aws sts assume-role \
  --role-arn $AWS_ROLE_ARN \
  --role-session-name "ParameterStoreSession" \
  --duration-seconds 3600 > temp_credentials.json

# Extract credentials
export AWS_ACCESS_KEY_ID=$(cat temp_credentials.json | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(cat temp_credentials.json | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(cat temp_credentials.json | jq -r '.Credentials.SessionToken')

# Create or update parameters
aws ssm put-parameter \
    --name "/chat-tensai/DATABASE_URL" \
    --value "$DATABASE_URL" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

aws ssm put-parameter \
    --name "/chat-tensai/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
    --value "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

aws ssm put-parameter \
    --name "/chat-tensai/CLERK_SECRET_KEY" \
    --value "$CLERK_SECRET_KEY" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

aws ssm put-parameter \
    --name "/chat-tensai/NEXT_PUBLIC_SUPABASE_URL" \
    --value "$NEXT_PUBLIC_SUPABASE_URL" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

aws ssm put-parameter \
    --name "/chat-tensai/NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --value "$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

aws ssm put-parameter \
    --name "/chat-tensai/AWS_ACCESS_KEY_ID" \
    --value "$AWS_ACCESS_KEY_ID" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

aws ssm put-parameter \
    --name "/chat-tensai/AWS_SECRET_ACCESS_KEY" \
    --value "$AWS_SECRET_ACCESS_KEY" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

aws ssm put-parameter \
    --name "/chat-tensai/AWS_REGION" \
    --value "us-east-1" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

aws ssm put-parameter \
    --name "/chat-tensai/S3_BUCKET_NAME" \
    --value "$S3_BUCKET_NAME" \
    --type "SecureString" \
    --overwrite \
    --region us-east-1

# Clean up
rm temp_credentials.json

echo "All parameters have been added to AWS Parameter Store" 