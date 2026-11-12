package app.cloudvault.android.data.workers

import android.content.Context
import android.net.Uri
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import app.cloudvault.android.data.api.CloudVaultApiClient
import app.cloudvault.android.data.crypto.AndroidCryptoEngine
import app.cloudvault.android.data.crypto.CryptoSpec
import app.cloudvault.android.data.crypto.VolatileKeyStore
import app.cloudvault.android.data.db.CloudVaultDatabase
import app.cloudvault.android.data.db.entity.TransferStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStream

class FileDownloadWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val KEY_TRANSFER_ID = "transfer_id"
        const val KEY_FILE_ID = "file_id"
        const val KEY_OUTPUT_URI = "output_uri"
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val transferId = inputData.getString(KEY_TRANSFER_ID) ?: return@withContext Result.failure()
        val fileId = inputData.getString(KEY_FILE_ID) ?: return@withContext Result.failure()
        val outputUriStr = inputData.getString(KEY_OUTPUT_URI) ?: return@withContext Result.failure()

        val masterKey = VolatileKeyStore.getMasterKey()
        if (masterKey == null) {
            return@withContext Result.failure(workDataOf("error" to "Vault is locked"))
        }

        val api = CloudVaultApiClient()
        val crypto = AndroidCryptoEngine()
        val db = CloudVaultDatabase(applicationContext)

        try {
            db.updateStatus(transferId, TransferStatus.RUNNING)

            // 1. Fetch file metadata and S3 download URLs
            val downloadData = api.getDownloadUrls(fileId).getOrThrow()
            val fileDto = downloadData.file
            val wrappedFekDto = fileDto.wrappedFek
                ?: throw IllegalStateException("Missing wrapped FEK in file record")

            val wrappedFekPayload = CryptoSpec.KeyWrapPayload(
                v = wrappedFekDto.v,
                iv = wrappedFekDto.iv,
                tag = wrappedFekDto.tag,
                ct = wrappedFekDto.ct
            )
            val fek = crypto.unwrapFek(masterKey, wrappedFekPayload)

            val outputUri = Uri.parse(outputUriStr)
            val outputStream: OutputStream? = applicationContext.contentResolver.openOutputStream(outputUri)
            val totalChunks = downloadData.downloadUrls.size

            outputStream?.use { stream ->
                for (chunkIndex in 0 until totalChunks) {
                    val presignedUrl = downloadData.downloadUrls[chunkIndex]
                    val isFinal = (chunkIndex == totalChunks - 1)

                    // Direct S3 download of ciphertext chunk
                    val wireChunkBytes = api.downloadS3Chunk(presignedUrl).getOrThrow()
                    val (iv, ciphertext, tag) = CryptoSpec.unpackChunk(wireChunkBytes)

                    val aad = CryptoSpec.buildChunkAAD(fileId, chunkIndex, totalChunks, isFinal)
                    val plaintextChunk = CryptoSpec.decryptAesGcm(fek, iv, ciphertext, tag, aad)

                    stream.write(plaintextChunk)
                    db.updateProgress(transferId, chunkIndex + 1, TransferStatus.RUNNING)
                    setProgress(workDataOf("progress" to ((chunkIndex + 1).toFloat() / totalChunks)))
                }
            }

            db.updateStatus(transferId, TransferStatus.COMPLETED)
            Result.success()
        } catch (e: Exception) {
            db.updateStatus(transferId, TransferStatus.FAILED, e.message)
            Result.failure(workDataOf("error" to (e.message ?: "Download failed")))
        }
    }
}

