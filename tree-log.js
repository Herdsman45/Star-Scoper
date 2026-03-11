/**
 * Evil Tree Log - Track captured worlds and tree availability times
 * Uses localStorage for persistence (auto-expires after session)
 */

// Storage keys
const STORAGE_KEY = "starScoper_treeLog";
const SPLIT_MODE_KEY = "starScoper_treeLog_splitMode";
const PLACEHOLDER_MODE_KEY = "starScoper_treeLog_placeholderMode";

// Worlds data (Members/Free-to-play)
let worldTypeMap = new Map();

// Track last sort state for auto-resorting on countdown updates
let lastSortColumn = null;
let lastSortAscending = true;

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

// Get/set placeholder mode
function getPlaceholderMode() {
  const saved = localStorage.getItem(PLACEHOLDER_MODE_KEY);
  return saved === "true";
}

function setPlaceholderMode(enabled) {
  localStorage.setItem(PLACEHOLDER_MODE_KEY, String(enabled));
}

// Load data from localStorage
function loadTreeData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Error loading tree data:", err);
    return [];
  }
}

// Save data to localStorage
function saveTreeData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Error saving tree data:", err);
  }
}

// Format timestamp to UTC short format (HH:MM)
function formatUTCTime(timestamp) {
  const date = new Date(timestamp);
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// Calculate minutes until a timestamp (can be negative)
function getMinutesUntil(timestamp) {
  const now = Date.now();
  const diff = timestamp - now;
  const minutes = Math.round(diff / 60000);
  return minutes;
}

// Format minutes until display with color coding
function formatMinutesUntil(minutes) {
  if (minutes <= -15) {
    return '<span class="expired">Expired</span>';
  } else if (minutes < 0) {
    return `<span class="ready">${minutes}m</span>`;
  } else if (minutes <= 5) {
    return `<span class="soon">${minutes}m</span>`;
  } else {
    return `${minutes}m`;
  }
}

// Pad string to specific width
function padRight(str, len) {
  str = String(str);
  while (str.length < len) str += " ";
  return str;
}

// Render table with live countdown
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const data = loadTreeData();
  const splitMode = getSplitMode();

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-state"><td colspan="7">No trees captured yet. Capture a region to populate this log.</td></tr>';
    document.getElementById("statsLabel").textContent = "0 trees logged";
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
      headerCell.colSpan = 7;
      headerCell.textContent = sectionLabel;
    }

    entries.forEach((entry) => {
      const row = tbody.insertRow();

      // Handle placeholder entries differently
      if (entry.isPlaceholder) {
        row.classList.add("placeholder-row");

        row.insertCell(0).textContent = entry.world;

        const typeCell = row.insertCell(1);
        const worldType = getWorldType(entry.world);
        typeCell.textContent = worldType === "Members" ? "M" : "F2P";
        typeCell.className =
          worldType === "Members" ? "world-type-members" : "world-type-f2p";

        row.insertCell(2).textContent = "-";
        row.insertCell(3).textContent = "-";
        row.insertCell(4).textContent = ""; // Estimated column
        row.insertCell(5).textContent = "-"; // Tree type
        row.insertCell(6).textContent = ""; // No delete button for placeholders
      } else {
        const minutesUntil = getMinutesUntil(entry.availableTime);

        row.insertCell(0).textContent = entry.world;

        const typeCell = row.insertCell(1);
        const worldType = getWorldType(entry.world);
        typeCell.textContent = worldType === "Members" ? "M" : "F2P";
        typeCell.className =
          worldType === "Members" ? "world-type-members" : "world-type-f2p";

        row.insertCell(2).textContent = formatUTCTime(entry.availableTime);
        row.insertCell(3).innerHTML = formatMinutesUntil(minutesUntil);

        // Add estimated column
        const estimatedCell = row.insertCell(4);
        if (entry.estimated) {
          estimatedCell.textContent = "estimated";
          estimatedCell.className = "estimated-cell";
        }

        // Add tree type dropdown
        const treeTypeCell = row.insertCell(5);
        const typeSelect = document.createElement("select");
        typeSelect.className = "type-dropdown";
        typeSelect.innerHTML = `
          <option value="">-</option>
          <option value="Normal">Normal</option>
          <option value="Oak">Oak</option>
          <option value="Willow">Willow</option>
          <option value="Maple">Maple</option>
          <option value="Yew">Yew</option>
          <option value="Magic">Magic</option>
          <option value="Elder">Elder</option>
        `;
        typeSelect.value = entry.type || "";
        typeSelect.addEventListener("change", () => {
          updateEntryType(entry.world, typeSelect.value);
        });
        treeTypeCell.appendChild(typeSelect);

        // Add delete button
        const deleteCell = row.insertCell(6);
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "×";
        deleteBtn.title = "Delete this entry";
        deleteBtn.addEventListener("click", () => {
          deleteEntry(entry.world);
        });
        deleteCell.appendChild(deleteBtn);

        // Add visual feedback for expired entries
        if (minutesUntil <= -15) {
          row.classList.add("expired-row");
        }

        // Add visual feedback for typed entries
        if (entry.type) {
          row.classList.add("typed-row");
        }
      }
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
    `${data.filter((e) => !e.isPlaceholder).length} tree${data.filter((e) => !e.isPlaceholder).length === 1 ? "" : "s"} logged`;
}

// Add new entry (called from main process via IPC)
function addEntry(world, treeTime, estimated = false) {
  const data = loadTreeData();

  // treeTime is Unix timestamp in milliseconds
  const availableTime = treeTime;

  // Remove duplicate world if exists
  const filtered = data.filter((entry) => entry.world !== world);

  // Add new entry at the top
  filtered.unshift({
    world,
    availableTime,
    capturedAt: Date.now(),
    type: null,
    estimated: estimated,
  });

  saveTreeData(filtered);
  renderTable();
}

// Add manual entry
function addManualEntry() {
  const worldInput = document.getElementById("manualWorld");
  const minsInput = document.getElementById("manualMins");

  const world = parseInt(worldInput.value, 10);
  const mins = parseInt(minsInput.value, 10);

  if (isNaN(world) || world < 1 || world > 300) {
    alert("Please enter a valid world number (1-300)");
    return;
  }

  if (isNaN(mins)) {
    alert("Please enter a valid number of minutes");
    return;
  }

  // Calculate timestamp: current time + minutes
  const timestamp = Date.now() + mins * 60 * 1000;

  // Add entry
  addEntry(world, timestamp);

  // Clear inputs
  worldInput.value = "";
  minsInput.value = "";
  worldInput.focus();
}

// Import from Discord formatted list
function importDiscordList() {
  const textarea = document.getElementById("importDiscord");
  const text = textarea.value.trim();

  if (!text) {
    alert("Please paste Discord formatted list");
    return;
  }

  // Parse Discord format: w58 <t:1736813284:R> (15:09) f2p or World `58` <t:1736813284:R> (`HH:mm`)
  const lines = text.split("\n");
  let imported = 0;
  let failed = 0;

  lines.forEach((line) => {
    // Match new format: w58 <t:1736813284:R> ...
    let match = line.match(/w(\d+)\s+<t:(\d+):R>/i);

    // Try old format if new format didn't match: World `58` <t:1736813284:R> ...
    if (!match) {
      match = line.match(/World\s+`(\d+)`\s+<t:(\d+):R>/i);
    }

    if (match) {
      const world = parseInt(match[1], 10);
      const unixTimestamp = parseInt(match[2], 10);
      const timestamp = unixTimestamp * 1000; // Convert to milliseconds

      if (!isNaN(world) && !isNaN(timestamp)) {
        addEntry(world, timestamp);
        imported++;
      } else {
        failed++;
      }
    } else if (line.trim()) {
      // Non-empty line that didn't match
      failed++;
    }
  });

  if (imported > 0) {
    alert(
      `Imported ${imported} tree${imported === 1 ? "" : "s"}${failed > 0 ? ` (${failed} failed)` : ""}`,
    );
    textarea.value = "";
  } else {
    alert(
      "No valid entries found. Expected format: w58 <t:1736813284:R> (15:09) f2p",
    );
  }
}

// Update entry type
function updateEntryType(world, type) {
  const data = loadTreeData();
  const entry = data.find((e) => e.world === world);
  if (entry) {
    entry.type = type || null;
    saveTreeData(data);
    renderTable();
  }
}

// Delete entry
function deleteEntry(world) {
  const data = loadTreeData();
  const filtered = data.filter((e) => e.world !== world);
  saveTreeData(filtered);
  renderTable();
}

// Clear all data
function clearLog() {
  if (confirm("Clear all logged trees?")) {
    localStorage.removeItem(STORAGE_KEY);
    renderTable();
  }
}

// Export to CSV
function exportToCsv() {
  let data = loadTreeData();
  // Filter out placeholders
  data = data.filter((entry) => !entry.isPlaceholder);

  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  let csv = "World,Type,Available Time (UTC),Minutes Until,Tree Type\n";
  data.forEach((entry) => {
    const worldType = getWorldType(entry.world);
    const typeStr = worldType === "Members" ? "M" : "F2P";
    const minutesUntil = getMinutesUntil(entry.availableTime);
    let minutesStr;
    if (minutesUntil <= -15) {
      minutesStr = "Expired";
    } else if (minutesUntil < 0) {
      minutesStr = `${minutesUntil}m`;
    } else {
      minutesStr = `${minutesUntil}m`;
    }
    const treeTypeStr = entry.type || "";
    csv += `${entry.world},${typeStr},${formatUTCTime(entry.availableTime)},${minutesStr},${treeTypeStr}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  a.download = `evil-tree-log-${timestamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Copy as Discord formatted list with live timers
function copyCodeBlock() {
  let data = loadTreeData();
  // Filter out placeholders
  data = data.filter((entry) => !entry.isPlaceholder);

  if (data.length === 0) {
    alert("No data to copy");
    return;
  }

  // Filter out entries with types set and expired entries
  const filteredData = data.filter((entry) => {
    const minutesUntil = getMinutesUntil(entry.availableTime);
    return !entry.type && minutesUntil > -15;
  });

  if (filteredData.length === 0) {
    alert("No data to copy (all entries are typed or expired)");
    return;
  }

  // Format: w58 <t:1736813284:R> (15:09) f2p
  let lines = [];

  filteredData.forEach((entry) => {
    const unixTimestamp = Math.floor(entry.availableTime / 1000);
    const utcTime = formatUTCTime(entry.availableTime);
    const worldType = getWorldType(entry.world);
    const suffix = worldType === "Members" ? "" : " `f2p`";
    const line = `w\`${entry.world}\` <t:${unixTimestamp}:R> (\`${utcTime}\`)${suffix}`;
    lines.push(line);
  });

  const discordMessage = lines.join("\n");

  // Discord message limit is 2000 chars
  if (discordMessage.length > 2000) {
    let allowedLines = [];
    let total = 0;
    for (let i = 0; i < lines.length; i++) {
      let nextLen = lines[i].length + 1;
      if (total + nextLen > 2000) break;
      allowedLines.push(lines[i]);
      total += nextLen;
    }
    const truncatedMessage = allowedLines.join("\n");
    navigator.clipboard
      .writeText(truncatedMessage)
      .then(() =>
        alert(
          `Copied ${allowedLines.length} of ${lines.length} entries (truncated to fit Discord limit)`,
        ),
      )
      .catch((err) => alert("Failed to copy: " + err));
  } else {
    navigator.clipboard
      .writeText(discordMessage)
      .then(() => alert("Discord list copied to clipboard!"))
      .catch((err) => alert("Failed to copy: " + err));
  }
}

// Toggle split mode
function toggleSplitMode() {
  const enabled = !getSplitMode();
  setSplitMode(enabled);
  const btn = document.getElementById("splitToggleBtn");
  btn.textContent = enabled ? "Show Mixed" : "Split by Type";
  renderTable();
}

// Toggle placeholder mode
function togglePlaceholderMode() {
  const enabled = !getPlaceholderMode();
  setPlaceholderMode(enabled);
  const btn = document.getElementById("placeholderToggleBtn");
  btn.textContent = enabled ? "Hide Empty" : "Fill Empty";

  if (enabled) {
    // Add placeholder entries for all worlds not in the list
    const data = loadTreeData();
    const existingWorldIds = new Set(data.map((entry) => entry.world));

    // Get all world IDs from worldTypeMap
    const placeholdersToAdd = [];
    worldTypeMap.forEach((type, worldId) => {
      if (!existingWorldIds.has(worldId)) {
        placeholdersToAdd.push({
          world: worldId,
          availableTime: null,
          capturedAt: null,
          type: null,
          estimated: false,
          isPlaceholder: true,
        });
      }
    });

    // Add placeholders to data
    const updatedData = [...data, ...placeholdersToAdd];
    saveTreeData(updatedData);
  } else {
    // Remove all placeholder entries
    let data = loadTreeData();
    data = data.filter((entry) => !entry.isPlaceholder);
    saveTreeData(data);
  }

  renderTable();
}

// Sorting functionality
function setupSorting() {
  const headers = document.querySelectorAll("th.sortable");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const col = parseInt(header.dataset.col);
      let data = loadTreeData();
      const isAscending = header.classList.contains("asc");
      const splitMode = getSplitMode();

      // Save sort state for auto-resorting
      lastSortColumn = col;
      lastSortAscending = !isAscending;

      // Clear all sort indicators
      headers.forEach((h) => h.classList.remove("asc", "desc"));

      // Set current sort indicator
      header.classList.toggle("asc", !isAscending);
      header.classList.toggle("desc", isAscending);

      applySortToData(col, !isAscending);
    });
  });
}

// Sort function (extracted for reuse)
function getSortFunction(col, isAscending) {
  return (a, b) => {
    // When sorting by world number (col 0), include placeholders in normal sort
    // Otherwise, always sort placeholders to the bottom
    if (col !== 0) {
      if (a.isPlaceholder && !b.isPlaceholder) return 1;
      if (!a.isPlaceholder && b.isPlaceholder) return -1;
      if (a.isPlaceholder && b.isPlaceholder) {
        // Both are placeholders, sort by world number
        return isAscending ? a.world - b.world : b.world - a.world;
      }
    }

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
        valA = a.availableTime;
        valB = b.availableTime;
        break;
      case 3:
        valA = getMinutesUntil(a.availableTime);
        valB = getMinutesUntil(b.availableTime);

        // Custom sorting for minutes column
        // Priority order (ascending):
        // 1. Recent past (-5 to -1): -5, -4, -3, -2, -1
        // 2. Future (0+): 0, 1, 2, 3, ...
        // 3. Older past (-6 to -14): -6, -7, -8, -9, -10, ...
        // 4. Expired (-15 and below): at bottom

        const getSortPriority = (mins) => {
          if (mins <= -15) return 4; // Expired
          if (mins < -5) return 3; // Older past (-14 to -6)
          if (mins < 0) return 1; // Recent past (-5 to -1)
          return 2; // Future (0+)
        };

        const priorityA = getSortPriority(valA);
        const priorityB = getSortPriority(valB);

        // If different priorities, sort by priority
        if (priorityA !== priorityB) {
          if (isAscending) {
            return priorityA - priorityB; // Lower priority number first
          } else {
            return priorityB - priorityA; // Higher priority number first
          }
        }

        // Within same priority group
        if (isAscending) {
          // Recent past (-5 to -1): ascending by value (-5, -4, -3, -2, -1)
          // Future (0+): ascending by value (0, 1, 2, 3, ...)
          if (priorityA === 1 || priorityA === 2) {
            return valA - valB;
          }
          // Older past (-14 to -6): descending by value (-6, -7, -8, ..., -14)
          // Expired: descending by value
          else {
            return valB - valA;
          }
        } else {
          // Descending: reverse everything
          if (priorityA === 1 || priorityA === 2) {
            return valB - valA;
          } else {
            return valA - valB;
          }
        }
      case 4:
        // Estimated column: sort by boolean (false first, then true)
        valA = a.estimated ? 1 : 0;
        valB = b.estimated ? 1 : 0;
        break;
    }

    // Generic sorting for non-minutes columns
    if (typeof valA === "number") {
      return isAscending ? valB - valA : valA - valB;
    } else {
      return isAscending
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    }
  };
}

