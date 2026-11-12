package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.data.repository.AuthRepository
import app.cloudvault.android.ui.components.BrandSquircle
import app.cloudvault.android.ui.components.CosmicCard
import app.cloudvault.android.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    authRepository: AuthRepository,
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit,
    onForgotPasswordClick: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var enableBiometrics by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

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
            BrandSquircle(size = 72.dp)

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Log in to your account",
                color = HeadingDark,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Unlock your zero-knowledge encrypted vault",
                color = SecondaryTextDark,
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            CosmicCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Email
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it; errorMessage = null },
                        label = { Text("Email Address") },
                        leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = PrimaryPurple) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrightAccentPurple,
                            unfocusedBorderColor = BorderDark,
                            focusedTextColor = HeadingDark,
                            unfocusedTextColor = HeadingDark,
                            focusedLabelColor = PrimaryPurple,
                            unfocusedLabelColor = SecondaryTextDark
                        )
                    )

                    // Password
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it; errorMessage = null },
                        label = { Text("Master Password") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryPurple) },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = null,
                                    tint = SecondaryTextDark
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
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

                    // Quick Unlock Toggle
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Checkbox(
                            checked = enableBiometrics,
                            onCheckedChange = { enableBiometrics = it },
                            colors = CheckboxDefaults.colors(checkedColor = BrightAccentPurple)
                        )
                        Icon(Icons.Default.Fingerprint, contentDescription = null, tint = PrimaryPurple, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Enable Biometric / Quick Unlock", color = SecondaryTextDark, fontSize = 12.sp)
                    }

                    if (errorMessage != null) {
                        Text(
                            text = errorMessage ?: "",
                            color = ErrorRed,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                    }

                    // Login Button
                    Button(
                        onClick = {
                            if (email.isBlank() || password.isBlank()) {
                                errorMessage = "Please enter both email and password"
                                return@Button
                            }
                            isLoading = true
                            errorMessage = null
                            coroutineScope.launch {
                                authRepository.login(email.trim(), password, enableBiometrics)
                                    .onSuccess {
                                        isLoading = false
                                        onLoginSuccess()
                                    }
                                    .onFailure {
                                        isLoading = false
                                        errorMessage = it.message ?: "Authentication failed"
                                    }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        enabled = !isLoading,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Deriving Keys & Unlocking...", color = Color.White)
                        } else {
                            Text("Log In", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }

                    // Forgot Password
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        TextButton(onClick = onForgotPasswordClick) {
                            Text("Forgot your password?", color = LinkPurple, fontSize = 13.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Don't have an account?", color = SecondaryTextDark, fontSize = 13.sp)
                TextButton(onClick = onNavigateToRegister) {
                    Text("Create an account", color = LinkPurple, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                }
            }
        }
    }
}

