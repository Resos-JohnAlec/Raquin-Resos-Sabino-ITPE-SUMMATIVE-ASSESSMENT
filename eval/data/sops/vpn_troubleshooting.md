# SOP-IT-001: Enterprise VPN Troubleshooting Guide

## Purpose
Standard Operating Procedure for diagnosing and resolving Virtual Private Network (VPN) connection failures for remote workforce employees.

## Scope
Applies to all enterprise endpoints connecting through corporate VPN gateways (GlobalProtect and OpenVPN).

## Common Connection Failure Modes

### 1. Error: "Gateway Not Reachable" or "Network Timeout"
- Cause: Local ISP DNS failure, corporate firewall block, or captive Wi-Fi portal (airports, hotels).
- Resolution Steps:
  1. Verify active public internet connection by navigating to a public web page.
  2. If using public Wi-Fi, accept terms of service on the network captive portal page.
  3. Flush local DNS cache:
     - Windows: Open PowerShell as administrator and run: `ipconfig /flushdns`
     - macOS: Open Terminal and run: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
  4. Ensure VPN client server endpoint is configured to `vpn.enterprise-corp.com:443`.
  5. Restart the VPN client service.

### 2. Error: "Authentication Failed" or "MFA Token Invalid"
- Cause: Expired domain credentials, Active Directory account lockout, or MFA authenticator clock drift.
- Resolution Steps:
  1. Confirm your corporate password has not expired via the Self-Service Password Portal.
  2. If your account is locked after 5 invalid attempts, wait for the 30-minute lockout cooldown or request an administrative reset.
  3. Re-synchronize your Google Authenticator or Microsoft Authenticator time clock in Authenticator settings -> Time correction for codes -> Sync now.
  4. Enter the freshly generated 6-digit one-time passcode.

### 3. Error: "Split-Tunneling / Internal Route Failure"
- Symptoms: VPN connects successfully, but internal intranet URLs or SSH servers (10.x.x.x / 172.16.x.x) cannot be resolved.
- Resolution Steps:
  1. Disconnect and re-connect the VPN session to pull updated routing tables.
  2. Check if local subnet conflicts with corporate subnets (e.g., local home router using `192.168.1.0/24`).
  3. Contact IT Helpdesk to add route exceptions if using cellular hotspot tethering.
