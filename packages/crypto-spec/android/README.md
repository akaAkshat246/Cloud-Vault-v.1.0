# CloudVault Android Cryptographic Module

## Build & Toolchain Requirements
- **JDK:** Requires JDK 17 LTS or JDK 21 LTS. (JDK 26 Early Access is not yet supported by Kotlin 2.1.0 compiler).
- **Gradle:** Uses Gradle 9.3.1 wrapper (`./gradlew` or `gradlew.bat`).
- **Toolchain:** Configured via `kotlin { jvmToolchain(17) }` and `java { toolchain { languageVersion.set(JavaLanguageVersion.of(17)) } }`.

## Running Tests
```bash
./gradlew test
```
To run on a system where default system JAVA_HOME points to an unsupported preview JDK:
```bash
JAVA_HOME="/path/to/jdk-17" ./gradlew test
# Windows PowerShell:
$env:JAVA_HOME="C:\Program Files\Java\jdk-17"; .\gradlew.bat test
```

