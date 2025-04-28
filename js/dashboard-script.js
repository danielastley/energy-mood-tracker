// --- Register Chart.js Date Adapter (Attempt inside DOMContentLoaded is safer) ---
// We will place the actual registration call inside the listener below.

// --- Global Variables ---
let allData = [];
let uniqueDateKeys = [];
let uniqueWeekStartKeys = [];
let currentView = 'intraDay';
let selectedDateKey = null;
let selectedWeekStartKey = null;
let dayChartInstance = null;
let weekChartInstance = null;

// --- Chart Colors ---
const energyColor = 'rgba(255, 159, 64, 1)';
const moodColor = 'rgba(54, 162, 235, 1)';
const energyBgColor = 'rgba(255, 159, 64, 0.2)';
const moodBgColor = 'rgba(54, 162, 235, 0.2)';

// --- DOM Elements (Assign inside DOMContentLoaded) ---
let messageArea, intraDayViewBtn, intraWeekViewBtn, intraDayViewDiv, intraWeekViewDiv;
let dayChartCanvas, weekChartCanvas, dayNavButtonsDiv, weekNavButtonsDiv;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Reverted Script"); // DEBUG

// *** REVISED ADAPTER CHECK HERE (Using internal Chart property) ***
try {
    if (typeof Chart !== 'undefined' && typeof luxon !== 'undefined' && typeof Chart._adapters !== 'undefined' && typeof Chart._adapters._date !== 'undefined') {
         console.log("Luxon adapter seems loaded via Chart._adapters._date.");
         // No explicit Chart.register needed here usually
    } else {
        console.error("Check failed: Chart object or its date adapter property not found.",
            "Chart:", typeof Chart, "Chart._adapters:", typeof Chart?._adapters, "Chart._adapters._date:", typeof Chart?._adapters?._date);
         showMessage("Error: Failed to load necessary date components for charts.", true);
         return;
    }
} catch (e) {
     console.error("Error during adapter check:", e);
     showMessage("Error: Failed to initialize charting date components.", true);
     return;
}
// *** END REVISED ADAPTER CHECK ***

    // Assign DOM Elements now that DOM is ready
    messageArea = document.getElementById('messageArea');
    intraDayViewBtn = document.getElementById('intraDayViewBtn');
    intraWeekViewBtn = document.getElementById('intraWeekViewBtn');
    intraDayViewDiv = document.getElementById('intraDayView');
    intraWeekViewDiv = document.getElementById('intraWeekView');
    dayChartCanvas = document.getElementById('dayChartCanvas');
    weekChartCanvas = document.getElementById('weekChartCanvas');
    dayNavButtonsDiv = document.getElementById('dayNavButtons');
    weekNavButtonsDiv = document.getElementById('weekNavButtons');

    // Check if essential elements exist
    if (!messageArea || !intraDayViewBtn || !intraWeekViewBtn || !dayChartCanvas || !weekChartCanvas || !dayNavButtonsDiv || !weekNavButtonsDiv) {
         console.error("Dashboard initialization failed: One or more essential HTML elements not found.");
         if (messageArea) showMessage("Error: Dashboard UI elements missing.", true);
         return; // Stop initialization
    }

    setupEventListeners();
    fetchData(); // Start fetching data
}); // End DOMContentLoaded

// --- Event Listeners ---
function setupEventListeners() {
    if (intraDayViewBtn) intraDayViewBtn.addEventListener('click', () => switchView('intraDay'));
    if (intraWeekViewBtn) intraWeekViewBtn.addEventListener('click', () => switchView('intraWeek'));
    // Listeners for day/week nav buttons are added dynamically in their render functions
}

