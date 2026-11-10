# ============================================================
# ZELO Backend - imagem de produção
# Build multi-stage: compila o jar dentro da imagem, sem depender
# de artefatos pré-compilados no host.
#
#   docker build -t zelo-backend .
#   docker run -p 8080:8080 --env-file .env zelo-backend
# ============================================================

# ---- Estágio 1: build ----
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /build

# Copia primeiro o pom para aproveitar o cache de dependências
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---- Estágio 2: runtime ----
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Usuário não-root e diretório de uploads com permissão de escrita
RUN adduser -D -u 1001 zelo \
    && mkdir -p /app/uploads \
    && chown -R zelo:zelo /app/uploads

COPY --from=build /build/target/backend-1.0.0.jar app.jar

USER zelo

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
