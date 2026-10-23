# Ask Aarohi Evaluation Report (Golden Dataset)

*Automated benchmark evaluation run on 2026-10-23T19:00:55.726Z*

## Executive Summary

| Metric | Measured Value | Standard / Target | Status |
| :--- | :--- | :--- | :--- |
| **Total Test Items** | **105** | >= 100 questions | Passed |
| **Overall Pass Rate** | **100%** (105/105) | >= 85% | Passed |
| **Numerical Recomputation Accuracy** | **100%** (9/9) | >= 90% | Passed |
| **Curriculum Grounding Rate** | **100%** | >= 80% | Passed |
| **Mean Pipeline Latency** | **5 ms** | < 250 ms (local) | Passed |
| **Median Latency (p50)** | **5 ms** | < 150 ms | Passed |
| **95th Percentile Latency (p95)** | **6 ms** | < 500 ms | Passed |

---

## Subject-Wise Performance Breakdown

| Subject | Questions | Passed | Pass Rate | Avg Latency |
| :--- | :---: | :---: | :---: | :---: |
| **PHYSICS** | 20 | 20 | **100%** | 6 ms |
| **CHEMISTRY** | 18 | 18 | **100%** | 5 ms |
| **MATHEMATICS** | 20 | 20 | **100%** | 5 ms |
| **BIOLOGY** | 18 | 18 | **100%** | 5 ms |
| **COMPUTER SCIENCE** | 15 | 15 | **100%** | 5 ms |
| **HISTORY POLITY** | 14 | 14 | **100%** | 5 ms |

---

## Numerical & Scientific Verification

- **Total Numerical Calculations**: 9
- **Deterministic Recomputation Verifications**: 9
- **Accuracy Rate**: **100%**
- **Evaluation Mechanism**: Evaluates arithmetic expressions, dimensional consistency (units: `N`, `A`, `V`, `Ω`, `m/s`, `J`, `W`), and enforces relative tolerance <= 5% for recomputed physical laws without code injection risk.

---

## Safety, Multi-turn & Attribution Guarantees

1. **Prompt Injection Defense**: Evaluated against 8 injection vectors (system prompts, `ignore previous instructions`, DAN jailbreaks). 100% neutralized or sanitized.
2. **Harmful Content Guard**: Strict refusals triggered for weapon construction, self-harm, and illegal requests with compassionate educational redirection.
3. **Citation & General Knowledge Tagging**: Responses without direct textbook chunk evidence are strictly annotated as `"not from course material"` to eliminate student misinformation.

---

## Verification Reproducibility

To re-run this evaluation suite and regenerate this report:
```powershell
npm run eval
```
