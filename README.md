# IoT Remote API - System Vitals Dashboard

A clean, modern web UI for monitoring system vitals from the IoT Remote API server. Inspired by the Zed editor's aesthetic with a dark theme, monospace fonts, and minimal design.

## Features

- **Real-time Monitoring**: Fetches system vitals at configurable intervals (1-60 seconds)
- **Visual Metrics**: 
  - CPU usage with progress bar
  - Memory usage with progress bar
  - Disk usage with progress bar
  - System uptime display
  - Network statistics (RX/TX bytes)
- **Color-coded Alerts**: Automatic color changes based on usage thresholds
  - Normal: Default color
  - Medium (70-89%): Warning color
  - High (90%+): Error color
- **Connection Status**: Live connection indicator with status messages
- **Persistent Settings**: Configuration saved to browser localStorage
- **Error Handling**: Clear error messages with retry logic
- **Responsive Design**: Works on desktop and mobile devices
- **Page Visibility API**: Automatically pauses when tab is hidden to save resources

## Quick Start

### 1. Prerequisites

Ensure the IoT Remote API server is running:

```bash
cd server/api
cargo run --release
```

The API server should be accessible at `http://localhost:3000`.

### 2. Open the Dashboard

Simply open the `index.html` file in your web browser:

```bash
# From the project root
cd ui
open index.html   # macOS
xdg-open index.html   # Linux
start index.html   # Windows
```

Or use a simple HTTP server (recommended for CORS):

```bash
# Python 3
python3 -m http.server 8080

# Node.js (if you have http-server)
npx http-server -p 8080
```

Then navigate to: `http://localhost:8080`

### 3. Configure Settings

On first load:

1. Enter your API endpoint (default: `http://localhost:3000`)
2. Enter your API key (configured in the server's `.env` file)
3. Set refresh interval (default: 5 seconds, range: 1-60)
4. Click **Apply Settings**

The dashboard will save your configuration and start fetching vitals data.

## Configuration

### API Endpoint

The URL where your IoT Remote API server is running:
- Local development: `http://localhost:3000`
- Network: `http://<server-ip>:3000`

### API Key

The API key must match one configured in your server's `.env` file:

```env
# Example .env in server/api/
API_KEYS=your-secret-api-key-here,another-key
```

### Refresh Interval

How often to poll the API for updates:
- **Minimum**: 1 second (high frequency, more network traffic)
- **Default**: 5 seconds (balanced)
- **Maximum**: 60 seconds (low frequency, less traffic)

**Note**: The dashboard automatically pauses polling when the browser tab is hidden.

## API Endpoints Used

The dashboard uses the following REST endpoint:

### GET `/api/v1/system/vitals`

**Headers**:
```
X-API-Key: your-api-key
```

**Response**:
```json
{
  "cpu_usage": 23.5,
  "memory_usage": 67.2,
  "disk_usage": 45.8,
  "network_rx_bytes": 1234567890,
  "network_tx_bytes": 987654321,
  "uptime_seconds": 86400
}
```

For detailed API documentation, see [SYSTEM_VITALS.md](../docs/SYSTEM_VITALS.md).

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)

Requires:
- ES6+ JavaScript support
- Fetch API
- localStorage
- CSS Grid

## Troubleshooting

### "Configuration required" error

**Solution**: Enter your API endpoint and API key in the Settings section.

### "Invalid API key" error

**Solution**: 
1. Check that your API key matches the one in the server's `.env` file
2. Restart the API server after changing `.env`

### "Connection failed" error

**Possible causes**:
1. API server not running → Start with `cargo run --release`
2. Wrong endpoint URL → Check Settings, ensure port matches server
3. CORS issues → Open UI via `http://` not `file://` (use http-server)
4. Firewall blocking connection → Check firewall rules

### No data displayed

**Solution**:
1. Open browser DevTools (F12) → Console tab
2. Check for error messages
3. Verify API server logs for errors
4. Test API directly: `curl -H "X-API-Key: your-key" http://localhost:3000/api/v1/system/vitals`

### CORS errors

If you see CORS errors in the browser console when opening from `file://`:

**Solution**: Serve the UI via HTTP:
```bash
cd ui
python3 -m http.server 8080
# Open http://localhost:8080
```

## Customization

### Changing Colors

Edit `styles.css` and modify the CSS variables at the top:

```css
:root {
    --color-bg-primary: #1e1e1e;  /* Main background */
    --color-accent-blue: #4fc1ff;  /* Primary accent */
    /* ... more variables */
}
```

### Changing Refresh Interval Default

Edit `app.js` and modify the default in the constructor:

```javascript
this.config = {
    apiEndpoint: 'http://localhost:3000',
    apiKey: '',
    refreshInterval: 5,  // Change this default
};
```

### Adding New Metrics

1. **HTML**: Add metric card to `index.html`
2. **CSS**: Style the new metric in `styles.css`
3. **JavaScript**: Update `updateUI()` method in `app.js` to handle new data

## Development

### File Structure

```
ui/
├── index.html      # Main HTML structure
├── styles.css      # Zed-inspired styling
├── app.js          # Application logic
└── README.md       # This file
```

### Code Organization

**app.js** follows a class-based architecture:

- `VitalsMonitor`: Main application class
  - `init()`: Initialize and load settings
  - `start()`: Start polling
  - `stop()`: Stop polling
  - `fetchVitals()`: Fetch data from API
  - `updateUI()`: Update DOM with new data
  - Helper methods for formatting

## License

This UI is part of the IoT Remote API project. See the main project README for license information.

## Related Documentation

- [System Vitals API](../docs/SYSTEM_VITALS.md)
- [Main Project README](../README.md)
- [API Documentation](../docs/)
