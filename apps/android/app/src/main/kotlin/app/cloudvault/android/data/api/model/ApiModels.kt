package app.cloudvault.android.data.api.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PreLoginRequest(
    val email: String
)

@Serializable
data class PreLoginResponse(
    val email: String,
    val saltHex: String,
    val kdfVersion: Int = 1,
    val exists: Boolean
)

@Serializable
data class KeyWrapPayloadDto(
    val v: Int = 1,
    val iv: String,
    val tag: String,
    val ct: String
)

@Serializable
data class RegisterRequest(
    val email: String,
    val authKeyHex: String,
    val wrappedMasterKey: KeyWrapPayloadDto,
    val recoveryWrappedMasterKey: KeyWrapPayloadDto,
    val kdfSaltHex: String,
    val recoveryMnemonicHash: String
)

@Serializable
data class LoginRequest(
    val email: String,
    val authKeyHex: String,
    val deviceName: String? = "Android Device"
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val emailVerified: Boolean = false,
    val storageQuotaBytes: Long = 5368709120L, // 5 GB default
    val storageUsedBytes: Long = 0L,
    val createdAt: String? = null
)

@Serializable
data class AuthResponse(
    val user: UserDto,
    val wrappedMasterKey: KeyWrapPayloadDto? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null
)

@Serializable
data class VerifyEmailRequest(
    val code: String
)

@Serializable
data class ResendVerificationRequest(
    val email: String
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean = true,
    val data: T? = null,
    val error: String? = null
)

// Storage Models
@Serializable
data class UploadInitRequest(
    val expectedSizeBytes: Long,
    val totalChunks: Int,
    val folderId: String? = null
)

@Serializable
data class ChunkUploadUrlDto(
    val chunkIndex: Int,
    val url: String
)

@Serializable
data class UploadInitResponse(
    val fileId: String,
    val uploadId: String,
    val chunkUrls: List<ChunkUploadUrlDto>
)

@Serializable
data class CompletedPartDto(
    val partNumber: Int,
    val etag: String
)

@Serializable
data class UploadCompleteRequest(
    val fileId: String,
    val uploadId: String,
    val nameEncryptedHex: String,
    val mimeTypeEncryptedHex: String,
    val ivHex: String,
    val wrappedFek: KeyWrapPayloadDto,
    val parts: List<CompletedPartDto>
)

@Serializable
data class FileItemDto(
    val id: String,
    val nameEncryptedHex: String,
    val mimeTypeEncryptedHex: String,
    val ivHex: String,
    val sizeBytes: Long,
    val folderId: String? = null,
    val wrappedFek: KeyWrapPayloadDto? = null,
    val totalChunks: Int = 1,
    val isStarred: Boolean = false,
    val isDeleted: Boolean = false,
    val deletedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class FolderItemDto(
    val id: String,
    val nameEncryptedHex: String,
    val ivHex: String,
    val parentId: String? = null,
    val isDeleted: Boolean = false,
    val createdAt: String? = null
)

@Serializable
data class FileListResponse(
    val files: List<FileItemDto>,
    val total: Int = 0
)

@Serializable
data class FolderListResponse(
    val folders: List<FolderItemDto>
)

@Serializable
data class CreateFolderRequest(
    val nameEncryptedHex: String,
    val ivHex: String,
    val parentId: String? = null
)

@Serializable
data class StorageQuotaDto(
    val usedBytes: Long,
    val totalBytes: Long,
    val percentage: Double
)

@Serializable
data class DownloadUrlsResponse(
    val file: FileItemDto,
    val downloadUrls: List<String>
)

