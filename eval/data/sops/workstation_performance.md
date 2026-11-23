# SOP-IT-007: Workstation Performance and OS Diagnostics

## Purpose
Standard Operating Procedure for triaging workstation freezing, unresponsiveness, 100% CPU utilization spikes, memory leaks, and disk thrashing on enterprise managed endpoints.

## Scope
Applies to all corporate Windows and macOS workstations deployed to engineering, operational, and administrative staff.

## Procedure

### 1. Process and Resource Triage
- Launch Windows Task Manager via Ctrl + Shift + Esc.
- Sort processes by CPU, Memory, and Disk columns to identify rogue consumer tasks.
- If corporate endpoint security agents (e.g. Defender, EDR) are executing scheduled scans, verify if scan completion resolves utilization.
- If memory usage exceeds 90%, restart memory-intensive container engines or developer environments.

### 2. Operating System Integrity and Cache Purge
- Open PowerShell with administrator elevation.
- Clean temporary user directories:
  Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
- Execute System File Checker to repair damaged system DLLs:
  sfc /scannow
- Execute DISM system health restoration:
  DISM.exe /Online /Cleanup-image /Restorehealth

### 3. Thermal Throttling and Storage Constraints
- Verify that the primary OS volume has at least 15% unallocated storage for virtual memory paging files.
- Inspect laptop air intake vents and verify workstation fans are operational to prevent hardware CPU thermal throttling.
