## Smart Inventory Tracker

A web app with frontend + backend that helps track inventory items: adding, editing, and monitoring stock. Built using JavaScript for the frontend, Python for backend logic, with a clear separation of concerns.

##Project Structure
```bash
Smart_Inventory_Tracker/
├─ backend/             # Python backend API / logic
├─ frontend/            # JavaScript frontend (UI)
├─ .vscode/             # VSCode config (settings, launch etc.)
├─ .gitignore
└─ README.md            # This documentation
```

## Features

Here are some core features the app includes:

- Add new inventory items (name, quantity, perhaps category)
- Edit or update existing items (change quantity, mark sold or used etc.)
- View a list dashboard of all items and their stock levels
- Frontend-backend communications
- Searching/filtering of items

## Getting Started
Prerequisites
- Python installed (version X or newer)
- Node.js & npm (or yarn) installed

Installation

1. Clone the repository:
```bash
git clone https://github.com/Shobhan1000/Smart_Inventory_Tracker.git
cd Smart_Inventory_Tracker
```

2. Backend setup:
```bash
cd backend
# (optional) create virtual environment
python -m venv venv
source venv/bin/activate   # macOS / Linux
# or
venv\Scripts\activate      # Windows

pip install -r requirements.txt
```

3. Frontend setup:
```bash
cd ../frontend
npm install
```

## Usage

1. Run backend server (from the backend/ folder).
2. Run the frontend UI (from frontend/ folder).
3. Use the frontend in browser to interact with inventory:
    - Add new items
    - Edit existing items
    - View list or dashboard
    - Filter / search items

## Roadmap / Future Enhancements

Some improvements could include:
- Authentication so users must log in to see / edit inventory
- Permissions / roles (e.g. viewer vs editor)
- Export / import inventory (CSV etc.)
- More detailed item metadata (price, supplier, category etc.)
- Better UI (sorting, filtering, responsive design)

## Contributing

- Fork the repo
- Create a new branch for your feature or fix (e.g. feature/alerts)
- Make changes and test
- Submit a pull request with description of what you added or changed