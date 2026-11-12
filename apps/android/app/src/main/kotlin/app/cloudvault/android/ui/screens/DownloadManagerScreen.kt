package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.db.entity.TransferType
import app.cloudvault.android.data.repository.TransferRepository
import app.cloudvault.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DownloadManagerScreen(
    transferRepository: TransferRepository,
    onNavigateBack: () -> Unit
) {
    val allTransfers = transferRepository.transfersFlow.collectAsState(initial = emptyList()).value
    val downloadTasks = allTransfers.filter { it.type == TransferType.DOWNLOAD }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Download Manager", color = HeadingDark, fontWeight = FontWeight.Bold) },
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            if (downloadTasks.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.CloudDownload, contentDescription = null, tint = SecondaryTextDark, modifier = Modifier.size(54.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No active downloads", color = SecondaryTextDark, fontSize = 14.sp)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(downloadTasks) { task ->
                        TransferTaskRow(task = task)
                    }
                }
            }
        }
    }
}

