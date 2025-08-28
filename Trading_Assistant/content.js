

function scrapeAllTables() {
  let allTables = [];
  console.log("Scraping all tables...");

  document.querySelectorAll("table").forEach((table, tableIndex) => {
    let headers = [];
    let rowsData = [];

    // Extract headers
    table.querySelectorAll("thead th").forEach(th => {
      headers.push(th.innerText.trim());
    });

    // Fallback headers if none exist
    if (headers.length === 0) {
      let firstRow = table.querySelector("tr");
      if (firstRow) {
        let cols = firstRow.querySelectorAll("td, th").length;
        headers = Array.from({ length: cols }, (_, i) => `Column${i + 1}`);
      }
    }

    // Extract rows (from tbody only)
    table.querySelectorAll("tbody tr").forEach(tr => {
      let cells = tr.querySelectorAll("td, th");
      if (cells.length > 0) {
        let rowObj = {};
        cells.forEach((cell, i) => {
          rowObj[headers[i] || `Column${i + 1}`] = cell.innerText.trim();
        });
        rowsData.push(rowObj);
      }
    });

    if (rowsData.length > 0) {
      allTables.push({ tableIndex, headers, rows: rowsData });
    }
  });

  console.log("Scraped tables:", allTables);
  return allTables;
}

// ✅ Listen for popup request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_DATA") {
    const data = scrapeAllTables();
    console.log("Scraped data to send:", data);
    sendResponse({ tables: data }); // return in consistent format
  }
});

async function fetchAndClickStocks() {
  const response = await fetch("http://127.0.0.1:8000/suggest_stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "tech stocks" })
  });

  const data = await response.json();

  if (data.success && Array.isArray(data.suggestions)) {
    // Get the table from page
    const table = document.querySelector("table"); // adjust selector
    if (!table) return;

    // Extract Symbol column
    let symbols = [];
    const headers = Array.from(table.querySelectorAll("thead th")).map(h => h.innerText.trim());
    const symbolIndex = headers.findIndex(h => h.toLowerCase() === "symbol");
    if (symbolIndex === -1) return;

    table.querySelectorAll("tbody tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      if (cells.length > symbolIndex) {
        symbols.push(cells[symbolIndex].innerText.trim());
      }
    });

    // Loop through unique suggestions
    data.suggestions.forEach(stock => {
      const suggestedSymbol = stock.split(" ")[0].trim(); // get ticker
      if (symbols.includes(suggestedSymbol)) {
        console.log("Clicking stock:", suggestedSymbol);

        // Example: find link by symbol and click
        let el = document.querySelector(`a[title*="${suggestedSymbol}"]`);
        if (el) el.click();
      }
    });
  }
}
