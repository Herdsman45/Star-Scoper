/**
 * Session Log - Track captured worlds during scoping session
 * Uses localStorage for persistence (auto-expires after session)
 */

// Storage key
const STORAGE_KEY = "starScoper_sessionLog";

// Load data from localStorage
function loadSessionData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Error loading session data:", err);
    return [];
  }
}

// Save data to localStorage
function saveSessionData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Error saving session data:", err);
  }
}

// Format timestamp to UTC short format (HH:MM)
function formatUTCTime(timestamp) {
  const date = new Date(timestamp);
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// Pad string to specific width
function padRight(str, len) {
  str = String(str);
  while (str.length < len) str += " ";
  return str;
}

// Render table
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const data = loadSessionData();

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-state"><td colspan="4">No worlds captured yet. Capture a region to populate this log.</td></tr>';
    document.getElementById("statsLabel").textContent = "0 worlds logged";
    return;
  }

  tbody.innerHTML = "";
  data.forEach((entry) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = entry.world;
    row.insertCell(1).textContent = entry.region;
    row.insertCell(2).textContent = entry.size;
    row.insertCell(3).textContent = formatUTCTime(entry.landingTime);
  });

  document.getElementById("statsLabel").textContent =
    `${data.length} world${data.length === 1 ? "" : "s"} logged`;
}

// Add new entry (called from main process via IPC)
function addEntry(world, region, size, relativeTime) {
  const data = loadSessionData();

  // Calculate landing time (current time + relative time in minutes)
  const landingTime = Date.now() + relativeTime * 60 * 1000;

  // Remove duplicate world if exists
  const filtered = data.filter((entry) => entry.world !== world);

  // Add new entry at the top
  filtered.unshift({
    world,
    region,
    size,
    relativeTime,
    landingTime,
    capturedAt: Date.now(),
  });

  saveSessionData(filtered);
  renderTable();
}

// Clear all data
function clearLog() {
  if (confirm("Clear all logged worlds?")) {
    localStorage.removeItem(STORAGE_KEY);
    renderTable();
  }
}

// Export to CSV
function exportToCsv() {
  const data = loadSessionData();
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  let csv = "World,Region,Size,Time (UTC)\n";
  data.forEach((entry) => {
    csv += `${entry.world},"${entry.region}",${entry.size},${formatUTCTime(entry.landingTime)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  a.download = `star-session-${timestamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Copy as Discord code block
function copyCodeBlock() {
  const data = loadSessionData();
  if (data.length === 0) {
    alert("No data to copy");
    return;
  }

  // Column widths: World(5), Region(28), Size(7), Time(5)
  const colWidths = [5, 28, 7, 5];
  let lines = [];

  // Header
  lines.push(
    padRight("W", colWidths[0]) +
      padRight("Region", colWidths[1]) +
      padRight("Size", colWidths[2]) +
      padRight("Time", colWidths[3]),
  );

  // Rows
  data.forEach((entry) => {
    lines.push(
      padRight(String(entry.world), colWidths[0]) +
        padRight(entry.region, colWidths[1]) +
        padRight(String(entry.size), colWidths[2]) +
        padRight(formatUTCTime(entry.landingTime), colWidths[3]),
    );
  });

  let codeBlock = "```\n" + lines.join("\n") + "\n```";

  // Discord message limit is 2000 chars
  if (codeBlock.length > 2000) {
    let allowedLines = [];
    let total = 8; // for opening/closing ```
    for (let i = 0; i < lines.length; i++) {
      let nextLen = lines[i].length + 1;
      if (total + nextLen > 1997) break;
      allowedLines.push(lines[i]);
      total += nextLen;
    }
    codeBlock = "```\n" + allowedLines.join("\n") + "\n```";
  }

  navigator.clipboard
    .writeText(codeBlock)
    .then(() => alert("Code block copied to clipboard!"))
    .catch((err) => alert("Failed to copy: " + err));
}

// Sorting functionality
function setupSorting() {
  const headers = document.querySelectorAll("th.sortable");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const col = parseInt(header.dataset.col);
      const data = loadSessionData();
      const isAscending = header.classList.contains("asc");

      // Clear all sort indicators
      headers.forEach((h) => h.classList.remove("asc", "desc"));

      // Set current sort indicator
      header.classList.toggle("asc", !isAscending);
      header.classList.toggle("desc", isAscending);

      // Sort data
      data.sort((a, b) => {
        let valA, valB;
        switch (col) {
          case 0:
            valA = a.world;
            valB = b.world;
            break;
          case 1:
            valA = a.region;
            valB = b.region;
            break;
          case 2:
            valA = a.size;
            valB = b.size;
            break;
          case 3:
            valA = a.landingTime;
            valB = b.landingTime;
            break;
        }

        if (typeof valA === "number") {
          return isAscending ? valB - valA : valA - valB;
        } else {
          return isAscending
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        }
      });

      saveSessionData(data);
      renderTable();
    });
  });
}

// UTC Clock
function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, "0");
  const m = String(now.getUTCMinutes()).padStart(2, "0");
  document.getElementById("utcClock").textContent = `UTC: ${h}:${m}`;
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  renderTable();
  setupSorting();
  updateClock();
  setInterval(updateClock, 1000);

  // Button handlers
  document.getElementById("clearBtn").addEventListener("click", clearLog);
  document
    .getElementById("exportCsvBtn")
    .addEventListener("click", exportToCsv);
  document
    .getElementById("copyCodeBlockBtn")
    .addEventListener("click", copyCodeBlock);

  // Listen for new entries from main process
  window.electronAPI.ipc.on(
    "session-log-add-entry",
    ({ world, region, size, relativeTime }) => {
      console.log("[SESSION_LOG] Received entry:", {
        world,
        region,
        size,
        relativeTime,
      });
      addEntry(world, region, size, relativeTime);
    },
  );

  // Listen for storage changes (if multiple windows open)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      renderTable();
    }
  });
});
