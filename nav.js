import { fetchRSS, sanitizeHTML } from './rssClient.js';

// ===========================================
// CONFIGURATION
// ===========================================
const CONFIG = {
    github: {
        username: 'richmond070', // Replace with your GitHub username
        // Option 1: Use topics to categorize (Recommended)
        backendTopics: [
            'backend', 'api', 'django', 'rest-api', 
            'flask', 'typescript', 'javascript', 
        ],
        dataEngineeringTopics: [
            'data-engineering', 'etl', 'pipeline',
             'data-warehouse', 'airflow'
        ],
        
        maxProjectsPerCategory: 3

        // Option 2: Manual project configuration (Fallback)
        // manualProjects: {
        //     backend: [
        //         // Add repo names for backend projects
        //         'school-management-api',
        //         'ecommerce-backend'
        //     ],
        //     dataEngineering: [
        //         // Add repo names for data engineering projects
        //         'etl-pipeline-project',
        //         'data-warehouse-analytics'
        //     ]
        // }
    },
};

// ===========================================
// MOBILE NAVIGATION
// ===========================================
const primaryNav = document.querySelector(".primary-navigation");
const navToggle = document.querySelector(".mobile-nav-toggle");

if (navToggle) {
    navToggle.addEventListener("click", () => {
        const visibility = primaryNav.getAttribute("data-visible");
        
        if (visibility === "false") {
            primaryNav.setAttribute("data-visible", "true");
            navToggle.setAttribute("aria-expanded", "true");
        } else {
            primaryNav.setAttribute("data-visible", "false");
            navToggle.setAttribute("aria-expanded", "false");
        }
    });
}

// ===========================================
// SMOOTH SCROLLING & ACTIVE NAVIGATION
// ===========================================
const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        // Close mobile menu if open
        if (primaryNav.getAttribute("data-visible") === "true") {
            primaryNav.setAttribute("data-visible", "false");
            navToggle.setAttribute("aria-expanded", "false");
        }
        
        // Scroll to section
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// Active Navigation on Scroll
const sections = document.querySelectorAll('section[id]');

function highlightNavOnScroll() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', highlightNavOnScroll);

// ===========================================
// PROJECT TABS
// ===========================================
const tabBtns = document.querySelectorAll('.tab-btn');
const projectGrids = document.querySelectorAll('.project-grid');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        projectGrids.forEach(grid => grid.classList.remove('active-tab'));
        
        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active-tab');
    });
});

// ===========================================
// GITHUB PROJECTS FETCHER
// ===========================================

/**
 * Fetch GitHub repositories and categorize them
 */
