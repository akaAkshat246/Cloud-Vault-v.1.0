package app.cloudvault.android.domain.model

data class User(
    val id: String,
    val email: String,
    val emailVerified: Boolean,
    val storageQuotaBytes: Long,
    val storageUsedBytes: Long
)

data class FileItem(
    val id: String,
    val name: String, // Plaintext decrypted name for UI
    val mimeType: String,
    val sizeBytes: Long,
    val folderId: String? = null,
    val totalChunks: Int = 1,
    val isStarred: Boolean = false,
    val isDeleted: Boolean = false,
    val deletedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class FolderItem(
    val id: String,
    val name: String, // Plaintext decrypted name for UI
    val parentId: String? = null,
    val createdAt: String? = null
)

data class StorageQuota(
    val usedBytes: Long,
    val totalBytes: Long,
    val percentage: Double
) {
    val usedGbString: String
        get() = String.format("%.1f GB", usedBytes.toDouble() / (1024 * 1024 * 1024))

    val totalGbString: String
        get() = String.format("%.0f GB", totalBytes.toDouble() / (1024 * 1024 * 1024))
}

