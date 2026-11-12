package app.cloudvault.android.data.api

import app.cloudvault.android.data.api.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class CloudVaultApiClient(
    private var baseUrl: String = "http://10.0.2.2:3000/api/v1"
) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val cookieStore = mutableMapOf<String, MutableMap<String, Cookie>>()

    private val cookieJar = object : CookieJar {
        override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
            val hostCookies = cookieStore.getOrPut(url.host) { mutableMapOf() }
            for (cookie in cookies) {
                hostCookies[cookie.name] = cookie
            }
        }

        override fun loadForRequest(url: HttpUrl): List<Cookie> {
            val hostCookies = cookieStore[url.host] ?: return emptyList()
            val now = System.currentTimeMillis()
            return hostCookies.values.filter { it.expiresAt > now }
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .header("x-cloudvault-client", "android")
                .header("Accept", "application/json")
                .build()
            chain.proceed(request)
        }
        .build()

    fun setBaseUrl(url: String) {
        baseUrl = url.trimEnd('/')
    }

    fun getBaseUrl(): String = baseUrl

    fun clearCookies() {
        cookieStore.clear()
    }

    // AUTH ENDPOINTS
    suspend fun preLogin(email: String): Result<PreLoginResponse> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(PreLoginRequest(email))
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/auth/pre-login")
                .post(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Pre-login failed with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<PreLoginResponse>(responseBody)
        }
    }

    suspend fun register(requestDto: RegisterRequest): Result<AuthResponse> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(requestDto)
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/auth/register")
                .post(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Registration failed with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<AuthResponse>(responseBody)
        }
    }

    suspend fun login(email: String, authKeyHex: String): Result<AuthResponse> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(LoginRequest(email, authKeyHex))
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/auth/login")
                .post(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Login failed with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<AuthResponse>(responseBody)
        }
    }

    suspend fun verifyEmail(code: String): Result<Boolean> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(VerifyEmailRequest(code))
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/auth/verify-email")
                .post(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            response.isSuccessful
        }
    }

    suspend fun resendVerification(email: String): Result<Boolean> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(ResendVerificationRequest(email))
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/auth/resend-verification")
                .post(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            response.isSuccessful
        }
    }

    suspend fun logout(): Result<Boolean> = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder()
                .url("$baseUrl/auth/logout")
                .post("{}".toRequestBody("application/json".toMediaType()))
                .build()
            val response = okHttpClient.newCall(request).execute()
            clearCookies()
            response.isSuccessful
        }
    }

    // STORAGE ENDPOINTS
    suspend fun uploadInit(requestDto: UploadInitRequest): Result<UploadInitResponse> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(requestDto)
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/storage/upload/init")
                .post(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Upload init failed with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<UploadInitResponse>(responseBody)
        }
    }

    suspend fun uploadComplete(requestDto: UploadCompleteRequest): Result<FileItemDto> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(requestDto)
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/storage/upload/complete")
                .post(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Upload complete failed with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<FileItemDto>(responseBody)
        }
    }

    suspend fun getFiles(folderId: String? = null): Result<List<FileItemDto>> = withContext(Dispatchers.IO) {
        runCatching {
            val urlBuilder = "$baseUrl/storage/files".toHttpUrlOrNull()!!.newBuilder()
            if (folderId != null) {
                urlBuilder.addQueryParameter("folderId", folderId)
            }
            val request = Request.Builder().url(urlBuilder.build()).get().build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Failed to fetch files with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<FileListResponse>(responseBody).files
        }
    }

    suspend fun getFolders(parentId: String? = null): Result<List<FolderItemDto>> = withContext(Dispatchers.IO) {
        runCatching {
            val urlBuilder = "$baseUrl/storage/folders".toHttpUrlOrNull()!!.newBuilder()
            if (parentId != null) {
                urlBuilder.addQueryParameter("parentId", parentId)
            }
            val request = Request.Builder().url(urlBuilder.build()).get().build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Failed to fetch folders with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<FolderListResponse>(responseBody).folders
        }
    }

    suspend fun createFolder(requestDto: CreateFolderRequest): Result<FolderItemDto> = withContext(Dispatchers.IO) {
        runCatching {
            val body = json.encodeToString(requestDto)
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$baseUrl/storage/folders")
                .post(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Failed to create folder with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<FolderItemDto>(responseBody)
        }
    }

    suspend fun deleteFile(fileId: String): Result<Boolean> = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder()
                .url("$baseUrl/storage/files/$fileId")
                .delete()
                .build()
            val response = okHttpClient.newCall(request).execute()
            response.isSuccessful
        }
    }

    suspend fun getDownloadUrls(fileId: String): Result<DownloadUrlsResponse> = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder()
                .url("$baseUrl/storage/files/$fileId/download")
                .get()
                .build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Failed to get download URLs with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<DownloadUrlsResponse>(responseBody)
        }
    }

    suspend fun getQuota(): Result<StorageQuotaDto> = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder().url("$baseUrl/storage/quota").get().build()
            val response = okHttpClient.newCall(request).execute()
            val responseBody = response.body?.string() ?: throw IOException("Empty response")
            if (!response.isSuccessful) {
                throw IOException("Failed to fetch quota with HTTP ${response.code}: $responseBody")
            }
            json.decodeFromString<StorageQuotaDto>(responseBody)
        }
    }

    // DIRECT-TO-S3 OPERATIONS (Zero server proxying)
    suspend fun uploadS3Chunk(presignedPutUrl: String, chunkCiphertext: ByteArray): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val body = chunkCiphertext.toRequestBody("application/octet-stream".toMediaType())
            val request = Request.Builder()
                .url(presignedPutUrl)
                .put(body)
                .build()
            val response = okHttpClient.newCall(request).execute()
            if (!response.isSuccessful) {
                throw IOException("S3 PUT failed with HTTP ${response.code}")
            }
            // ETag header returned by S3
            val etag = response.header("ETag")?.replace("\"", "") ?: "etag-chunk-completed"
            etag
        }
    }

    suspend fun downloadS3Chunk(presignedGetUrl: String, rangeHeader: String? = null): Result<ByteArray> = withContext(Dispatchers.IO) {
        runCatching {
            val reqBuilder = Request.Builder().url(presignedGetUrl).get()
            if (rangeHeader != null) {
                reqBuilder.header("Range", rangeHeader)
            }
            val response = okHttpClient.newCall(reqBuilder.build()).execute()
            if (!response.isSuccessful && response.code != 206) {
                throw IOException("S3 GET failed with HTTP ${response.code}")
            }
            response.body?.bytes() ?: throw IOException("Empty S3 response body")
        }
    }
}

