package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.VaultRepository
import app.cloudvault.android.domain.model.FileItem
import app.cloudvault.android.domain.model.FolderItem
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FileBrowserScreen(
    vaultRepository: VaultRepository,
    onNavigateBack: () -> Unit,
    onNavigateToUpload: () -> Unit,
    onFolderClick: (String, String) -> Unit,
    onFileClick: (String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val files = vaultRepository.currentFiles.collectAsState().value
    val folders = vaultRepository.currentFolders.collectAsState().value

    var searchQuery by remember { mutableStateOf("") }
    var showCreateFolderDialog by remember { mutableStateOf(false) }
    var newFolderName by remember { mutableStateOf("") }

    val filteredFiles = files.filter { it.name.contains(searchQuery, ignoreCase = true) }
    val filteredFolders = folders.filter { it.name.contains(searchQuery, ignoreCase = true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Files", color = HeadingDark, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryPurple)
                    }
                },
                actions = {
                    IconButton(onClick = { showCreateFolderDialog = true }) {
                        Icon(Icons.Default.CreateNewFolder, contentDescription = "New Folder", tint = PrimaryPurple)
                    }
                    IconButton(onClick = onNavigateToUpload) {
                        Icon(Icons.Default.CloudUpload, contentDescription = "Upload", tint = BrightAccentPurple)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = VoidDark)
            )
        },
        containerColor = VoidDark
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search files and folders...", color = PlaceholderText, fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = SecondaryTextDark) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                shape = RoundedCornerShape(12.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BrightAccentPurple,
                    unfocusedBorderColor = BorderDark,
                    focusedTextColor = HeadingDark,
                    unfocusedTextColor = HeadingDark
                )
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(vertical = 8.dp)
            ) {
                // Folders Section
                if (filteredFolders.isNotEmpty()) {
                    item {
                        Text("Folders", color = SecondaryTextDark, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                    items(filteredFolders) { folder ->
                        FolderRowItem(
                            folder = folder,
                            onClick = { onFolderClick(folder.id, folder.name) }
                        )
                    }
                }

                // Files Section
                if (filteredFiles.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Files", color = SecondaryTextDark, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                    items(filteredFiles) { file ->
                        FileRowItem(
                            file = file,
                            onClick = { onFileClick(file.id) }
                        )
                    }
                }

                if (filteredFolders.isEmpty() && filteredFiles.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 60.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (searchQuery.isBlank()) "Folder is empty" else "No matching files",
                                color = SecondaryTextDark,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }

        // New Folder Dialog
        if (showCreateFolderDialog) {
            AlertDialog(
                onDismissRequest = { showCreateFolderDialog = false },
                title = { Text("Create New Folder", color = HeadingDark, fontWeight = FontWeight.Bold) },
                text = {
                    OutlinedTextField(
                        value = newFolderName,
                        onValueChange = { newFolderName = it },
                        label = { Text("Folder Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrightAccentPurple,
                            unfocusedBorderColor = BorderDark,
                            focusedTextColor = HeadingDark,
                            unfocusedTextColor = HeadingDark
                        )
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (newFolderName.isNotBlank()) {
                                coroutineScope.launch {
                                    vaultRepository.createFolder(newFolderName.trim())
                                    newFolderName = ""
                                    showCreateFolderDialog = false
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
                    ) {
                        Text("Create", color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showCreateFolderDialog = false }) {
                        Text("Cancel", color = SecondaryTextDark)
                    }
                },
                containerColor = ElevatedDark
            )
        }
    }
}

@Composable
fun FolderRowItem(
    folder: FolderItem,
    onClick: () -> Unit
) {
    CosmicCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        backgroundColor = ElevatedDark
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Folder, contentDescription = null, tint = PrimaryPurple, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = folder.name,
                color = HeadingDark,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

