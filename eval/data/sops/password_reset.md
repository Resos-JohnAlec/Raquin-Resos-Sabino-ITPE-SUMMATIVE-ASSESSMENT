# SOP-IT-002: Active Directory Password Reset Policy and Procedures

## Purpose
Procedures for managing, resetting, and unlocking enterprise Active Directory (AD) user accounts.

## Scope
Applies to all corporate domain accounts across workstations, email, VPN, and internal enterprise applications.

## Password Requirements
- Minimum length: 14 characters.
- Complexity: Must contain at least three of the following: uppercase letter, lowercase letter, numeric digit, special character (!@#$%^&*).
- History: Cannot reuse the last 10 passwords.
- Expiration: Password expires every 90 days. Users receive notification banners starting 14 days prior.

## Account Lockout Policy
- Lockout threshold: 5 consecutive invalid authentication attempts within 15 minutes.
- Lockout duration: 30 minutes automatic lockout cooldown, after which the account unlocks automatically.
- Emergency unlock: May be executed immediately by Level-1 IT Helpdesk or automated self-service bot upon identity confirmation.

## Self-Service Password Reset (SSPR) Flow
1. User requests a password reset via the AI Helpdesk Assistant chat portal.
2. The AI assistant verifies the user identity against the active session.
3. The AI assistant asks the user to explicitly confirm the password reset action.
4. Upon user confirmation, the system triggers the Active Directory directory reset workflow.
5. A temporary, one-time password (OTP) is provisioned and delivered to the user registered alternative phone or emergency contact email.
6. The user must change the temporary password on first logon.
