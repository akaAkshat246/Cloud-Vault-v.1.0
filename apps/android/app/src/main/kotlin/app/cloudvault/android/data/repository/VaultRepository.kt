package app.cloudvault.android.data.repository

import app.cloudvault.android.data.api.CloudVaultApiClient
import app.cloudvault.android.data.api.model.CreateFolderRequest
import app.cloudvault.android.data.crypto.AndroidCryptoEngine
import app.cloudvault.android.data.crypto.CryptoSpec
import app.cloudvault.android.data.crypto.VolatileKeyStore
import app.cloudvault.android.data.db.CloudVaultDatabase
import app.cloudvault.android.data.db.entity.CachedFileEntity
import app.cloudvault.android.domain.model.FileItem
import app.cloudvault.android.domain.model.FolderItem
import app.cloudvault.android.domain.model.StorageQuota
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

class VaultRepository(
    private val api: CloudVaultApiClient,
    private val crypto: AndroidCryptoEngine,
    private val db: CloudVaultDatabase
) {

    private val _currentFiles = MutableStateFlow<List<FileItem>>(emptyList())
    val currentFiles: StateFlow<List<FileItem>> = _currentFiles.asStateFlow()

    private val _currentFolders = MutableStateFlow<List<FolderItem>>(emptyList())
    val currentFolders: StateFlow<List<FolderItem>> = _currentFolders.asStateFlow()

    private val _storageQuota = MutableStateFlow<StorageQuota?>(null)
    val storageQuota: StateFlow<StorageQuota?> = _storageQuota.asStateFlow()

    suspend fun loadVault(folderId: String? = null): Result<Unit> {
        return runCatching {
            val masterKey = VolatileKeyStore.getMasterKey()
                ?: throw IllegalStateException("Vault is locked")

            // 1. Fetch files from API
            val fileDtos = api.getFiles(folderId).getOrThrow()
            val folderDtos = api.getFolders(folderId).getOrThrow()

            // 2. Decrypt names locally using MasterKey
            val decryptedFiles = fileDtos.map { dto ->
                val plainName = try {
                    crypto.decryptMetadata(masterKey, dto.id, dto.nameEncryptedHex, dto.ivHex)
                } catch (e: Exception) {
                    "Encrypted File (${dto.id.take(8)})"
                }
                val plainMime = try {
                    crypto.decryptMetadata(masterKey, dto.id, dto.mimeTypeEncryptedHex, dto.ivHex)
                } catch (e: Exception) {
                    "application/octet-stream"
                }
                FileItem(
                    id = dto.id,
                    name = plainName,
                    mimeType = plainMime,
                    sizeBytes = dto.sizeBytes,
                    folderId = dto.folderId,
                    totalChunks = dto.totalChunks,
                    isStarred = dto.isStarred,
                    isDeleted = dto.isDeleted,
                    deletedAt = dto.deletedAt,
                    createdAt = dto.createdAt,
                    updatedAt = dto.updatedAt
                )
            }

            val decryptedFolders = folderDtos.map { dto ->
                val plainName = try {
                    crypto.decryptMetadata(masterKey, dto.id, dto.nameEncryptedHex, dto.ivHex)
                } catch (e: Exception) {
                    "Folder (${dto.id.take(8)})"
                }
                FolderItem(
                    id = dto.id,
                    name = plainName,
                    parentId = dto.parentId,
                    createdAt = dto.createdAt
                )
            }

            _currentFiles.value = decryptedFiles
            _currentFolders.value = decryptedFolders

            // 3. Cache encrypted records in local database
            val cachedEntities = fileDtos.map { dto ->
                CachedFileEntity(
                    id = dto.id,
                    nameEncryptedHex = dto.nameEncryptedHex,
                    mimeTypeEncryptedHex = dto.mimeTypeEncryptedHex,
                    ivHex = dto.ivHex,
                    sizeBytes = dto.sizeBytes,
                    folderId = dto.folderId,
                    isStarred = dto.isStarred,
                    isDeleted = dto.isDeleted
                )
            }
            db.upsertFiles(cachedEntities)

            // 4. Update Quota
            val quotaDto = api.getQuota().getOrNull()
            if (quotaDto != null) {
                _storageQuota.value = StorageQuota(
                    usedBytes = quotaDto.usedBytes,
                    totalBytes = quotaDto.totalBytes,
                    percentage = quotaDto.percentage
                )
            }
        }
    }

    suspend fun createFolder(name: String, parentId: String? = null): Result<FolderItem> {
        return runCatching {
            val masterKey = VolatileKeyStore.getMasterKey()
                ?: throw IllegalStateException("Vault is locked")
            val syntheticId = UUID.randomUUID().toString()
            val (nameEnc, ivHex) = crypto.encryptMetadata(masterKey, syntheticId, name)

            val folderDto = api.createFolder(
                CreateFolderRequest(
                    nameEncryptedHex = nameEnc,
                    ivHex = ivHex,
                    parentId = parentId
                )
            ).getOrThrow()

            val folder = FolderItem(
                id = folderDto.id,
                name = name,
                parentId = folderDto.parentId,
                createdAt = folderDto.createdAt
            )
            _currentFolders.value = _currentFolders.value + folder
            folder
        }
    }

    suspend fun deleteFile(fileId: String): Result<Boolean> {
        return runCatching {
            api.deleteFile(fileId).getOrThrow()
            _currentFiles.value = _currentFiles.value.filter { it.id != fileId }
            db.deleteFile(fileId)
            true
        }
    }
}

