document.getElementById("scrapeBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_DATA" }, (response) => {
    document.getElementById("output").textContent = JSON.stringify(response, null, 2);
  });
});

