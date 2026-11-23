# SOP-IT-008: External Displays and Peripheral Docking Standards

## Purpose
Standard Operating Procedure for resolving display output failures, external monitor non-detection, USB-C/Thunderbolt docking power cycle issues, and display driver crashes.

## Scope
Applies to all enterprise workstations configured with external dual-monitor setups and USB-C / Thunderbolt docking stations.

## Procedure

### 1. Rapid Graphics Subsystem Restart
- Press the keyboard combination Win + Ctrl + Shift + B.
- The workstation display will flash briefly and produce a diagnostic chime as the display driver restarts.

### 2. Docking Station Power Drain Cycle
- Disconnect the USB-C / Thunderbolt host cable from the workstation.
- Disconnect the dock AC power adapter from the electrical outlet.
- Maintain disconnected state for 15 seconds to discharge internal dock capacitors.
- Reconnect AC power to the docking station first, verify dock power LED, then reconnect USB-C cable to the workstation Thunderbolt port.

### 3. Display Configuration and Bandwidth Verification
- Press Win + P to confirm multi-display mode is set to 'Extend'.
- Open Settings -> System -> Display -> Multiple Displays -> click 'Detect'.
- For high-resolution 4K dual display configurations, ensure refresh rates are set to 60Hz or 30Hz in Advanced display settings if cable bandwidth capacity is saturated.
