# syntax=docker/dockerfile:1
#
# 로컬 Docker stack(task 1.98)의 Server·도구 이미지. production 배포 이미지가 아니다.
# Server 소스는 compose의 추가 context `server-src`(기본: 공개 Proovy-server 저장소의 pin한 commit)로 받아
# 컨테이너 안에서 bootJar를 만든다 — 개발자 컴퓨터에 Java가 필요 없다. amd64·arm64(Apple Silicon) 공통 base만 쓴다.

FROM eclipse-temurin:21-jdk AS server-build
WORKDIR /src
COPY --from=server-src . .
# Gradle 배포본·의존성은 BuildKit cache에 남긴다(다시 빌드할 때 내려받지 않는다). Docker 메모리가 작아도 돌도록 낮게 잡는다.
RUN --mount=type=cache,id=proovy-local-gradle,target=/root/.gradle \
    sh ./gradlew bootJar --no-daemon --max-workers=2 -Dorg.gradle.jvmargs=-Xmx768m

# Server: local profile로 기동한다. 개발용 secret은 실행 시 /secrets volume에서 읽는다(이미지·compose 파일에 값이 없다).
FROM eclipse-temurin:21-jre AS server
RUN groupadd --system app && useradd --system --gid app --no-create-home app
WORKDIR /app
COPY --from=server-build /src/build/libs/app.jar app.jar
COPY --chmod=755 tools/server-entrypoint.sh /usr/local/bin/server-entrypoint.sh
USER app
EXPOSE 8080
ENTRYPOINT ["server-entrypoint.sh"]

# 도구: Postgres 본체이면서 secret 생성·role 경계 적용·검증용 token 발급 명령을 담는다.
# role 경계 SQL은 같은 Server commit에서 가져온다.
FROM postgres:15-alpine AS tools
COPY --from=server-src src/main/resources/db/provisioning/role-boundary.sql /provisioning/role-boundary.sql
COPY --chmod=755 tools/initdb.sh /docker-entrypoint-initdb.d/10-proovy.sh
COPY --chmod=755 tools/init-secrets.sh /usr/local/bin/init-secrets.sh
COPY --chmod=755 tools/issue-token.sh /usr/local/bin/issue-token
