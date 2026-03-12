#!/bin/bash
# 将指定环境配置复制到 .env
# 用法: ./src/scripts/use-env.sh <local|development|production>
# 如果对应的 .env.xxx.env 不存在，则直接使用已有的 .env

ENV_NAME="${1:-local}"

case "$ENV_NAME" in
  local)       SOURCE=".env.local.env" ;;
  development) SOURCE=".env.development.env" ;;
  production)  SOURCE=".env.production.env" ;;
  *)
    echo "❌ 未知环境: $ENV_NAME (可选: local, development, production)"
    exit 1
    ;;
esac

if [ ! -f "$SOURCE" ]; then
  if [ -f ".env" ]; then
    echo "⚠️  $SOURCE 不存在，使用已有的 .env"
    exit 0
  else
    echo "❌ $SOURCE 和 .env 都不存在，请先创建配置文件"
    exit 1
  fi
fi

cp "$SOURCE" .env
echo "✅ 已将 $SOURCE → .env ($ENV_NAME 环境)"
