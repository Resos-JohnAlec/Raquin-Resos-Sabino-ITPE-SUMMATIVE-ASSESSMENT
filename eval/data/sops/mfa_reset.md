# SOP-IT-006: Multi-Factor Authentication (MFA) & TAP Policy

## Purpose
Standard Operating Procedure for resolving Multi-Factor Authentication (MFA) lockout, authenticator device replacement, and Temporary Access Pass (TAP) provisioning under enterprise Zero Trust security.

## Scope
Applies to all enterprise users requiring multi-factor authentication for identity verification and corporate resource access.

## Procedure

### 1. Identity Verification Requirements
- Under enterprise security guidelines, an MFA reset request must be accompanied by secondary identity verification to mitigate SIM-swap and credential stuffing risks.
- Handlers verify employee badge number, manager confirmation, or active corporate device fingerprint.

### 2. Temporary Access Pass (TAP) Provisioning
- When a user loses their authenticator hardware or switches mobile phones:
  1. An authorized IT handler issues a time-limited 8-hour Temporary Access Pass (TAP).
  2. The employee accesses https://mysignins.microsoft.com/security-info using the issued TAP.
  3. The employee removes the previous stale device entry.
  4. The employee registers the new authenticator application via QR code scanning.

### 3. Time Clock Synchronization
- If 6-digit TOTP passcodes fail validation, time drift between mobile device and domain servers is the primary root cause.
- On Android: Open Authenticator Settings -> Time correction for codes -> Sync now.
- On iOS: Open Settings -> General -> Date & Time -> Ensure 'Set Automatically' is toggled on.
