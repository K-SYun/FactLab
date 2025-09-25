# Multi-stage build for production
FROM openjdk:17-jdk-slim as builder

# Create non-root user for security
RUN groupadd -r factlab && useradd -r -g factlab factlab

WORKDIR /app

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy pom.xml and download dependencies (cache optimization)
COPY pom-secure.xml pom.xml
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Production image
FROM openjdk:17-jdk-slim

# Install security packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r factlab && useradd -r -g factlab factlab

# Create directories and set permissions
RUN mkdir -p /app /var/log/factlab && \
    chown -R factlab:factlab /app /var/log/factlab

WORKDIR /app

# Copy built JAR file
COPY --from=builder --chown=factlab:factlab /app/target/*.jar app.jar

# Switch to non-root user
USER factlab

# Expose ports
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1

# JVM options (security and performance)
ENV JAVA_OPTS="-Xms512m -Xmx1024m \
                -XX:+UseG1GC \
                -XX:MaxGCPauseMillis=200 \
                -XX:+UseStringDeduplication \
                -Djava.security.egd=file:/dev/./urandom \
                -Dspring.profiles.active=prod \
                -Djava.awt.headless=true \
                -Dfile.encoding=UTF-8"

# Run application
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]