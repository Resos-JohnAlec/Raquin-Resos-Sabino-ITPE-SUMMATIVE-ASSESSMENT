# SOP-IT-004: Enterprise Wi-Fi and 802.1x Network Troubleshooting

## Purpose
Standard Operating Procedure for diagnosing and resolving wireless connectivity failures, 802.1x RADIUS authentication issues, and DHCP IP lease conflicts on enterprise wireless infrastructure.

## Scope
Applies to all managed enterprise laptops and mobile devices connecting to corporate wireless access points.

## Procedure

### 1. Corporate SSID and Authentication Standard
- Connect exclusively to the enterprise SSID 'Enterprise-Secure'.
- Security protocol: WPA3-Enterprise or WPA2-Enterprise with 802.1x PEAP-MSCHAPv2.
- Authentication credentials: Use full corporate identity (user@aihas.local) and current domain password.
- Do not use guest or visitor wireless networks for corporate workstation operations.

### 2. Network Stack and IP Lease Renewal
- Open PowerShell with administrator privileges.
- Execute DHCP release and renewal commands:
  ipconfig /release
  ipconfig /renew
- If IP address begins with 169.254.x.x, an APIFA self-assigned failure has occurred. Reset the TCP/IP stack:
  netsh winsock reset
  netsh int ip reset
- Reboot the workstation after resetting the network stack.

### 3. Profile Re-registration and RADIUS Trust
- Navigate to Windows Settings -> Network & Internet -> Wi-Fi -> Manage known networks.
- Select 'Enterprise-Secure' and click 'Forget'.
- Scan for networks and reconnect to force acceptance of renewed enterprise root CA certificates.
