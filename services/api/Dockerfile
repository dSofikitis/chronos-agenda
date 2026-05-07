FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline
COPY src ./src
RUN ./mvnw -B -q -DskipTests package && \
    cp target/*.jar /app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S svc && adduser -S svc -G svc
COPY --from=build /app.jar /app/app.jar
USER svc
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