// --- Data Fetching & Processing ---
async function fetchData() {
    showMessage('Loading data...');
    console.log("Dashboard Script: Starting fetchData...");
    try {
        // *** IMPORTANT: Verify this PHP script path is correct! ***
        const phpScriptUrl = 'get-energy-mood-data.php';
        console.log(`Dashboard Script: Fetching from URL: ${phpScriptUrl}`);
        const response = await fetch(phpScriptUrl);
        console.log(`Dashboard Script: Fetch response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Dashboard Script: Fetch failed! Response Text:", errorText);
            throw new Error(`HTTP error ${response.status} when fetching data.`);
        }

        const rawData = await response.json();
        console.log("Dashboard Script: Raw data type:", typeof rawData, "Is Array:", Array.isArray(rawData));

        if (rawData.error) throw new Error(`API Error: ${rawData.error}`);
        if (!Array.isArray(rawData)) throw new Error("Invalid data format received (expected array).");

        // Process data
        console.log(`Dashboard Script: Processing ${rawData.length} raw rows...`);
        allData = rawData
            .map((item, index) => {
                 if (!item || typeof item !== 'object' || !item.Timestamp || item.EnergyValue_0_100 === null || item.MoodValue_0_100 === null) {
                     console.warn(`Skipping invalid item at index ${index}:`, item); return null;
                 }
                 const dt = luxon.DateTime.fromSQL(item.Timestamp, { zone: 'Europe/London' });
                 if (!dt.isValid) {
                     console.warn(`Skipping row #${index} with invalid timestamp: ${item.Timestamp}, Reason: ${dt.invalidReason}`); return null;
                 }
                 const energyVal = parseFloat(item.EnergyValue_0_100);
                 const moodVal = parseFloat(item.MoodValue_0_100);
                 if (isNaN(energyVal) || isNaN(moodVal)) {
                      console.warn(`Skipping row #${index} with non-numeric energy/mood:`, item); return null;
                 }
                 return { timestamp: dt.toJSDate(), energy: energyVal, mood: moodVal, dateKey: dt.toISODate() };
            })
            .filter(item => item !== null)
            .sort((a, b) => a.timestamp - b.timestamp);
        console.log(`Dashboard Script: Processed ${allData.length} valid rows.`);

        if (allData.length === 0) {
            showMessage('No valid data found to display.', true); return;
        }

        // Calculate unique days and weeks
        calculateDateKeys();
        calculateWeekStartKeys();

        // Set initial selections
        selectedDateKey = uniqueDateKeys.length > 0 ? uniqueDateKeys[uniqueDateKeys.length - 1] : null;
        selectedWeekStartKey = uniqueWeekStartKeys.length > 0 ? uniqueWeekStartKeys[uniqueWeekStartKeys.length - 1] : null;
        console.log("Dashboard Script: Initial selections - Date:", selectedDateKey, "Week:", selectedWeekStartKey);

        hideMessage();
        renderUI(); // Initial render

    } catch (error) {
        console.error("Dashboard Script: Error caught in fetchData:", error);
        showMessage(`Error loading dashboard: ${error.message}`, true);
    }
} // End fetchData

function calculateDateKeys() {
    uniqueDateKeys = [...new Set(allData.map(item => item.dateKey))];
}

function calculateWeekStartKeys() {
    const weekStarts = new Set();
    allData.forEach(item => {
        const dt = luxon.DateTime.fromJSDate(item.timestamp);
        const weekStart = dt.startOf('week'); // Monday default
        weekStarts.add(weekStart.toISODate());
    });
    uniqueWeekStartKeys = [...weekStarts].sort();
}

// --- UI Rendering ---
function switchView(view) {
    currentView = view;
    if (intraDayViewBtn) intraDayViewBtn.classList.toggle('active', view === 'intraDay');
    if (intraWeekViewBtn) intraWeekViewBtn.classList.toggle('active', view === 'intraWeek');
    if (intraDayViewDiv) intraDayViewDiv.classList.toggle('active', view === 'intraDay');
    if (intraWeekViewDiv) intraWeekViewDiv.classList.toggle('active', view === 'intraWeek');
    renderUI();
}

function renderUI() {
    if (allData.length === 0) return;
    if (currentView === 'intraDay') {
        renderDayNavButtons();
        renderIntraDayChart();
    } else if (currentView === 'intraWeek') {
        renderWeekNavButtons();
        renderIntraWeekChart();
    }
}

