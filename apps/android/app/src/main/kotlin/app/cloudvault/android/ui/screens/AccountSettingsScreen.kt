package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.AuthRepository
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountSettingsScreen(
    authRepository: AuthRepository,
    onNavigateBack: () -> Unit,
    onNavigateToSecurity: () -> Unit,
    onNavigateToSessions: () -> Unit,
    onNavigateToStorage: () -> Unit,
    onNavigateToLimitations: () -> Unit,
    onLogoutComplete: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val user = authRepository.currentUser.collectAsState().value

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Account Settings", color = HeadingDark, fontWeight = FontWeight.Bold) },
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Card
            CosmicCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(BrightAccentPurple),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = (user?.email?.take(1)?.uppercase() ?: "U"),
                            color = Color.White,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column {
                        Text(
                            text = user?.email ?: "user@example.com",
                            color = HeadingDark,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (user?.emailVerified == true) SuccessGreen else WarningAmber)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (user?.emailVerified == true) "Email Verified" else "Verification Pending",
                                color = SecondaryTextDark,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            // Menu Items
            SettingsMenuItem(
                icon = Icons.Default.Security,
                title = "Security & Encryption",
                subtitle = "Keystore quick unlock, BIP-39 recovery kit",
                onClick = onNavigateToSecurity
            )

            SettingsMenuItem(
                icon = Icons.Default.Devices,
                title = "Session Management",
                subtitle = "Active device sessions & token rotation",
                onClick = onNavigateToSessions
            )

            SettingsMenuItem(
                icon = Icons.Default.PieChart,
                title = "Storage Breakdown",
                subtitle = "Quota consumption & breakdown ring",
                onClick = onNavigateToStorage
            )

            SettingsMenuItem(
                icon = Icons.Default.Info,
                title = "Known Limitations & Disclosures",
                subtitle = "30-day grace period notice & threat model",
                onClick = onNavigateToLimitations
            )

            Spacer(modifier = Modifier.weight(1f))

            // Logout Button
            Button(
                onClick = {
                    coroutineScope.launch {
                        authRepository.logout()
                        onLogoutComplete()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed.copy(alpha = 0.85f))
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, tint = Color.White)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Log Out & Zeroize Keys", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun SettingsMenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
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
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = PrimaryPurple, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = title, color = HeadingDark, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Text(text = subtitle, color = SecondaryTextDark, fontSize = 11.sp)
                }
            }

            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = SecondaryTextDark)
        }
    }
}

