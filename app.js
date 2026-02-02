// ============================================
// IoT Remote API - System Vitals Dashboard
// Client Application
// ============================================

class VitalsMonitor {
    constructor() {
        // Configuration
        this.config = {
            apiEndpoint: 'http://localhost:3000',
            apiKey: '',
            refreshInterval: 5,
        };

        // State
        this.isRunning = false;
        this.intervalId = null;
        this.lastUpdate = null;

        // DOM Elements
        this.elements = {
            // Connection status
            connectionStatus: document.getElementById('connectionStatus'),
            lastUpdate: document.getElementById('lastUpdate'),

            // Metrics
            cpuValue: document.getElementById('cpuValue'),
            cpuBar: document.getElementById('cpuBar'),
            memoryValue: document.getElementById('memoryValue'),
            memoryBar: document.getElementById('memoryBar'),
            diskValue: document.getElementById('diskValue'),
            diskBar: document.getElementById('diskBar'),
            uptimeValue: document.getElementById('uptimeValue'),
            uptimeDetail: document.getElementById('uptimeDetail'),

            // Network
            networkRx: document.getElementById('networkRx'),
            networkTx: document.getElementById('networkTx'),

            // Settings
            settingsButton: document.getElementById('settingsButton'),
            settingsPanel: document.getElementById('settingsPanel'),
            closeSettings: document.getElementById('closeSettings'),
            apiEndpoint: document.getElementById('apiEndpoint'),
            apiKey: document.getElementById('apiKey'),
            refreshInterval: document.getElementById('refreshInterval'),
            applySettings: document.getElementById('applySettings'),
            resetSettings: document.getElementById('resetSettings'),

            // Error
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            errorClose: document.getElementById('errorClose'),
        };

        this.init();
    }

    init() {
        // Load settings from localStorage
        this.loadSettings();

        // Setup event listeners
        this.setupEventListeners();
        
        // Debug log
        console.log('VitalsMonitor initialized', {
            settingsButton: !!this.elements.settingsButton,
            settingsPanel: !!this.elements.settingsPanel
        });

        // Start monitoring if API key is present
        if (this.config.apiKey) {
            this.start();
        } else {
            this.showError('Please configure your API key in settings');
            this.updateConnectionStatus('error', 'Configuration required');
        }
    }

