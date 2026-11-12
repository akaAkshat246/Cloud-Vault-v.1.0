package app.cloudvault.android.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import app.cloudvault.android.data.repository.VaultRepository
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FileDetailsScreen(
    fileId: String,
    vaultRepository: VaultRepository,
    onNavigateBack: () -> Unit,
    onDownloadClick: (fileId: String, fileName: String, sizeBytes: Long) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val files = vaultRepository.currentFiles.collectAsState().value
    val file = files.find { it.id == fileId }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("File Details", color = HeadingDark, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryPurple)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = VoidDark)
            )
        },
        containerColor = VoidDark
    ) { paddingValues ->
        if (file == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Text("File not found", color = SecondaryTextDark)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    CosmicCard(
                        modifier = Modifier.size(90.dp),
                        backgroundColor = ElevatedDark
                    ) {
                        Icon(
                            imageVector = Icons.Default.InsertDriveFile,
                            contentDescription = null,
                            tint = PrimaryPurple,
                            modifier = Modifier
                                .size(48.dp)
                                .align(Alignment.Center)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = file.name,
                        color = HeadingDark,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = formatBytes(file.sizeBytes),
                        color = SecondaryTextDark,
                        fontSize = 13.sp
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // Metadata Card
                    CosmicCard(modifier = Modifier.fillMaxWidth()) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            DetailRow("Type", file.mimeType)
                            DetailRow("Size", formatBytes(file.sizeBytes))
                            DetailRow("Total Chunks", "${file.totalChunks} (5 MiB wire chunks)")
                            DetailRow("Encryption", "AES-256-GCM + 27B AAD")
                            DetailRow("Key Envelope", "Wrapped with MasterKey")
                            DetailRow("File ID", file.id)
                        }
                    }
                }

                // Action Buttons
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = {
                            onDownloadClick(file.id, file.name, file.sizeBytes)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Download & Decrypt", color = Color.White, fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = {
                            coroutineScope.launch {
                                vaultRepository.deleteFile(file.id)
                                Toast.makeText(context, "File moved to trash", Toast.LENGTH_SHORT).show()
                                onNavigateBack()
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ErrorRed)
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Move to Trash")
                    }
                }
            }
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, color = SecondaryTextDark, fontSize = 12.sp)
        Text(text = value, color = HeadingDark, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}

