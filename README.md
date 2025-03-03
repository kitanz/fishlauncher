# Fish Launcher

A modern, sleek game launcher built with Electron, Vue, and TypeScript. Fish Launcher provides a seamless experience for managing game updates, news, and launching your favorite games.

![Fish Launcher Icon](resources/icon.png)

## Features

- **Game Management**: Set your game directory
- **Automatic Updates**: Check for and download game updates automatically
- **News Feed**: Stay up-to-date with the latest game news and announcements
- **Modern UI**: Clean, responsive interface
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fishlauncher.git
   cd fishlauncher
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   SERVER_URL=https://your-server-url.com/game-updates
   APP_NAME=Fish Launcher
   APP_VERSION=1.0.0
   DEFAULT_GAME_DIRECTORY=
   ENABLE_AUTO_UPDATES=true
   ```

4. Create sample `version.json` and `news.json` files in the project root for testing:
   
   **version.json**:
   ```json
   {
     "version": "1.0.0",
     "file": "game-update.zip",
     "notes": "Initial release"
   }
   ```

   **news.json**:
   ```json
   [
     {
       "id": 1,
       "title": "Welcome to Fish Launcher",
       "date": "2023-06-01",
       "content": "This is the first release of Fish Launcher. Enjoy!",
       "image": "https://example.com/images/welcome.jpg"
     }
   ]
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Building

Build the application for production:
```bash
npm run build
```

The built application will be in the `dist` directory.

## Project Structure

- `src/main`: Electron main process code
- `src/preload`: Preload scripts for secure IPC communication
- `src/renderer`: Vue frontend application
  - `src/renderer/src/views`: Vue components for different views
  - `src/renderer/src/assets`: Static assets and styles
  - `src/renderer/src/types`: TypeScript type definitions

## Configuration

### Environment Variables

- `SERVER_URL`: URL to the game update server
- `APP_NAME`: Name of the launcher application
- `APP_VERSION`: Version of the launcher application
- `DEFAULT_GAME_DIRECTORY`: Default directory for game installation
- `ENABLE_AUTO_UPDATES`: Enable or disable automatic updates

### Server API

The launcher expects the following endpoints on your server:

- `{SERVER_URL}/version.json`: Information about the latest game version
- `{SERVER_URL}/news.json`: Array of news items to display
- `{SERVER_URL}/{update-file}`: Game update files

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [electron-vite](https://github.com/alex8088/electron-vite)
