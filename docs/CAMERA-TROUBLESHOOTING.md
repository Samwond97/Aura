# Camera Timeout Troubleshooting Guide

## Understanding the "Timeout starting video source" Error

This error occurs when the browser attempts to access the camera but doesn't receive a video stream in the expected timeframe. This can happen for several reasons:

1. Another application is using the camera
2. The camera hardware is not responding properly
3. Browser permission issues
4. Browser configuration problems
5. Hardware driver issues

## Quick Solutions

Try these solutions in order:

### 1. Refresh the Page

Sometimes a simple page refresh can resolve temporary browser issues:

1. Close the authentication dialog if possible
2. Refresh the browser page
3. Try authentication again

### 2. Check Camera Permissions

Ensure your browser has permission to use the camera:

**Chrome**:
1. Click the lock/info icon in the address bar
2. Verify "Camera" permission is set to "Allow"
3. If not, change it and refresh the page

**Firefox**:
1. Click the lock/info icon in the address bar
2. Click "Connection Secure" > "More Information"
3. Go to "Permissions" tab and ensure camera access is allowed

**Safari**:
1. Go to Safari Preferences > Websites > Camera
2. Ensure the website is set to "Allow"

### 3. Close Other Applications

Other applications might be using your camera:

1. Close video conferencing apps (Zoom, Teams, Meet, etc.)
2. Close other browser tabs that might be using the camera
3. On Windows, check Task Manager for any running camera applications
4. On Mac, look for the green camera indicator in the menu bar

### 4. Try Incognito/Private Mode

Browser extensions can sometimes interfere with camera access:

1. Open a new incognito/private window
2. Navigate to the application
3. Try authentication again

### 5. Try Another Browser

If the issue persists, try a different browser:

- If using Chrome, try Firefox or Edge
- If using Firefox, try Chrome or Safari
- If using Safari, try Chrome or Firefox

### 6. Restart Your Browser

A full browser restart can help:

1. Close all browser windows
2. Reopen the browser
3. Try authentication again

### 7. Check for Hardware Issues

If still experiencing problems:

1. Verify the camera works in other applications
2. Check if your computer recognizes the camera in system settings
3. Consider updating your camera drivers

## Advanced Troubleshooting

### Browser Camera Testing

Test your camera directly in the browser:

1. Navigate to [https://webcamtests.com/](https://webcamtests.com/)
2. Run the camera test to see if your camera functions properly

### Browser Configuration

Some settings can affect camera behavior:

**Chrome**:
1. Type `chrome://settings/content/camera` in address bar
2. Ensure sites can ask to use your camera
3. Check if the site is in the blocked list

**Firefox**:
1. Go to Options/Preferences
2. Select Privacy & Security
3. Scroll to Permissions section
4. Click "Settings" next to Camera
5. Ensure the site isn't blocked

### System Level Camera Privacy Settings

**Windows 10/11**:
1. Go to Settings > Privacy > Camera
2. Ensure "Allow apps to access your camera" is turned on
3. Ensure browser is allowed camera access

**macOS**:
1. Go to System Preferences > Security & Privacy > Privacy
2. Select Camera from the left sidebar
3. Ensure your browser is checked

## Still Having Issues?

If none of these solutions work:

1. Try using an alternative authentication method if available
2. Contact support with details about your browser and operating system
3. Consider using the application on a different device temporarily

## Reporting Camera Problems

When reporting camera problems, please include:

1. Browser name and version
2. Operating system
3. Type of camera (built-in or external)
4. Exact error message
5. Steps you've already tried 