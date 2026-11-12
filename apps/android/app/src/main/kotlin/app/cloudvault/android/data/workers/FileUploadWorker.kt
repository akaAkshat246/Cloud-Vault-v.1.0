package app.cloudvault.android.data.workers

import android.content.Context
import android.net.Uri
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import app.cloudvault.android.data.api.CloudVaultApiClient
import app.cloudvault.android.data.api.model.CompletedPartDto
import app.cloudvault.android.data.api.model.KeyWrapPayloadDto
import app.cloudvault.android.data.api.model.UploadCompleteRequest
import app.cloudvault.android.data.api.model.UploadInitRequest
import app.cloudvault.android.data.crypto.AndroidCryptoEngine
import app.cloudvault.android.data.crypto.CryptoSpec
import app.cloudvault.android.data.crypto.VolatileKeyStore
import app.cloudvault.android.data.db.CloudVaultDatabase
import app.cloudvault.android.data.db.entity.TransferStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import kotlin.math.ceil

class FileUploadWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val KEY_TRANSFER_ID = "transfer_id"
        const val KEY_FILE_URI = "file_uri"
        const val KEY_FILE_NAME = "file_name"
        const val KEY_MIME_TYPE = "mime_type"
        const val KEY_FOLDER_ID = "folder_id"
        const val CHUNK_SIZE = 5 * 1024 * 1024 // 5 MiB
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val transferId = inputData.getString(KEY_TRANSFER_ID) ?: return@withContext Result.failure()
        val fileUriStr = inputData.getString(KEY_FILE_URI) ?: return@withContext Result.failure()
        val fileName = inputData.getString(KEY_FILE_NAME) ?: "Untitled"
        val mimeType = inputData.getString(KEY_MIME_TYPE) ?: "application/octet-stream"
        val folderId = inputData.getString(KEY_FOLDER_ID)

        val masterKey = VolatileKeyStore.getMasterKey()
        if (masterKey == null) {
            return@withContext Result.failure(workDataOf("error" to "Vault is locked"))
        }

        val api = CloudVaultApiClient()
        val crypto = AndroidCryptoEngine()
        val db = CloudVaultDatabase(applicationContext)

        try {
            db.updateStatus(transferId, TransferStatus.RUNNING)

            val uri = Uri.parse(fileUriStr)
            val contentResolver = applicationContext.contentResolver
            val fileSize = contentResolver.openFileDescriptor(uri, "r")?.statSize ?: 0L
            val totalChunks = if (fileSize == 0L) 1 else ceil(fileSize.toDouble() / CHUNK_SIZE).toInt()

            // 1. Initialize upload with backend to reserve quota and get presigned S3 URLs
            val initResponse = api.uploadInit(
                UploadInitRequest(
                    expectedSizeBytes = fileSize,
                    totalChunks = totalChunks,
                    folderId = folderId
                )
            ).getOrThrow()

            val fileId = initResponse.fileId
            val uploadId = initResponse.uploadId
            val fek = crypto.generateFek()

            val completedParts = mutableListOf<CompletedPartDto>()
            val buffer = ByteArray(CHUNK_SIZE)
            var bytesRemaining = fileSize
            var chunkIndex = 0

            val inputStream: InputStream? = contentResolver.openInputStream(uri)
            inputStream?.use { stream ->
                while (chunkIndex < totalChunks) {
                    val isFinal = (chunkIndex == totalChunks - 1)
                    val bytesToRead = if (isFinal && bytesRemaining < CHUNK_SIZE) bytesRemaining.toInt() else CHUNK_SIZE
                    var bytesReadTotal = 0

                    if (fileSize > 0) {
                        while (bytesReadTotal < bytesToRead) {
                            val r = stream.read(buffer, bytesReadTotal, bytesToRead - bytesReadTotal)
                            if (r == -1) break
                            bytesReadTotal += r
                        }
                    }

                    val plaintextChunk = if (fileSize == 0L) ByteArray(0) else buffer.copyOfRange(0, bytesReadTotal)
                    val aad = CryptoSpec.buildChunkAAD(fileId, chunkIndex, totalChunks, isFinal)
                    val gcmRes = CryptoSpec.encryptAesGcm(fek, plaintextChunk, aad)
                    val packedWireChunk = CryptoSpec.packChunk(gcmRes.iv, gcmRes.ciphertext, gcmRes.tag)

                    val presignedUrl = initResponse.chunkUrls.find { it.chunkIndex == chunkIndex }?.url
                        ?: throw IllegalStateException("Missing presigned URL for chunk $chunkIndex")

                    // Direct PUT to S3
                    val etag = api.uploadS3Chunk(presignedUrl, packedWireChunk).getOrThrow()
                    completedParts.add(CompletedPartDto(partNumber = chunkIndex + 1, etag = etag))

                    bytesRemaining -= bytesReadTotal
                    chunkIndex++
                    db.updateProgress(transferId, chunkIndex, TransferStatus.RUNNING)
                    setProgress(workDataOf("progress" to (chunkIndex.toFloat() / totalChunks)))
                }
            }

            // 2. Encrypt metadata and complete upload
            val (nameEnc, ivHex) = crypto.encryptMetadata(masterKey, fileId, fileName)
            val (mimeEnc, _) = crypto.encryptMetadata(masterKey, fileId, mimeType)
            val wrappedFek = crypto.wrapFek(masterKey, fek)

            api.uploadComplete(
                UploadCompleteRequest(
                    fileId = fileId,
                    uploadId = uploadId,
                    nameEncryptedHex = nameEnc,
                    mimeTypeEncryptedHex = mimeEnc,
                    ivHex = ivHex,
                    wrappedFek = KeyWrapPayloadDto(
                        v = wrappedFek.v,
                        iv = wrappedFek.iv,
                        tag = wrappedFek.tag,
                        ct = wrappedFek.ct
                    ),
                    parts = completedParts
                )
            ).getOrThrow()

            db.updateStatus(transferId, TransferStatus.COMPLETED)
            Result.success()
        } catch (e: Exception) {
            db.updateStatus(transferId, TransferStatus.FAILED, e.message)
            Result.failure(workDataOf("error" to (e.message ?: "Upload failed")))
        }
    }
}

