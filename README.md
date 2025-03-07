# Fish Launcher

A modern game launcher and updater built with Electron, Vue, and TypeScript.

## Features

- Game version checking and automatic updates
- News feed with images and content
- Settings management
- Logging system
- Cross-platform support (Windows, macOS, Linux)

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/kitanz/fishlauncher.git
cd fishlauncher
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
SERVER_URL=http://localhost/get-updates
APP_NAME=Fish Launcher
APP_VERSION=1.0.0
```

### Development Commands

- Start the development server:
```bash
npm run dev
```

- Build the application:
```bash
npm run build
```

- Build for specific platforms:
```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Project Structure

```
fishlauncher/
├── build/                # Build resources
├── resources/            # Application resources
├── src/
│   ├── main/             # Electron main process
│   │   ├── modules/      # Modular main process code
│   │   └── index.ts      # Main entry point
│   ├── preload/          # Preload scripts
│   └── renderer/         # Frontend (Vue)
│       ├── src/
│       │   ├── assets/   # Static assets
│       │   ├── components/# Vue components
│       │   ├── stores/   # Pinia stores
│       │   ├── utils/    # Utility functions
│       │   ├── views/    # Vue views
│       │   ├── App.vue   # Main Vue component
│       │   └── main.ts   # Renderer entry point
│       ├── index.html    # HTML template
│       └── types.ts      # TypeScript types
├── .env                  # Environment variables
├── electron-builder.yml  # Electron builder config
└── package.json          # Project metadata
```

## Server Setup

The launcher expects a server with the following endpoints:

- `{SERVER_URL}/version.json` - Contains the latest game version information
- `{SERVER_URL}/news.json` - Contains news items
- `{SERVER_URL}/{update-file}` - Update files referenced in version.json

Example `version.json`:
```json
{
  "version": "1.0.0",
  "file": "updates/game-1.0.0.zip",
  "releaseDate": "2023-01-01",
  "releaseNotes": "Initial release"
}
```

Example `news.json`:
```json
[
  {
    "id": 1,
    "title": "Welcome to Fish Launcher",
    "date": "2023-01-01",
    "content": "This is the first news item.",
    "image": "http://example.com/images/news1.jpg"
  }
]
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
