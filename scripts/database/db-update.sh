#!/bin/bash
set -e

# Usage: ./scripts/database/db-update.sh
SERVICE_PATH="src/services/coproperty-management/Myb.Coproperty"

pushd "$SERVICE_PATH" >/dev/null

echo "⏫ Updating database to latest migration"
dotnet ef database update

echo "✅ Database updated!"

popd >/dev/null
