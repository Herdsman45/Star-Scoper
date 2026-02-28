/**
 * Session Log - Track captured worlds during scoping session
 * Uses localStorage for persistence (auto-expires after session)
 */

// Storage keys
const STORAGE_KEY = "starScoper_sessionLog";
const SPLIT_MODE_KEY = "starScoper_sessionLog_splitMode";

// Worlds data (Members/Free-to-play)
let worldTypeMap = new Map();

// Load worlds data from global WORLDS_DATA (loaded via worlds.js script)
function loadWorldsData() {
  if (typeof WORLDS_DATA !== "undefined") {
    WORLDS_DATA.forEach((world) => {
      worldTypeMap.set(world.id, world.type);
    });
  } else {
    console.error("WORLDS_DATA not found. Make sure worlds.js is loaded.");
  }
}

// Get world type
function getWorldType(worldId) {
  // Convert to number since worlds.json has numeric IDs but OCR might give strings
  const numericId =
    typeof worldId === "string" ? parseInt(worldId, 10) : worldId;
  return worldTypeMap.get(numericId) || "Unknown";
}

// Get/set split mode
function getSplitMode() {
  const saved = localStorage.getItem(SPLIT_MODE_KEY);
  return saved === "true";
}

function setSplitMode(enabled) {
  localStorage.setItem(SPLIT_MODE_KEY, String(enabled));
}

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
  const splitMode = getSplitMode();

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-state"><td colspan="6">No worlds captured yet. Capture a region to populate this log.</td></tr>';
    document.getElementById("statsLabel").textContent = "0 worlds logged";
    return;
  }

  // If split mode, separate by type
  let membersData = [];
  let f2pData = [];

  if (splitMode) {
    data.forEach((entry) => {
      const type = getWorldType(entry.world);
      if (type === "Members") {
        membersData.push(entry);
      } else {
        f2pData.push(entry);
      }
    });
  }

  tbody.innerHTML = "";

  const renderEntries = (entries, sectionLabel = null) => {
    if (sectionLabel && entries.length > 0) {
      const headerRow = tbody.insertRow();
      headerRow.className = "section-header";
      const headerCell = headerRow.insertCell(0);
      headerCell.colSpan = 6;
      headerCell.textContent = sectionLabel;
    }

    entries.forEach((entry) => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = entry.world;

      const typeCell = row.insertCell(1);
      const worldType = getWorldType(entry.world);
      typeCell.textContent = worldType === "Members" ? "M" : "F2P";
      typeCell.className =
        worldType === "Members" ? "world-type-members" : "world-type-f2p";

      row.insertCell(2).textContent = entry.region;
      row.insertCell(3).textContent = entry.size;
      row.insertCell(4).textContent = formatUTCTime(entry.landingTime);

      // Add delete button
      const deleteCell = row.insertCell(5);
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "×";
      deleteBtn.title = "Delete this entry";
      deleteBtn.addEventListener("click", () => {
        deleteEntry(entry.world);
      });
      deleteCell.appendChild(deleteBtn);
    });
  };

  if (splitMode) {
    renderEntries(
      membersData,
      membersData.length > 0 ? "Members Worlds" : null,
    );
    renderEntries(f2pData, f2pData.length > 0 ? "Free-to-Play Worlds" : null);
  } else {
    renderEntries(data);
  }

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

// Delete entry
function deleteEntry(world) {
  const data = loadSessionData();
  const filtered = data.filter((e) => e.world !== world);
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

  let csv = "World,Type,Region,Size,Time (UTC)\n";
  data.forEach((entry) => {
    const worldType = getWorldType(entry.world);
    const typeStr = worldType === "Members" ? "M" : "F2P";
    csv += `${entry.world},${typeStr},"${entry.region}",${entry.size},${formatUTCTime(entry.landingTime)}\n`;
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

// Toggle split mode
function toggleSplitMode() {
  const enabled = !getSplitMode();
  setSplitMode(enabled);
  const btn = document.getElementById("splitToggleBtn");
  btn.textContent = enabled ? "Show Mixed" : "Split by Type";
  renderTable();
}

// Copy as Discord code block
function copyCodeBlock() {
  const data = loadSessionData();
  if (data.length === 0) {
    alert("No data to copy");
    return;
  }

  // Column widths: World(5), Type(4), Region(28), Size(7), Time(5)
  const colWidths = [5, 4, 28, 7, 5];
  let lines = [];

  // Header
  lines.push(
    padRight("W", colWidths[0]) +
      padRight("Type", colWidths[1]) +
      padRight("Region", colWidths[2]) +
      padRight("Size", colWidths[3]) +
      padRight("Time", colWidths[4]),
  );

  // Rows
  data.forEach((entry) => {
    const worldType = getWorldType(entry.world);
    const typeStr = worldType === "Members" ? "M" : "F2P";
    lines.push(
      padRight(String(entry.world), colWidths[0]) +
        padRight(typeStr, colWidths[1]) +
        padRight(entry.region, colWidths[2]) +
        padRight(String(entry.size), colWidths[3]) +
        padRight(formatUTCTime(entry.landingTime), colWidths[4]),
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
      let data = loadSessionData();
      const isAscending = header.classList.contains("asc");
      const splitMode = getSplitMode();

      // Clear all sort indicators
      headers.forEach((h) => h.classList.remove("asc", "desc"));

      // Set current sort indicator
      header.classList.toggle("asc", !isAscending);
      header.classList.toggle("desc", isAscending);

      // Sort data
      const sortFn = (a, b) => {
        let valA, valB;
        switch (col) {
          case 0:
            valA = a.world;
            valB = b.world;
            break;
          case 1:
            valA = getWorldType(a.world);
            valB = getWorldType(b.world);
            break;
          case 2:
            valA = a.region;
            valB = b.region;
            break;
          case 3:
            valA = a.size;
            valB = b.size;
            break;
          case 4:
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
      };

      if (splitMode) {
        // Sort within each section
        const membersData = data.filter(
          (e) => getWorldType(e.world) === "Members",
        );
        const f2pData = data.filter((e) => getWorldType(e.world) !== "Members");

        membersData.sort(sortFn);
        f2pData.sort(sortFn);

        data = [...membersData, ...f2pData];
      } else {
        data.sort(sortFn);
      }

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
  loadWorldsData();

  // Set initial split button text
  const splitBtn = document.getElementById("splitToggleBtn");
  if (splitBtn) {
    splitBtn.textContent = getSplitMode() ? "Show Mixed" : "Split by Type";
  }

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
  document
    .getElementById("splitToggleBtn")
    .addEventListener("click", toggleSplitMode);

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
