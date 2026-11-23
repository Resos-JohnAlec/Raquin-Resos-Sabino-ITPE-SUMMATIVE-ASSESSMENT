export interface MockUser {
  id: string;
  email: string;
  role: "user" | "handler" | "admin";
  is_active: boolean;
  created_at: string;
}

export interface MockTicket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  escalation_reason?: string;
  requester_id: string;
  assigned_handler_id?: string;
  conversation_id?: string;
  created_at: string;
  transcript: Array<{ sender: string; text: string; created_at: string }>;
  suggested_reply: string;
}

export interface MockKBDoc {
  id: string;
  title: string;
  file_path?: string;
  status: "indexed" | "pending" | "failed";
  metadata_json?: any;
}

const defaultUsers: MockUser[] = [
  {
    id: "a1111111-1111-4111-8111-111111111111",
    email: "admin@aihas.local",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "b2222222-2222-4222-8222-222222222222",
    email: "handler@aihas.local",
    role: "handler",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c3333333-3333-4333-8333-333333333333",
    email: "user@aihas.local",
    role: "user",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const defaultTickets: MockTicket[] = [
  {
    id: "t1010101-1010-4010-8010-101010101010",
    title: "GlobalProtect VPN Gateway Timeout",
    description: "User unable to reach vpn.enterprise-corp.com after IP renewal.",
    status: "open",
    priority: "high",
    escalation_reason: "Automated RAG confidence score below threshold",
    requester_id: "user@aihas.local",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    transcript: [
      {
        sender: "user",
        text: "My VPN gives error 'Gateway Not Reachable' and my home IP is <IP_REDACTED>",
        created_at: "10:15 AM",
      },
      {
        sender: "assistant",
        text: "Please follow SOP-IT-001 to flush DNS cache with ipconfig /flushdns.",
        created_at: "10:16 AM",
      },
      {
        sender: "user",
        text: "I did that and it still times out. Need IT helpdesk support.",
        created_at: "10:18 AM",
      },
    ],
    suggested_reply:
      "Hello, I have reviewed your VPN diagnostic logs. Please verify if your local router firewall allows outbound UDP port 4500 and TCP port 443.",
  },
  {
    id: "t2020202-2020-4020-8020-202020202020",
    title: "Docker Desktop Pro License Request",
    description: "Engineering workstation access request for local container development.",
    status: "resolved",
    priority: "medium",
    escalation_reason: "Tier 2 software manager approval required",
    requester_id: "user@aihas.local",
    assigned_handler_id: "b2222222-2222-4222-8222-222222222222",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    transcript: [
      {
        sender: "user",
        text: "I need Docker Desktop Pro for our project build sprint.",
        created_at: "08:30 AM",
      },
    ],
    suggested_reply:
      "Your engineering manager has approved your Tier 2 license. The license key has been bound to your corporate account.",
  },
];

const defaultKBDocs: MockKBDoc[] = [
  {
    id: "d1111111-1111-4111-8111-111111111111",
    title: "SOP-IT-001: Enterprise VPN Troubleshooting Guide",
    file_path: "eval/data/sops/vpn_troubleshooting.md",
    status: "indexed",
    metadata_json: { chunks_count: 3, vector_dim: 1536 },
  },
  {
    id: "d2222222-2222-4222-8222-222222222222",
    title: "SOP-IT-002: Active Directory Password Reset Policy",
    file_path: "eval/data/sops/password_reset.md",
    status: "indexed",
    metadata_json: { chunks_count: 2, vector_dim: 1536 },
  },
  {
    id: "d3333333-3333-4333-8333-333333333333",
    title: "SOP-IT-003: Software Licensing and Access Request Standard",
    file_path: "eval/data/sops/software_access.md",
    status: "indexed",
    metadata_json: { chunks_count: 3, vector_dim: 1536 },
  },
  {
    id: "d4444444-4444-4444-8444-444444444444",
    title: "SOP-IT-004: Enterprise Wi-Fi and 802.1x Network Troubleshooting",
    file_path: "eval/data/sops/wifi_troubleshooting.md",
    status: "indexed",
    metadata_json: { chunks_count: 3, vector_dim: 1536 },
  },
  {
    id: "d5555555-5555-4555-8555-555555555555",
    title: "SOP-IT-005: Corporate Exchange and Outlook Client Recovery",
    file_path: "eval/data/sops/email_sync.md",
    status: "indexed",
    metadata_json: { chunks_count: 3, vector_dim: 1536 },
  },
  {
    id: "d6666666-6666-4666-8666-666666666666",
    title: "SOP-IT-006: Multi-Factor Authentication (MFA) & TAP Policy",
    file_path: "eval/data/sops/mfa_reset.md",
    status: "indexed",
    metadata_json: { chunks_count: 3, vector_dim: 1536 },
  },
  {
    id: "d7777777-7777-4777-8777-777777777777",
    title: "SOP-IT-007: Workstation Performance and OS Diagnostics",
    file_path: "eval/data/sops/workstation_performance.md",
    status: "indexed",
    metadata_json: { chunks_count: 3, vector_dim: 1536 },
  },
  {
    id: "d8888888-8888-4888-8888-888888888888",
    title: "SOP-IT-008: External Displays and Peripheral Docking Standards",
    file_path: "eval/data/sops/display_dock.md",
    status: "indexed",
    metadata_json: { chunks_count: 3, vector_dim: 1536 },
  },
  {
    id: "d9999999-9999-4999-8999-999999999999",
    title: "SOP-IT-009: Phishing and Information Security Incident Response",
    file_path: "eval/data/sops/phishing_response.md",
    status: "indexed",
    metadata_json: { chunks_count: 3, vector_dim: 1536 },
  },
];

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

let auditLogCounter = 1;

export function handleMockRequest(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  if (endpoint === "/api/v1/health") {
    return {
      status: "healthy",
      project: "AI-HAS",
      environment: "standalone-client-mode",
      database: "embedded-simulation-active",
    };
  }

  if (endpoint === "/api/v1/auth/login" && method === "POST") {
    const email = body.email || "";
    const users = getStorage<MockUser[]>("aihas_mock_users", defaultUsers);
    let matchedUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!matchedUser) {
      let role: "user" | "handler" | "admin" = "user";
      if (email.includes("admin")) role = "admin";
      else if (email.includes("handler")) role = "handler";
      matchedUser = {
        id: "usr-" + Math.random().toString(36).substring(2, 9),
        email,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      users.push(matchedUser);
      setStorage("aihas_mock_users", users);
    }

    return {
      access_token: "mock-jwt-token-" + matchedUser.role + "-" + Date.now(),
      token_type: "bearer",
      user: matchedUser,
    };
  }

  if (endpoint === "/api/v1/chat/conversations" && method === "GET") {
    return getStorage("aihas_mock_conversations", [
      {
        id: "conv-10101010",
        title: "IT Helpdesk Session",
        created_at: new Date().toISOString(),
      },
    ]);
  }

  if (endpoint === "/api/v1/chat/conversations" && method === "POST") {
    const convs = getStorage("aihas_mock_conversations", [
      {
        id: "conv-10101010",
        title: "IT Helpdesk Session",
        created_at: new Date().toISOString(),
      },
    ]);
    const newConv = {
      id: "conv-" + Math.random().toString(36).substring(2, 10),
      title: body.title || "IT Helpdesk Session",
      created_at: new Date().toISOString(),
    };
    convs.unshift(newConv);
    setStorage("aihas_mock_conversations", convs);

    const allMessages = getStorage<Record<string, any[]>>("aihas_mock_messages", {});
    allMessages[newConv.id] = [];
    setStorage("aihas_mock_messages", allMessages);
    return newConv;
  }

  if (endpoint.startsWith("/api/v1/chat/conversations/") && method === "DELETE") {
    const parts = endpoint.split("/");
    const convId = parts[parts.length - 1];

    let convs = getStorage<Array<{ id: string; title: string; created_at: string }>>(
      "aihas_mock_conversations",
      []
    );
    convs = convs.filter((c) => c.id !== convId);
    setStorage("aihas_mock_conversations", convs);

    const allMessages = getStorage<Record<string, any[]>>("aihas_mock_messages", {});
    delete allMessages[convId];
    setStorage("aihas_mock_messages", allMessages);

    const escalations = getStorage<Record<string, string>>("aihas_mock_escalations", {});
    delete escalations[convId];
    setStorage("aihas_mock_escalations", escalations);

    const resolvedSessions = getStorage<Record<string, boolean>>(
      "aihas_mock_resolved_sessions",
      {}
    );
    delete resolvedSessions[convId];
    setStorage("aihas_mock_resolved_sessions", resolvedSessions);

    return { status: "deleted", conversation_id: convId };
  }

  if (endpoint === "/api/v1/chat/switch-to-ai" && method === "POST") {
    const convId = body.conversation_id;
    const escalations = getStorage<Record<string, string>>("aihas_mock_escalations", {});
    delete escalations[convId];
    setStorage("aihas_mock_escalations", escalations);

    const allMessages = getStorage<Record<string, any[]>>("aihas_mock_messages", {});
    if (!allMessages[convId]) allMessages[convId] = [];

    const switchNotice = {
      id: "msg-" + Date.now(),
      sender_type: "assistant" as const,
      content:
        "Session returned to AI Assistant mode. You can now consult standard operating procedures, request password resets, or ask IT support questions.",
      created_at: new Date().toISOString(),
    };
    allMessages[convId].push(switchNotice);
    setStorage("aihas_mock_messages", allMessages);

    return {
      status: "switched_to_ai",
      is_escalated: false,
      message: switchNotice.content,
    };
  }

  if (endpoint.startsWith("/api/v1/chat/conversations/") && endpoint.endsWith("/messages")) {
    const parts = endpoint.split("/");
    const convId = parts[parts.length - 2];
    const allMessages = getStorage<Record<string, any[]>>("aihas_mock_messages", {});
    return allMessages[convId] || [];
  }

  if (endpoint === "/api/v1/chat/message" && method === "POST") {
    const convId = body.conversation_id;
    const userText = body.content || "";

    const resolvedSessions = getStorage<Record<string, boolean>>(
      "aihas_mock_resolved_sessions",
      {}
    );
    if (resolvedSessions[convId]) {
      throw new Error(
        "This session has been resolved and closed by the IT Handler. You can no longer send messages in this session. Please start a new session."
      );
    }

    const allMessages = getStorage<Record<string, any[]>>("aihas_mock_messages", {});
    if (!allMessages[convId]) {
      allMessages[convId] = [];
    }

    const userEntry = {
      id: "msg-" + Date.now(),
      sender_type: "user" as const,
      content: userText,
      created_at: new Date().toISOString(),
    };
    allMessages[convId].push(userEntry);

    const escalations = getStorage<Record<string, string>>("aihas_mock_escalations", {});
    const activeTicketId = escalations[convId];

    if (activeTicketId) {
      const tickets = getStorage<MockTicket[]>("aihas_mock_tickets", defaultTickets);
      const targetTicket = tickets.find((t) => t.id === activeTicketId && t.status !== "resolved");

      if (targetTicket) {
        targetTicket.transcript.push({
          sender: "user",
          text: userText,
          created_at: new Date().toLocaleTimeString(),
        });
        setStorage("aihas_mock_tickets", tickets);

        const responseText = `Your message has been updated on Ticket #${activeTicketId} and forwarded directly to the active Handler Queue. An IT support specialist has been notified.`;
        const assistantEntry = {
          id: "msg-" + Date.now() + 1,
          sender_type: "assistant" as const,
          content: responseText,
          citations: [],
          action_card: null,
          created_at: new Date().toISOString(),
        };
        allMessages[convId].push(assistantEntry);
        setStorage("aihas_mock_messages", allMessages);

        return {
          role: "assistant",
          content: responseText,
          citations: [],
          action_card: null,
          escalation_available: false,
          is_escalated: true,
          ticket_id: activeTicketId,
        };
      }
    }

    const lower = userText.toLowerCase();
    let responseText = "";
    let citations: any[] = [];
    let actionCard = null;

    if (lower.includes("password") && (lower.includes("reset") || lower.includes("forgot"))) {
      responseText =
        "Based on SOP-IT-002 (Active Directory Password Reset Policy):\n\n" +
        "1. Identity & SSPR Protocol:\n" +
        "   Corporate accounts are protected under Self-Service Password Reset (SSPR) standards. Reset requests require affirmative user verification.\n\n" +
        "2. Domain Password Policy Requirements:\n" +
        "   - Minimum Length: 14 characters.\n" +
        "   - Complexity: Must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol (!@#$%^&*).\n" +
        "   - History: Cannot match any of your previous 5 passwords.\n" +
        "   - Account lockout automatically resets after 30 minutes or immediately via this action card.\n\n" +
        "3. Temporary Password Provisioning:\n" +
        "   Please confirm the action card below to provision a single-use 15-minute temporary password for your account.";
      actionCard = {
        type: "confirm_password_reset",
        tool_invocation_id: "tool-inv-" + Date.now(),
        title: "Active Directory Password Reset",
        description:
          "Target Account: Authenticated Session User. A temporary 15-minute OTP password will be generated upon confirmation.",
        requires_confirmation: true,
      };
      citations = [
        {
          title: "SOP-IT-002: Active Directory Password Reset Policy",
          doc_id: "d2222222",
          score: 0.98,
          chunk_index: 0,
          excerpt:
            "Self-Service Password Reset (SSPR) Flow requires the AI assistant to ask for explicit confirmation before directory reset action runs.",
        },
      ];
    } else if (lower.includes("vpn") || lower.includes("gateway") || lower.includes("timeout")) {
      responseText =
        "Based on SOP-IT-001 (Enterprise VPN Troubleshooting Guide):\n\n" +
        "1. Phase 1 - Local Network & DNS Verification:\n" +
        "   - Confirm your internet connection is active by browsing to a public site.\n" +
        "   - If on public or hotel Wi-Fi, accept terms on the network captive portal page.\n" +
        "   - Flush local DNS cache in PowerShell (Admin): ipconfig /flushdns\n\n" +
        "2. Phase 2 - Client Configuration & Service Restart:\n" +
        "   - Ensure VPN server endpoint is set to: vpn.enterprise-corp.com:443\n" +
        "   - Restart the corporate VPN client background service via PowerShell:\n" +
        "     Restart-Service -Name 'PanGPS' -Force\n\n" +
        "3. Phase 3 - Subnet Collisions & Route Verification:\n" +
        "   - Verify that your local home subnet (e.g., 192.168.1.0/24) does not conflict with corporate subnets (10.0.0.0/8).\n" +
        "   - Disconnect and reconnect to obtain an updated virtual routing table.\n\n" +
        "If timeout persists, click 'Talk to a Human' above to route your diagnostic logs to a Network Operations Handler.";
      citations = [
        {
          title: "SOP-IT-001: Enterprise VPN Troubleshooting Guide",
          doc_id: "d1111111",
          score: 0.96,
          chunk_index: 0,
          excerpt:
            "Flush local DNS cache with 'ipconfig /flushdns', verify captive portal on public Wi-Fi, and ensure server endpoint is vpn.enterprise-corp.com:443.",
        },
      ];
    } else if (lower.includes("docker") || lower.includes("license") || lower.includes("software") || lower.includes("jetbrains")) {
      responseText =
        "Based on SOP-IT-003 (Software Licensing Standard):\n\n" +
        "1. Software Catalog Classification:\n" +
        "   - Tier 1 (Pre-Approved Tools): VS Code, Google Chrome, Slack, Git, Node.js. Available for self-install via Company Portal.\n" +
        "   - Tier 2 (Developer Licenses): Docker Desktop Pro, JetBrains All Products, Postman Enterprise. Requires Direct Engineering Manager approval.\n" +
        "   - Tier 3 (Cloud & Infrastructure): AWS Console IAM, Production DB Admin. Requires Security Architecture Board sign-off.\n\n" +
        "2. Provisioning SLA & Workflow:\n" +
        "   - Standard provisioning SLA for Tier 2 software is 24 business hours from manager approval.\n" +
        "   - License seats are bound to your corporate email account automatically upon approval.\n\n" +
        "3. Action Steps:\n" +
        "   - Submit your software request through the Self-Service Portal with your manager's email in the CC field.\n" +
        "   - If urgent sprint work is blocked, escalate to human handlers for expedited review.";
      citations = [
        {
          title: "SOP-IT-003: Software Licensing Standard",
          doc_id: "d3333333",
          score: 0.95,
          chunk_index: 1,
          excerpt:
            "Tier 2 developer tools require direct engineering manager approval with a 24 business hour SLA.",
        },
      ];
    } else if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("802.1x") || lower.includes("network")) {
      responseText =
        "Based on SOP-IT-004 (Enterprise Wi-Fi and 802.1x Network Troubleshooting):\n\n" +
        "1. SSID & Authentication Standard:\n" +
        "   - Connect exclusively to the 'Enterprise-Secure' network. Do not use Guest Wi-Fi for internal corporate operations.\n" +
        "   - Authentication Protocol: WPA3/WPA2-Enterprise (802.1x PEAP-MSCHAPv2).\n" +
        "   - Log in using your primary corporate email (user@aihas.local) and domain password.\n\n" +
        "2. Network Stack & DHCP IP Renewal:\n" +
        "   - Open PowerShell as Administrator and run:\n" +
        "     ipconfig /release\n" +
        "     ipconfig /renew\n" +
        "   - If assigned a 169.254.x.x address, reset Winsock and IP stack:\n" +
        "     netsh winsock reset\n" +
        "     netsh int ip reset\n\n" +
        "3. Profile Re-registration:\n" +
        "   - Go to Settings -> Network & Internet -> Wi-Fi -> Manage known networks -> select 'Enterprise-Secure' and click 'Forget'.\n" +
        "   - Reconnect to download the latest enterprise root CA certificate.";
      citations = [
        {
          title: "SOP-IT-004: Enterprise Wi-Fi and 802.1x Network Troubleshooting",
          doc_id: "d4444444",
          score: 0.95,
          chunk_index: 0,
          excerpt:
            "Connect exclusively to SSID Enterprise-Secure with 802.1x PEAP credentials. Reset network stack with netsh winsock reset if DHCP fails.",
        },
      ];
    } else if (lower.includes("outlook") || lower.includes("sync") || lower.includes("email") || lower.includes("exchange") || lower.includes("mailbox")) {
      responseText =
        "Based on SOP-IT-005 (Corporate Exchange and Outlook Client Recovery):\n\n" +
        "1. Service Connectivity Check:\n" +
        "   - Check the bottom-right status bar in Outlook. If it shows 'Disconnected', verify webmail access at https://outlook.office.com.\n\n" +
        "2. Launch Outlook in Safe Mode:\n" +
        "   - Press Win + R, enter:\n" +
        "     outlook.exe /safe\n" +
        "   - If Outlook opens normally, a corrupted third-party COM add-in is the cause. Disable unnecessary add-ins via File -> Options -> Add-ins.\n\n" +
        "3. Purge Corrupted Windows Credential Cache:\n" +
        "   - Close Outlook.\n" +
        "   - Open Windows Credential Manager -> Windows Credentials.\n" +
        "   - Under Generic Credentials, remove all items prefixed with 'MicrosoftOffice16' or 'MS.Outlook'.\n" +
        "   - Relaunch Outlook and authenticate through corporate Single Sign-On (SSO).\n\n" +
        "4. Local OST File Rebuild:\n" +
        "   - In Outlook: File -> Account Settings -> Data Files -> Open File Location.\n" +
        "   - Close Outlook, rename your .ost file to .ost.bak, and reopen Outlook to rebuild local cache.";
      citations = [
        {
          title: "SOP-IT-005: Corporate Exchange and Outlook Client Recovery",
          doc_id: "d5555555",
          score: 0.94,
          chunk_index: 0,
          excerpt:
            "Isolate add-ins with outlook.exe /safe, purge cached credentials in Windows Credential Manager, and rename damaged OST cache files to force resync.",
        },
      ];
    } else if (lower.includes("mfa") || lower.includes("authenticator") || lower.includes("token") || lower.includes("phone")) {
      responseText =
        "Based on SOP-IT-006 (Multi-Factor Authentication (MFA) & TAP Policy):\n\n" +
        "1. Zero Trust Security Verification:\n" +
        "   - Under enterprise Zero Trust policy, resetting MFA methods requires secondary identity verification to prevent account takeover and SIM-swap attacks.\n\n" +
        "2. Temporary Access Pass (TAP) Workflow:\n" +
        "   - If your phone is lost or replaced:\n" +
        "     1. An IT Handler validates your employee identity and issues a time-limited 8-hour Temporary Access Pass (TAP).\n" +
        "     2. Use the TAP to sign in at https://mysignins.microsoft.com/security-info.\n" +
        "     3. Delete your outdated authenticator entry.\n" +
        "     4. Add a new sign-in method and scan the QR code using Microsoft Authenticator.\n\n" +
        "3. Code Synchronization Troubleshooting:\n" +
        "   - If 6-digit codes are rejected: In Authenticator, go to Settings -> Time correction for codes -> Sync now (Android), or toggle 'Set Automatically' in iOS Date & Time settings.\n\n" +
        "Click 'Talk to a Human' above to request identity validation and emergency TAP issuance.";
      citations = [
        {
          title: "SOP-IT-006: Multi-Factor Authentication (MFA) & TAP Policy",
          doc_id: "d6666666",
          score: 0.97,
          chunk_index: 0,
          excerpt:
            "Secondary identity verification required for MFA resets. Authorized handlers generate an 8-hour Temporary Access Pass (TAP) for portal re-enrollment.",
        },
      ];
    } else if (lower.includes("slow") || lower.includes("cpu") || lower.includes("freezing") || lower.includes("performance") || lower.includes("lag")) {
      responseText =
        "Based on SOP-IT-007 (Workstation Performance and OS Diagnostics):\n\n" +
        "1. Resource Utilization Triage:\n" +
        "   - Press Ctrl + Shift + Esc to open Task Manager.\n" +
        "   - Click the 'CPU' or 'Memory' column header to sort by highest consumer.\n" +
        "   - If corporate antivirus (EDR/Defender) is executing a scheduled scan, allow it to complete.\n" +
        "   - If memory usage is above 90%, restart memory-heavy container environments or developer workspaces.\n\n" +
        "2. System Health & File Integrity Repair (PowerShell as Admin):\n" +
        "   - Purge user temporary cache files:\n" +
        "     Remove-Item -Path \"$env:TEMP\\*\" -Recurse -Force -ErrorAction SilentlyContinue\n" +
        "   - Run System File Checker:\n" +
        "     sfc /scannow\n" +
        "   - Run DISM online image health repair:\n" +
        "     DISM.exe /Online /Cleanup-image /Restorehealth\n\n" +
        "3. Storage & Thermal Verification:\n" +
        "   - Ensure drive C: has at least 15% free capacity for virtual memory paging.\n" +
        "   - Ensure laptop ventilation vents are unobstructed to avoid CPU thermal throttling.";
      citations = [
        {
          title: "SOP-IT-007: Workstation Performance and OS Diagnostics",
          doc_id: "d7777777",
          score: 0.93,
          chunk_index: 0,
          excerpt:
            "Triage CPU and RAM via Task Manager, purge temp directories, execute sfc /scannow and DISM image repair, and ensure minimum 15% free disk capacity.",
        },
      ];
    } else if (lower.includes("monitor") || lower.includes("dock") || lower.includes("display") || lower.includes("screen") || lower.includes("hdmi")) {
      responseText =
        "Based on SOP-IT-008 (External Displays and Peripheral Docking Standards):\n\n" +
        "1. Rapid Graphics Subsystem Reset:\n" +
        "   - Press Win + Ctrl + Shift + B on your keyboard.\n" +
        "   - Your screens will blink once and chime as the display driver re-initializes.\n\n" +
        "2. Docking Station Power Drain Procedure:\n" +
        "   - Unplug the USB-C / Thunderbolt cable from your workstation.\n" +
        "   - Disconnect the dock's AC power adapter from the electrical wall outlet.\n" +
        "   - Wait 15 seconds to discharge internal dock capacitors.\n" +
        "   - Plug in dock AC power first, observe the power LED, then reconnect the USB-C cable to the laptop's Thunderbolt port.\n\n" +
        "3. Windows Display Configuration:\n" +
        "   - Press Win + P and verify projection mode is set to 'Extend'.\n" +
        "   - In Windows Settings -> System -> Display, click 'Detect'.\n" +
        "   - If dual 4K monitors flicker, lower refresh rates from 60Hz to 30Hz in Advanced display settings if cable bandwidth is exceeded.";
      citations = [
        {
          title: "SOP-IT-008: External Displays and Peripheral Docking Standards",
          doc_id: "d8888888",
          score: 0.95,
          chunk_index: 0,
          excerpt:
            "Restart graphics subsystem with Win + Ctrl + Shift + B, perform 15-second AC power drain on docking station, and verify projection mode is Extend.",
        },
      ];
    } else if (lower.includes("phish") || lower.includes("suspicious") || lower.includes("security") || lower.includes("malware") || lower.includes("hacked")) {
      responseText =
        "Based on SOP-IT-009 (Phishing and Information Security Incident Response):\n\n" +
        "1. Immediate Threat Containment Protocol:\n" +
        "   - DO NOT click any links, open attachments, or approve MFA prompts.\n" +
        "   - DO NOT reply to the sender.\n" +
        "   - If you clicked a link or entered credentials:\n" +
        "     1. Disconnect network cable or turn off Wi-Fi immediately to isolate your workstation.\n" +
        "     2. Notify IT Security immediately via the emergency hotline or click 'Talk to a Human'.\n\n" +
        "2. Reporting Workflow in Outlook:\n" +
        "   - Select the suspect message and click 'Report Message' -> 'Phishing' in the Outlook Home ribbon.\n" +
        "   - If reporting manually, export the message as .eml to preserve email headers (DKIM, SPF, ARC) and send to security@aihas.local.\n\n" +
        "3. Automated SOC Protection:\n" +
        "   - Our automated security gateway will analyze the sender domain and purge matching malicious emails across all tenant mailboxes within 10 minutes.";
      citations = [
        {
          title: "SOP-IT-009: Phishing and Information Security Incident Response",
          doc_id: "d9999999",
          score: 0.98,
          chunk_index: 0,
          excerpt:
            "Immediate network isolation if link clicked. Report via Outlook Phishing ribbon or forward headers to security@aihas.local for automated SOC tenant purge.",
        },
      ];
    } else if (lower.includes("human") || lower.includes("agent") || lower.includes("escalate")) {
      const tickets = getStorage<MockTicket[]>("aihas_mock_tickets", defaultTickets);
      const ticketId = "t-" + Math.floor(1000 + Math.random() * 9000);
      const convMessages = allMessages[convId] || [];

      const newTicket: MockTicket = {
        id: ticketId,
        title: "Consultation Request: " + userText.slice(0, 40),
        description: userText,
        status: "open",
        priority: "high",
        escalation_reason: "User requested human transfer",
        requester_id: "user@aihas.local",
        conversation_id: convId,
        created_at: new Date().toISOString(),
        transcript: convMessages.map((m) => ({
          sender: m.sender_type,
          text: m.content,
          created_at: new Date().toLocaleTimeString(),
        })),
        suggested_reply:
          "Hello, I am reviewing your request. Please let me know any additional details regarding your workstation or network setup.",
      };
      tickets.unshift(newTicket);
      setStorage("aihas_mock_tickets", tickets);

      escalations[convId] = ticketId;
      setStorage("aihas_mock_escalations", escalations);

      responseText = `Your inquiry has been escalated to an IT support handler. Ticket Reference: ${ticketId}. Your transcript has been routed to the active Handler Queue.`;
    } else {
      responseText =
        "The knowledge base does not contain sufficient confidence to answer your request with certainty. Would you like me to connect you with an IT support handler? Click 'Talk to a Human' above.";
    }

    const assistantEntry = {
      id: "msg-" + Date.now() + 1,
      sender_type: "assistant" as const,
      content: responseText,
      citations,
      action_card: actionCard,
      created_at: new Date().toISOString(),
    };
    allMessages[convId].push(assistantEntry);
    setStorage("aihas_mock_messages", allMessages);

    return {
      role: "assistant",
      content: responseText,
      citations,
      action_card: actionCard,
      escalation_available: !escalations[convId],
      is_escalated: !!escalations[convId],
      ticket_id: escalations[convId] || null,
    };
  }

  if (endpoint === "/api/v1/chat/actions/confirm" && method === "POST") {
    if (body.confirmed) {
      const tempPass = "Tmp#" + Math.random().toString(36).substring(2, 8).toUpperCase() + "89!";
      return {
        status: "success",
        temporary_password: tempPass,
        expires_in_minutes: 15,
        message:
          "Active Directory password reset succeeded. Please use this temporary password on your next domain logon.",
      };
    }
    return { status: "cancelled", message: "Action cancelled by user." };
  }

  if (endpoint === "/api/v1/chat/escalate" && method === "POST") {
    const convId = body.conversation_id;
    const allMessages = getStorage<Record<string, any[]>>("aihas_mock_messages", {});
    const convMessages = allMessages[convId] || [];

    const firstUserMsg = convMessages.find((m) => m.sender_type === "user");
    const summaryTitle = firstUserMsg
      ? firstUserMsg.content.slice(0, 45)
      : "Consultation Request";

    const tickets = getStorage<MockTicket[]>("aihas_mock_tickets", defaultTickets);
    const ticketId = "t-" + Math.floor(1000 + Math.random() * 9000);

    const newTicket: MockTicket = {
      id: ticketId,
      title: `Consultation: ${summaryTitle}`,
      description: firstUserMsg ? firstUserMsg.content : "User requested human assistance",
      status: "open",
      priority: "high",
      escalation_reason: body.reason || "User clicked 'Talk to a Human' in chat portal",
      requester_id: "user@aihas.local",
      conversation_id: convId,
      created_at: new Date().toISOString(),
      transcript: convMessages.map((m) => ({
        sender: m.sender_type,
        text: m.content,
        created_at: new Date().toLocaleTimeString(),
      })),
      suggested_reply:
        "Hello, this is IT Support regarding your inquiry. I have reviewed your conversation transcript. How can I assist you with this issue?",
    };

    tickets.unshift(newTicket);
    setStorage("aihas_mock_tickets", tickets);

    const escalations = getStorage<Record<string, string>>("aihas_mock_escalations", {});
    escalations[convId] = ticketId;
    setStorage("aihas_mock_escalations", escalations);

    return {
      status: "escalated",
      ticket_id: ticketId,
      message: "Session routed to active Handler Queue.",
    };
  }

  if (endpoint.startsWith("/api/v1/tickets") && method === "GET") {
    const tickets = getStorage<MockTicket[]>("aihas_mock_tickets", defaultTickets);
    const [pathPart, queryPart] = endpoint.split("?");
    const segments = pathPart.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment && lastSegment !== "tickets") {
      const found = tickets.find((t) => t.id === lastSegment);
      return found || tickets[0];
    }

    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      const statusFilter = params.get("status_filter");
      if (statusFilter && statusFilter !== "all") {
        return tickets.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase());
      }
    }

    return [...tickets];
  }

  if (endpoint.startsWith("/api/v1/tickets/") && method === "DELETE") {
    const parts = endpoint.split("/");
    const ticketId = parts[parts.length - 1];

    let tickets = getStorage<MockTicket[]>("aihas_mock_tickets", defaultTickets);
    tickets = tickets.filter((t) => t.id !== ticketId);
    setStorage("aihas_mock_tickets", tickets);

    const escalations = getStorage<Record<string, string>>("aihas_mock_escalations", {});
    for (const [convId, tId] of Object.entries(escalations)) {
      if (tId === ticketId) {
        delete escalations[convId];
      }
    }
    setStorage("aihas_mock_escalations", escalations);

    return { status: "deleted", ticket_id: ticketId };
  }

  if (endpoint.includes("/reply") && method === "POST") {
    const parts = endpoint.split("/");
    const ticketId = parts[parts.length - 2];
    const tickets = getStorage<MockTicket[]>("aihas_mock_tickets", defaultTickets);
    const ticket = tickets.find((t) => t.id === ticketId);

    if (ticket) {
      if (body.mark_resolved) {
        ticket.status = "resolved";
      }
      ticket.suggested_reply = body.reply_text;
      ticket.transcript.push({
        sender: "handler",
        text: `[Technician Response]: ${body.reply_text}`,
        created_at: new Date().toLocaleTimeString(),
      });
      setStorage("aihas_mock_tickets", tickets);

      if (ticket.conversation_id) {
        const convId = ticket.conversation_id;
        const allMessages = getStorage<Record<string, any[]>>("aihas_mock_messages", {});
        if (!allMessages[convId]) allMessages[convId] = [];

        allMessages[convId].push({
          id: "msg-" + Date.now(),
          sender_type: "assistant",
          content: `[IT Support Specialist]: ${body.reply_text}${
            body.mark_resolved
              ? "\n\n[Status: Ticket Marked Resolved - Session Closed by Handler]"
              : ""
          }`,
          created_at: new Date().toISOString(),
        });
        setStorage("aihas_mock_messages", allMessages);

        if (body.mark_resolved) {
          const resolvedSessions = getStorage<Record<string, boolean>>(
            "aihas_mock_resolved_sessions",
            {}
          );
          resolvedSessions[convId] = true;
          setStorage("aihas_mock_resolved_sessions", resolvedSessions);

          const escalations = getStorage<Record<string, string>>(
            "aihas_mock_escalations",
            {}
          );
          delete escalations[convId];
          setStorage("aihas_mock_escalations", escalations);
        }
      }
    }

    return {
      status: "success",
      ticket_id: ticketId,
      reply_dispatched: body.reply_text,
    };
  }

  if (endpoint === "/api/v1/metrics/dashboard" && method === "GET") {
    const tickets = getStorage<MockTicket[]>("aihas_mock_tickets", defaultTickets);
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const open = tickets.filter((t) => t.status === "open").length;

    return {
      kpi: {
        ticket_deflection_rate_pct: 84.6,
        mttr_minutes: 12.8,
        avg_latency_ms: 740,
        faithfulness_score: 0.95,
        total_conversations: 142,
        total_tickets: tickets.length,
        resolved_tickets: resolved,
        open_tickets: open,
      },
      tickets_by_category: [
        { category: "VPN & Remote Access", count: 18, percentage: 36 },
        { category: "Active Directory / Password", count: 16, percentage: 32 },
        { category: "Software Provisioning", count: 10, percentage: 20 },
        { category: "Hardware & Peripherals", count: 6, percentage: 12 },
      ],
      guardrail_telemetry: {
        pii_redacted_events: 34,
        prompt_injection_blocked: 12,
        automated_password_resets: 19,
        recent_audit_events: [
          {
            id: "aud-" + auditLogCounter++,
            event_type: "pii_redacted",
            user_id: "c3333333",
            created_at: "Just now",
            details: { type: "EMAIL_REDACTED", count: 1 },
          },
          {
            id: "aud-" + auditLogCounter++,
            event_type: "password_reset_executed",
            user_id: "c3333333",
            created_at: "5 min ago",
            details: { action: "AD_PASSWORD_PROVISIONED" },
          },
          {
            id: "aud-" + auditLogCounter++,
            event_type: "prompt_injection_blocked",
            user_id: "unknown",
            created_at: "12 min ago",
            details: { pattern: "jailbreak_attempt" },
          },
        ],
      },
    };
  }

  if (endpoint === "/api/v1/kb/documents" && method === "GET") {
    return getStorage<MockKBDoc[]>("aihas_mock_kb", defaultKBDocs);
  }

  if (endpoint === "/api/v1/kb/documents" && method === "POST") {
    const docs = getStorage<MockKBDoc[]>("aihas_mock_kb", defaultKBDocs);
    const newDoc: MockKBDoc = {
      id: "doc-" + Math.random().toString(36).substring(2, 9),
      title: body.title,
      status: "indexed",
      metadata_json: { chunks_count: 2, vector_dim: 1536 },
    };
    docs.push(newDoc);
    setStorage("aihas_mock_kb", docs);
    return newDoc;
  }

  if (endpoint.startsWith("/api/v1/kb/documents/") && method === "DELETE") {
    const parts = endpoint.split("/");
    const id = parts[parts.length - 1];
    const docs = getStorage<MockKBDoc[]>("aihas_mock_kb", defaultKBDocs);
    const idx = docs.findIndex((d) => d.id === id);
    if (idx !== -1) {
      docs.splice(idx, 1);
      setStorage("aihas_mock_kb", docs);
    }
    return {};
  }

  if (endpoint === "/api/v1/users" && method === "GET") {
    return getStorage<MockUser[]>("aihas_mock_users", defaultUsers);
  }

  if (endpoint === "/api/v1/users" && method === "POST") {
    const users = getStorage<MockUser[]>("aihas_mock_users", defaultUsers);
    const newUser: MockUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      email: body.email,
      role: body.role || "user",
      is_active: true,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setStorage("aihas_mock_users", users);
    return newUser;
  }

  if (endpoint.startsWith("/api/v1/users/") && method === "PATCH") {
    const parts = endpoint.split("/");
    const id = parts[parts.length - 1];
    const users = getStorage<MockUser[]>("aihas_mock_users", defaultUsers);
    const target = users.find((u) => u.id === id);
    if (target) {
      if (body.role !== undefined) target.role = body.role;
      if (body.is_active !== undefined) target.is_active = body.is_active;
      setStorage("aihas_mock_users", users);
    }
    return target || {};
  }

  return {};
}
