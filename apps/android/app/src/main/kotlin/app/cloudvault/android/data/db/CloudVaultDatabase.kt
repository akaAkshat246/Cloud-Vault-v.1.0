package app.cloudvault.android.data.db

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import app.cloudvault.android.data.db.dao.FileDao
import app.cloudvault.android.data.db.dao.TransferDao
import app.cloudvault.android.data.db.entity.CachedFileEntity
import app.cloudvault.android.data.db.entity.TransferStatus
import app.cloudvault.android.data.db.entity.TransferTaskEntity
import app.cloudvault.android.data.db.entity.TransferType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class CloudVaultDatabase(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION), TransferDao, FileDao {

    companion object {
        const val DATABASE_NAME = "cloudvault_local.db"
        const val DATABASE_VERSION = 1

        private const val TABLE_TRANSFERS = "transfers"
        private const val TABLE_CACHED_FILES = "cached_files"
    }

    private val transfersFlow = MutableStateFlow<List<TransferTaskEntity>>(emptyList())
    private val filesFlow = MutableStateFlow<List<CachedFileEntity>>(emptyList())

    init {
        // Initial load of tables into flows
        refreshTransfers()
        refreshFiles()
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS $TABLE_TRANSFERS (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                file_id TEXT NOT NULL,
                local_uri TEXT NOT NULL,
                file_name_enc TEXT NOT NULL,
                total_size INTEGER NOT NULL,
                total_chunks INTEGER NOT NULL,
                completed_chunks INTEGER NOT NULL,
                status TEXT NOT NULL,
                error_msg TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        """.trimIndent())

        db.execSQL("""
            CREATE TABLE IF NOT EXISTS $TABLE_CACHED_FILES (
                id TEXT PRIMARY KEY,
                name_enc TEXT NOT NULL,
                mime_enc TEXT NOT NULL,
                iv_hex TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                folder_id TEXT,
                is_starred INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL
            )
        """.trimIndent())
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_TRANSFERS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_CACHED_FILES")
        onCreate(db)
    }

    private fun refreshTransfers() {
        val list = mutableListOf<TransferTaskEntity>()
        val cursor = readableDatabase.query(TABLE_TRANSFERS, null, null, null, null, null, "created_at DESC")
        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    TransferTaskEntity(
                        id = it.getString(it.getColumnIndexOrThrow("id")),
                        type = TransferType.valueOf(it.getString(it.getColumnIndexOrThrow("type"))),
                        fileId = it.getString(it.getColumnIndexOrThrow("file_id")),
                        localUri = it.getString(it.getColumnIndexOrThrow("local_uri")),
                        fileNameEncryptedHex = it.getString(it.getColumnIndexOrThrow("file_name_enc")),
                        totalSizeBytes = it.getLong(it.getColumnIndexOrThrow("total_size")),
                        totalChunks = it.getInt(it.getColumnIndexOrThrow("total_chunks")),
                        completedChunks = it.getInt(it.getColumnIndexOrThrow("completed_chunks")),
                        status = TransferStatus.valueOf(it.getString(it.getColumnIndexOrThrow("status"))),
                        errorMessage = it.getString(it.getColumnIndexOrThrow("error_msg")),
                        createdAt = it.getLong(it.getColumnIndexOrThrow("created_at")),
                        updatedAt = it.getLong(it.getColumnIndexOrThrow("updated_at"))
                    )
                )
            }
        }
        transfersFlow.value = list
    }

    private fun refreshFiles() {
        val list = mutableListOf<CachedFileEntity>()
        val cursor = readableDatabase.query(TABLE_CACHED_FILES, null, null, null, null, null, "updated_at DESC")
        cursor.use {
            while (it.moveToNext()) {
                list.add(
                    CachedFileEntity(
                        id = it.getString(it.getColumnIndexOrThrow("id")),
                        nameEncryptedHex = it.getString(it.getColumnIndexOrThrow("name_enc")),
                        mimeTypeEncryptedHex = it.getString(it.getColumnIndexOrThrow("mime_enc")),
                        ivHex = it.getString(it.getColumnIndexOrThrow("iv_hex")),
                        sizeBytes = it.getLong(it.getColumnIndexOrThrow("size_bytes")),
                        folderId = it.getString(it.getColumnIndexOrThrow("folder_id")),
                        isStarred = it.getInt(it.getColumnIndexOrThrow("is_starred")) == 1,
                        isDeleted = it.getInt(it.getColumnIndexOrThrow("is_deleted")) == 1,
                        updatedAt = it.getLong(it.getColumnIndexOrThrow("updated_at"))
                    )
                )
            }
        }
        filesFlow.value = list
    }

    // TRANSFER DAO IMPLEMENTATION
    override fun getAllTransfersFlow(): Flow<List<TransferTaskEntity>> = transfersFlow.asStateFlow()

    override suspend fun getTransfer(id: String): TransferTaskEntity? = withContext(Dispatchers.IO) {
        transfersFlow.value.find { it.id == id }
    }

    override suspend fun insertOrUpdate(task: TransferTaskEntity) = withContext(Dispatchers.IO) {
        val values = ContentValues().apply {
            put("id", task.id)
            put("type", task.type.name)
            put("file_id", task.fileId)
            put("local_uri", task.localUri)
            put("file_name_enc", task.fileNameEncryptedHex)
            put("total_size", task.totalSizeBytes)
            put("total_chunks", task.totalChunks)
            put("completed_chunks", task.completedChunks)
            put("status", task.status.name)
            put("error_msg", task.errorMessage)
            put("created_at", task.createdAt)
            put("updated_at", task.updatedAt)
        }
        writableDatabase.insertWithOnConflict(TABLE_TRANSFERS, null, values, SQLiteDatabase.CONFLICT_REPLACE)
        refreshTransfers()
    }

    override suspend fun updateProgress(id: String, completedChunks: Int, status: TransferStatus) = withContext(Dispatchers.IO) {
        val values = ContentValues().apply {
            put("completed_chunks", completedChunks)
            put("status", status.name)
            put("updated_at", System.currentTimeMillis())
        }
        writableDatabase.update(TABLE_TRANSFERS, values, "id = ?", arrayOf(id))
        refreshTransfers()
    }

    override suspend fun updateStatus(id: String, status: TransferStatus, error: String?) = withContext(Dispatchers.IO) {
        val values = ContentValues().apply {
            put("status", status.name)
            put("error_msg", error)
            put("updated_at", System.currentTimeMillis())
        }
        writableDatabase.update(TABLE_TRANSFERS, values, "id = ?", arrayOf(id))
        refreshTransfers()
    }

    override suspend fun deleteTransfer(id: String) = withContext(Dispatchers.IO) {
        writableDatabase.delete(TABLE_TRANSFERS, "id = ?", arrayOf(id))
        refreshTransfers()
    }

    override suspend fun clearCompleted() = withContext(Dispatchers.IO) {
        writableDatabase.delete(TABLE_TRANSFERS, "status = ?", arrayOf(TransferStatus.COMPLETED.name))
        refreshTransfers()
    }

    // FILE DAO IMPLEMENTATION
    override fun getFilesFlow(folderId: String?): Flow<List<CachedFileEntity>> {
        return filesFlow.map { list ->
            list.filter { !it.isDeleted && (folderId == null && it.folderId == null || it.folderId == folderId) }
        }
    }

    override fun getTrashFilesFlow(): Flow<List<CachedFileEntity>> {
        return filesFlow.map { list ->
            list.filter { it.isDeleted }
        }
    }

    override suspend fun getFile(id: String): CachedFileEntity? = withContext(Dispatchers.IO) {
        filesFlow.value.find { it.id == id }
    }

    override suspend fun upsertFiles(files: List<CachedFileEntity>) = withContext(Dispatchers.IO) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (file in files) {
                val values = ContentValues().apply {
                    put("id", file.id)
                    put("name_enc", file.nameEncryptedHex)
                    put("mime_enc", file.mimeTypeEncryptedHex)
                    put("iv_hex", file.ivHex)
                    put("size_bytes", file.sizeBytes)
                    put("folder_id", file.folderId)
                    put("is_starred", if (file.isStarred) 1 else 0)
                    put("is_deleted", if (file.isDeleted) 1 else 0)
                    put("updated_at", file.updatedAt)
                }
                db.insertWithOnConflict(TABLE_CACHED_FILES, null, values, SQLiteDatabase.CONFLICT_REPLACE)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        refreshFiles()
    }

    override suspend fun deleteFile(id: String) = withContext(Dispatchers.IO) {
        writableDatabase.delete(TABLE_CACHED_FILES, "id = ?", arrayOf(id))
        refreshFiles()
    }

    override suspend fun clearAll() = withContext(Dispatchers.IO) {
        writableDatabase.delete(TABLE_CACHED_FILES, null, null)
        writableDatabase.delete(TABLE_TRANSFERS, null, null)
        refreshFiles()
        refreshTransfers()
    }
}

