package app.cloudvault.android.ui.screens

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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.AuthRepository
import app.cloudvault.android.data.repository.VaultRepository
import app.cloudvault.android.domain.model.FileItem
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.components.EmptyVaultPedestal
import app.cloudvault.android.ui.components.FloatingUploadFab
import app.cloudvault.android.ui.components.StorageDonutRing
import app.cloudvault.android.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    authRepository: AuthRepository,
    vaultRepository: VaultRepository,
    onNavigateToFileBrowser: () -> Unit,
    onNavigateToUpload: () -> Unit,
    onNavigateToTrash: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onFileClick: (String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val user = authRepository.currentUser.collectAsState().value
    val files = vaultRepository.currentFiles.collectAsState().value
    val quota = vaultRepository.storageQuota.collectAsState().value
    var isRefreshing by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        vaultRepository.loadVault()
    }

    val displayName = user?.email?.substringBefore('@')?.replaceFirstChar { it.uppercase() } ?: "User"

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(VoidDark)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Bar
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Welcome back, $displayName! 👋",
                            color = HeadingDark,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Here's what's happening with your files today.",
                            color = SecondaryTextDark,
                            fontSize = 12.sp
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        IconButton(onClick = onNavigateToSettings) {
                            Icon(Icons.Default.Settings, contentDescription = "Settings", tint = PrimaryPurple)
                        }
                    }
                }
            }

            // Storage Overview Card
            item {
                CosmicCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Total Storage", color = HeadingDark, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${quota?.usedGbString ?: "0.0 GB"} used",
                                color = PrimaryPurple,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Zero-Knowledge Encrypted",
                                color = SecondaryTextDark,
                                fontSize = 11.sp
                            )
                        }

                        StorageDonutRing(
                            percentage = quota?.percentage ?: 0.0,
                            usedText = quota?.usedGbString ?: "0 GB",
                            totalText = quota?.totalGbString ?: "5 GB",
                            size = 110.dp,
                            strokeWidth = 11.dp
                        )
                    }
                }
            }

            // Quick Stats Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(
                        icon = Icons.Default.InsertDriveFile,
                        title = "Files",
                        value = "${files.size}",
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        icon = Icons.Default.Share,
                        title = "Shared",
                        value = "0",
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        icon = Icons.Default.Delete,
                        title = "Trash",
                        value = "0",
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToTrash
                    )
                }
            }

            // Content Area: Empty state or Recent Files
            if (files.isEmpty()) {
                item {
                    EmptyVaultPedestal(
                        onUploadClick = onNavigateToUpload
                    )
                }
            } else {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Recent Files", color = HeadingDark, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        TextButton(onClick = onNavigateToFileBrowser) {
                            Text("View All", color = LinkPurple, fontSize = 13.sp)
                        }
                    }
                }

                items(files.take(5)) { file ->
                    FileRowItem(
                        file = file,
                        onClick = { onFileClick(file.id) }
                    )
                }
            }

            // Bottom Spacing for FAB
            item {
                Spacer(modifier = Modifier.height(72.dp))
            }
        }

        // Floating Upload FAB
        FloatingUploadFab(
            onClick = onNavigateToUpload,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp)
        )
    }
}

@Composable
fun StatCard(
    icon: ImageVector,
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    CosmicCard(
        modifier = modifier,
        backgroundColor = ElevatedDark
    ) {
        Column(
            horizontalAlignment = Alignment.Start,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = PrimaryPurple, modifier = Modifier.size(20.dp))
            Text(text = value, color = HeadingDark, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(text = title, color = SecondaryTextDark, fontSize = 11.sp)
        }
    }
}

@Composable
fun FileRowItem(
    file: FileItem,
    onClick: () -> Unit
) {
    CosmicCard(
        modifier = Modifier.fillMaxWidth(),
        backgroundColor = ElevatedDark
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Icon(
                    imageVector = Icons.Default.InsertDriveFile,
                    contentDescription = null,
                    tint = PrimaryPurple,
                    modifier = Modifier.size(32.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = file.name,
                        color = HeadingDark,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1
                    )
                    Text(
                        text = formatBytes(file.sizeBytes),
                        color = SecondaryTextDark,
                        fontSize = 11.sp
                    )
                }
            }

            IconButton(onClick = onClick) {
                Icon(Icons.Default.MoreVert, contentDescription = "Options", tint = SecondaryTextDark)
            }
        }
    }
}

fun formatBytes(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val units = arrayOf("B", "KB", "MB", "GB", "TB")
    val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
    return String.format("%.1f %s", bytes / Math.pow(1024.0, digitGroups.toDouble()), units[digitGroups])
}

