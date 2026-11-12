package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.AuthRepository
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*

@Composable
fun RecoveryKitVerifyScreen(
    authRepository: AuthRepository,
    onVerificationSuccess: () -> Unit
) {
    val words = authRepository.pendingRecoveryKit?.words ?: emptyList()
    val challengeIndices = remember { listOf(3, 11, 18) } // 4th, 12th, 19th words (0-indexed)

    var inputWord1 by remember { mutableStateOf("") }
    var inputWord2 by remember { mutableStateOf("") }
    var inputWord3 by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scrollState = rememberScrollState()

    val word1Correct = words.getOrNull(challengeIndices[0])?.equals(inputWord1.trim().lowercase()) == true
    val word2Correct = words.getOrNull(challengeIndices[1])?.equals(inputWord2.trim().lowercase()) == true
    val word3Correct = words.getOrNull(challengeIndices[2])?.equals(inputWord3.trim().lowercase()) == true
    val allCorrect = word1Correct && word2Correct && word3Correct

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(VoidDark)
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Verify Recovery Phrase",
                color = HeadingDark,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "To confirm you have securely backed up your 24 words, please enter the requested words below.",
                color = SecondaryTextDark,
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            CosmicCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Challenge 1
                    OutlinedTextField(
                        value = inputWord1,
                        onValueChange = { inputWord1 = it; errorMessage = null },
                        label = { Text("Word #${challengeIndices[0] + 1}") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrightAccentPurple,
                            unfocusedBorderColor = BorderDark,
                            focusedTextColor = HeadingDark,
                            unfocusedTextColor = HeadingDark,
                            focusedLabelColor = PrimaryPurple,
                            unfocusedLabelColor = SecondaryTextDark
                        )
                    )

                    // Challenge 2
                    OutlinedTextField(
                        value = inputWord2,
                        onValueChange = { inputWord2 = it; errorMessage = null },
                        label = { Text("Word #${challengeIndices[1] + 1}") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrightAccentPurple,
                            unfocusedBorderColor = BorderDark,
                            focusedTextColor = HeadingDark,
                            unfocusedTextColor = HeadingDark,
                            focusedLabelColor = PrimaryPurple,
                            unfocusedLabelColor = SecondaryTextDark
                        )
                    )

                    // Challenge 3
                    OutlinedTextField(
                        value = inputWord3,
                        onValueChange = { inputWord3 = it; errorMessage = null },
                        label = { Text("Word #${challengeIndices[2] + 1}") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrightAccentPurple,
                            unfocusedBorderColor = BorderDark,
                            focusedTextColor = HeadingDark,
                            unfocusedTextColor = HeadingDark,
                            focusedLabelColor = PrimaryPurple,
                            unfocusedLabelColor = SecondaryTextDark
                        )
                    )

                    if (errorMessage != null) {
                        Text(text = errorMessage ?: "", color = ErrorRed, fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            if (!allCorrect) {
                                errorMessage = "One or more words do not match your backup. Please verify."
                                return@Button
                            }
                            onVerificationSuccess()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        enabled = inputWord1.isNotBlank() && inputWord2.isNotBlank() && inputWord3.isNotBlank(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
                    ) {
                        Text("Confirm & Continue", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }
    }
}

