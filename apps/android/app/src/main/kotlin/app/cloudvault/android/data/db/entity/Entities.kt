package app.cloudvault.android.data.db.entity

enum class TransferType {
    UPLOAD,
    DOWNLOAD
}

enum class TransferStatus {
    QUEUED,
    RUNNING,
    PAUSED,
    COMPLETED,
    FAILED
}

data class TransferTaskEntity(
    val id: String,
    val type: TransferType,
    val fileId: String,
    val localUri: String,
    val fileNameEncryptedHex: String,
    val totalSizeBytes: Long,
    val totalChunks: Int,
    val completedChunks: Int,
    val status: TransferStatus,
    val errorMessage: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

data class CachedFileEntity(
    val id: String,
    val nameEncryptedHex: String,
    val mimeTypeEncryptedHex: String,
    val ivHex: String,
    val sizeBytes: Long,
    val folderId: String? = null,
    val isStarred: Boolean = false,
    val isDeleted: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis()
)

