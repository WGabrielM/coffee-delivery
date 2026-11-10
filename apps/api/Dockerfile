# The API image (spec 037): a multi-stage build. Gradle makes the boot jar, and a Java 21 runtime
# image runs it as a user that is not root, on port 3000. The settings come from the environment
# (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, and optionally
# OTEL_EXPORTER_OTLP_ENDPOINT, as in .env.example); no secret is in the image.
#
#   docker build -t coffee-delivery-api apps/api

FROM eclipse-temurin:21.0.13_9-jdk-alpine AS build
WORKDIR /workspace
# The wrapper and the build files first, so the Gradle distribution and the dependencies are cached
# until they change.
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle gradle
RUN ./gradlew --no-daemon --version
COPY src src
RUN ./gradlew --no-daemon bootJar -x test \
    && cp build/libs/coffee-delivery-api-0.1.0.jar /workspace/app.jar

FROM eclipse-temurin:21.0.13_9-jre-alpine
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build /workspace/app.jar app.jar
USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=6 \
  CMD wget -q -O - http://127.0.0.1:3000/actuator/health | grep -q '"UP"' || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
