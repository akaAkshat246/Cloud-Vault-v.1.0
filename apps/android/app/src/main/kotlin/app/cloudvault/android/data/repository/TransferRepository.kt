package app.cloudvault.android.data.repository

import android.content.Context
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import app.cloudvault.android.data.db.CloudVaultDatabase
import app.cloudvault.android.data.db.entity.TransferStatus
import app.cloudvault.android.data.db.entity.TransferTaskEntity
import app.cloudvault.android.data.db.entity.TransferType
import app.cloudvault.android.data.workers.FileDownloadWorker
import app.cloudvault.android.data.workers.FileUploadWorker
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class TransferRepository(
    private val context: Context,
    private val db: CloudVaultDatabase
) {

    val transfersFlow: Flow<List<TransferTaskEntity>> = db.getAllTransfersFlow()

    suspend fun enqueueUpload(
        fileUri: String,
        fileName: String,
        mimeType: String,
        sizeBytes: Long,
        folderId: String? = null
    ): String {
        val transferId = UUID.randomUUID().toString()
        val totalChunks = if (sizeBytes == 0L) 1 else Math.ceil(sizeBytes.toDouble() / FileUploadWorker.CHUNK_SIZE).toInt()

        val entity = TransferTaskEntity(
            id = transferId,
            type = TransferType.UPLOAD,
            fileId = "pending",
            localUri = fileUri,
            fileNameEncryptedHex = fileName, // stored for local display in transfer list
            totalSizeBytes = sizeBytes,
            totalChunks = totalChunks,
            completedChunks = 0,
            status = TransferStatus.QUEUED
        )
        db.insertOrUpdate(entity)

        val workRequest = OneTimeWorkRequestBuilder<FileUploadWorker>()
            .setInputData(
                workDataOf(
                    FileUploadWorker.KEY_TRANSFER_ID to transferId,
                    FileUploadWorker.KEY_FILE_URI to fileUri,
                    FileUploadWorker.KEY_FILE_NAME to fileName,
                    FileUploadWorker.KEY_MIME_TYPE to mimeType,
                    FileUploadWorker.KEY_FOLDER_ID to folderId
                )
            )
            .build()

        WorkManager.getInstance(context).enqueue(workRequest)
        return transferId
    }

    suspend fun enqueueDownload(
        fileId: String,
        fileName: String,
        outputUri: String,
        sizeBytes: Long
    ): String {
        val transferId = UUID.randomUUID().toString()
        val totalChunks = if (sizeBytes == 0L) 1 else Math.ceil(sizeBytes.toDouble() / FileUploadWorker.CHUNK_SIZE).toInt()

        val entity = TransferTaskEntity(
            id = transferId,
            type = TransferType.DOWNLOAD,
            fileId = fileId,
            localUri = outputUri,
            fileNameEncryptedHex = fileName,
            totalSizeBytes = sizeBytes,
            totalChunks = totalChunks,
            completedChunks = 0,
            status = TransferStatus.QUEUED
        )
        db.insertOrUpdate(entity)

        val workRequest = OneTimeWorkRequestBuilder<FileDownloadWorker>()
            .setInputData(
                workDataOf(
                    FileDownloadWorker.KEY_TRANSFER_ID to transferId,
                    FileDownloadWorker.KEY_FILE_ID to fileId,
                    FileDownloadWorker.KEY_OUTPUT_URI to outputUri
                )
            )
            .build()

        WorkManager.getInstance(context).enqueue(workRequest)
        return transferId
    }
}

