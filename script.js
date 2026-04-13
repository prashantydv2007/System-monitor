/**
 * System Monitoring Dashboard Logic
 * Handles real-time simulation of CPU, RAM, and Storage metrics,
 * intelligently analyzes the data for insights, and manages visual alerts.
 */

// Configuration thresholds
const THRESHOLDS = {
    cpu: { warning: 60, critical: 80 },
    ram: { warning: 70, critical: 85 },
    storage: { warning: 80, critical: 95 }
};

// State variables for metrics
let state = {
    cpu: 25,
    ram: 45,
    storage: 75,
    maxRamGB: 16,
    maxStorageGB: 512
};

// Keeps track of active alerts to prevent spamming
let activeAlerts = {
    cpu: false,
    ram: false,
    storage: false
};

// DOM Elements
const elements = {
    cpu: {
        val: document.getElementById('cpu-value'),
        bar: document.getElementById('cpu-bar'),
        card: document.getElementById('cpu-card')
    },
    ram: {
        val: document.getElementById('ram-value'),
        bar: document.getElementById('ram-bar'),
        details: document.getElementById('ram-details'),
        card: document.getElementById('ram-card')
    },
    storage: {
        val: document.getElementById('storage-value'),
        bar: document.getElementById('storage-bar'),
        details: document.getElementById('storage-details'),
        card: document.getElementById('storage-card')
    },
    insight: {
        text: document.getElementById('insight-text'),
        panel: document.getElementById('insights-panel')
    },
    statusDot: document.getElementById('global-status-dot'),
    statusText: document.getElementById('global-status-text'),
    alertContainer: document.getElementById('alert-container')
};

// Utility to get random number within a range
const getRandom = (min, max) => Math.random() * (max - min) + min;

// Simulation loop
function simulateMetrics() {
    // CPU fluctuates wildly
    let cpuDelta = getRandom(-15, 15);
    state.cpu = Math.max(2, Math.min(100, state.cpu + cpuDelta));
    
    // Periodically spike CPU to trigger alerts (for demonstration)
    if (Math.random() > 0.92) {
        state.cpu = getRandom(82, 98);
    }

    // RAM fluctuates slowly and in smaller increments
    let ramDelta = getRandom(-3, 4);
    state.ram = Math.max(10, Math.min(100, state.ram + ramDelta));
    
    // Periodically spike RAM
    if (Math.random() > 0.95) {
        state.ram = getRandom(86, 95);
    }

    // Storage rarely changes but creeps up slowly
    if (Math.random() > 0.8) {
        state.storage = Math.min(100, state.storage + getRandom(0, 0.5));
    }
    
    // Simulate near full storage rarely
    if(Math.random() > 0.98 && state.storage < 80) {
        state.storage = 96;
    }

    updateUI();
    analyzeSystem();
}

// Update the DOM based on exact metrics
function updateUI() {
    // --- CPU ---
    elements.cpu.val.textContent = `${Math.round(state.cpu)}%`;
    elements.cpu.bar.style.width = `${Math.round(state.cpu)}%`;
    updateProgressColor(elements.cpu.bar, elements.cpu.card, state.cpu, 'cpu');

    // --- RAM ---
    elements.ram.val.textContent = `${Math.round(state.ram)}%`;
    elements.ram.bar.style.width = `${Math.round(state.ram)}%`;
    updateProgressColor(elements.ram.bar, elements.ram.card, state.ram, 'ram');
    
    let currentRamGB = (state.ram / 100 * state.maxRamGB).toFixed(1);
    elements.ram.details.textContent = `${currentRamGB} GB / ${state.maxRamGB} GB`;

    // --- Storage ---
    elements.storage.val.textContent = `${Math.round(state.storage)}%`;
    elements.storage.bar.style.width = `${Math.round(state.storage)}%`;
    updateProgressColor(elements.storage.bar, elements.storage.card, state.storage, 'storage');
    
    let currentStorageGB = (state.storage / 100 * state.maxStorageGB).toFixed(0);
    elements.storage.details.textContent = `${currentStorageGB} GB / ${state.maxStorageGB} GB`;
}

