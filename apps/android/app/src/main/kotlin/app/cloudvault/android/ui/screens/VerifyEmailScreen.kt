package app.cloudvault.android.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MarkEmailRead
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.AuthRepository
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.components.VerificationCodeInput
import app.cloudvault.android.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun VerifyEmailScreen(
    authRepository: AuthRepository,
    onVerificationComplete: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val user = authRepository.currentUser.collectAsState().value

    var code by remember { mutableStateOf("") }
    var secondsLeft by remember { mutableStateOf(299) } // 5 minutes
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        while (secondsLeft > 0) {
            delay(1000)
            secondsLeft--
        }
    }

    val minutes = secondsLeft / 60
    val seconds = secondsLeft % 60
    val timeFormatted = String.format("%02d:%02d", minutes, seconds)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(VoidDark)
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Visual matching 8.12.21.jpeg
            CosmicCard(
                modifier = Modifier.size(100.dp),
                backgroundColor = ElevatedDark
            ) {
                Icon(
                    imageVector = Icons.Default.MarkEmailRead,
                    contentDescription = null,
                    tint = PrimaryPurple,
                    modifier = Modifier
                        .size(54.dp)
                        .align(Alignment.Center)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Verify your email",
                color = HeadingDark,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "We've sent a 6-digit verification code to\n${user?.email ?: "your registered email"}",
                color = SecondaryTextDark,
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 6-digit code boxes
            VerificationCodeInput(
                code = code,
                onCodeChange = {
                    code = it
                    errorMessage = null
                },
                modifier = Modifier.padding(horizontal = 12.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Countdown timer
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Timer, contentDescription = null, tint = SecondaryTextDark, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Code expires in $timeFormatted",
                    color = SecondaryTextDark,
                    fontSize = 12.sp
                )
            }

            if (errorMessage != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = errorMessage ?: "", color = ErrorRed, fontSize = 12.sp)
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Verify Code Button
            Button(
                onClick = {
                    if (code.length != 6) {
                        errorMessage = "Please enter the full 6-digit code"
                        return@Button
                    }
                    isLoading = true
                    coroutineScope.launch {
                        authRepository.verifyEmail(code)
                            .onSuccess {
                                isLoading = false
                                onVerificationComplete()
                            }
                            .onFailure {
                                isLoading = false
                                errorMessage = it.message ?: "Verification failed"
                            }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = code.length == 6 && !isLoading,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Text("Verify Code", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Resend link
            TextButton(
                onClick = {
                    val emailStr = user?.email
                    if (emailStr != null) {
                        coroutineScope.launch {
                            authRepository.resendVerification(emailStr)
                            Toast.makeText(context, "New verification code sent", Toast.LENGTH_SHORT).show()
                            secondsLeft = 299
                        }
                    }
                }
            ) {
                Text("Didn't receive the code? Resend code", color = LinkPurple, fontSize = 13.sp)
            }
        }
    }
}

