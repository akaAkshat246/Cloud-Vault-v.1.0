package app.cloudvault.android.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.crypto.KeystoreManager
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SecuritySettingsScreen(
    keystoreManager: KeystoreManager,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    var isQuickUnlockEnabled by remember { mutableStateOf(keystoreManager.hasDeviceBoundKey()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Security & Encryption", color = HeadingDark, fontWeight = FontWeight.Bold) },
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
            // Android Keystore Quick Unlock Card
            CosmicCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Fingerprint, contentDescription = null, tint = PrimaryPurple, modifier = Modifier.size(28.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Android Keystore Quick Unlock", color = HeadingDark, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            Text("Hardware-backed AES-256-GCM device key", color = SecondaryTextDark, fontSize = 11.sp)
                        }
                    }

                    Switch(
                        checked = isQuickUnlockEnabled,
                        onCheckedChange = { checked ->
                            isQuickUnlockEnabled = checked
                            if (!checked) {
                                keystoreManager.clearDeviceBoundMasterKey()
                                Toast.makeText(context, "Device quick unlock disabled", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Log in again to re-enroll device key", Toast.LENGTH_LONG).show()
                            }
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = BrightAccentPurple)
                    )
                }
            }

            // Cryptographic Invariants Card
            CosmicCard(
                modifier = Modifier.fillMaxWidth(),
                backgroundColor = ElevatedDark
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Cryptographic Specification (v1)", color = HeadingDark, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    CryptoDetailItem(icon = Icons.Default.Lock, title = "KDF", desc = "Argon2id (m=64MB, t=3, p=1)")
                    CryptoDetailItem(icon = Icons.Default.Key, title = "Domain Separation", desc = "HKDF-SHA256 (RFC 5869)")
                    CryptoDetailItem(icon = Icons.Default.Lock, title = "File Framing", desc = "AES-256-GCM with 27-byte AAD binding")
                    CryptoDetailItem(icon = Icons.Default.Key, title = "Emergency Recovery", desc = "BIP-39 24-word English mnemonic")
                }
            }
        }
    }
}

@Composable
fun CryptoDetailItem(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, desc: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(imageVector = icon, contentDescription = null, tint = PrimaryPurple, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(title, color = HeadingDark, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Text(desc, color = SecondaryTextDark, fontSize = 11.sp)
        }
    }
}

