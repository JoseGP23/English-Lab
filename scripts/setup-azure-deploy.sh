#!/bin/sh
# Conecta GitHub Actions con Azure SIN claves (OIDC).
# Crea una identidad que solo puede escribir en la cuenta de almacenamiento del sitio
# y solo acepta ejecuciones de la rama main de JoseGP23/English-Lab.
# Uso (Git Bash, con `az login` hecho): sh scripts/setup-azure-deploy.sh
set -e

REPO="JoseGP23/English-Lab"
ACCOUNT="englishlab28807"
GROUP="rg-english-lab"
WORKFLOW="$(dirname "$0")/../.github/workflows/deploy.yml"

APP_ID=$(az ad app create --display-name github-english-lab-deploy --query appId -o tsv)
az ad sp create --id "$APP_ID" -o none 2>/dev/null || true

az ad app federated-credential create --id "$APP_ID" -o none --parameters "{
  \"name\": \"github-main\",
  \"issuer\": \"https://token.actions.githubusercontent.com\",
  \"subject\": \"repo:$REPO:ref:refs/heads/main\",
  \"audiences\": [\"api://AzureADTokenExchange\"]
}"

SCOPE=$(az storage account show -n "$ACCOUNT" -g "$GROUP" --query id -o tsv)
az role assignment create --assignee "$APP_ID" --role "Storage Blob Data Contributor" --scope "$SCOPE" -o none

TENANT_ID=$(az account show --query tenantId -o tsv)
SUB_ID=$(az account show --query id -o tsv)

# Estos tres valores son identificadores, no claves: pueden ir en el repositorio
sed -i \
  -e "s/__AZURE_CLIENT_ID__/$APP_ID/" \
  -e "s/__AZURE_TENANT_ID__/$TENANT_ID/" \
  -e "s/__AZURE_SUBSCRIPTION_ID__/$SUB_ID/" \
  "$WORKFLOW"

echo "Listo. IDs escritos en $WORKFLOW"
