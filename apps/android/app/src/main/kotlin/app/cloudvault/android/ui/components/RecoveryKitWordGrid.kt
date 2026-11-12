package app.cloudvault.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cloudvault.android.ui.theme.BorderDark
import app.cloudvault.android.ui.theme.ElevatedDark
import app.cloudvault.android.ui.theme.HeadingDark
import app.cloudvault.android.ui.theme.SecondaryTextDark

@Composable
fun RecoveryKitWordGrid(
    words: List<String>,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        val rows = (words.size + 1) / 2
        for (r in 0 until rows) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Word 1
                val idx1 = r
                if (idx1 < words.size) {
                    WordPill(
                        index = idx1 + 1,
                        word = words[idx1],
                        modifier = Modifier.weight(1f)
                    )
                }
                // Word 2
                val idx2 = r + rows
                if (idx2 < words.size) {
                    WordPill(
                        index = idx2 + 1,
                        word = words[idx2],
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
fun WordPill(
    index: Int,
    word: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(ElevatedDark)
            .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "${index.toString().padStart(2, '0')}.",
            color = SecondaryTextDark,
            fontSize = 12.sp,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.width(28.dp)
        )
        Text(
            text = word,
            color = HeadingDark,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

