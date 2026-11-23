# SOP-IT-005: Corporate Exchange and Outlook Client Recovery

## Purpose
Standard Operating Procedure for diagnosing and restoring Microsoft Outlook desktop client synchronization failures, corrupted local OST data caches, and Exchange Online connection drops.

## Scope
Applies to all enterprise endpoints running Microsoft 365 Apps for Enterprise or Outlook desktop clients.

## Procedure

### 1. Service Connectivity Verification
- Inspect the Outlook status bar at bottom right: verify if status indicates 'Connected to Microsoft Exchange' or 'Disconnected'.
- Verify corporate mailbox health by navigating to the webmail interface at https://outlook.office.com.

### 2. Safe Mode and Add-In Isolation
- Execute Outlook in Safe Mode to isolate third-party COM add-in interference:
  outlook.exe /safe
- If Outlook functions normally in Safe Mode, navigate to File -> Options -> Add-ins -> COM Add-ins and disable third-party security or indexing plugins.

### 3. Credential Cache Purge
- Terminate Outlook and all Microsoft 365 background processes.
- Open Windows Credential Manager -> Windows Credentials.
- Under Generic Credentials, locate and delete all entries prefixed with 'MicrosoftOffice16' or 'MS.Outlook'.
- Launch Outlook and authenticate through corporate Single Sign-On (SSO).

### 4. Local OST File Rebuild
- Navigate to File -> Account Settings -> Account Settings -> Data Files tab.
- Note the path of the .ost file, close Outlook, and append '.bak' to the file name.
- Start Outlook to initiate automatic server mailbox resynchronization.
