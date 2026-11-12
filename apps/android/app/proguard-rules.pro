# CloudVault Android Proguard Rules
-keep class app.cloudvault.android.data.api.model.** { *; }
-keep class app.cloudvault.crypto.CryptoSpec** { *; }
-keep class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**

