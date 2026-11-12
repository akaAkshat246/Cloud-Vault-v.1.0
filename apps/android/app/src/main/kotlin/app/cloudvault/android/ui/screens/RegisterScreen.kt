package app.cloudvault.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.RadioButtonUnchecked
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
fun RegisterScreen(
    authRepository: AuthRepository,
    onRegisterSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var agreedToTerms by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val hasMinLength = password.length >= 8
    val hasUppercase = password.any { it.isUpperCase() }
    val hasNumber = password.any { it.isDigit() }
    val isFormValid = hasMinLength && hasUppercase && hasNumber && password == confirmPassword && email.isNotBlank() && agreedToTerms

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
            BrandSquircle(size = 64.dp)

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Create your account",
                color = HeadingDark,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Sign up to get started with CloudVault",
                color = SecondaryTextDark,
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(20.dp))

            CosmicCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    // Full Name
                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        label = { Text("Full Name") },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = PrimaryPurple) },
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
                        label = { Text("Password") },
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

                    // Confirm Password
                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it; errorMessage = null },
                        label = { Text("Confirm Password") },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryPurple) },
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

                    // Password Requirement Checklist from 8.12.20.jpeg
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Password must contain:", color = SecondaryTextDark, fontSize = 12.sp)
                        PasswordRuleItem(text = "At least 8 characters", isMet = hasMinLength)
                        PasswordRuleItem(text = "One uppercase letter", isMet = hasUppercase)
                        PasswordRuleItem(text = "One number", isMet = hasNumber)
                    }

                    // Terms Checkbox
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Checkbox(
                            checked = agreedToTerms,
                            onCheckedChange = { agreedToTerms = it },
                            colors = CheckboxDefaults.colors(checkedColor = BrightAccentPurple)
                        )
                        Text(
                            text = "I agree to the Terms of Service and Privacy Policy",
                            color = SecondaryTextDark,
                            fontSize = 12.sp
                        )
                    }

                    if (errorMessage != null) {
                        Text(text = errorMessage ?: "", color = ErrorRed, fontSize = 12.sp)
                    }

                    // Sign Up Button
                    Button(
                        onClick = {
                            if (!isFormValid) {
                                errorMessage = "Please fulfill all password requirements and accept terms."
                                return@Button
                            }
                            isLoading = true
                            errorMessage = null
                            coroutineScope.launch {
                                authRepository.register(email.trim(), password)
                                    .onSuccess {
                                        isLoading = false
                                        onRegisterSuccess()
                                    }
                                    .onFailure {
                                        isLoading = false
                                        errorMessage = it.message ?: "Registration failed"
                                    }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        enabled = isFormValid && !isLoading,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BrightAccentPurple)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Generating Master Keys...", color = Color.White)
                        } else {
                            Text("Sign Up", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Already have an account?", color = SecondaryTextDark, fontSize = 13.sp)
                TextButton(onClick = onNavigateToLogin) {
                    Text("Log in", color = LinkPurple, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
fun PasswordRuleItem(text: String, isMet: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = if (isMet) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (isMet) SuccessGreen else SecondaryTextDark,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = text,
            color = if (isMet) HeadingDark else SecondaryTextDark,
            fontSize = 12.sp
        )
    }
}

