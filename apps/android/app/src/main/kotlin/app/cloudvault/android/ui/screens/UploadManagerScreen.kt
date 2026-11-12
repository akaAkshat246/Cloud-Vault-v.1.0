package app.cloudvault.android.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.db.entity.TransferStatus
import app.cloudvault.android.data.db.entity.TransferTaskEntity
import app.cloudvault.android.data.db.entity.TransferType
import app.cloudvault.android.data.repository.TransferRepository
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UploadManagerScreen(
    transferRepository: TransferRepository,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val allTransfers = transferRepository.transfersFlow.collectAsState(initial = emptyList()).value
    val uploadTasks = allTransfers.filter { it.type == TransferType.UPLOAD }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            coroutineScope.launch {
                val contentResolver = context.contentResolver
                var fileName = "Selected_File"
                var sizeBytes = 0L
                contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                        val sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE)
                        if (nameIndex != -1) fileName = cursor.getString(nameIndex)
                        if (sizeIndex != -1) sizeBytes = cursor.getLong(sizeIndex)
                    }
                }
                val mimeType = contentResolver.getType(uri) ?: "application/octet-stream"
                transferRepository.enqueueUpload(
                    fileUri = uri.toString(),
                    fileName = fileName,
                    mimeType = mimeType,
                    sizeBytes = sizeBytes
                )
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Upload Manager", color = HeadingDark, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryPurple)
                    }
                },
                actions = {
                    Button(
                        onClick = { filePickerLauncher.launch("*/*") },
                        colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Pick File", fontSize = 12.sp, color = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = VoidDark)
            )
        },
        containerColor = VoidDark
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            if (uploadTasks.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.CloudUpload, contentDescription = null, tint = SecondaryTextDark, modifier = Modifier.size(54.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No active uploads", color = SecondaryTextDark, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Tap 'Pick File' to encrypt and upload a file", color = PlaceholderText, fontSize = 12.sp)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(uploadTasks) { task ->
                        TransferTaskRow(task = task)
                    }
                }
            }
        }
    }
}

@Composable
fun TransferTaskRow(task: TransferTaskEntity) {
    CosmicCard(
        modifier = Modifier.fillMaxWidth(),
        backgroundColor = ElevatedDark
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = if (task.type == TransferType.UPLOAD) Icons.Default.CloudUpload else Icons.Default.CloudDownload,
                        contentDescription = null,
                        tint = PrimaryPurple,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = task.fileNameEncryptedHex,
                            color = HeadingDark,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1
                        )
                        Text(
                            text = "${task.completedChunks}/${task.totalChunks} chunks • ${formatBytes(task.totalSizeBytes)}",
                            color = SecondaryTextDark,
                            fontSize = 11.sp
                        )
                    }
                }

                StatusPill(status = task.status)
            }

            // Progress Bar
            val progress = if (task.totalChunks > 0) task.completedChunks.toFloat() / task.totalChunks else 0f
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth(),
                color = BrightAccentPurple,
                trackColor = BorderDark
            )
        }
    }
}

@Composable
fun StatusPill(status: TransferStatus) {
    val (bgColor, textColor, text) = when (status) {
        TransferStatus.QUEUED -> Triple(BorderDark, SecondaryTextDark, "Queued")
        TransferStatus.RUNNING -> Triple(PrimaryPurple.copy(alpha = 0.2f), BrightAccentPurple, "Uploading")
        TransferStatus.PAUSED -> Triple(WarningAmber.copy(alpha = 0.2f), WarningAmber, "Paused")
        TransferStatus.COMPLETED -> Triple(SuccessGreen.copy(alpha = 0.2f), SuccessGreen, "Completed")
        TransferStatus.FAILED -> Triple(ErrorRed.copy(alpha = 0.2f), ErrorRed, "Failed")
    }

    Box(
        modifier = Modifier
            .background(bgColor, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(text = text, color = textColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