// Map percentage to color (CSS variables)
function updateProgressColor(barElement, cardElement, value, type) {
    let colorVar = 'var(--color-good)';
    let glowVar = 'var(--glow-good)';
    
    let isCritical = false;
    let isWarning = false;

    if (value >= THRESHOLDS[type].critical) {
        colorVar = 'var(--color-critical)';
        glowVar = 'var(--glow-critical)';
        isCritical = true;
    } else if (value >= THRESHOLDS[type].warning) {
        colorVar = 'var(--color-warning)';
        glowVar = 'var(--glow-warning)';
        isWarning = true;
    }

    barElement.style.backgroundColor = colorVar;
    barElement.style.boxShadow = `0 0 10px ${glowVar}`;
    
    // Optional: add a slight glowing border to the card if critical
    if (isCritical) {
        cardElement.style.border = `1px solid rgba(239, 68, 68, 0.4)`;
        cardElement.style.boxShadow = `0 4px 20px rgba(239, 68, 68, 0.1)`;
    } else if (isWarning) {
        cardElement.style.border = `1px solid rgba(245, 158, 11, 0.4)`;
        cardElement.style.boxShadow = `0 4px 20px rgba(245, 158, 11, 0.1)`;
    } else {
        cardElement.style.border = `1px solid var(--border-color)`;
        cardElement.style.boxShadow = `0 4px 20px rgba(0, 0, 0, 0.2)`;
    }
}

// Intelligent Layer: Analyze state and generate human-readable insights & alerts
function analyzeSystem() {
    let conditions = [];
    
    if (state.cpu >= THRESHOLDS.cpu.critical) conditions.push('critical_cpu');
    if (state.ram >= THRESHOLDS.ram.critical) conditions.push('critical_ram');
    if (state.storage >= THRESHOLDS.storage.critical) conditions.push('critical_storage');
    
    // Handle Alerts
    handleAlerts(state.cpu, THRESHOLDS.cpu.critical, 'cpu', 'High CPU Load', 'CPU usage has exceeded 80%. System may become unresponsive.');
    handleAlerts(state.ram, THRESHOLDS.ram.critical, 'ram', 'Low Memory', 'RAM usage is above 85%. Consider closing unused applications.');
    handleAlerts(state.storage, THRESHOLDS.storage.critical, 'storage', 'Storage Full', 'Storage space is critically low. Clean up files soon.');

    // Insights logic
    if (conditions.length === 0) {
        if (state.cpu > THRESHOLDS.cpu.warning || state.ram > THRESHOLDS.ram.warning) {
            elements.insight.text.textContent = "System load is increasing. Monitoring resources for potential bottlenecks.";
            updateGlobalStatus('warning', 'Moderate Load');
        } else {
            elements.insight.text.textContent = "System is running efficiently. All resources are within normal parameters.";
            updateGlobalStatus('good', 'Online & Healthy');
        }
    } else if (conditions.length === 1) {
        if (conditions.includes('critical_cpu')) {
            elements.insight.text.textContent = "Heavy processing detected! CPU is maxing out. Tasks might take longer to complete.";
        } else if (conditions.includes('critical_ram')) {
            elements.insight.text.textContent = "Memory is almost full. The system might start swapping, causing severe slowdowns.";
        } else if (conditions.includes('critical_storage')) {
            elements.insight.text.textContent = "Your primary drive is almost full. Some applications may fail to save data.";
        }
        updateGlobalStatus('critical', 'Critical Warning');
    } else {
        elements.insight.text.textContent = "Multiple systems are experiencing critical loads! Immediate action is required to prevent instability.";
        updateGlobalStatus('critical', 'System Overload');
    }
}

function updateGlobalStatus(state, text) {
    elements.statusText.textContent = text;
    elements.statusDot.style.backgroundColor = `var(--color-${state})`;
    elements.statusDot.style.boxShadow = `0 0 10px var(--glow-${state})`;
}

// Creates an alert toast if condition met and not already active
function handleAlerts(value, threshold, type, title, message) {
    if (value >= threshold && !activeAlerts[type]) {
        // Trigger alert
        activeAlerts[type] = true;
        createToastAlert(type, title, message, 'critical');
    } else if (value < threshold - 5 && activeAlerts[type]) {
        // Cooldown: Remove active state when value drops safely below threshold
        activeAlerts[type] = false;
    }
}

function createToastAlert(id, title, message, severity) {
    const toast = document.createElement('div');
    toast.className = `alert-toast ${severity}`;
    toast.id = `alert-${id}`;
    
    // Icon
    let iconSvg = '';
    if (severity === 'critical') {
        iconSvg = `<svg class="alert-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <div class="alert-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <button class="alert-close" onclick="closeToast(this, '${id}')">&times;</button>
    `;

    elements.alertContainer.appendChild(toast);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            closeToast(toast.querySelector('.alert-close'), id);
        }
    }, 8000);
}

// Global function to close toast from HTML onclick
window.closeToast = function(btnElement, id) {
    let toast = btnElement.closest('.alert-toast');
    toast.style.animation = 'slideOut 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
    setTimeout(() => {
        if(toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 400);
}

// Init simulation
updateUI(); // Initial paint
setInterval(simulateMetrics, 1500); // UI updates roughly every 1.5s for that real-time feel
