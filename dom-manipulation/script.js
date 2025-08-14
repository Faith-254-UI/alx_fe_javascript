// ============ DATA & STORAGE =============
let quotes = [];
const LOCAL_QUOTES_KEY = 'quotes';
const LAST_CATEGORY_KEY = 'lastCategory';

// ============ APP INIT =============
document.addEventListener('DOMContentLoaded', () => {
  loadQuotes();
  populateCategories();
  showRandomQuote();
  createAddQuoteForm();
  restoreLastCategory();
  document.getElementById('newQuote').onclick = showRandomQuote;
  document.getElementById('exportJson').onclick = exportQuotesAsJson;
  // Start simulated server sync
  setInterval(simulateServerSync, 10000); // every 10 seconds
});

// ============ QUOTE MANAGEMENT =============

// Show a random quote, respecting filter
function showRandomQuote() {
  let visibleQuotes = getFilteredQuotes();
  if (visibleQuotes.length === 0) {
    document.getElementById('quoteDisplay').textContent = 'No quotes available for this category.';
    return;
  }
  const randomIndex = Math.floor(Math.random() * visibleQuotes.length);
  const { text, category } = visibleQuotes[randomIndex];
  document.getElementById('quoteDisplay').textContent = `"${text}" — [${category}]`;
  // Save last viewed quote to sessionStorage
  sessionStorage.setItem('lastQuote', JSON.stringify(visibleQuotes[randomIndex]));
}

// Create and display the form to add a new quote
function createAddQuoteForm() {
  const formDiv = document.getElementById('addQuoteForm');
  formDiv.innerHTML = `
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteBtn">Add Quote</button>
  `;
  document.getElementById('addQuoteBtn').onclick = addQuote;
}

// Add a new quote from the form inputs
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const catInput = document.getElementById('newQuoteCategory');
  const text = textInput.value.trim();
  const category = catInput.value.trim();
  if (!text || !category) {
    alert('Please provide both quote text and category.');
    return;
  }
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  textInput.value = '';
  catInput.value = '';
  showRandomQuote();
}

// ============ CATEGORY & FILTERING =============

function populateCategories() {
  const select = document.getElementById('categoryFilter');
  const categories = Array.from(new Set(quotes.map(q => q.category)));
  // Save current selection
  const prev = select.value || 'all';
  select.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
  select.value = prev;
}

// Get quotes matching selected category
function getFilteredQuotes() {
  const select = document.getElementById('categoryFilter');
  const selected = select.value;
  if (selected === 'all') return quotes;
  return quotes.filter(q => q.category === selected);
}

// Filter quotes and show a new one
function filterQuotes() {
  const select = document.getElementById('categoryFilter');
  localStorage.setItem(LAST_CATEGORY_KEY, select.value);
  showRandomQuote();
}

// Restore last selected filter
function restoreLastCategory() {
  const last = localStorage.getItem(LAST_CATEGORY_KEY);
  if (last) {
    document.getElementById('categoryFilter').value = last;
    showRandomQuote();
  }
}

// ============ WEB STORAGE =============

function saveQuotes() {
  localStorage.setItem(LOCAL_QUOTES_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const data = localStorage.getItem(LOCAL_QUOTES_KEY);
  if (data) {
    try {
      quotes = JSON.parse(data);
    } catch {
      quotes = [];
    }
  } else {
    // Default seed quotes
    quotes = [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Life is what happens when you’re busy making other plans.", category: "Life" }
    ];
    saveQuotes();
  }
}

// ============ JSON IMPORT/EXPORT =============

function exportQuotesAsJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error();
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      showRandomQuote();
      alert('Quotes imported successfully!');
    } catch {
      alert('Invalid JSON file!');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ============ SERVER SYNC & CONFLICTS =============

// Simulate fetching quotes from a server (using JSONPlaceholder for demonstration)
function simulateServerSync() {
  const syncStatus = document.getElementById('syncStatus');
  fetch('https://jsonplaceholder.typicode.com/posts?_limit=3')
    .then(res => res.json())
    .then(serverData => {
      // Simulate server quotes structure
      const serverQuotes = serverData.map(post => ({
        text: post.title,
        category: 'Server'
      }));
      // Conflict resolution: server wins
      let updated = false;
      serverQuotes.forEach(sq => {
        if (!quotes.some(q => q.text === sq.text)) {
          quotes.push(sq);
          updated = true;
        }
      });
      if (updated) {
        saveQuotes();
        populateCategories();
        showRandomQuote();
        syncStatus.textContent = "Quotes synced with server and updated!";
      } else {
        syncStatus.textContent = "No new updates from server.";
      }
      setTimeout(() => { syncStatus.textContent = ""; }, 4000);
    })
    .catch(() => {
      syncStatus.textContent = "Server sync failed.";
      setTimeout(() => { syncStatus.textContent = ""; }, 4000);
    });
}