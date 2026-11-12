package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.VaultRepository
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrashScreen(
    vaultRepository: VaultRepository,
    onNavigateBack: () -> Unit
) {
    val deletedFiles = vaultRepository.currentFiles.collectAsState().value.filter { it.isDeleted }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Trash", color = HeadingDark, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryPurple)
                    }
                },
                actions = {
                    if (deletedFiles.isNotEmpty()) {
                        IconButton(onClick = { /* Empty Trash */ }) {
                            Icon(Icons.Default.DeleteForever, contentDescription = "Empty Trash", tint = ErrorRed)
                        }
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 30-Day Warning Banner matching 8.12.33-1.jpeg
            CosmicCard(
                modifier = Modifier.fillMaxWidth(),
                backgroundColor = ElevatedDark
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = PrimaryPurple, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Items in trash are permanently deleted after 30 days.", color = HeadingDark, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text("Orphaned data can be purged on demand.", color = SecondaryTextDark, fontSize = 11.sp)
                    }
                }
            }

            if (deletedFiles.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Delete, contentDescription = null, tint = SecondaryTextDark, modifier = Modifier.size(54.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Trash is empty", color = SecondaryTextDark, fontSize = 14.sp)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(deletedFiles) { file ->
                        FileRowItem(file = file, onClick = {})
                    }
                }
            }
        }
    }
}

