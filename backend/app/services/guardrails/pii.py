import re
from typing import Tuple, List, Dict, Any


EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_PATTERN = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
CREDIT_CARD_PATTERN = re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b')
SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
IP_PATTERN = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')


def redact_pii(text: str) -> Tuple[str, List[Dict[str, Any]]]:
    redacted = text
    entities_found: List[Dict[str, Any]] = []

    def replace_email(match):
        val = match.group(0)
        entities_found.append({"type": "EMAIL_ADDRESS", "value": val})
        return "<EMAIL_REDACTED>"

    def replace_phone(match):
        val = match.group(0)
        entities_found.append({"type": "PHONE_NUMBER", "value": val})
        return "<PHONE_REDACTED>"

    def replace_card(match):
        val = match.group(0)
        entities_found.append({"type": "CREDIT_CARD", "value": val})
        return "<CREDIT_CARD_REDACTED>"

    def replace_ssn(match):
        val = match.group(0)
        entities_found.append({"type": "US_SSN", "value": val})
        return "<SSN_REDACTED>"

    def replace_ip(match):
        val = match.group(0)
        entities_found.append({"type": "IP_ADDRESS", "value": val})
        return "<IP_REDACTED>"

    redacted = EMAIL_PATTERN.sub(replace_email, redacted)
    redacted = PHONE_PATTERN.sub(replace_phone, redacted)
    redacted = CREDIT_CARD_PATTERN.sub(replace_card, redacted)
    redacted = SSN_PATTERN.sub(replace_ssn, redacted)
    redacted = IP_PATTERN.sub(replace_ip, redacted)

    return redacted, entities_found
