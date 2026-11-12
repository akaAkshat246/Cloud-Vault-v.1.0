package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.VaultRepository
import app.cloudvault.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FolderBrowserScreen(
    folderId: String,
    folderName: String,
    vaultRepository: VaultRepository,
    onNavigateBack: () -> Unit,
    onNavigateToUpload: () -> Unit,
    onFileClick: (String) -> Unit
) {
    val files = vaultRepository.currentFiles.collectAsState().value.filter { it.folderId == folderId }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(folderName, color = HeadingDark, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryPurple)
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToUpload) {
                        Icon(Icons.Default.CloudUpload, contentDescription = "Upload", tint = BrightAccentPurple)
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
            if (files.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No files in this folder", color = SecondaryTextDark, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(files) { file ->
                        FileRowItem(
                            file = file,
                            onClick = { onFileClick(file.id) }
                        )
                    }
                }
            }
        }
    }
}

