// // // Scrape stock data from TradingView watchlist/screener


// function scrapeStocks() {
//   let stocks = [];

//   document.querySelectorAll("tr[data-rowkey]").forEach(row => {
//     let cells = row.querySelectorAll("td");

//     let ticker = cells[0]?.innerText;   // e.g. "NVDA\nNVIDIA Corporation"
//     let price  = cells[1]?.innerText;   // e.g. "179.81 USD"
//     let change = cells[2]?.innerText;   // e.g. "+1.02%"

//     if (ticker) {
//       stocks.push({ ticker, price, change });
//     }
//   });

//   console.log("Scraped stocks:", stocks);
//   return stocks;
// }

// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   if (msg.type === "SCRAPE_DATA") {
//     try {
//       let data = scrapeStocks();
//       sendResponse(data);
//     } catch (err) {
//       console.error("Scrape error:", err);
//       sendResponse([]);
//     }
//   }
//   return true;
// });


function scrapeAllTables() {
  let allTables = [];
  console.log("Scraping all tables...");

  document.querySelectorAll("table").forEach((table, tableIndex) => {
    let headers = [];
    let rowsData = [];

    // Get headers (if any)
    table.querySelectorAll("thead th").forEach(th => {
      headers.push(th.innerText.trim());
    });
    console.log(`Table ${tableIndex} headers:`, headers);

    // Fallback: generate generic headers if none found
    if (headers.length === 0) {
      let firstRow = table.querySelector("tr");
      if (firstRow) {
        let cols = firstRow.querySelectorAll("td, th").length;
        headers = Array.from({ length: cols }, (_, i) => `Column${i + 1}`);
      }
    }

    // Get rows
    table.querySelectorAll("tbody tr, tr").forEach(tr => {
      let cells = tr.querySelectorAll("td, th");
      if (cells.length > 0) {
        let rowObj = {};
        cells.forEach((cell, i) => {
          rowObj[headers[i] || `Column${i + 1}`] = cell.innerText.trim();
        });
        rowsData.push(rowObj);
      }
    });

    allTables.push({
      tableIndex,
      headers,
      rows: rowsData
    });
  });

  console.log("Scraped tables:", allTables);
  return allTables;
}

// ✅ Add this listener to respond to popup.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SCRAPE_DATA") {
    try {
      let data = scrapeAllTables();
      sendResponse(data);
    } catch (err) {
      console.error("Scrape error:", err);
      sendResponse([]);
    }
  }
  return true;
});
