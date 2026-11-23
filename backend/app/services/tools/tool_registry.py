from typing import List, Dict, Any

TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "propose_password_reset",
            "description": "Propose an Active Directory domain password reset for the current authenticated user. This requires explicit confirmation by the user before execution.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "Brief explanation why password reset is requested"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_support_ticket",
            "description": "Log an IT support ticket and escalate the issue to human handlers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Clear summary of the issue"
                    },
                    "description": {
                        "type": "string",
                        "description": "Detailed explanation of the technical problem and troubleshooting steps taken"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": "Severity level"
                    }
                },
                "required": ["title", "description"]
            }
        }
    }
]
