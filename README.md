# TradingView Stock Suggestion Scraper

A Chrome Extension that scrapes stock tables from [TradingView](https://www.tradingview.com/), sends the data to a backend AI model, and displays suggested promising stocks in a clean, interactive popup. It also highlights and clicks the suggested stock symbols on the page automatically.  
 

---

## Features

- Scrapes stock tables (`<table>` elements) from TradingView pages.
- Sends scraped data to a FastAPI backend for AI-based stock suggestions.
- Displays suggested stocks in a user-friendly, aligned format with symbols and company names.
- Automatically highlights or clicks suggested stocks on the webpage.
- Fully asynchronous and lightweight.

---

# Installation

### Backend

1. Clone the repository:

```bash
git clone <repo_url>
cd TradingView-Scraper
```
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the FastAPI backend:

```bash
uvicorn app:app --reload --port 5000

```
Make sure the backend is running at http://127.0.0.1:5000.

## Chrome Extension

1. Open Chrome and go to chrome://extensions/.

2. Enable Developer mode (top-right).

3. Click Load unpacked and select the extension folder (TradingView-Scraper/).

4. Pin the extension for easy access.

## Usage

1. Navigate to a TradingView page with stock tables.

2. Click the extension icon and then Suggest Stocks.

3. The extension will:

 i. Scrape all tables on the page.

 ii. Send the data to the backend for AI suggestions.

iii. Display suggested stocks in the popup.

## Technical Details

1. Content Script (content.js): Scrapes table headers and rows, communicates with popup.

2. Popup (popup.js): Sends table data to backend, formats AI-generated suggestions, displays them neatly.

3. Backend (app.py) : FastAPI + Transformers

## Dependencies

1. Chrome Extension

2. Chrome Manifest V3

3. JavaScript, HTML, CSS

4. Backend

5. fastapi

6. uvicorn

7. transformers

8. torch

## License

MIT License © 2025

