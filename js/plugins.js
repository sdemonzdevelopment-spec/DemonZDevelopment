document.addEventListener("DOMContentLoaded", () => {
    
    // --- START: API Configuration ---
    const API_BASE_URL = "/api"; 
    const FALLBACK_ALL_PLUGINS_URL = "all-plugins.json"; 
    // --- END: API Configuration ---

    // --- GLOBAL STATE ---
    let allPlugins = []; // Master list of all plugins, fetched once

    // --- DOM ELEMENTS ---
    const featuredCard = document.getElementById("featured-plugin-card");
    const featuredSpinner = document.getElementById("featured-loading-spinner");
    const grid = document.getElementById("plugin-list-grid");
    const gridSpinner = document.getElementById("loading-spinner");
    
    const searchInput = document.getElementById("search-input");
    const categoryFilter = document.getElementById("filter-category");
    const sortBy = document.getElementById("sort-by");

    // --- DATA FETCHING (Runs once on page load) ---
    async function fetchData() {
        showSpinner(true, true); // Show both spinners
        
        try {
            // 1. Try to fetch from the LIVE Node.js API
            const response = await fetch(`${API_BASE_URL}/plugins`);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            
            let plugins = await response.json();
            // Store the API download URL directly
            allPlugins = plugins.map(plugin => ({
                ...plugin,
                download_url: `${API_BASE_URL}/plugins/download/${plugin.slug}`
            }));
            
        } catch (error) {
            // 2. If API fails, load from FALLBACK
            console.warn("API fetch failed, loading from fallback file.", error);
            
            try {
                const fallbackResponse = await fetch(FALLBACK_ALL_PLUGINS_URL);
                if (!fallbackResponse.ok) throw new Error("Fallback file not found.");
                
                let fallbackPlugins = await fallbackResponse.json();
                
                // Modify download_url for fallback mode
                // This assumes your JSON has a "jarFile" property
                allPlugins = fallbackPlugins.map(plugin => ({
                    ...plugin,
                    download_url: `/plugins/${plugin.jarFile || plugin.slug + '.jar'}` // Static fallback URL
                }));
                
            } catch (fallbackError) {
                // 3. If BOTH fail
                console.error("Failed to load all plugin data.", fallbackError);
                showError("featured", "Could not load featured plugin.");
                showError("grid", "Could not load plugin data.");
                return; // Stop execution
            }
        }
        
        // If we have data, render everything
        if (allPlugins.length > 0) {
            renderFeaturedPlugin();
            renderMainGrid(); // This filters, sorts, and displays the main grid
        } else {
            showError("featured", "No featured plugin available.");
            showError("grid", "No plugins found.");
        }
    }

    // --- RENDERING: FEATURED PLUGIN ---
    function renderFeaturedPlugin() {
        if (!featuredCard) return;

        // Find the featured plugin (logic: most downloaded)
        const featuredPlugin = [...allPlugins].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0];

        if (!featuredPlugin) {
             showError("featured", "No featured plugin available.");
             return;
        }

        const detailUrl = `plugin-detail.html?slug=${featuredPlugin.slug}`;

        featuredCard.innerHTML = `
            <div class="featured-plugin-image">
                <img src="${featuredPlugin.imageUrl || 'https://via.placeholder.com/400x250?text=DemonZ+Development'}" alt="${featuredPlugin.name}">
            </div>
            <div class="featured-plugin-info">
                <h3>${featuredPlugin.name}</h3>
                <p class="featured-tagline">${featuredPlugin.tagline || 'No tagline available.'}</p>
                <p class="featured-desc">${(featuredPlugin.description || 'No description.').substring(0, 150)}...</p>
                <div class="featured-plugin-footer">
                    <span class="plugin-downloads">
                        <i class="fas fa-download"></i> ${featuredPlugin.downloads || 0} Downloads
                    </span>
                    <div class="featured-plugin-buttons">
                        <a href="${detailUrl}" class="plugin-details-btn">View Details</a>
                        <a href="${featuredPlugin.download_url}" class="cta-button" target="_blank">Download</a>
                    </div>
                </div>
            </div>
        `;
        if(featuredSpinner) featuredSpinner.style.display = 'none';
    }

    // --- RENDERING: MAIN GRID (CONTROLLER) ---
    
    // This function is called every time a filter, sort, or search changes
    function renderMainGrid() {
        if (!grid) return;
        
        let processedPlugins = [...allPlugins];
        
        // 1. Get filter values
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const sortValue = sortBy.value;

        // 2. Filter by Category
        if (category !== 'all') {
            // Assumes your plugin data has a 'category' field. Defaults to 'utility' if missing.
            processedPlugins = processedPlugins.filter(p => (p.category || 'utility').toLowerCase() === category);
        }

        // 3. Filter by Search Term
        if (searchTerm) {
            processedPlugins = processedPlugins.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                (p.tagline && p.tagline.toLowerCase().includes(searchTerm)) ||
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );
        }

        // 4. Sort
        switch (sortValue) {
            case 'downloads':
                processedPlugins.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                break;
            case 'updated':
                // Assumes API provides a valid 'updatedAt' date string
                processedPlugins.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
                break;
            case 'name':
                processedPlugins.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        // 5. Display the final list
        displayGridPlugins(processedPlugins);
    }

    // This function just handles the HTML creation for the grid
    function displayGridPlugins(pluginArray) {
        grid.innerHTML = ""; // Clear grid (and spinner)

        if (pluginArray.length === 0) {
            grid.innerHTML = `<p class="no-results-message">No plugins found matching your criteria.</p>`;
            return;
        }

        pluginArray.forEach(plugin => {
            const pluginCard = document.createElement("div");
            pluginCard.className = "plugin-card";
            
            const detailUrl = `plugin-detail.html?slug=${plugin.slug}`;
            
            pluginCard.innerHTML = `
                <div class.plugin-card-content">
                    <h3>${plugin.name}</h3>
                    <p>${plugin.tagline || 'No description available.'}</p>
                </div>
                <div class="plugin-card-footer">
                    <span class="plugin-downloads">
                        <i class="fas fa-download"></i> ${plugin.downloads || 0}
                    </span>
                    <div>
                        <a href="${detailUrl}" class="plugin-details-btn">Details</a>
                        <a href="${plugin.download_url}" class="plugin-download-btn" target="_blank">Download</a>
                    </div>
                </div>
            `;
            grid.appendChild(pluginCard);
        });
    }
    
    // --- HELPER FUNCTIONS ---
    function showSpinner(featured, gridlist) {
        // Show/hide featured spinner
        if(featuredSpinner) featuredSpinner.style.display = featured ? 'flex' : 'none';
        if(featuredCard && !featured) featuredCard.style.minHeight = 'auto';

        // Show/hide grid spinner
        if(gridSpinner) gridSpinner.style.display = gridlist ? 'block' : 'none';
    }
    
    function showError(section, message) {
        if (section === "featured" && featuredCard) {
            if(featuredSpinner) featuredSpinner.style.display = 'none';
            featuredCard.innerHTML = `<p class="error-message">${message}</p>`;
        }
        if (section === "grid" && grid) {
            if(gridSpinner) gridSpinner.style.display = 'none';
            grid.innerHTML = `<p class="no-results-message">${message}</p>`;
        }
    }

    // --- EVENT LISTENERS ---
    if (searchInput) searchInput.addEventListener("input", renderMainGrid);
    if (categoryFilter) categoryFilter.addEventListener("change", renderMainGrid);
    if (sortBy) sortBy.addEventListener("change", renderMainGrid);

    // --- INITIAL LOAD ---
    fetchData();
    
});
