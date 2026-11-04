import org.springframework.boot.gradle.plugin.SpringBootPlugin

plugins {
  java
  jacoco
  id("org.springframework.boot") version "4.1.2"
  id("com.diffplug.spotless") version "8.7.0"
}

group = "com.coffeedelivery"

version = "0.1.0"

repositories { mavenCentral() }

dependencies {
  implementation(platform(SpringBootPlugin.BOM_COORDINATES))

  implementation("org.springframework.boot:spring-boot-starter-webmvc")
  implementation("org.springframework.boot:spring-boot-starter-actuator")
  implementation("org.springframework.boot:spring-boot-starter-jdbc")
  implementation("org.springframework.boot:spring-boot-starter-flyway")
  implementation("org.springframework.boot:spring-boot-starter-opentelemetry")
  implementation("org.flywaydb:flyway-database-postgresql")
  runtimeOnly("org.postgresql:postgresql")

  testImplementation("org.springframework.boot:spring-boot-starter-test")
  testImplementation("org.testcontainers:testcontainers")
  testImplementation("com.tngtech.archunit:archunit:1.4.1")
  testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile>().configureEach {
  options.release = 21
  options.compilerArgs.addAll(listOf("-Xlint:all", "-parameters"))
}

// `test` runs the unit tests and never needs Docker. `e2eTest` runs the tests tagged "e2e"
// (Spring Boot tests with a Testcontainers PostgreSQL).
tasks.test { useJUnitPlatform { excludeTags("e2e") } }

val e2eTest by
  tasks.registering(Test::class) {
    description = "Runs the end-to-end tests (Spring Boot with Testcontainers; needs Docker)."
    group = "verification"
    testClassesDirs = sourceSets.test.get().output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath
    useJUnitPlatform { includeTags("e2e") }
    shouldRunAfter(tasks.test)
  }

jacoco { toolVersion = "0.8.14" }

val coveredClasses =
  sourceSets.main.get().output.classesDirs.asFileTree.matching {
    exclude("com/coffeedelivery/CoffeeDeliveryApplication*")
  }

tasks.jacocoTestReport {
  executionData(tasks.test.get(), e2eTest.get())
  classDirectories.setFrom(coveredClasses)
}

tasks.jacocoTestCoverageVerification {
  executionData(tasks.test.get(), e2eTest.get())
  classDirectories.setFrom(coveredClasses)
  mustRunAfter(e2eTest)
  violationRules {
    rule {
      limit {
        counter = "LINE"
        value = "COVEREDRATIO"
        minimum = "0.80".toBigDecimal()
      }
    }
  }
}

spotless {
  java {
    target("src/**/*.java")
    googleJavaFormat()
  }
}
