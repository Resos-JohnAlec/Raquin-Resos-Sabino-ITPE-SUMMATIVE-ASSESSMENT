import re
from typing import Tuple, Optional

INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)",
    r"(?i)system\s+override",
    r"(?i)jailbreak",
    r"(?i)you\s+are\s+now\s+(DAN|unfiltered|god\s+mode|developer\s+mode)",
    r"(?i)disregard\s+all\s+safety",
    r"(?i)pretend\s+(you\s+have\s+no\s+rules|you\s+are\s+not\s+an\s+ai)",
    r"(?i)reveal\s+(your\s+system\s+prompt|system\s+instructions|hidden\s+rules)",
    r"(?i)bypass\s+security\s+controls",
    r"(?i)act\s+as\s+root",
]


def check_prompt_injection(text: str) -> Tuple[bool, Optional[str]]:
    for pattern in INJECTION_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return True, f"Prompt injection pattern detected: {match.group(0)}"
    return False, None
