# Shopping List App

A beautiful and smooth mobile-first shopping list web application built with React and Tailwind CSS.

## Features

- **Current Shopping List**: Add and remove items from your active shopping list
- **Quick Add Input**: Simple input field to add new items
- **History**: Automatically tracks previously added items
- **Smart History Ordering**: History items are sorted by recency (most recently used first)
- **One-Click Add from History**: Click any history item to quickly add it back to your list
- **Persistent Storage**: All data is saved to localStorage and persists across sessions
- **Mobile-Optimized**: Designed primarily for mobile viewing with a responsive layout
- **Beautiful UI**: Gradient backgrounds, smooth transitions, and modern design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the App

Start the development server:
```bash
npm start
```

The app will open in your browser at [http://localhost:3000](http://localhost:3000).

### Building for Production

Create an optimized production build:
```bash
npm run build
```

## Usage

### Adding Items
1. Type an item name in the "Add new..." input field
2. Press Enter or click the + button to add it to your list

### Removing Items from List
- Click the small 'x' button in the top-right corner of any item in the current list

### Using History
- Previously added items appear in the History section
- Click any history item to quickly add it back to your current list
- History items are automatically sorted by most recently used
- Remove items from history by clicking the 'x' button (this won't affect your current list)

## Technology Stack

- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework for beautiful styling
- **localStorage**: Browser storage for data persistence

## Project Structure

```
shopping-list/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main application component
│   ├── index.js        # Application entry point
│   └── index.css       # Tailwind CSS imports
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## License

This project is open source and available for personal use.