// Apply sort to data with the extracted sort function
function applySortToData(col, isAscending) {
  let data = loadTreeData();
  const splitMode = getSplitMode();

  // Update sort indicators
  const headers = document.querySelectorAll("th.sortable");
  headers.forEach((h) => h.classList.remove("asc", "desc"));
  const targetHeader = document.querySelector(`th.sortable[data-col="${col}"]`);
  if (targetHeader) {
    targetHeader.classList.toggle("asc", isAscending);
    targetHeader.classList.toggle("desc", !isAscending);
  }

  const sortFn = getSortFunction(col, isAscending);

  if (splitMode) {
    // Sort within each section
    const membersData = data.filter((e) => getWorldType(e.world) === "Members");
    const f2pData = data.filter((e) => getWorldType(e.world) !== "Members");

    membersData.sort(sortFn);
    f2pData.sort(sortFn);

    data = [...membersData, ...f2pData];
  } else {
    data.sort(sortFn);
  }

  saveTreeData(data);
  renderTable();
}

// Update countdown every minute and re-apply last sort
function updateCountdown() {
  let data = loadTreeData();
  if (data.length === 0) return;

  // Check for expired non-estimated trees and create estimated respawn entries
  const now = Date.now();
  const entriesToProcess = [];

  data.forEach((entry) => {
    // Skip placeholders
    if (entry.isPlaceholder) return;

    const minutesUntil = getMinutesUntil(entry.availableTime);
    // If tree is expired (-15 or less) and not estimated, mark it for respawn
    if (minutesUntil <= -15 && !entry.estimated) {
      entriesToProcess.push({
        world: entry.world,
        originalTime: entry.availableTime,
        type: entry.type,
      });
    }
  });

  // Remove expired non-estimated trees and evaluate if they should respawn
  if (entriesToProcess.length > 0) {
    const worldsToRemove = entriesToProcess.map((e) => e.world);
    data = data.filter(
      (entry) =>
        !(
          worldsToRemove.includes(entry.world) &&
          getMinutesUntil(entry.availableTime) <= -15 &&
          !entry.estimated
        ),
    );

    // Process each expired entry
    entriesToProcess.forEach((expiredEntry) => {
      // Calculate next spawn by adding 148 minutes to the original time
      const nextSpawnTime = expiredEntry.originalTime + 148 * 60 * 1000;
      const minutesUntilNextSpawn = getMinutesUntil(nextSpawnTime);

      // Only add estimated entry if it's not more than one cycle behind (not older than -148 minutes)
      if (minutesUntilNextSpawn > -148) {
        data.unshift({
          world: expiredEntry.world,
          availableTime: nextSpawnTime,
          capturedAt: now,
          type: null, // Reset tree type since we can't know what will spawn next
          estimated: true,
        });
      }
      // If minutesUntilNextSpawn <= -148, the entry is too stale and gets deleted (not re-added)
    });

    saveTreeData(data);
  }

  // If there's a saved sort state, re-apply it
  if (lastSortColumn !== null) {
    applySortToData(lastSortColumn, lastSortAscending);
  } else {
    // Just re-render if no sort was applied
    renderTable();
  }
}

