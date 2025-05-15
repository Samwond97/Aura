# Enhanced Journal Features for Aura Bloom

This enhancement adds two powerful new features to the journal experience in the Aura Bloom application:

## 1. Voice Typing 

The voice typing feature allows users to input text through speech recognition, making journaling more accessible and efficient.

### Usage:
- Click the microphone icon in the toolbar to start voice typing
- Speak clearly to see your words transcribed in real-time
- Click the microphone icon again to stop voice typing
- Supports punctuation commands like "comma", "period", and "new line"

### Implementation Details:
- Uses the Web Speech API via react-speech-recognition
- Inserts text at the current cursor position in the editor
- Provides visual feedback when actively listening

## 2. File Attachments

The file attachment feature enables users to insert various types of files directly into their journal entries.

### Supported File Types:
- Images (jpg, png, gif, etc.)
- Videos (mp4, webm, etc.)
- Audio files (mp3, wav, etc.)
- PDFs

### Usage:
- Click the file upload icon in the toolbar
- Select a file from your device
- The file will be embedded in the journal entry
- Drag to reposition files within the entry
- Resize files using the controls that appear when hovering
- Delete files when no longer needed

### Implementation Details:
- Files are stored locally using object URLs
- Drag and drop functionality via @dnd-kit libraries
- Responsive design that adjusts to different screen sizes

## Integration

To use these enhanced features:

1. Launch the application
2. Navigate to the Journal section
3. Click on "New Entry" or edit an existing entry
4. Use the microphone and file upload icons in the toolbar

## Technical Notes

- All files are stored locally in the browser and do not leave your device
- Voice recognition accuracy depends on your browser and microphone quality
- Large file attachments may impact performance

## Future Enhancements

- Cloud storage for file attachments
- Improved voice command recognition for formatting
- Collaborative journaling with shared attachments 