    setupEventListeners() {
        // Settings button - toggle panel
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', () => {
                console.log('Settings button clicked');
                this.toggleSettings();
            });
        } else {
            console.error('Settings button not found!');
        }

        // Close settings button
        this.elements.closeSettings.addEventListener('click', () => {
            this.hideSettings();
        });

        // Apply settings button
        this.elements.applySettings.addEventListener('click', () => {
            this.applySettings();
        });

        // Reset settings button
        this.elements.resetSettings.addEventListener('click', () => {
            this.resetSettings();
        });

        // Error close button
        this.elements.errorClose.addEventListener('click', () => {
            this.hideError();
        });

        // Enter key in settings
        [this.elements.apiEndpoint, this.elements.apiKey, this.elements.refreshInterval].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applySettings();
                }
            });
        });

        // Escape key to close settings
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.settingsPanel.style.display !== 'none') {
                this.hideSettings();
            }
        });
    }

    loadSettings() {
        const saved = localStorage.getItem('vitals-monitor-config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.config = { ...this.config, ...config };
                this.updateSettingsUI();
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('vitals-monitor-config', JSON.stringify(this.config));
    }

    updateSettingsUI() {
        this.elements.apiEndpoint.value = this.config.apiEndpoint;
        this.elements.apiKey.value = this.config.apiKey;
        this.elements.refreshInterval.value = this.config.refreshInterval;
    }

    toggleSettings() {
        const panel = this.elements.settingsPanel;
        if (!panel) {
            console.error('Settings panel not found');
            return;
        }
        
        const isHidden = panel.style.display === 'none' || !panel.style.display;
        if (isHidden) {
            this.showSettings();
        } else {
            this.hideSettings();
        }
    }

    showSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.style.display = 'block';
        }
    }

    hideSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.style.display = 'none';
        }
    }

    applySettings() {
        // Read values from inputs
        const endpoint = this.elements.apiEndpoint.value.trim();
        const apiKey = this.elements.apiKey.value.trim();
        const interval = parseInt(this.elements.refreshInterval.value, 10);

        // Validate
        if (!endpoint) {
            this.showError('API endpoint is required');
            return;
        }
        if (!apiKey) {
            this.showError('API key is required');
            return;
        }
        if (interval < 1 || interval > 60) {
            this.showError('Refresh interval must be between 1 and 60 seconds');
            return;
        }

        // Update config
        this.config.apiEndpoint = endpoint;
        this.config.apiKey = apiKey;
        this.config.refreshInterval = interval;

        // Save to localStorage
        this.saveSettings();

        // Restart monitoring
        this.stop();
        this.start();

        this.hideError();
        this.hideSettings();
    }

    resetSettings() {
        this.config = {
            apiEndpoint: 'http://localhost:3000',
            apiKey: '',
            refreshInterval: 5,
        };
        this.updateSettingsUI();
        this.saveSettings();
        this.stop();
        this.updateConnectionStatus('error', 'Configuration required');
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.updateConnectionStatus('connecting', 'Connecting...');

        // Fetch immediately
        this.fetchVitals();

        // Setup interval
        this.intervalId = setInterval(() => {
            this.fetchVitals();
        }, this.config.refreshInterval * 1000);
    }

    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.updateConnectionStatus('disconnected', 'Stopped');
    }

    async fetchVitals() {
        try {
            const url = `${this.config.apiEndpoint}/api/v1/system/vitals`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-API-Key': this.config.apiKey,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key');
                } else if (response.status === 404) {
                    throw new Error('API endpoint not found');
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }

            const data = await response.json();
            this.updateUI(data);
            this.updateConnectionStatus('connected', 'Connected');
            this.hideError();

        } catch (error) {
            console.error('Failed to fetch vitals:', error);
            this.showError(`Connection failed: ${error.message}`);
            this.updateConnectionStatus('error', 'Connection failed');
        }
    }

    updateUI(vitals) {
        // Update timestamp
        this.lastUpdate = new Date();
        this.elements.lastUpdate.textContent = this.formatTime(this.lastUpdate);

        // CPU Usage
        const cpu = vitals.cpu_usage || 0;
        this.elements.cpuValue.textContent = `${cpu.toFixed(1)}%`;
        this.updateBar(this.elements.cpuBar, cpu);

        // Memory Usage
        const memory = vitals.memory_usage || 0;
        this.elements.memoryValue.textContent = `${memory.toFixed(1)}%`;
        this.updateBar(this.elements.memoryBar, memory);

        // Disk Usage
        const disk = vitals.disk_usage || 0;
        this.elements.diskValue.textContent = `${disk.toFixed(1)}%`;
        this.updateBar(this.elements.diskBar, disk);

        // Uptime
        const uptime = vitals.uptime_seconds || 0;
        this.elements.uptimeValue.textContent = this.formatUptime(uptime);
        this.elements.uptimeDetail.textContent = this.formatUptimeDetail(uptime);

        // Network
        const rxBytes = vitals.network_rx_bytes || 0;
        const txBytes = vitals.network_tx_bytes || 0;
        this.elements.networkRx.textContent = this.formatBytes(rxBytes);
        this.elements.networkTx.textContent = this.formatBytes(txBytes);
    }

    updateBar(element, percentage) {
        element.style.width = `${percentage}%`;

        // Update color based on usage
        element.classList.remove('medium', 'high');
        if (percentage >= 90) {
            element.classList.add('high');
        } else if (percentage >= 70) {
            element.classList.add('medium');
        }
    }

    updateConnectionStatus(status, text) {
        this.elements.connectionStatus.className = `connection-status ${status}`;
        this.elements.connectionStatus.querySelector('.status-text').textContent = text;
    }

    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.style.display = 'flex';
    }

    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    formatUptimeDetail(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }

    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const monitor = new VitalsMonitor();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            monitor.stop();
        } else if (monitor.config.apiKey) {
            monitor.start();
        }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        monitor.stop();
    });
});
