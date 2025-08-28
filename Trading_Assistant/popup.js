

document.getElementById("scrapeBtn").addEventListener("click", async () => {
  try {
    // Get the active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Ask content.js to scrape tables
    chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_DATA" }, async (response) => {
      if (!response || !response.tables || response.tables.length === 0) {
        document.getElementById("output").textContent = "❌ No tables found!";
        return;
      }

      console.log("✅ Scraped tables:", response.tables);

      try {
        // Send scraped data to backend
        const res = await fetch("http://127.0.0.1:5000/suggest_stocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tables: response.tables })
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }

        const data = await res.json();
        console.log("✅ Backend response:", data);

        // Show backend response in popup
        
        if (data.success && data.suggestions) {
  // Split suggestions into array and remove duplicates
        const suggestionsArray = [...new Set(data.suggestions.split(",").map(s => s.trim()))];

  // Create a nice HTML list
        const listHTML = suggestionsArray.map(stock => {
        const [symbol, ...nameParts] = stock.split(" ");
        const name = nameParts.join(" ");
      return `<li>⭐ <strong>${symbol}</strong> - ${name}</li>`;
    }).join("");

  // Inject into popup
  document.getElementById("output").innerHTML = `
    <h3>Suggested Stocks:</h3>
    <ul style="list-style-type:none; padding-left:0;">${listHTML}</ul>
  `;
} else {
  document.getElementById("output").textContent = "❌ No suggestions returned!";
}

      } catch (err) {
        console.error("❌ Error calling backend:", err);
        document.getElementById("output").textContent =
          "Error calling backend: " + err.message;
      }
    });
  } catch (err) {
    console.error("❌ Error scraping tab:", err);
    document.getElementById("output").textContent =
      "Error scraping tab: " + err.message;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_DATA") {
    const data = scrapeAllTables();
    console.log("Scraped data to send:", data);

    // Send to backend
    fetch("http://127.0.0.1:5000/suggest_stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tables: data })
    })
    .then(res => res.json())
    .then(resp => {
      console.log("Backend response:", resp);
      if (resp.success && resp.suggestions) {
        // Attach suggestions to message for popup
        sendResponse({ tables: data, suggestions: resp.suggestions });
        // Automatically click suggested stocks
        clickSuggestedStocks(resp.suggestions, data);
      } else {
        sendResponse({ tables: data, suggestions: [] });
      }
    })
    .catch(err => {
      console.error("Backend fetch error:", err);
      sendResponse({ tables: data, suggestions: [], error: err.message });
    });

    return true; // keep channel open for async
  }
});

// Helper function
function clickSuggestedStocks(suggestions, tables) {
  const table = document.querySelector("table"); 
  if (!table) return;
  console.log("Clicking suggested stocks:", suggestions);
  const headers = Array.from(table.querySelectorAll("thead th")).map(h => h.innerText.trim());
  const symbolIndex = headers.findIndex(h => h.toLowerCase() === "symbol");
  if (symbolIndex === -1) return;

  const symbols = [];
  table.querySelectorAll("tbody tr").forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length > symbolIndex) {
      symbols.push(cells[symbolIndex].innerText.trim());
    }
  });

  const uniqueSuggestions = [...new Set(suggestions)];
  uniqueSuggestions.forEach(stock => {
    const suggestedSymbol = stock.split(" ")[0].trim();
    if (symbols.includes(suggestedSymbol)) {
      console.log("Clicking stock:", suggestedSymbol);
      let el = document.querySelector(`a[title*="${suggestedSymbol}"]`);
      if (el) el.click();
    }
  });
}
