# BuHikayeSenin (BHS) - API & Device Control System

## Overview
BuHikayeSenin (BHS) is a system that includes devices and a website to control them. The devices are preloaded with PDFs, and when a button is pressed, a selected PDF from a specified category is printed for users to read. The website panel allows management of devices, including:

- Controlling device status (active/disabled)
- Changing button categories
- Adding content for devices

## Features
- User authentication (Login/Register)
- Device and category management
- Content upload and retrieval
- PDF creation and processing
- File management (zip creation, upload handling)
- REST API with JSON responses

## API Endpoints

### User Endpoints
- `POST /login` - User login
- `POST /register` - Register a new user

### Device Management
- `GET /getDeviceInformation` - Retrieve device details
- `GET /allDevices` - Get all registered devices
- `POST /updateDeviceInformation` - Update device details
- `POST /updateDeviceButtons` - Update device button categories
- `POST /updateDeviceClock` - Update device clock settings
- `POST /changeDeviceStatus` - Enable/disable a device

### Content Management
- `GET /getCategories` - Get all categories
- `GET /getContents` - Get all contents
- `GET /getContents_category` - Get contents by category
- `GET /getLastContents` - Get latest contents
- `GET /getContent` - Get a specific content
- `POST /insertNewCategory` - Add a new category
- `POST /insertNewContent` - Add a new content
- `DELETE /deleteCategory` - Delete a category
- `DELETE /deleteContent` - Delete a content

### File Handling
- `GET /getPDF` - Retrieve a specific PDF
- `GET /downloadPDFs` - Download PDFs
- `GET /downloadZIP` - Download zipped contents
- `POST /uploadPhoto` - Upload an image
- `DELETE /deleteImages` - Remove uploaded images

## Installation & Setup

### Prerequisites
- Node.js
- MySQL database
- `npm install`

### Database Connection
Database connection is hardcoded in `database.js`:
```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'yourpassword',
  database: 'bhs_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### Running the Server
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   node server.js
   ```

The server will start on `http://localhost:2020/`.

## Folder Structure
```
📂 BuHikayeSenin
├── 📂 logos          # Logo images
│   ├── 1x1-ffffff7f.png  # Empty user image
├── 📂 public         # Public assets (Important: Must exist)
├── 📂 selfPackages   
│   ├── crypto.js     # Cryptographic functions
│   ├── database.js   # Database connection file
│   ├── fileJobs.js   # File handling logic
│   ├── fixer.sh      # PDF Generation Helper
├── 📂 tmp           
├── 📂 user_uploads   # User-specific uploads (Important: Must exist)
├── 📂 zipper         # Generated ZIP files (Important: Must exist)
├── package.json      # Node dependencies
├── package-lock.json # Dependency lock file
├── server.js         # Main API server
```

**⚠ Important:** Before running the project, ensure the following folders exist:
- `zipper`
- `public`
- `user_uploads`

If they don't exist, create them manually to avoid errors.

# IMPORTANT NOTICE
This project was made for 2 years and now retired. This code is for public use and base or anything else you want. I know there is a security issue but I don't mind to be hacked. Have fun!

## License
MIT License

