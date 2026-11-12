package app.cloudvault.android.data.db.dao

import app.cloudvault.android.data.db.entity.CachedFileEntity
import app.cloudvault.android.data.db.entity.TransferStatus
import app.cloudvault.android.data.db.entity.TransferTaskEntity
import kotlinx.coroutines.flow.Flow

interface TransferDao {
    fun getAllTransfersFlow(): Flow<List<TransferTaskEntity>>
    suspend fun getTransfer(id: String): TransferTaskEntity?
    suspend fun insertOrUpdate(task: TransferTaskEntity)
    suspend fun updateProgress(id: String, completedChunks: Int, status: TransferStatus)
    suspend fun updateStatus(id: String, status: TransferStatus, error: String? = null)
    suspend fun deleteTransfer(id: String)
    suspend fun clearCompleted()
}

interface FileDao {
    fun getFilesFlow(folderId: String? = null): Flow<List<CachedFileEntity>>
    fun getTrashFilesFlow(): Flow<List<CachedFileEntity>>
    suspend fun getFile(id: String): CachedFileEntity?
    suspend fun upsertFiles(files: List<CachedFileEntity>)
    suspend fun deleteFile(id: String)
    suspend fun clearAll()
}