// --- Intra-day View ---
function renderDayNavButtons() {
    if (!dayNavButtonsDiv) return;
    let buttonsHTML = '<p>Select Day:</p>';
    const daysToShow = uniqueDateKeys.slice(-14); // Show last 14 days
    daysToShow.forEach(dateKey => {
        const dt = luxon.DateTime.fromISO(dateKey);
        const displayDate = dt.toFormat('d');
        const fullDate = dt.toFormat('MMM d');
        const isSelected = dateKey === selectedDateKey;
        buttonsHTML += `<button class="nav-button ${isSelected ? 'selected' : ''}" data-datekey="${dateKey}" title="${fullDate}">${displayDate}</button>`;
    });
    dayNavButtonsDiv.innerHTML = buttonsHTML;
    dayNavButtonsDiv.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', (e) => {
            selectedDateKey = e.target.dataset.datekey;
            renderDayNavButtons(); // Update button selection style
            renderIntraDayChart(); // Update chart
        });
    });
}

function renderIntraDayChart() {
    if (!dayChartCanvas || !selectedDateKey) {
         console.log("IntraDayChart: Render skipped - canvas or selectedDateKey missing.");
         // Optionally clear or show message on canvas
         if(dayChartInstance) dayChartInstance.destroy();
         if(dayChartCanvas) {
             const ctx = dayChartCanvas.getContext('2d');
             ctx.clearRect(0, 0, dayChartCanvas.width, dayChartCanvas.height);
             ctx.textAlign = 'center';
             ctx.fillText("Select a day to view data.", dayChartCanvas.width / 2, 50);
         }
         return;
     }
    console.log(`IntraDayChart: Rendering for date ${selectedDateKey}`); // DEBUG

    const ctx = dayChartCanvas.getContext('2d');
    const dayData = allData.filter(item => item.dateKey === selectedDateKey);
    console.log(`IntraDayChart: Found ${dayData.length} data points for selected day.`); // DEBUG

    const energyChartData = dayData.map(item => ({ x: item.timestamp.valueOf(), y: item.energy }));
    const moodChartData = dayData.map(item => ({ x: item.timestamp.valueOf(), y: item.mood }));

    const startOfDay = luxon.DateTime.fromISO(selectedDateKey).set({ hour: 8, minute: 0, second: 0 });
    const endOfDay = luxon.DateTime.fromISO(selectedDateKey).set({ hour: 20, minute: 0, second: 0 });

    if (dayChartInstance) {
        dayChartInstance.destroy();
    }

    dayChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                { label: 'Energy', data: energyChartData, borderColor: energyColor, backgroundColor: energyBgColor, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, tension: 0.1 },
                { label: 'Mood', data: moodChartData, borderColor: moodColor, backgroundColor: moodBgColor, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, tension: 0.1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time', // THIS REQUIRES THE DATE ADAPTER
                    adapters: { date: { locale: 'en-GB' } }, // Optional: Specify locale if needed
                    min: startOfDay.valueOf(), max: endOfDay.valueOf(),
                    time: { unit: 'hour', tooltipFormat: 'HH:mm', displayFormats: { hour: 'HH:mm' } },
                    title: { display: true, text: 'Time of Day' }
                },
                y: { beginAtZero: true, max: 100, title: { display: true, text: 'Level (0-100)' } }
            },
            plugins: { tooltip: { mode: 'index', intersect: false }, legend: { position: 'top' } },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
     console.log("IntraDayChart: Chart rendered.");// DEBUG
}

