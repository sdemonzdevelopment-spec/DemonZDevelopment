document.addEventListener("DOMContentLoaded", () => {
    
    // --- START: API Configuration ---
    const API_BASE_URL = "/api"; 
    const FALLBACK_ALL_PLUGINS_URL = "all-plugins.json"; 
    // --- END: API Configuration ---

    // --- DOM ELEMENTS ---
    const contentContainer = document.getElementById("plugin-detail-content");
    const spinner = document.getElementById("loading-spinner");

    // --- HELPER FUNCTIONS ---
    function showSpinner(visible) {
        if (spinner) {
            spinner.style.display = visible ? 'block' : 'none';
        }
    }

    function showError(message) {
        showSpinner(false);
        contentContainer.innerHTML = `<h2 class="plugin-detail-error">${message}</h2>`;
    }

    /**
     * Renders the plugin data into the HTML container.
     * @param {object} plugin - The plugin data object.
     * @param {string} downloadUrl - The pre-configured download URL (handles API vs. Fallback).
     */
    function renderPlugin(plugin, downloadUrl) {
        showSpinner(false);

        // --- Process Data ---
        const name = plugin.name || "Unknown Plugin";
        const tagline = plugin.tagline || "No tagline available.";
        const imageUrl = plugin.imageUrl || "https://via.placeholder.com/150?text=DemonZ"; // A default placeholder
        const version = plugin.version || "1.0.0";
        const downloads = plugin.downloads || 0;
        const description = plugin.description || "No description provided.";
        const author = plugin.author || "DemonZ Development";
        const updatedAt = plugin.updatedAt ? new Date(plugin.updatedAt).toLocaleDateString() : "Unknown";
        const sourceUrl = plugin.source_url; // Will be undefined if not present

        // --- Build HTML ---
        let sourceLinkHtml = '';
        if (sourceUrl) {
            sourceLinkHtml = `<li><strong>Source:</strong> <a href="${sourceUrl}" target="_blank">View on GitHub</a></li>`;
        }

        const html = `
            <div class="plugin-header">
                <img src="${imageUrl}" alt="${name} Icon" class="plugin-image">
                <div class="plugin-title-info">
                    <h1 id="plugin-name">${name}</h1>
                    <p id="plugin-tagline">${tagline}</p>
                    <div class="plugin-meta">
                        <span id="plugin-version">Version: ${version}</span>
                        <span id="plugin-downloads"><i class="fas fa-download"></i> ${downloads} Downloads</span>
                    </div>
                </div>
                <div class="plugin-actions">
                    <a href="${downloadUrl}" id="plugin-download-btn" class="cta-button" target="_blank">Download Now</a>
                </div>
            </div>

            <div class="plugin-body">
                <div class="plugin-description">
                    <h2>Description</h2>
                    <div id="plugin-description-content" style="white-space: pre-wrap;"></div>
                </div>
                <div class="plugin-sidebar">
                    <h3>Plugin Info</h3>
                    <ul>
                        <li><strong>Author:</strong> <span id="plugin-author">${author}</span></li>
                        <li><strong>Updated:</strong> <span id="plugin-updated">${updatedAt}</span></li>
                        ${sourceLinkHtml}
                    </ul>
                </div>
            </div>
        `;

        // Inject the main HTML structure
        contentContainer.innerHTML = html;

        // --- IMPORTANT: Safe Text Injection ---
        // To prevent XSS, we inject the description (which could contain user text)
        // using .textContent. This ensures the browser treats it as plain text, not HTML.
        const descriptionElement = document.getElementById("plugin-description-content");
        if (descriptionElement) {
            descriptionElement.textContent = description;
        }
    }

    /**
     * Fetches the plugin details from the API or Fallback
     * @param {string} slug - The plugin slug from the URL
     */
    async function fetchPluginDetails(slug) {
        showSpinner(true);
        try {
            // 1. Try to fetch from the LIVE Node.js API
            const response = await fetch(`${API_BASE_URL}/plugins/${slug}`);
            
            if (response.status === 404) {
                throw new Error("Plugin not found.");
            }
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            
            const plugin = await response.json();
            const downloadUrl = `${API_BASE_URL}/plugins/download/${plugin.slug}`;
            renderPlugin(plugin, downloadUrl);
            
        } catch (error) {
            // 2. If API fails, load from FALLBACK
            console.warn("API fetch failed, loading from fallback file.", error.message);
            
            if (error.message === "Plugin not found.") {
                showError("404 - Plugin Not Found");
                return;
            }

            try {
                const fallbackResponse = await fetch(FALLBACK_ALL_PLUGINS_URL);
                if (!fallbackResponse.ok) {
                    throw new Error("Fallback file not found.");
                }
                
                const fallbackPlugins = await fallbackResponse.json();
                
                // Find the specific plugin in the full list
                const plugin = fallbackPlugins.find(p => p.slug === slug);

                if (plugin) {
                    // Use static download link for fallback
                    const downloadUrl = `/plugins/${plugin.jarFile || plugin.slug + '.jar'}`;
                    renderPlugin(plugin, downloadUrl);
                } else {
                    // Found the fallback file, but the slug is not in it
                    showError("404 - Plugin Not Found");
                }
                
            } catch (fallbackError) {
                // 3. If BOTH fail
                console.error("Failed to load both API and fallback.", fallbackError);
                showError("Error: Could not load plugin data. Please try again later.");
            }
        }
    }

    // --- INITIAL PAGE LOAD ---
    // Get the slug from the URL (e.g., plugin-detail.html?slug=my-plugin)
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (slug) {
        fetchPluginDetails(slug);
    } else {
        showError("No plugin specified. Please go back to the Plugin Hanger.");
    }
});
