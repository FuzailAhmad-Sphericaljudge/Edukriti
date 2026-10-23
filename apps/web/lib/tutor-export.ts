import type { TutorResponse } from '@edukriti/contracts';

export type ExportableMessage = {
  role: 'user' | 'assistant';
  content: string;
  response?: TutorResponse;
};

/**
 * Formats a tutor exchange history as structured Markdown for student study notes.
 */
export function exportConversationAsMarkdown(
  messages: ExportableMessage[],
  topic = 'General Study',
): string {
  const date = new Date().toISOString().split('T')[0];
  const header = `# Ask Aarohi Study Session Notes\n\n- **Topic:** ${topic}\n- **Date:** ${date}\n- **Companion:** Edukriti AI Study Teacher\n\n---\n\n`;

  if (messages.length === 0) {
    return `${header}*No questions recorded in this session.*`;
  }

  const body = messages
    .map((msg, index) => {
      if (msg.role === 'user') {
        const doubtNum = Math.floor(index / 2) + 1;
        return `### 🙋 Doubt #${doubtNum}\n\n${msg.content}\n`;
      }

      const mathNote = msg.response?.mathVerification?.notes
        ? `\n> 🔢 **Verified Calculation:** ${msg.response.mathVerification.notes}\n`
        : '';

      const citationsSection =
        msg.response?.citations && msg.response.citations.length > 0
          ? `\n#### 📚 Grounded References\n${msg.response.citations
              .map(
                (c, i) =>
                  `${i + 1}. **${c.title || c.source}** (Page ${c.page || 'N/A'})\n   > *"${c.excerpt}"*`,
              )
              .join('\n')}\n`
          : '';

      return `### 👩‍🏫 Aarohi Explanation\n\n${msg.content}\n${mathNote}${citationsSection}\n---\n`;
    })
    .join('\n');

  return `${header}${body}`.trim();
}
