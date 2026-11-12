plugins {
    kotlin("jvm") version "2.1.0"
}

kotlin {
    jvmToolchain(17)
}

repositories {
    mavenCentral()
    google()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.json:json:20240303")
    
    // Test dependencies (JVM Test Scope only - production dependencies untouched)
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.11.3")
    testImplementation("org.bouncycastle:bcprov-jdk18on:1.78.1")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

tasks.withType<JavaCompile>().configureEach {
    sourceCompatibility = "17"
    targetCompatibility = "17"
}

tasks.test {
    useJUnitPlatform()
}

