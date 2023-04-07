##!/bin/sh

# Read environment variables from the .env file and convert them to the required format
export $(cat .env | xargs)
env_vars=$(envsubst < .env | tr '\n' ',' | sed 's/,$//')

# Deploy the service with gcloud, including the environment variables
gcloud run deploy web-diary3d-client \
  --source . \
  --min-instances 4 \
  --region asia-northeast1 \
  --set-env-vars "$env_vars"