async function fetchGitHubProjects() {
    const backendGrid = document.getElementById('backend');
    const dataGrid = document.getElementById('data');

    try {
        console.log('🔄 Fetching GitHub repositories...');

        const response = await fetch(
            `https://api.github.com/users/${CONFIG.github.username}/repos?sort=updated&per_page=100`,
            {
                headers: {
                    // Required if you want repo.topics to be returned
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = await response.json();
        console.log(`✅ Found ${repos.length} repositories`);

        const { backend, dataEngineering } = categorizeProjects(repos);

        // Clear existing content
        backendGrid.innerHTML = '';
        dataGrid.innerHTML = '';

        // Render only 3 per category
        backend
            .slice(0, CONFIG.github.maxProjectsPerCategory)
            .forEach(repo =>
                backendGrid.appendChild(createProjectCard(repo, 'backend'))
            );

        dataEngineering
            .slice(0, CONFIG.github.maxProjectsPerCategory)
            .forEach(repo =>
                dataGrid.appendChild(createProjectCard(repo, 'data'))
            );

        console.log('✅ Projects rendered (max 3 per category)');
    } catch (error) {
        console.error('❌ Error fetching GitHub projects:', error);
    }
}


/**
 * Categorize repos based on topics or manual configuration
 */
function categorizeProjects(repos) {
    const backend = [];
    const dataEngineering = [];

    repos.forEach(repo => {
        if (repo.fork) return;

        const topics = (repo.topics || []).map(t => t.toLowerCase());
        const description = (repo.description || '').toLowerCase();

        const isBackend =
            topics.some(t => CONFIG.github.backendTopics.includes(t)) ||
            description.includes('backend') ||
            description.includes('api') ||
            description.includes('django');

        const isDataEngineering =
            topics.some(t => CONFIG.github.dataEngineeringTopics.includes(t)) ||
            description.includes('data') ||
            description.includes('etl') ||
            description.includes('pipeline');

        if (isBackend) {
            backend.push(repo);
        } else if (isDataEngineering) {
            dataEngineering.push(repo);
        }
    });

    return { backend, dataEngineering };
}


/**
 * Create project card HTML element
 */
function createProjectCard(repo, category) {
    const card = document.createElement('div');
    card.className = 'project-card';

    const projectImage = `https://opengraph.githubassets.com/1/${repo.owner.login}/${repo.name}`;
    const langColor = getLanguageColor(repo.language);

    const topics = repo.topics || [];
    const tagsHTML = topics.slice(0, 3).map(topic =>
        `<span class="tag">${topic}</span>`
    ).join('');

    card.innerHTML = `
        <div class="project-image">
            <img 
                src="${projectImage}"
                alt="${repo.name} preview"
                loading="lazy"
                onerror="this.src='${repo.owner.avatar_url}'"
            >
        </div>
        <div class="project-info">
            <h3>${formatRepoName(repo.name)}</h3>
            <p>${repo.description || 'No description available.'}</p>

            <div class="project-tags">
                ${repo.language ? `<span class="tag" style="border-color:${langColor};color:${langColor}">${repo.language}</span>` : ''}
                ${tagsHTML}
            </div>

            <div class="project-stats">
                <span>⭐ ${repo.stargazers_count}</span>
                <span>🍴 ${repo.forks_count}</span>
            </div>

            <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-link">
                View on GitHub →
            </a>
        </div>
    `;

    return card;
}

/**
 * Format repository name for display
 */
function formatRepoName(name) {
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Get color for programming language
 */
function getLanguageColor(language) {
    const colors = {
        'Python': '#3572A5',
        'JavaScript': '#f1e05a',
        'TypeScript': '#2b7489',
        'Java': '#b07219',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Ruby': '#701516',
        'PHP': '#4F5D95',
        'SQL': '#e38c00',
        'Shell': '#89e051'
    };
    return colors[language] || '#858585';
}

// ===========================================
// MEDIUM BLOG FETCHER
// ===========================================

async function fetchMediumPosts() {
    const MEDIUM_RSS = 'https://medium.com/feed/@ekezieju';
    const blogContainer = document.getElementById('blog-container');

    try {
        const posts = await fetchRSS({
            rssUrl: MEDIUM_RSS,
            limit: 3,
            cacheKey: 'medium_posts'
        });

        if (!posts || posts.length === 0) {
            throw new Error('No posts returned');
        }

        blogContainer.innerHTML = '';

        posts.forEach(post => {
            // ✅ Normalize content safely
            const rawHTML =
                post.content ||
                post.description ||
                '';

            const sanitized = sanitizeHTML(rawHTML);

            // ✅ Image handling (RSS2JSON already provides thumbnail)
            const imgSrc =
                post.thumbnail ||
                sanitized?.querySelector('img')?.src ||
                'image/default-blog.png';

            const textContent =
                sanitized?.textContent
                    ?.trim()
                    .substring(0, 150) + '…';


            const postTitle =
                post.title || post.link
                sanitized?.postTitle
                    ?.trim()
                    .substring(0, 40) + '…';

            // ✅ Defensive fallback
            if (!post.title || !post.link) return;

            const blogCard = document.createElement('div');
            blogCard.className = 'blog-card';
            blogCard.innerHTML = `
                <div class="blog-image">
                    <img src="${imgSrc}" alt="${postTitle}" loading="lazy">
                </div>
                <div class="blog-info">
                    <h3>${postTitle}</h3>
                    <p>${textContent || 'Read the full article on Medium.'}</p>
                    <a href="${post.link}" target="_blank" rel="noopener" class="blog-link">
                        Read Article <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            `;

            blogContainer.appendChild(blogCard);
        });

        console.log('✅ Medium posts rendered successfully');

    } catch (err) {
        console.error('❌ Error fetching Medium posts:', err);
        console.log('Using fallback static posts...');
    }
}

// fetchMediumPosts();

// ===========================================
// CONTACT FORM
// ===========================================
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        
        // Here you can integrate with email services:
        // - Formspree: https://formspree.io/
        // - EmailJS: https://www.emailjs.com/
        // - Netlify Forms
        // - Vercel Edge Functions
        
        alert(`Thank you, ${name}! Your message has been received. I'll get back to you at ${email} soon.`);
        contactForm.reset();
    });
}

// ===========================================
// SCROLL ANIMATIONS
// ===========================================
function reveal() {
    const reveals = document.querySelectorAll('.project-card, .blog-card, .expertise-item, .tech-item');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Set initial state
document.addEventListener('DOMContentLoaded', () => {
    const reveals = document.querySelectorAll('.project-card, .blog-card, .expertise-item');
    reveals.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
    });
});

window.addEventListener('scroll', reveal);

// ===========================================
// HEADER SCROLL EFFECT
// ===========================================
const header = document.querySelector('.primary-header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.padding = '1rem 5%';
        header.style.background = 'rgba(1, 1, 1, 0.98)';
    } else {
        header.style.padding = '1.5rem 5%';
        header.style.background = 'rgba(1, 1, 1, 0.95)';
    }
});

// ===========================================
// INITIALIZE ON PAGE LOAD
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Portfolio initialized');
    
    // Uncomment to enable GitHub project fetching
    fetchGitHubProjects();
    
    // Uncomment to enable Medium blog fetching
    fetchMediumPosts();
    
    reveal();
});

// ===========================================
// EXPORT FOR TESTING (Optional)
// ===========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchGitHubProjects,
        categorizeProjects,
        fetchMediumPosts
    };
}

console.log('📝 Portfolio loaded successfully!');
console.log('💡 To enable GitHub projects: Set CONFIG.github.username and uncomment fetchGitHubProjects()');
console.log('💡 To enable Medium posts: Uncomment fetchMediumPosts()');