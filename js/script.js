document.addEventListener("DOMContentLoaded", () => {
    
    // --- START: API Configuration ---
    // This is the URL for your Node.js backend API.
    // Since we're hosting on the same domain, we can just use relative paths.
    const API_BASE_URL = "/api"; 
    
    // This is the local JSON file to use if the API is down
    const FALLBACK_POPULAR_PLUGINS_URL = "popular-plugins.json";
    // --- END: API Configuration ---


    // --- Matrix Background Effect ---
    const canvas = document.getElementById('matrix-bg');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let letters = '01';
        let columns = Math.floor(canvas.width / 20);
        let drops = [];
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        function drawMatrix() {
            ctx.fillStyle = 'rgba(10, 10, 16, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00aaff';
            ctx.font = '15px monospace';
            for (let i = 0; i < drops.length; i++) {
                let text = letters[Math.floor(Math.random() * letters.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);
                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        setInterval(drawMatrix, 40);
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            columns = Math.floor(canvas.width / 20);
            drops = [];
            for (let i = 0; i < columns; i++) {
                drops[i] = 1;
            }
        });
    }

    // --- Typing Effect ---
    const typingText = document.getElementById('typing-effect');
    if (typingText) {
        const words = [
            "Elite Custom Minecraft Plugins.",
            "Powerful Web Development.",
            "Intelligent Discord Bots."
        ];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        function type() {
            const currentWord = words[wordIndex];
            const typeSpeed = isDeleting ? 75 : 150;
            if (isDeleting) {
                typingText.textContent = currentWord.substring(0, charIndex--);
            } else {
                typingText.textContent = currentWord.substring(0, charIndex++);
            }
            if (!isDeleting && charIndex === currentWord.length) {
                setTimeout(() => isDeleting = true, 3000);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
            }
            setTimeout(type, typeSpeed);
        }
        type();
    }

    // --- Responsive Hamburger Menu ---
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                if (navMenu.classList.contains("active")) {
                    hamburger.classList.remove("active");
                    navMenu.classList.remove("active");
                }
            });
        });
    }

    // --- On-Scroll Fade-in Animations ---
    const revealElements = document.querySelectorAll(".reveal-fade");
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --- Popular Plugins Section ---
    
    const pluginGrid = document.getElementById("plugin-grid");

    // Helper function to create the spinner
    function createSpinner() {
        const spinnerWrapper = document.createElement("div");
        spinnerWrapper.className = "loading-spinner visible";
        spinnerWrapper.innerHTML = `<div class"spinner"></div>`;
        return spinnerWrapper;
    }

    // Helper function to show an error
    function showPluginError(message) {
        if (pluginGrid) {
            pluginGrid.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    // Renders the plugin cards
    function displayPopularPlugins(plugins) {
        if (!pluginGrid) return;
        pluginGrid.innerHTML = ""; // Clear spinner or error

        if (!plugins || plugins.length === 0) {
            pluginGrid.innerHTML = `<p style="color: var(--text-secondary); text-align: center; grid-column: 1 / -1;">No popular plugins to show right now.</p>`;
            return;
        }

        plugins.forEach(plugin => {
            const pluginCard = document.createElement("div");
            pluginCard.className = "plugin-card";
            
            // This will be the link to the detail page
            const detailPageUrl = `plugin-detail.html?slug=${plugin.slug}`;

            pluginCard.innerHTML = `
                <div class="plugin-card-content">
                    <h3>${plugin.name}</h3>
                    <p>${plugin.tagline || plugin.description}</p>
                </div>
                <div class="plugin-card-footer">
                    <span class="plugin-downloads">
                        <i class="fas fa-download"></i> ${plugin.downloads || 0}
                    </span>
                    <a href="${detailPageUrl}" class="plugin-download-btn">View Details</a>
                </div>
            `;
            pluginGrid.appendChild(pluginCard);
        });
    }

    // Fetches the popular plugins
    async function fetchPopularPlugins() {
        if (!pluginGrid) return; // Don't run if the grid isn't on this page
        
        pluginGrid.innerHTML = ""; // Clear grid
        pluginGrid.appendChild(createSpinner()); // Add spinner

        try {
            // 1. Try to fetch from the LIVE Node.js API
            // Your API route will be /api/plugins, and we'll add a query
            const response = await fetch(`${API_BASE_URL}/plugins?limit=4`);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            
            const plugins = await response.json();
            displayPopularPlugins(plugins);
            
        } catch (error) {
            // 2. If the API fetch FAILS (server is down, etc.)
            console.warn("API fetch failed, loading from fallback file.", error);
            
            try {
                // Try to fetch the local FALLBACK file
                const fallbackResponse = await fetch(FALLBACK_POPULAR_PLUGINS_URL);
                if (!fallbackResponse.ok) {
                    throw new Error("Fallback file not found.");
                }
                
                const fallbackPlugins = await fallbackResponse.json();
                displayPopularPlugins(fallbackPlugins);
                
            } catch (fallbackError) {
                // 3. If BOTH the API and the fallback file fail
                console.error("Failed to load both API and fallback.", fallbackError);
                showPluginError("Could not load popular plugins.");
            }
        }
    }

    // Initial load
    fetchPopularPlugins();
});