// UTC Clock
function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, "0");
  const m = String(now.getUTCMinutes()).padStart(2, "0");
  document.getElementById("utcClock").textContent = `UTC: ${h}:${m}`;
}

// Apply sort to data (extracted from setupSorting for reuse)
function applySortToData(col, isAscending) {
  let data = loadTreeData();
  const splitMode = getSplitMode();

  // Update sort indicators
  const headers = document.querySelectorAll("th.sortable");
  headers.forEach((h) => h.classList.remove("asc", "desc"));
  const targetHeader = document.querySelector(`th.sortable[data-col="${col}"]`);
  if (targetHeader) {
    targetHeader.classList.toggle("asc", isAscending);
    targetHeader.classList.toggle("desc", !isAscending);
  }

  const sortFn = getSortFunction(col, isAscending);

  if (splitMode) {
    // Sort within each section
    const membersData = data.filter((e) => getWorldType(e.world) === "Members");
    const f2pData = data.filter((e) => getWorldType(e.world) !== "Members");

    membersData.sort(sortFn);
    f2pData.sort(sortFn);

    data = [...membersData, ...f2pData];
  } else {
    data.sort(sortFn);
  }

  saveTreeData(data);
  renderTable();
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadWorldsData();

  // Set initial split button text
  const splitBtn = document.getElementById("splitToggleBtn");
  if (splitBtn) {
    splitBtn.textContent = getSplitMode() ? "Show Mixed" : "Split by Type";
  }

  // Set initial placeholder button text
  const placeholderBtn = document.getElementById("placeholderToggleBtn");
  if (placeholderBtn) {
    placeholderBtn.textContent = getPlaceholderMode()
      ? "Hide Empty"
      : "Fill Empty";
  }

  renderTable();
  setupSorting();
  updateClock();
  setInterval(updateClock, 1000);

  // Synchronize countdown updates to start of each minute (0 seconds)
  const now = new Date();
  const msUntilNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  // Wait until the start of the next minute, then update every 60 seconds
  setTimeout(() => {
    updateCountdown(); // First update at start of minute
    setInterval(updateCountdown, 60000); // Then every minute
  }, msUntilNextMinute);

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
  document
    .getElementById("placeholderToggleBtn")
    .addEventListener("click", togglePlaceholderMode);
  document
    .getElementById("addManualBtn")
    .addEventListener("click", addManualEntry);
  document
    .getElementById("importDiscordBtn")
    .addEventListener("click", importDiscordList);

  // Enter key on manual entry inputs
  document.getElementById("manualWorld").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("manualMins").focus();
    }
  });
  document.getElementById("manualMins").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addManualEntry();
    }
  });

  // Enable right-click context menu for textarea and input fields
  const addContextMenuToElement = (element) => {
    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      const menu = document.createElement("div");
      menu.style.position = "fixed";
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;
      menu.style.background = "#2d2d2d";
      menu.style.border = "1px solid #555";
      menu.style.borderRadius = "4px";
      menu.style.padding = "4px 0";
      menu.style.zIndex = "10000";
      menu.style.minWidth = "100px";
      menu.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

      const menuItems = [
        {
          label: "Paste",
          action: async () => {
            const text = await navigator.clipboard.readText();
            const start = element.selectionStart;
            const end = element.selectionEnd;
            element.value =
              element.value.substring(0, start) +
              text +
              element.value.substring(end);
            element.selectionStart = element.selectionEnd = start + text.length;
            element.focus();
          },
        },
      ];

      menuItems.forEach((item) => {
        const menuItem = document.createElement("div");
        menuItem.textContent = item.label;
        menuItem.style.padding = "6px 12px";
        menuItem.style.cursor = "pointer";
        menuItem.style.color = "#e0e0e0";
        menuItem.style.fontSize = "13px";

        menuItem.addEventListener("mouseenter", () => {
          menuItem.style.background = "#0d6efd";
        });
        menuItem.addEventListener("mouseleave", () => {
          menuItem.style.background = "transparent";
        });
        menuItem.addEventListener("click", async () => {
          await item.action();
          if (document.body.contains(menu)) {
            document.body.removeChild(menu);
          }
        });

        menu.appendChild(menuItem);
      });

      document.body.appendChild(menu);

      // Close menu on click outside
      const closeMenu = (event) => {
        if (!menu.contains(event.target)) {
          if (document.body.contains(menu)) {
            document.body.removeChild(menu);
          }
          document.removeEventListener("click", closeMenu);
        }
      };
      setTimeout(() => document.addEventListener("click", closeMenu), 0);
    });
  };

  // Add context menu to textarea and input fields
  addContextMenuToElement(document.getElementById("importDiscord"));

  // Listen for new entries from main process
  window.electronAPI.ipc.on(
    "tree-log-add-entry",
    ({ world, treeTime, estimated }) => {
      console.log("[TREE_LOG] Received entry:", {
        world,
        treeTime,
        estimated,
      });
      addEntry(world, treeTime, estimated || false);
    },
  );

  // Listen for storage changes (if multiple windows open)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      renderTable();
    }
  });
});