// --- Intra-week View (Keep existing logic from previous correct version) ---
 function renderWeekNavButtons() {
     if (!weekNavButtonsDiv) return;
     let buttonsHTML = '<p>Select Week Starting (Monday):</p>';
     const weeksToShow = uniqueWeekStartKeys.slice(-12);
      weeksToShow.forEach(weekKey => {
          const dt = luxon.DateTime.fromISO(weekKey);
          const displayDate = dt.toFormat('MMM d');
          const isSelected = weekKey === selectedWeekStartKey;
          buttonsHTML += `<button class="nav-button ${isSelected ? 'selected' : ''}" data-weekkey="${weekKey}">${displayDate}</button>`;
      });
     weekNavButtonsDiv.innerHTML = buttonsHTML;
     weekNavButtonsDiv.querySelectorAll('.nav-button').forEach(button => {
          button.addEventListener('click', (e) => {
              selectedWeekStartKey = e.target.dataset.weekkey;
              renderWeekNavButtons();
              renderIntraWeekChart();
          });
      });
 }

function calculateDailyAverages(weekData) { /* ... Keep existing logic ... */
    const dailyTotals = {};
    weekData.forEach(item => {
        const dateKey = item.dateKey;
        if (!dailyTotals[dateKey]) {
            dailyTotals[dateKey] = { energySum: 0, moodSum: 0, count: 0 };
        }
        dailyTotals[dateKey].energySum += item.energy;
        dailyTotals[dateKey].moodSum += item.mood;
        dailyTotals[dateKey].count++;
    });
    const averages = {};
    for (const dateKey in dailyTotals) {
        averages[dateKey] = {
            avgEnergy: dailyTotals[dateKey].energySum / dailyTotals[dateKey].count,
            avgMood: dailyTotals[dateKey].moodSum / dailyTotals[dateKey].count
        };
    }
    return averages;
 }

function renderIntraWeekChart() { /* ... Keep existing logic, ensure weekStartDate uses Luxon ... */
    if (!weekChartCanvas || !selectedWeekStartKey) return;
     console.log(`IntraWeekChart: Rendering for week starting ${selectedWeekStartKey}`);// DEBUG
    const ctx = weekChartCanvas.getContext('2d');
    const weekStartDate = luxon.DateTime.fromISO(selectedWeekStartKey);
    const weekEndDate = weekStartDate.plus({ days: 6 });
    const weekData = allData.filter(item => {
        const itemDt = luxon.DateTime.fromJSDate(item.timestamp);
        return itemDt >= weekStartDate && itemDt <= weekEndDate.endOf('day');
    });
    const dailyAverages = calculateDailyAverages(weekData);
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const energyAvgData = [];
    const moodAvgData = [];
    for (let i = 0; i < 7; i++) {
        const currentDayKey = weekStartDate.plus({ days: i }).toISODate();
        energyAvgData.push(dailyAverages[currentDayKey]?.avgEnergy ?? null);
        moodAvgData.push(dailyAverages[currentDayKey]?.avgMood ?? null);
    }
    if (weekChartInstance) weekChartInstance.destroy();
    weekChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [ /* ... datasets using avg data ... */
             { label: 'Avg Energy', data: energyAvgData, borderColor: energyColor, backgroundColor: energyBgColor, borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, tension: 0.1, spanGaps: true },
             { label: 'Avg Mood', data: moodAvgData, borderColor: moodColor, backgroundColor: moodBgColor, borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, tension: 0.1, spanGaps: true }
         ]},
        options: { /* ... week chart options ... */
             responsive: true, maintainAspectRatio: false,
             scales: {
                 x: { title: { display: true, text: `Week Starting ${weekStartDate.toFormat('MMM d, yyyy')}` } },
                 y: { beginAtZero: true, max: 100, title: { display: true, text: 'Avg Level (0-100)' } }
             },
             plugins: { tooltip: { mode: 'index', intersect: false }, legend: { position: 'top' } },
             interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
     console.log("IntraWeekChart: Chart rendered.");// DEBUG
 }

// --- Utility Functions ---
function showMessage(msg, isError = false) {
    if (!messageArea) return;
    messageArea.textContent = msg;
    messageArea.className = isError ? 'error' : '';
    messageArea.style.display = 'block';
}
function hideMessage() {
    if (messageArea) messageArea.style.display = 'none';
}