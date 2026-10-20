#!/bin/sh
# Server 컨테이너 entrypoint — secrets volume의 개발용 값을 env로 넘기고 jar를 실행한다.
set -eu
JWT_SECRET="$(cat /secrets/jwt-secret)"
DB_PASSWORD="$(cat /secrets/server-db-password)"
BRAIN_SHARED_TOKEN="$(cat /secrets/shared-token)"
export JWT_SECRET DB_PASSWORD BRAIN_SHARED_TOKEN
exec java -Xmx384m -XX:+UseSerialGC -jar /app/app.jar
