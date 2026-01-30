#!/bin/bash
set -e

# Usage: ./scripts/database/db-migration.sh AddManagerNameToCoproperty
MIGRATION_NAME=${1:-"AddManagerNameToCoproperty"}
SERVICE_PATH="src/services/coproperty-management/Myb.Coproperty"

if [ -z "$MIGRATION_NAME" ]; then
  echo "Usage: ./scripts/database/db-migration.sh <MigrationName>"
  exit 1
fi

pushd "$SERVICE_PATH" >/dev/null

echo "🛠️  Creating migration: $MIGRATION_NAME"
dotnet ef migrations add "$MIGRATION_NAME" --output-dir Infrastructure/Migrations

echo "✅ Migration created!"

echo "⏫ Applying migration to database"
dotnet ef database update

echo "✅ Database updated!"

popd >/dev/null
