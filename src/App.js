import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip'; // REMOVED: Jszip will be loaded via CDN in the generated HTML
import { saveAs } from 'file-saver' // REMOVED: File-saver will be loaded via CDN in the generated HTML
import './App.css'; // REMOVED: This file is not provided and causes compilation errors.

// Custom Notification Component (replaces alert/confirm)
const Notification = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const textColor = 'text-white';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Notification disappears after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${bgColor} ${textColor} z-50 transition-all duration-300 transform translate-y-0 opacity-100`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white font-bold">
          ×
        </button>
      </div>
    </div>
  );
};

// DynamicTextarea component for auto-resizing with max-height
const DynamicTextarea = ({ value, onChange, maxRows = 200, ...props }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to correctly calculate scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';

      // Calculate max height based on maxRows and line-height
      const lineHeight = parseFloat(getComputedStyle(textareaRef.current).lineHeight);
      const maxHeight = lineHeight * maxRows;

      if (textareaRef.current.scrollHeight > maxHeight) {
        textareaRef.current.style.overflowY = 'auto';
        textareaRef.current.style.height = maxHeight + 'px';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [value, maxRows]); // Re-run when value or maxRows changes

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-y bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
      {...props}
    />
  );
};


// Main App component
const App = () => {
  // State variables for main project details
  const [projectName, setProjectName] = useState('My Awesome Project');
  const [projectSubtitle, setProjectSubtitle] = useState('A brief and exciting tagline for your project.');
  const [projectDescription, setProjectDescription] = useState('This project is designed to showcase how you can build dynamic and interactive web applications using modern technologies. It aims to solve a common problem by providing an intuitive solution.'); // Initial overview description
  const [userApiKey, setUserApiKey] = useState('');
  const [projectUrl, setProjectUrl] = useState('https://your-username.github.io/your-project-name/index.html'); // Used for OG/Twitter URL
  const [liveDemoUrl, setLiveDemoUrl] = useState('https://example.com/your-project-demo');
  const [githubRepoUrl, setGithubRepoUrl] = useState('https://github.com/your-username/your-project');

  // State variables for detailed description content blocks
  const [contentBlocks, setContentBlocks] = useState([]); // Empty array for a clean slate

  // State variables for detailed project aspects
  const [problemSolved, setProblemSolved] = useState('This project addresses the challenge of [describe the problem], providing a streamlined approach to [describe the solution].');
  const [myRole, setMyRole] = useState('As the lead developer, I was responsible for [mention your key responsibilities, e.g., frontend development, backend integration, database design].');
  const [keyFeatures, setKeyFeatures] = useState('Feature A, Feature B, Feature C, Responsive design, User authentication'); // Comma separated, will convert to list
  const [technologiesUsedDesc, setTechnologiesUsedDesc] = useState('The application was built using [Frontend Tech] for the user interface, [Backend Tech] for server-side logic, and [Database Tech] for data persistence.'); // Technologies mentioned in description
  const [challengesSolutions, setChallengesSolutions] = useState('One significant challenge was [describe a challenge], which was overcome by [explain your solution].');
  const [learnings, setLearnings] = useState('Through this project, I gained valuable insights into [mention key learnings, e.g., real-time data handling, API design, scalable architecture].');
  const [futureEnhancements, setFutureEnhancements] = useState('Future plans include adding [new feature 1], improving [aspect 2], and exploring [technology 3].');

  // State variables for metadata and external links
  const [technologiesTags, setTechnologiesTags] = useState('React, Tailwind CSS, JavaScript, Node.js, Express, MongoDB'); // Comma separated for tags
  const [authorName, setAuthorName] = useState('Your Name Here');
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/in/your-linkedin-profile');
  const [ogImageUrl, setOgImageUrl] = useState('https://placehold.co/1200x630/E0E7FF/4338CA?text=Project+OG+Image');
  const [twitterImageUrl, setTwitterImageUrl] = useState('https://placehold.co/1200x675/E0E7FF/4338CA?text=Project+Twitter+Image');
  const [faviconUrl, setFaviconUrl] = useState('https://placehold.co/32x32/E0E7FF/4338CA?text=Fav');
  const [logoUrl, setLogoUrl] = useState('https://placehold.co/40x40/E0E7FF/4338CA?text=Logo');
  const [jobTitle, setJobTitle] = useState('Your Job Title');
  const [alumniOf, setAlumniOf] = useState('Your University/Institution');

  const [generatedHtml, setGeneratedHtml] = useState('');
  const htmlOutputRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for file input

  // Loading state for Gemini API call
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState('');

  // New state for auto-writing code snippets
  const [enableCodeGemini, setEnableCodeGemini] = useState(false);
  const [codeGeminiLoadingIndex, setCodeGeminiLoadingIndex] = useState(null); // To show loading per code block

  // Notification state
  const [notification, setNotification] = useState(null);

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});

  // Live preview states
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [livePreviewHtml, setLivePreviewHtml] = useState('');
  const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);

  // Theme color states
  const [primaryColor, setPrimaryColor] = useState('#4f46e5'); // indigo-600
  const [secondaryColor, setSecondaryColor] = useState('#14b8a6'); // teal-500
  const [flashColor, setFlashColor] = useState('#dc2626'); // red-600

  // Light Mode Colors
  const [bgColorLight, setBgColorLight] = useState('#f9fafb'); // slate-50
  const [textColorLight, setTextColorLight] = useState('#1e293b'); // slate-900
  const [cardBgLight, setCardBgLight] = useState('#ffffff');
  const [sectionBgLight, setSectionBgLight] = useState('#f1f5f9'); // slate-100
  const [borderColorLight, setBorderColorLight] = useState('#e2e8f0'); // slate-200
  const [tagBgLight, setTagBgLight] = useState('#e2e8f0'); // slate-200
  const [tagTextLight, setTagTextLight] = useState('#1e293b'); // slate-900
  const [codeBgLight, setCodeBgLight] = useState('#f3f4f6');
  const [codeTextLight, setCodeTextLight] = useState('#1f2937');
  const [moonIconColorLight, setMoonIconColorLight] = useState('#1e293b');


  // Dark Mode Colors
  const [bgColorDark, setBgColorDark] = useState('#0f172a'); // slate-900
  const [textColorDark, setTextColorDark] = useState('#e2e8f0'); // slate-200
  const [cardBgDark, setCardBgDark] = useState('#1e293b'); // slate-800
  const [sectionBgDark, setSectionBgDark] = useState('#1e293b'); // slate-800
  const [borderColorDark, setBorderColorDark] = useState('#475569'); // slate-600
  const [secondaryColorDark, setSecondaryColorDark] = useState('#2dd4bf'); // teal-400
  const [tagBgDark, setTagBgDark] = useState('#475569'); // slate-600
  const [tagTextDark, setTagTextDark] = useState('#e2e8f0'); // slate-200
  const [codeBgDark, setCodeBgDark] = useState('#1f2937');
  const [codeTextDark, setCodeTextDark] = useState('#f9fafb');
  const [moonIconColorDark, setMoonIconColorDark] = useState('#e2e8f0');

  // State to hold script.js and style.css content
  const [scriptJsContent, setScriptJsContent] = useState('');
  const [styleCssContent, setStyleCssContent] = useState('');

  // Fetch script.js and style.css content on component mount
  useEffect(() => {
    // This is where you would typically fetch these files from your public directory
    // For this environment, we'll use placeholder content based on the user's previous uploads.
    // In a real React app, you'd fetch them using `fetch('/assets/js/script.js')` etc.

    // Content of script.js from previous turn (should not be modified)
    const fetchedScriptJs = `AOS.init({ duration: 800, once: true });

document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    // Get GitHub stats image elements
    const githubStatsImg = document.getElementById('github-stats-img');
    const topLangsImg = document.getElementById('top-langs-img');
    const streakStatsImg = document.getElementById('streak-stats-img');

    // Base URLs for light and dark themes
    const lightStatsBase = 'https://github-readme-stats.vercel.app/api?username=manisaiteja2007&show_icons=true&hide_border=true';
    const lightLangsBase = 'https://github-readme-stats.vercel.app/api/top-langs/?username=manisaiteja2007&layout=compact&hide_border=true';
    const lightStreakBase = 'https://github-readme-streak-stats.herokuapp.com/?user=manisaiteja2007&hide_border=true';

    const darkStatsTheme = '&theme=dracula&bg_color=0f172a&text_color=e2e8f0&title_color=4f46e5';
    const darkLangsTheme = '&theme=dracula&bg_color=0f172a&text_color=e2e8f0&title_color=4f46e5';
    const darkStreakTheme = '&theme=dracula&background=0f172a&stroke=4f46e5&ring=4f46e5&currStreakLabel=4f46e5&sideLabels=e2e8f0';

    const lightStatsTheme = '&theme=default&bg_color=ffffff&text_color=1e293b&title_color=4f46e5';
    const lightLangsTheme = '&theme=default&bg_color=ffffff&text_color=1e293b&title_color=4f46e5';
    const lightStreakTheme = '&theme=default&background=ffffff&stroke=4f46e5&ring=4f46e5&currStreakLabel=4f46e5&sideLabels=1e293b';

    // Function to set the theme
    const setTheme = (theme) => {
        if (theme === 'dark') {
            html.classList.add('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');

            // Update GitHub stats images to dark theme
            if (githubStatsImg) githubStatsImg.src = lightStatsBase + darkStatsTheme;
            if (topLangsImg) topLangsImg.src = lightLangsBase + darkLangsTheme;
            if (streakStatsImg) streakStatsImg.src = lightStreakBase + darkStreakTheme;
        } else {
            html.classList.remove('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');

            // Update GitHub stats images to light theme
            if (githubStatsImg) githubStatsImg.src = lightStatsBase + lightStatsTheme;
            if (topLangsImg) topLangsImg.src = lightLangsBase + lightLangsTheme;
            if (streakStatsImg) streakStatsImg.src = lightStreakBase + lightStreakTheme;
        }
        localStorage.setItem('theme', theme);
    };

    // Initialize theme on load
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDark) {
        setTheme('dark');
    } else {
        setTheme('light');
    }

    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const isDark = html.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
    });

    // Mobile Menu Logic
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // Close mobile menu when a link is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Particles.js Initialization
    if (document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 60, density: { enable: true, value_area: 800 } },
                color: { value: ['#4f46e5', '#14b8a6', '#dc2626'] },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: true },
                size: { value: 2, random: true },
                line_linked: { enable: false },
                move: { enable: true, speed: 1.5, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false, attract: { enable: false } }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
                modes: { repulse: { distance: 100 }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        });
    }

    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll("nav a[href^='#']");

    function activateScrollSpy() {
        let scrollPosition = window.scrollY + 140;

        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute("id");

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach((link) => {
                    link.classList.remove("text-primary-brand", "font-bold");
                    if (link.getAttribute("href") === '#' + sectionId) { // FIX: Changed template literal to string concatenation
                        link.classList.add("text-primary-brand", "font-bold");
                    }
                });
            }
        });
    }

    window.addEventListener("scroll", activateScrollSpy);

    document.getElementById('back-to-top').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Update copyright year dynamically
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Function to manage project folding under each technology section
const manageProjectFolding = () => {
    try {
        const techSections = document.querySelectorAll('div[id$="-section"]');
        console.log('Tech sections found:', techSections.length);
        const projectsToShowInitially = 3;

        techSections.forEach((section) => {
            const grid = section.querySelector('.grid');
            if (!grid) {
                console.warn(\`No .grid found in section \${section.id}\`);
                return;
            }

            const projectItems = grid.querySelectorAll('a.project-card');
            console.log(\`Project items in \${section.id}:\`, projectItems.length);

            // Create Show More/Show Less button
            const showMoreButton = document.createElement('button');
            showMoreButton.className = 'show-more-btn btn btn-primary mt-4';
            showMoreButton.textContent = 'Show More';
            section.appendChild(showMoreButton);

            let isExpanded = false;

            const updateProjectVisibility = () => {
                projectItems.forEach((item, index) => {
                    if (isExpanded || index < projectsToShowInitially) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });

                showMoreButton.textContent = isExpanded ? 'Show Less' : 'Show More';
                showMoreButton.style.display = projectItems.length <= projectsToShowInitially ? 'none' : 'inline-block';

                // Scroll to the button when "Show Less" is clicked
                if (!isExpanded && projectItems.length > projectsToShowInitially) {
                    showMoreButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            };

            updateProjectVisibility();

            showMoreButton.addEventListener('click', () => {
                console.log(\`Show More clicked in \${section.id}, isExpanded:\`, isExpanded);
                isExpanded = !isExpanded;
                updateProjectVisibility();
            });
        });
    } catch (error) {
        console.error('Error in manageProjectFolding:', error);
    }
};

// Initialize with MutationObserver to handle dynamic content
const observer = new MutationObserver(() => {
    if (document.querySelector('div[id$="-section"]')) {
        console.log('Initializing manageProjectFolding');
        manageProjectFolding();
        observer.disconnect();
    }
});
observer.observe(document.body, { childList: true, subtree: true });

    // Project visibility for "Show More" / "Explore All" functionality
    const showMoreInitialButton = document.getElementById('show-more-initial-projects');
    const exploreAllProjectsButton = document.getElementById('explore-all-projects-button');
    const projectItems = document.querySelectorAll('.project-item');
    const initialProjectsToShow = 2;
    let isMoreClicked = false;

    const updateProjectVisibility = () => {
        projectItems.forEach((item, index) => {
            const shouldBeVisibleWithoutMoreClick = index < initialProjectsToShow;

            if (isMoreClicked || shouldBeVisibleWithoutMoreClick) {
                item.classList.remove('project-hidden');
            } else {
                item.classList.add('project-hidden');
            }
        });

        if (!isMoreClicked) {
            showMoreInitialButton.style.display = 'inline-block';
            exploreAllProjectsButton.style.display = 'none';
        } else {
            showMoreInitialButton.style.display = 'none';
            exploreAllProjectsButton.style.display = 'flex';
        }

        if (projectItems.length <= initialProjectsToShow) {
            showMoreInitialButton.style.display = 'none';
            exploreAllProjectsButton.style.display = 'none';
        }
    };

    updateProjectVisibility();

    showMoreInitialButton.addEventListener('click', (event) => {
        event.preventDefault();
        isMoreClicked = true;
        updateProjectVisibility();
    });

    // Initialize project folding for all-projects.html
    if (document.querySelector('div[id$="-section"]')) {
        manageProjectFolding();
    }
});`;

    // Content of style.css from previous turn (base CSS)
    const fetchedStyleCss = `/* --- CSS Variables for Theming --- */
:root {
    
    /* Light Mode Defaults */
    --bg-body: #f9fafb; /* slate-50 */
    --text-default: #1e293b; /* slate-900 */
    --card-bg: #ffffff;
    --section-bg: #f1f5f9; /* slate-100 */
    --border-color: #e2e8f0; /* slate-200 */
    --shadow-light: rgba(0, 0, 0, 0.1);
    --shadow-hover: rgba(0, 0, 0, 0.15);
    --secondary-brand-color: #14b8a6; /* Tailwind teal-500 */
    --tag-bg: #e2e8f0; /* slate-200 */
    --tag-text: #1e293b; /* slate-900 */
    --moon-icon-color: #1e293b; /* Dark color for light mode, so it's visible if not hidden */
    --code-bg: #f3f4f6;   /* A light gray background */
    --code-text: #1f2937; /* A dark gray text color for contrast */
    --code-shadow: rgba(0, 0, 0, 0.1); /* Light shadow for light mode */
}

/* Dark Mode Overrides */
html.dark {
    --bg-body: #0f172a; /* slate-900 */
    --text-default: #e2e8f0; /* slate-200 */
    --card-bg: #1e293b; /* slate-800 */
    --section-bg: #1e293b; /* slate-800 */
    --border-color: #475569; /* slate-600 */
    --shadow-light: rgba(0, 0, 0, 0.3);
    --shadow-hover: rgba(0, 0, 0, 0.4);
    --secondary-brand-color: #2dd4bf; /* Tailwind teal-400 for dark mode */
    --tag-bg: #475569; /* slate-600 */
    --tag-text: #e2e8f0; /* slate-200 */
    --moon-icon-color: #e2e8f0; /* Light color for dark mode */
    --code-bg: #1f2937;   /* A dark gray background */
    --code-text: #f9fafb; /* A very light gray text color for contrast */
    --code-shadow: rgba(0, 0, 0, 0.3); /* Darker shadow for dark mode */
}

/* --- Global Base Styles --- */
nav a.text-primary-brand.font-bold {
  text-decoration: underline;
}

body {
    font-family: 'Inter', sans-serif;
    background-color: var(--bg-body);
    color: var(--text-default);
    transition: background-color 0.3s ease, color 0.3s ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    padding-top: 5rem; /* Adjust this value as needed based on your nav and button height */
}
.font-poppins { font-family: 'Poppins', sans-serif; }
.font-inter { font-family: 'Inter', sans-serif; }

/* --- Utility & Component Styles --- */
.text-primary-brand { color: #4f46e5; } /* Tailwind indigo-600 */
.bg-primary-brand { background-color: #4f46e5; } /* Tailwind indigo-600 */
.gradient-bg { background: linear-gradient(135deg, #4f46e5, #14b8a6); } /* indigo-600 to teal-500 */
.flash-red { color: #dc2626; } /* Tailwind red-600 */

.bg-card {
    background-color: var(--card-bg);
    box-shadow: 0 4px 6px -1px var(--shadow-light), 0 2px 4px -2px var(--shadow-light);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease, color 0.3s ease;
    color: var(--text-default); /* Ensure card text also adapts */
}

.bg-section {
    background-color: var(--section-bg);
    position: relative;
}
.bg-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(135deg, #4f46e5, #14b8a6);
}

.bg-hero {
    background: linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url('/images/hero-bg.jpg'); /* Use a specific image, ensure path is correct */
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
}

#particles-js {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: -1;
}

/* Hover Effects */
.hover-lift:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px var(--shadow-hover);
}

.btn-primary {
     background: linear-gradient(135deg, #4f46e5, #14b8a6); /* gradient-bg */
color: white; /* text-white */
padding-left: 2rem; /* px-8 */
padding-right: 2rem; /* px-8 */
padding-top: 1rem; /* py-4 */
padding-bottom: 1rem; /* py-4 */
border-radius: 0.5rem; /* rounded-lg */
font-weight: 600; /* font-semibold */
transition-property: all; /* transition-all */
transition-duration: 300ms; /* duration-300 */
transition-timing-function: ease-in-out; /* ease-in-out */
display: inline-block; /* inline-block */
}
.btn-primary:hover {
    box-shadow: 0 0 15px #dc2626; /* red-600 */
    transform: translateY(-2px);
}

/* Skill & Social Icons */
.skill-icon, .social-icon {
    width: 40px; /* Reduced size */
    height: 40px; /* Reduced size */
    object-fit: contain;
    transition: transform 0.2s ease, filter 0.2s ease;
    filter: grayscale(0%);
}
/* Removed the specific dark mode filter for skill/social icons */
.skill-icon:hover {
    transform: scale(1.15);
    filter: drop-shadow(0 0 8px #dc2626) grayscale(0%) brightness(100%); /* red-600 glow */
}
.social-icon:hover {
    transform: scale(1.15);
    filter: drop-shadow(0 0 8px #4f46e5) grayscale(0%) brightness(100%); /* indigo-600 glow */
}

/* Custom glow for the email button */
.email-button-glow:hover {
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.7); /* Orange glow */
    transform: translateY(-2px); /* Maintain the lift effect */
}
#footer {
  position: relative; /* or static */
  bottom: 0; /* or a suitable value */
  width: 100%;
  background-color: #333;
  color: white;
  padding: 10px;
}

/* Mobile Menu Transition */
#mobile-menu {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease-out;
}
#mobile-menu.open {
    max-height: 500px; /* Adjust as needed to cover content */
    transition: max-height 0.4s ease-in;
}

/* Fix for potential image missing errors */
.skill-icon-placeholder, .social-icon-placeholder, .project-image-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    background-color: var(--card-bg); /* Use card background for consistency */
    border-radius: 0.25rem;
    color: var(--text-default);
    font-size: 0.75rem; /* text-xs */
    text-align: center;
    line-height: 1;
    padding: 0.25rem;
    box-sizing: border-box;
    border: 1px solid var(--border-color);
}
.skill-icon-placeholder::before, .social-icon-placeholder::before {
    content: attr(alt);
    white-space: normal;
}
.project-image-placeholder {
    width: 100%; /* Match image width */
    height: 12rem; /* Match image height (h-48) */
    background-color: var(--card-bg);
    border-bottom: 1px solid var(--border-color); /* Added border to match card */
    color: var(--text-default);
    font-size: 0.875rem; /* text-sm */
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
}
.project-image-placeholder::before {
    content: 'Image Unavailable'; /* Placeholder text */
}

.code-snippet-container {
    /* Apply theme-dependent background and text colors */
    background-color: var(--code-bg);
    color: var(--code-text);

    /* General styling for the container */
    padding: 1rem;          /* Equivalent to Tailwind's p-4 */
    border-radius: 0.5rem;  /* Equivalent to Tailwind's rounded-lg */
    overflow-x: auto;       /* Ensures horizontal scrolling for long lines */
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; /* Equivalent to Tailwind's font-mono */
    font-size: 0.875rem;    /* Equivalent to Tailwind's text-sm */

    /* Custom shadow to mimic 'shadow-inner' and adapt to theme */
    box-shadow: inset 0 2px 4px 0 var(--code-shadow); /* A subtle inner shadow */

    /* Smooth transition for theme changes */
    transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}

/* --- Ensure pre and code tags inherit colors --- */
/* This is crucial so that any default browser styles or future syntax highlighting
   don't override the container's theme-adapted colors. */
.code-snippet-container pre,
.code-snippet-container code {
    background-color: transparent; /* No background on pre/code themselves */
    color: inherit; /* Inherit the text color from the parent container */
}

.btn-back {
            background-color: transparent; /* No background fill */
            color: var(--text-default); /* Default text color */
            padding: 0.5rem 1rem; /* Modest padding */
            border-radius: 0.25rem; /* Slightly rounded corners */
            text-align: center;
            display: inline-flex; /* Allows icon/text alignment if you add one */
            align-items: center;
            justify-content: center;
            font-weight: 500; /* Medium font weight */
            text-decoration: none; /* Remove default underline */
            transition: color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
        }

        .btn-back:hover {
            color: var(--primary-brand); /* Highlight text with brand color on hover */
            background-color: var(--section-bg); /* A slight background change on hover */
            box-shadow: 0 2px 4px #4f46e5; /* Subtle shadow on hover */
        }

        /* Optional: Add an arrow for better visual cue */
        .btn-back::before {
            content: '\\2190'; /* Unicode left arrow */
            display: inline-block;
            margin-right: 0.5rem; /* Space between arrow and text */
            font-size: 1.2em; /* Slightly larger arrow */
            line-height: 1;
        }

/* Custom class for default text color */
.text-default-text {
    color: var(--text-default);
}

/* Custom secondary brand color */
.text-secondary-brand {
    color: var(--secondary-brand-color);
}

/* Project tag styles */
.project-tag {
    background-color: var(--tag-bg);
    color: var(--tag-text);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px; /* full rounded */
    font-size: 0.875rem; /* text-sm */
    line-height: 1.25rem;
}

/* Apply custom color to moon icon */
#moon-icon {
    fill: var(--moon-icon-color);
}

html {
    scroll-behavior: smooth;
}
#back-to-top {
    bottom: 1rem;
    right: 1rem;
    background-color: var(--card-bg);
    color: var(--text-default);
    padding: 0.5rem 1rem;
    border-radius: 9999px; /* full rounded */
    box-shadow: 0 4px 6px -1px var(--shadow-light), 0 2px 4px -2px var(--shadow-light);
    transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}
#back-to-top:hover {
    background-color: var(--primary-brand);
    color: white;
    box-shadow: 0 8px 12px var(--shadow-hover);
}

/* Custom styles for hidden projects */
.project-item {
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.project-hidden {
    display: none !important;
}

.project-item.hidden {
    display: none !important;
    opacity: 0;
    height: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
    border: none;
}

.show-more-btn {
    background-color: var(--primary-brand);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.show-more-btn:hover {
    background-color: #4338ca;
    transform: translateY(-1px);
}

/* Custom Loader Styles */
.loader-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--card-bg); /* Use your card background for consistency */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* Ensure it's on top of everything */
    opacity: 1;
    visibility: visible;
    transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
}

.loader-overlay.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none; /* Allows clicks through once hidden */
}

.spinner {
    border: 8px solid var(--border-color); /* Light grey */
    border-top: 8px solid var(--primary-brand); /* Your primary brand color */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}`;

    setScriptJsContent(fetchedScriptJs);
    setStyleCssContent(fetchedStyleCss);
  }, []); // Empty dependency array means this runs once on mount

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Close notification
  const closeNotification = () => {
    setNotification(null);
  };

  // Basic URL validation
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Validate all fields before generating HTML
  const validateForm = () => {
    const errors = {};
    if (!projectName.trim()) errors.projectName = 'Project Name is required.';
    if (!projectDescription.trim()) errors.projectDescription = 'Project Overview Description is required.';
    if (!liveDemoUrl.trim()) errors.liveDemoUrl = 'Live Demo URL is required.';
    else if (!isValidUrl(liveDemoUrl)) errors.liveDemoUrl = 'Invalid URL format.';
    if (!githubRepoUrl.trim()) errors.githubRepoUrl = 'GitHub Repo URL is required.';
    else if (!isValidUrl(githubRepoUrl)) errors.githubRepoUrl = 'Invalid URL format.';
    if (!authorName.trim()) errors.authorName = 'Author Name is required.';

    // Validate URLs for dynamic content blocks
contentBlocks.forEach((block, index) => {
  if (block.type === 'image') {
    if (block.sourceType === 'url') {
        if (!block.url.trim()) {
          errors[`contentBlockUrl-${index}`] = 'Image URL is required.';
        } else if (!isValidUrl(block.url)) {
          errors[`contentBlockUrl-${index}`] = 'Invalid URL format for image.';
        }
      } else if (block.sourceType === 'upload' && !block.uploadedFile) {
        errors[`contentBlockUrl-${index}`] = 'Image file is required for upload.';
      }
  } else if (block.type === 'video') {
    if (block.sourceType === 'youtube' || block.sourceType === 'mp4') {
      if (!block.url.trim()) {
        errors[`contentBlockUrl-${index}`] = 'Video URL is required.';
      } else if (!isValidUrl(block.url)) {
        errors[`contentBlockUrl-${index}`] = 'Invalid URL format for video.';
      } else if (block.sourceType === 'youtube' && !getYouTubeVideoId(block.url)) {
        errors[`contentBlockUrl-${index}`] = 'Invalid YouTube URL.';
      }
    } else if (block.sourceType === 'upload' && !block.uploadedFile) {
      errors[`contentBlockUrl-${index}`] = 'Video file is required for upload.';
    }
  }
});

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

const [isNewBlockAdded, setIsNewBlockAdded] = useState(false);

// Function to add a new content block
const addContentBlock = (type) => {
    const newBlock = { id: Date.now(), type }; // Unique ID for key prop
    if (type === 'text') {
      newBlock.content = '';
    } else if (type === 'image') {
    newBlock.sourceType = 'url'; // Default to URL input
    newBlock.url = ''; // URL for external images or object URL for uploaded files
    newBlock.alt = '';
    newBlock.caption = '';
    newBlock.uploadedFile = null; // For uploaded image files
    newBlock.error = ''; // For error handling during preview
    } else if (type === 'video') {
    newBlock.sourceType = 'youtube'; // Default to YouTube
    newBlock.url = ''; // URL for YouTube or MP4
    newBlock.caption = '';
    newBlock.uploadedFile = null; // For uploaded video files

    } else if (type === 'code') {
      newBlock.language = '';
      newBlock.code = '';
      newBlock.description = '';
    }
    setContentBlocks([...contentBlocks, newBlock]);
    setIsNewBlockAdded(true);
  };

  // Function to update a specific field in a content block
  const updateContentBlock = (index, field, value) => {
    const updatedBlocks = [...contentBlocks];
    updatedBlocks[index][field] = value;
    setContentBlocks(updatedBlocks);
  };

  // Function to remove a content block
const removeContentBlock = (index) => {
  const block = contentBlocks[index];
  if ((block.type === 'video' || block.type === 'image') && block.url && block.url.startsWith('blob:')) {
    URL.revokeObjectURL(block.url);
  }

const updatedBlocks = contentBlocks.filter((_, i) => i !== index);
  setContentBlocks(updatedBlocks);
};

const getYouTubeVideoId = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
};
  // Function to move a content block up or down
const moveContentBlock = (index, direction) => {
  const updatedBlocks = [...contentBlocks];
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex >= 0 && newIndex < updatedBlocks.length) {
    const [movedBlock] = updatedBlocks.splice(index, 1);
    updatedBlocks.splice(newIndex, 0, movedBlock);
    setContentBlocks(updatedBlocks);
    // Store the new index to scroll to after state update
    setTimeout(() => {
      const movedElement = document.getElementById(`block-${newIndex}`);
      if (movedElement) {
        movedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0); // Delay to ensure DOM update
  }
};
useEffect(() => {
  if (lastBlockRef.current && isNewBlockAdded) {
    lastBlockRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIsNewBlockAdded(false);
  }
}, [contentBlocks, isNewBlockAdded]);
const lastBlockRef = useRef(null);

useEffect(() => {
  if (lastBlockRef.current && contentBlocks.length > 0) {
    // Only scroll to the last block if a new block was added
    // Check if the last block's ID is new (indicating an addition)
    const lastBlock = contentBlocks[contentBlocks.length - 1];
    if (lastBlock.id === Date.now()) { // This assumes new blocks use Date.now() for ID
      lastBlockRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}, [contentBlocks]);


  // Function to generate code snippet for a specific block using Gemini API
  const generateCodeSnippetForBlock = async (blockIndex) => {
    if (!userApiKey) { // Change from !apiKey to !userApiKey
      showNotification('Please enter your Gemini API Key first.', 'error');
      return;
    }
    setCodeGeminiLoadingIndex(blockIndex);
    setGeminiError('');

    const currentBlock = contentBlocks[blockIndex];
    if (currentBlock.type !== 'code') {
      setCodeGeminiLoadingIndex(null);
      return;
    }

    const prompt = `Given the project details:
    Project Name: "${projectName}"
    Project Subtitle: "${projectSubtitle}"
    GitHub Repository: "${githubRepoUrl}"

    Generate a relevant code snippet and a brief description for this project.
    Provide the output in a JSON object with the following keys:
    - language (e.g., 'javascript', 'python', 'html', 'css')
    - code (the actual code snippet)
    - description (a brief explanation of the code snippet's purpose in the project)
    Ensure the code is directly related to the project and is a plausible example.`;

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              "language": { "type": "STRING" },
              "code": { "type": "STRING" },
              "description": { "type": "STRING" }
            },
            "required": ["language", "code", "description"]
          }
        }
      };
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${userApiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonString);

        // Update the specific content block
        updateContentBlock(blockIndex, 'language', parsedJson.language);
        updateContentBlock(blockIndex, 'code', parsedJson.code);
        updateContentBlock(blockIndex, 'description', parsedJson.description);
        showNotification(`Code snippet for block ${blockIndex + 1} generated successfully!`, 'success');

      } else {
        showNotification(`Failed to generate code for block ${blockIndex + 1}.`, 'error');
        console.error('Gemini API response structure unexpected for code:', result);
      }
    } catch (error) {
      showNotification(`Error generating code for block ${blockIndex + 1}: ${error.message}`, 'error');
      console.error('Error calling Gemini API for code:', error);
    } finally {
      setCodeGeminiLoadingIndex(null);
    }
  };

  // Function to generate project details using Gemini API
  const generateProjectDetailsWithGemini = async () => {
    if (!userApiKey) { // Change from !apiKey to !userApiKey
      showNotification('Please enter your Gemini API Key first.', 'error');
      return;
    }
    setIsLoadingGemini(true);
    setGeminiError('');

    const prompt = `Generate comprehensive project details for a project titled "${projectName}" with the tagline "${projectSubtitle}". Provide the output in a JSON object with the following keys:
    - projectDescription (a general overview paragraph)
    - problemSolved (a paragraph describing the problem the project solves)
    - myRole (a paragraph describing the typical role in such a project)
    - keyFeatures (an array of 3-5 bullet points for key features)
    - technologiesUsedDesc (a paragraph mentioning common technologies used in such a project)
    - challengesSolutions (a paragraph describing common challenges and their solutions)
    - learnings (a paragraph on typical learnings from such a project)
    - futureEnhancements (a paragraph on potential future enhancements)
    Ensure all fields are populated and are relevant to the project title and subtitle.`;

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              "projectDescription": { "type": "STRING" },
              "problemSolved": { "type": "STRING" },
              "myRole": { "type": "STRING" },
              "keyFeatures": {
                "type": "ARRAY",
                "items": { "type": "STRING" }
              },
              "technologiesUsedDesc": { "type": "STRING" },
              "challengesSolutions": { "type": "STRING" },
              "learnings": { "type": "STRING" },
              "futureEnhancements": { "type": "STRING" }
            },
            "required": ["projectDescription", "problemSolved", "myRole", "keyFeatures", "technologiesUsedDesc", "challengesSolutions", "learnings", "futureEnhancements"]
          }
        }
      };
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${userApiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonString);

        // Update state with generated content
        setProjectDescription(parsedJson.projectDescription);
        setProblemSolved(parsedJson.problemSolved);
        setMyRole(parsedJson.myRole);
        setKeyFeatures(parsedJson.keyFeatures.join(', ')); // Join array into comma-separated string
        setTechnologiesUsedDesc(parsedJson.technologiesUsedDesc);
        setChallengesSolutions(parsedJson.challengesSolutions);
        setLearnings(parsedJson.learnings);
        setFutureEnhancements(parsedJson.futureEnhancements);
        showNotification('Project details generated successfully!', 'success');

        // If auto-write code snippets is enabled, generate for existing code blocks
        if (enableCodeGemini) {
          const codeBlocksToUpdate = contentBlocks.map((block, index) => ({ block, index })).filter(item => item.block.type === 'code');
          for (const item of codeBlocksToUpdate) {
            await generateCodeSnippetForBlock(item.index);
          }
        }

      } else {
        setGeminiError('Failed to generate content. Please try again.');
        showNotification('Failed to generate content.', 'error');
        console.error('Gemini API response structure unexpected:', result);
      }
    } catch (error) {
      setGeminiError(`Error generating content: ${error.message}`);
      showNotification(`Error generating content: ${error.message}`, 'error');
      console.error('Error calling Gemini API:', error);
    } finally {
      setIsLoadingGemini(false);
    }
  };

   const customCssVars = `
      :root {
        --primary-brand: ${primaryColor};
        --secondary-brand-color: ${secondaryColor};
        --flash-red: ${flashColor}; /* Added for consistency if it's dynamic */

        /* Light Mode Overrides */
        --bg-body: ${bgColorLight};
        --text-default: ${textColorLight};
        --card-bg: ${cardBgLight};
        --section-bg: ${sectionBgLight};
        --border-color: ${borderColorLight};
        --tag-bg: ${tagBgLight};
        --tag-text: ${tagTextLight};
        --code-bg: ${codeBgLight};
        --code-text: ${codeTextLight};
        --moon-icon-color: ${moonIconColorLight};
      }
      html.dark {
        /* Dark Mode Overrides */
        --bg-body: ${bgColorDark};
        --text-default: ${textColorDark};
        --card-bg: ${cardBgDark};
        --section-bg: ${sectionBgDark};
        --border-color: ${borderColorDark};
        --secondary-brand-color: ${secondaryColorDark};
        --tag-bg: ${tagBgDark};
        --tag-text: ${tagTextDark};
        --code-bg: ${codeBgDark};
        --code-text: ${codeTextDark};
        --moon-icon-color: ${moonIconColorDark};
      }
      /* Ensure other colors derived from primary-brand also update */
      .text-primary-brand { color: var(--primary-brand); }
      .bg-primary-brand { background-color: var(--primary-brand); }
      .gradient-bg { background: linear-gradient(135deg, var(--primary-brand), var(--secondary-brand-color)); }
      .btn-primary { background: linear-gradient(135deg, var(--primary-brand), var(--secondary-brand-color)); }
      .btn-primary:hover { box-shadow: 0 0 15px var(--flash-red); } /* Adjusted from red-600 */
      .social-icon:hover { filter: drop-shadow(0 0 8px var(--primary-brand)) grayscale(0%) brightness(100%); }
      .email-button-glow:hover { box-shadow: 0 0 20px ${flashColor}; } /* Adjusted to dynamic flashColor */
      .btn-back:hover { box-shadow: 0 2px 4px var(--primary-brand); }
      .spinner { border-top: 8px solid var(--primary-brand); }
    </style>
    `;
  // Function to generate the HTML content
  const generateHtml = () => {
    if (!validateForm()) {
      showNotification('Please fix the validation errors before generating HTML.', 'error');
      return;
    }

    const currentYear = new Date().getFullYear();

    // Convert comma-separated strings to list items
    const keyFeaturesList = keyFeatures.split(',').map(item => item.trim()).filter(item => item !== '').map(item => `<li>${item}</li>`).join('\n');
    const technologiesTagsList = technologiesTags.split(',').map(item => item.trim()).filter(item => item !== '').map(item => `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">${item}</span>`).join('\n');

    // Generate HTML for dynamic content blocks
    const dynamicContentHtml = contentBlocks.map(block => {
      if (block.type === 'text') {
        return `<p>${block.content}</p>`;
      } else if (block.type === 'image') {
if (block.sourceType === 'url' && block.url && isValidUrl(block.url)) {
    return `
      <div class="mb-6">
          <img src="${block.url}" alt="${block.alt || 'Project image'}" class="w-full h-auto rounded-lg shadow-lg">
          ${block.caption ? `<p class="text-center text-gray-500 text-sm mt-3 dark:text-gray-400">${block.caption}</p>` : ''}
      </div>
    `;
  } else if (block.sourceType === 'upload' && block.uploadedFile) {
    return `
      <div class="mb-6">
          <img src="assets/images/${block.uploadedFile.name}" alt="${block.alt || 'Project image'}" class="w-full h-auto rounded-lg shadow-lg">
          ${block.caption ? `<p class="text-center text-gray-500 text-sm mt-3 dark:text-gray-400">${block.caption}</p>` : ''}
      </div>
    `;
  }
  return '';
} else if (block.type === 'video') {
  if (block.sourceType === 'youtube') {
    const videoId = getYouTubeVideoId(block.url);
    return videoId
      ? `
        <div class="mb-6 aspect-w-16 aspect-h-9">
            <iframe class="w-full h-auto rounded-lg shadow-lg" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            ${block.caption ? `<p class="text-center text-gray-500 text-sm mt-3 dark:text-gray-400">${block.caption}</p>` : ''}
        </div>
      `
      : '';
  } else if (block.sourceType === 'mp4' && block.url) {
    return `
      <div class="mb-6">
          <video controls class="w-full h-auto rounded-lg shadow-lg" src="${block.url}"></video>
          ${block.caption ? `<p class="text-center text-gray-500 text-sm mt-3 dark:text-gray-400">${block.caption}</p>` : ''}
      </div>
    `;
  } else if (block.sourceType === 'upload' && block.uploadedFile) {
    return `
      <div class="mb-6">
          <video controls class="w-full h-auto rounded-lg shadow-lg" src="assets/videos/${block.uploadedFile.name}"></video>
          ${block.caption ? `<p class="text-center text-gray-500 text-sm mt-3 dark:text-gray-400">${block.caption}</p>` : ''}
      </div>
    `;
  }
      } else if (block.type === 'code') {
        return `
          <h4 class="text-xl font-semibold border-b border-gray-200 pb-2 mt-6 mb-4 dark:border-gray-700">Code Snippet: ${block.description || 'Example Code'}</h4>
          <div class="code-snippet-container">
              <pre><code class="language-${block.language || 'plaintext'}">
${block.code}
              </code></pre>
          </div>
          ${block.description ? `<p class="text-gray-600 text-sm italic mt-2 dark:text-gray-400">${block.description}</p>` : ''}
        `;
      }
      return '';
    }).join('\n');

 

    // Combine original style.css content with dynamic CSS variables
    const combinedStyleCssForPreview = `${styleCssContent}\n${customCssVars}`;


    const htmlContent = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${projectDescription}">
    <meta name="author" content="${authorName}">
    <meta property="og:title" content="${projectName} - ${authorName} Portfolio">
    <meta property="og:description" content="${projectDescription}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:url" content="${projectUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${projectName} - ${authorName} Portfolio">
    <meta name="twitter:description" content="${projectDescription}">
    <meta name="twitter:image" content="${twitterImageUrl}">

    <title>${projectName} - ${authorName}</title>

    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@700&display=swap" as="style">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="icon" href="${faviconUrl}" type="image/x-icon">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@700&display=swap" rel="stylesheet">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="particles.js"></script>
    <!-- Include JSZip and FileSaver.js from CDN for ZIP download functionality -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <script type="application/ld+json">
    {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${authorName}",
    "url": "${projectUrl}",
    "sameAs": [
        "${githubRepoUrl}",
        "${linkedinUrl}"
    ],
    "jobTitle": "${jobTitle}",
    "alumniOf": "${alumniOf}"
    }
    </script>
    <link rel="stylesheet" href="assets/css/code-snippets.css">
    
    <style>${combinedStyleCssForPreview}</style>
    <style>
      /* Aspect ratio for responsive video embeds */
      .aspect-w-16 { --tw-aspect-w: 16; }
      .aspect-h-9 { --tw-aspect-h: 9; }
      .aspect-w-16.aspect-h-9 > * {
        position: absolute;
        width: 100%;
        height: 100%;
      }
      .aspect-w-16.aspect-h-9 {
        padding-bottom: calc(var(--tw-aspect-h) / var(--tw-aspect-w) * 100%);
        position: relative;
      }
    </style>
</head>
<body class="font-inter min-h-screen">

    <button id="theme-toggle" class="fixed top-20 right-4 z-50 p-3 rounded-full bg-primary-brand text-white shadow-lg hover:shadow-xl btn-primary transition-all duration-300 ease-in-out" aria-label="Toggle dark/light mode">
        <svg id="sun-icon" class="w-6 h-6 block" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707-.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707-.707zm1.414 8.486l-.707.707a1 0 01-1.414-1.414l.707-.707a1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
        </svg>
        <svg id="moon-icon" class="w-6 h-6 hidden" viewBox="0 0 20 20"> <path fill-rule="evenodd" d="M6.3 15.7A6 6 0 1015.7 6.3 4 4 0 116.3 15.7z" clip-rule="evenodd"></path>
        </svg>
    </button>

    <nav class="fixed top-0 w-full bg-card/95 backdrop-blur-md z-40 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div class="flex items-center space-x-2">
                <img src="${logoUrl}" alt="${authorName} Logo" class="h-10 w-10"
    onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22 fill=%22%234f46e5%22><rect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22 /><text x=%2250%22 y=%2265%22 font-family=%22Poppins, sans-serif%22 font-size=%2260%22 font-weight=%22bold%22 text-anchor=%22middle%22 fill=%22%234f46e5%22>M</text></svg>'; this.classList.add('skill-icon-placeholder');"
>
                <a href="index.html#hero" class="text-2xl font-poppins font-bold text-primary-brand hidden md:block">
    ${authorName.split(' ')[0]} <span class="md:inline lg:block">${authorName.split(' ').slice(1).join(' ')}</span>
</a>
</div>

            <div class="md:hidden flex items-center ml-auto pr-16">
                <button id="menu-toggle" aria-label="Open main menu" aria-controls="mobile-menu" aria-expanded="false" class="p-2 rounded-md text-default-text focus:outline-none focus:ring-2 focus:ring-primary-brand">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>

            <div class="hidden md:flex space-x-6 items-center">
                <a href="index.html#about" class="font-semibold text-default hover:text-primary-brand transition-colors duration-200">About</a>
                <a href="index.html#skills" class="font-semibold text-default hover:text-primary-brand transition-colors duration-200">Skills</a>
                <a href="index.html#projects" class="font-semibold text-default hover:text-primary-brand transition-colors duration-200">Featured Projects</a>
                <a href="all-projects.html" class="font-semibold text-default hover:text-primary-brand transition-colors duration-200">All Projects</a>
                <a href="index.html#connect" class="font-semibold text-default hover:text-primary-brand transition-colors duration-200">Connect</a>
                <a href="index.html#stats" class="font-semibold text-default hover:text-primary-brand transition-colors duration-200">Stats</a>
                <a href="index.html#contact" class="font-semibold text-default hover:text-primary-brand transition-colors duration-200">Contact</a>
                <a href="index.html#fun-fact" class="font-semibold text-default hover:text-primary-brand transition-colors duration-200">Fun Fact</a>
            </div>
        </div>
        <div id="mobile-menu" class="md:hidden bg-card border-t border-border-color shadow-inner">
            <a href="index.html#about" class="block px-4 py-3 text-default-text hover:bg-section transition-colors duration-200">About</a>
            <a href="index.html#skills" class="block px-4 py-3 text-default-text hover:bg-section transition-colors duration-200">Skills</a>
            <a href="index.html#projects" class="block px-4 py-3 text-default-text hover:bg-section transition-colors duration-200">Featured Projects</a>
            <a href="all-projects.html" class="block px-4 py-3 text-default-text hover:bg-section transition-colors duration-200">All Projects</a>
            <a href="index.html#connect" class="block px-4 py-3 text-default-text hover:bg-section transition-colors duration-200">Connect</a>
            <a href="index.html#stats" class="block px-4 py-3 text-default-text hover:bg-section transition-colors duration-200">Stats</a>
            <a href="index.html#contact" class="block px-4 py-3 text-default-text hover:bg-section transition-colors duration-200">Contact</a>
            <a href="index.html#fun-fact" class="block px-4 py-3 text-default-text hover:bg-section transition-colors duration-200">Fun Fact</a>
        </div>
    </nav>

    <header class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 text-center">
        <div class="max-w-4xl mx-auto px-4">
            <h1 class="text-4xl md:text-5xl font-extrabold mb-3">${projectName}</h1>
            <p class="text-xl md:text-2xl font-light opacity-90">${projectSubtitle}</p>
            <div class="mt-6 flex justify-center space-x-4">
                <a href="${liveDemoUrl}" target="_blank" class="bg-white text-blue-600 px-6 py-2 rounded-full text-lg font-semibold hover:bg-gray-100 transition shadow-md dark:bg-gray-700 dark:text-blue-300 dark:hover:bg-gray-600">
                    Live Demo
                </a>
                <a href="${githubRepoUrl}" target="_blank" class="bg-gray-800 text-white px-6 py-2 rounded-full text-lg font-semibold hover:bg-gray-700 transition shadow-md dark:bg-gray-900 dark:hover:bg-gray-700">
                    GitHub Repo
                </a>
            </div>
        </div>
    </header>

    <main class="max-w-4xl mx-auto py-12 px-4">
        <section class="bg-card p-8 rounded-lg shadow-md mb-8">
            <h2 class="text-3xl font-bold text-blue-600 mb-6 dark:text-blue-400">Project Overview</h2>

            <h3 class="text-2xl font-semibold border-b-2 border-blue-200 pb-2 mb-4 dark:border-blue-700">Detailed Description</h3>
            <div class="prose dark:prose-invert max-w-none text-default-text">
                <p>
                    ${projectDescription}
                </p>
                <ul>
                    ${problemSolved ? `<li><strong>Problem Solved:</strong> ${problemSolved}</li>` : ''}
                    ${myRole ? `<li><strong>My Role:</strong> ${myRole}</li>` : ''}
                    ${keyFeaturesList ? `<li><strong>Key Features:</strong><ul>${keyFeaturesList}</ul></li>` : ''}
                    ${technologiesUsedDesc ? `<li><strong>Technologies Used:</strong> ${technologiesUsedDesc}</li>` : ''}
                    ${challengesSolutions ? `<li><strong>Challenges and Solutions:</strong> ${challengesSolutions}</li>` : ''}
                    ${learnings ? `<li><strong>Learnings:</strong> ${learnings}</li>` : ''}
                    ${futureEnhancements ? `<li><strong>Future Enhancements (Optional):</strong> ${futureEnhancements}</li>` : ''}
                </ul>
                ${dynamicContentHtml}
            </div>

            <h3 class="text-2xl font-semibold border-b-2 border-blue-200 pb-2 mt-8 mb-4 dark:border-blue-700">Technologies Used</h3>
            <div class="flex flex-wrap gap-2 text-sm">
                ${technologiesTagsList}
            </div>

            <h3 class="text-2xl font-semibold border-b-2 border-blue-200 pb-2 mt-8 mb-4 dark:border-blue-700">Project Links</h3>
            <div class="flex space-x-4">
                <a href="${liveDemoUrl}" target="_blank" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition dark:bg-blue-700 dark:hover:bg-blue-600">Live Demo</a>
                <a href="${githubRepoUrl}" target="_blank" class="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition shadow-md dark:bg-gray-900 dark:hover:bg-gray-700">GitHub Repo</a>
            </div>
        </section>

        <div class="text-center mt-8">
            <a href="all-projects.html" class="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">← Back to All Projects</a>
        </div>
    </main>

    <footer class="bg-card text-center py-8 border-t border-border-color">
        <p class="text-default-text text-sm mb-2">© ${currentYear} ${authorName}. All rights reserved.</p>
        <a href="#top" id="back-to-top" class="text-primary-brand hover:underline text-base font-medium">Back to Top</a>
    </footer>

    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script src="particles.js"></script>
    <!-- Live preview embedded script -->
    <script>${scriptJsContent}</script>
</body>
</html>`;
    setGeneratedHtml(htmlContent);
    showNotification('HTML generated successfully!', 'success');
  };

  // Function to copy the generated HTML to clipboard
  const copyToClipboard = () => {
    if (htmlOutputRef.current) {
      const textarea = document.createElement('textarea');
      textarea.value = generatedHtml;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showNotification('HTML code copied to clipboard!', 'success');
      } catch (err) {
        console.error('Failed to copy HTML: ', err);
        showNotification('Failed to copy HTML. Please copy manually.', 'error');
      }
      document.body.removeChild(textarea);
    }
  };

  // Function to export project data to JSON
  const exportProjectData = () => {
const data = {
  projectName, projectSubtitle, projectDescription, projectUrl, liveDemoUrl, githubRepoUrl,
  contentBlocks: contentBlocks.map(block => ({
    ...block,
    uploadedFile: block.uploadedFile ? block.uploadedFile.name : null // Store file name only
  })),
  problemSolved, myRole, keyFeatures, technologiesUsedDesc, challengesSolutions,
  learnings, futureEnhancements, technologiesTags, authorName, linkedinUrl, ogImageUrl,
  twitterImageUrl, faviconUrl, logoUrl, jobTitle, alumniOf, enableCodeGemini,
  // Export color states
  primaryColor, secondaryColor, flashColor,
  bgColorLight, textColorLight, cardBgLight, sectionBgLight, borderColorLight, tagBgLight, tagTextLight, codeBgLight, codeTextLight, moonIconColorLight,
  bgColorDark, textColorDark, cardBgDark, sectionBgDark, borderColorDark, secondaryColorDark, tagBgDark, tagTextDark, codeBgDark, codeTextDark, moonIconColorDark,
};
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s/g, '-')}-project-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Project data exported successfully!', 'success');
  };

  // Function to import project data from JSON
  const importProjectData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setProjectName(importedData.projectName || '');
          setProjectSubtitle(importedData.projectSubtitle || '');
          setProjectDescription(importedData.projectDescription || '');
          setProjectUrl(importedData.projectUrl || '');
          setLiveDemoUrl(importedData.liveDemoUrl || '');
          setGithubRepoUrl(importedData.githubRepoUrl || '');
          setContentBlocks(importedData.contentBlocks?.map(block => ({
          ...block,
          uploadedFile: null // Cannot restore actual file, reset to null
          }) || []));
          setProblemSolved(importedData.problemSolved || '');
          setMyRole(importedData.myRole || '');
          setKeyFeatures(importedData.keyFeatures || '');
          setTechnologiesUsedDesc(importedData.technologiesUsedDesc || '');
          setChallengesSolutions(importedData.challengesSolutions || '');
          setLearnings(importedData.learnings || '');
          setFutureEnhancements(importedData.futureEnhancements || '');
          setTechnologiesTags(importedData.technologiesTags || '');
          setAuthorName(importedData.authorName || '');
          setLinkedinUrl(importedData.linkedinUrl || '');
          setOgImageUrl(importedData.ogImageUrl || '');
          setTwitterImageUrl(importedData.twitterImageUrl || '');
          setFaviconUrl(importedData.faviconUrl || '');
          setLogoUrl(importedData.logoUrl || '');
          setJobTitle(importedData.jobTitle || '');
          setAlumniOf(importedData.alumniOf || '');
          setEnableCodeGemini(importedData.enableCodeGemini !== undefined ? importedData.enableCodeGemini : false);

          // Import color states
          setPrimaryColor(importedData.primaryColor || '#4f46e5');
          setSecondaryColor(importedData.secondaryColor || '#14b8a6');
          setFlashColor(importedData.flashColor || '#dc2626');
          setBgColorLight(importedData.bgColorLight || '#f9fafb');
          setTextColorLight(importedData.textColorLight || '#1e293b');
          setCardBgLight(importedData.cardBgLight || '#ffffff');
          setSectionBgLight(importedData.sectionBgLight || '#f1f5f9');
          setBorderColorLight(importedData.borderColorLight || '#e2e8f0');
          setTagBgLight(importedData.tagBgLight || '#e2e8f0');
          setTagTextLight(importedData.tagTextLight || '#1e293b');
          setCodeBgLight(importedData.codeBgLight || '#f3f4f6');
          setCodeTextLight(importedData.codeTextLight || '#1f2937');
          setMoonIconColorLight(importedData.moonIconColorLight || '#1e293b');
          setBgColorDark(importedData.bgColorDark || '#0f172a');
          setTextColorDark(importedData.textColorDark || '#e2e8f0');
          setCardBgDark(importedData.cardBgDark || '#1e293b');
          setSectionBgDark(importedData.sectionBgDark || '#1e293b');
          setBorderColorDark(importedData.borderColorDark || '#475569');
          setSecondaryColorDark(importedData.secondaryColorDark || '#2dd4bf');
          setTagBgDark(importedData.tagBgDark || '#475569');
          setTagTextDark(importedData.tagTextDark || '#e2e8f0');
          setCodeBgDark(importedData.codeBgDark || '#1f2937');
          setCodeTextDark(importedData.codeTextDark || '#f9fafb');
          setMoonIconColorDark(importedData.moonIconColorDark || '#e2e8f0');


          showNotification('Project data imported successfully!', 'success');
        } catch (error) {
          console.error('Error parsing JSON:', error);
          showNotification('Failed to import data: Invalid JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };
const downloadZip = async () => {
  if (!generatedHtml) {
    showNotification('Please generate HTML first.', 'error');
    return;
  }

  // Check for JSZip and saveAs availability globally (via CDN)
  if (!JSZip || !saveAs) {
    showNotification('JSZip or FileSaver.js are not loaded. Please ensure CDN scripts are present in the generated HTML for ZIP download.', 'error');
    return;
  }

  const zip = new JSZip(); // Use window.JSZip
  zip.file("index.html", generatedHtml);

  // Add script.js to assets/js folder
  const jsFolder = zip.folder("assets/js");
  jsFolder.file("script.js", scriptJsContent);

  // Combine original style.css content with dynamic CSS variables
  const combinedStyleCssForZip = `${styleCssContent}\n${customCssVars}`;
  // Add combined style.css to assets/css folder
  const cssFolder = zip.folder("assets/css");
  cssFolder.file("style.css", combinedStyleCssForZip);
  
  // Add code-snippets.css (assuming it's static and needed)
  // For demonstration, let's include a dummy or placeholder if it's not provided
  cssFolder.file("code-snippets.css", `/* Basic styles for code snippets */
.code-snippet-container {
    background-color: var(--code-bg);
    color: var(--code-text);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    font-family: monospace;
    font-size: 0.875rem;
    box-shadow: inset 0 2px 4px 0 var(--code-shadow);
    transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}
.code-snippet-container pre,
.code-snippet-container code {
    background-color: transparent;
    color: inherit;
}`);


  // Add uploaded videos
  const videoFolder = zip.folder("assets/videos");
  for (const block of contentBlocks) {
    if (block.type === 'video' && block.sourceType === 'upload' && block.uploadedFile) {
      videoFolder.file(block.uploadedFile.name, block.uploadedFile);
    }
  }

  // Add uploaded images
  const imageFolder = zip.folder("assets/images");
  for (const block of contentBlocks) {
    if (block.type === 'image' && block.sourceType === 'upload' && block.uploadedFile) {
      imageFolder.file(block.uploadedFile.name, block.uploadedFile);
    }
  }

  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName.toLowerCase().replace(/\s/g, '-')}-export.zip`); // Use window.saveAs
    showNotification('ZIP file exported successfully!', 'success');
  } catch (error) {
    console.error('Error generating ZIP:', error);
    showNotification('Failed to export ZIP file.', 'error');
  }
};

  // Effect to handle delayed live preview update
  useEffect(() => {
    let timer;
    if (showPreviewPanel && generatedHtml) {
      setIsUpdatingPreview(true);
      timer = setTimeout(() => {
        setLivePreviewHtml(generatedHtml);
        setIsUpdatingPreview(false);
      }, 1000); // 1-second delay
    } else if (!showPreviewPanel) {
      setLivePreviewHtml(''); // Clear preview when panel is hidden
    }
    return () => clearTimeout(timer); // Cleanup function to clear timeout if generatedHtml changes or panel is hidden
  }, [generatedHtml, showPreviewPanel]);

  // Inside the App component, after other useState and useRef declarations
  useEffect(() => {
    if (showPreviewPanel) {
      generateHtml();
    }
  }, [showPreviewPanel, generateHtml]); // Added handleGenerateHtml to dependency array for clarity
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-row p-4 text-gray-900 dark:text-gray-100 dark">
      {/* Main Content (Input Form) */}
      <div className={`${showPreviewPanel ? 'w-1/2 max-w-2xl' : 'w-full max-w'} bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl transition-all duration-300 ease-in-out flex-1 overflow-y-auto ${showPreviewPanel ? 'mr-4' : ''}`}>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
          Project Page HTML Generator
        </h1>

        {/* Toggle Live Preview Button */}
        <button
          onClick={() => setShowPreviewPanel(!showPreviewPanel)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mb-6"
        >
          {showPreviewPanel ? 'Hide Live Preview' : 'Show Live Preview'}
        </button>
        
        {/* Save/Load Buttons */}
        <div className="absolute top-4 left-4 flex space-x-2 z-50">
          <button
            onClick={exportProjectData}
            className="p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300"
            title="Export Project Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={importProjectData}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="p-2 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-all duration-300"
            title="Import Project Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>


        {/* Main Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="projectName" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Project Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.projectName ? 'border-red-500' : ''}`}
              value={projectName}
              onChange={(e) => { setProjectName(e.target.value); setValidationErrors(prev => ({ ...prev, projectName: '' })); }}
              placeholder="e.g., Real-time Chat Application"
              required
            />
            {validationErrors.projectName && <p className="text-red-500 text-xs italic mt-1">{validationErrors.projectName}</p>}
          </div>
          <div>
            <label htmlFor="projectSubtitle" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Project Subtitle/Tagline:
            </label>
            <input
              type="text"
              id="projectSubtitle"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              value={projectSubtitle}
              onChange={(e) => setProjectSubtitle(e.target.value)}
              placeholder="e.g., Building a responsive, secure, and interactive chat experience."
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="projectDescription" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Project Overview Description (Initial Paragraph): <span className="text-red-500">*</span>
          </label>
          <DynamicTextarea
            id="projectDescription"
            value={projectDescription}
            onChange={(e) => { setProjectDescription(e.target.value); setValidationErrors(prev => ({ ...prev, projectDescription: '' })); }}
            placeholder="This project involved the design and development of a real-time chat application..."
            required
            maxRows={200} // Changed from 10 to 20
          />
          {validationErrors.projectDescription && <p className="text-red-500 text-xs italic mt-1">{validationErrors.projectDescription}</p>}
          {/* Gemini API Key Input */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex flex-col space-y-4">
          <p className="font-semibold text-lg">
            🔑 Gemini API Key (Your Key)(Optional)
          </p>
          <p className="text-sm">
            Enter your own Gemini API key to use the generation features. This helps keep the app free and ensures you manage your own API usage. Your key is saved locally in your browser for convenience and is NOT sent to any server.
            <br />
            Get your key from: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
          </p>
          <input
            type="password" // Use type="password" for better security in UI
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            placeholder="Enter your Gemini API key here"
            value={userApiKey}
            onChange={(e) => setUserApiKey(e.target.value)}
          />
        </div>
          <button
            onClick={generateProjectDetailsWithGemini}
            disabled={isLoadingGemini}
            className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingGemini ? 'Generating...' : 'Generate with ✨Gemini'}
          </button>
          {geminiError && <p className="text-red-500 text-sm mt-2">{geminiError}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="liveDemoUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Live Demo URL: <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="liveDemoUrl"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.liveDemoUrl ? 'border-red-500' : ''}`}
              value={liveDemoUrl}
              onChange={(e) => { setLiveDemoUrl(e.target.value); setValidationErrors(prev => ({ ...prev, liveDemoUrl: '' })); }}
              placeholder="https://example.com/chat-app-demo"
              required
            />
            {validationErrors.liveDemoUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.liveDemoUrl}</p>}
          </div>
          <div>
            <label htmlFor="githubRepoUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              GitHub Repo URL: <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="githubRepoUrl"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.githubRepoUrl ? 'border-red-500' : ''}`}
              value={githubRepoUrl}
              onChange={(e) => { setGithubRepoUrl(e.target.value); setValidationErrors(prev => ({ ...prev, githubRepoUrl: '' })); }}
              placeholder="https://github.com/your-username/your-project"
              required
            />
            {validationErrors.githubRepoUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.githubRepoUrl}</p>}
          </div>
        </div>

        {/* Auto-write Code Snippets Toggle */}
        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="enableCodeGemini"
            className="mr-2 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            checked={enableCodeGemini}
            onChange={(e) => setEnableCodeGemini(e.target.checked)}
          />
          <label htmlFor="enableCodeGemini" className="text-gray-700 dark:text-gray-300 font-bold">
            Auto-write Code Snippets by Gemini
          </label>
        </div>

        {/* Theme Color Customization */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Theme Color Customization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">General Colors:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Primary Brand Color:
                </label>
                <input type="color" id="primaryColor" className="w-full h-10 rounded-lg cursor-pointer" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
              <div>
                <label htmlFor="secondaryColor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Secondary Brand Color:
                </label>
                <input type="color" id="secondaryColor" className="w-full h-10 rounded-lg cursor-pointer" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
              </div>
              <div>
                <label htmlFor="flashColor" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Flash/Accent Color:
                </label>
                <input type="color" id="flashColor" className="w-full h-10 rounded-lg cursor-pointer" value={flashColor} onChange={(e) => setFlashColor(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4">Light Mode Colors:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bgColorLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Body Background:</label>
                <input type="color" id="bgColorLight" className="w-full h-10 rounded-lg cursor-pointer" value={bgColorLight} onChange={(e) => setBgColorLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="textColorLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Default Text:</label>
                <input type="color" id="textColorLight" className="w-full h-10 rounded-lg cursor-pointer" value={textColorLight} onChange={(e) => setTextColorLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="cardBgLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Card Background:</label>
                <input type="color" id="cardBgLight" className="w-full h-10 rounded-lg cursor-pointer" value={cardBgLight} onChange={(e) => setCardBgLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="sectionBgLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Section Background:</label>
                <input type="color" id="sectionBgLight" className="w-full h-10 rounded-lg cursor-pointer" value={sectionBgLight} onChange={(e) => setSectionBgLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="borderColorLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Border Color:</label>
                <input type="color" id="borderColorLight" className="w-full h-10 rounded-lg cursor-pointer" value={borderColorLight} onChange={(e) => setBorderColorLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="tagBgLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Tag Background:</label>
                <input type="color" id="tagBgLight" className="w-full h-10 rounded-lg cursor-pointer" value={tagBgLight} onChange={(e) => setTagBgLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="tagTextLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Tag Text:</label>
                <input type="color" id="tagTextLight" className="w-full h-10 rounded-lg cursor-pointer" value={tagTextLight} onChange={(e) => setTagTextLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="codeBgLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Code Background:</label>
                <input type="color" id="codeBgLight" className="w-full h-10 rounded-lg cursor-pointer" value={codeBgLight} onChange={(e) => setCodeBgLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="codeTextLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Code Text:</label>
                <input type="color" id="codeTextLight" className="w-full h-10 rounded-lg cursor-pointer" value={codeTextLight} onChange={(e) => setCodeTextLight(e.target.value)} />
              </div>
              <div>
                <label htmlFor="moonIconColorLight" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Moon Icon (Light Mode):</label>
                <input type="color" id="moonIconColorLight" className="w-full h-10 rounded-lg cursor-pointer" value={moonIconColorLight} onChange={(e) => setMoonIconColorLight(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4">Dark Mode Colors:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bgColorDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Body Background:</label>
                <input type="color" id="bgColorDark" className="w-full h-10 rounded-lg cursor-pointer" value={bgColorDark} onChange={(e) => setBgColorDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="textColorDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Default Text:</label>
                <input type="color" id="textColorDark" className="w-full h-10 rounded-lg cursor-pointer" value={textColorDark} onChange={(e) => setTextColorDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="cardBgDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Card Background:</label>
                <input type="color" id="cardBgDark" className="w-full h-10 rounded-lg cursor-pointer" value={cardBgDark} onChange={(e) => setCardBgDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="sectionBgDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Section Background:</label>
                <input type="color" id="sectionBgDark" className="w-full h-10 rounded-lg cursor-pointer" value={sectionBgDark} onChange={(e) => setSectionBgDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="borderColorDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Border Color:</label>
                <input type="color" id="borderColorDark" className="w-full h-10 rounded-lg cursor-pointer" value={borderColorDark} onChange={(e) => setBorderColorDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="secondaryColorDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Secondary Brand Color (Dark):</label>
                <input type="color" id="secondaryColorDark" className="w-full h-10 rounded-lg cursor-pointer" value={secondaryColorDark} onChange={(e) => setSecondaryColorDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="tagBgDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Tag Background:</label>
                <input type="color" id="tagBgDark" className="w-full h-10 rounded-lg cursor-pointer" value={tagBgDark} onChange={(e) => setTagBgDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="tagTextDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Tag Text:</label>
                <input type="color" id="tagTextDark" className="w-full h-10 rounded-lg cursor-pointer" value={tagTextDark} onChange={(e) => setTagTextDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="codeBgDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Code Background:</label>
                <input type="color" id="codeBgDark" className="w-full h-10 rounded-lg cursor-pointer" value={codeBgDark} onChange={(e) => setCodeBgDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="codeTextDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Code Text:</label>
                <input type="color" id="codeTextDark" className="w-full h-10 rounded-lg cursor-pointer" value={codeTextDark} onChange={(e) => setCodeTextDark(e.target.value)} />
              </div>
              <div>
                <label htmlFor="moonIconColorDark" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Moon Icon (Dark Mode):</label>
                <input type="color" id="moonIconColorDark" className="w-full h-10 rounded-lg cursor-pointer" value={moonIconColorDark} onChange={(e) => setMoonIconColorDark(e.target.value)} />
              </div>
            </div>
          </div>
        </div>


        {/* Detailed Project Aspects */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Detailed Project Aspects</h2>

        <div className="mb-6">
          <label htmlFor="problemSolved" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Problem Solved:
          </label>
          <DynamicTextarea
            id="problemSolved"
            value={problemSolved}
            onChange={(e) => setProblemSolved(e.target.value)}
            placeholder="The primary problem addressed was the lack of a simple, secure, and real-time communication tool..."
            maxRows={200} // Changed from 10 to 20
          />
        </div>

        <div className="mb-6">
          <label htmlFor="myRole" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            My Role:
          </label>
          <DynamicTextarea
            id="myRole"
            value={myRole}
            onChange={(e) => setMyRole(e.target.value)}
            placeholder="As a solo developer, I was responsible for the entire full-stack development cycle..."
            maxRows={200} // Changed from 10 to 20
          />
        </div>

        <div className="mb-6">
          <label htmlFor="keyFeatures" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Key Features (Comma Separated):
          </label>
          <DynamicTextarea
            id="keyFeatures"
            value={keyFeatures}
            onChange={(e) => setKeyFeatures(e.target.value)}
            placeholder="Real-time message sending, Secure user authentication, Public and private chat rooms"
            maxRows={200} // Changed from 10 to 20
          />
        </div>

        <div className="mb-6">
          <label htmlFor="technologiesUsedDesc" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Technologies Used (in Description):
          </label>
          <DynamicTextarea
            id="technologiesUsedDesc"
            value={technologiesUsedDesc}
            onChange={(e) => setTechnologiesUsedDesc(e.target.value)}
            placeholder="I extensively leveraged Angular for the dynamic and component-based frontend, Firebase Firestore for data storage..."
            maxRows={200} // Changed from 10 to 20
          />
        </div>

        <div className="mb-6">
          <label htmlFor="challengesSolutions" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Challenges and Solutions:
          </label>
          <DynamicTextarea
            id="challengesSolutions"
            value={challengesSolutions}
            onChange={(e) => setChallengesSolutions(e.target.value)}
            placeholder="A significant challenge was ensuring real-time data consistency and synchronization..."
            maxRows={200} // Changed from 10 to 20
          />
        </div>

        <div className="mb-6">
          <label htmlFor="learnings" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Learnings:
          </label>
          <DynamicTextarea
            id="learnings"
            value={learnings}
            onChange={(e) => setLearnings(e.target.value)}
            placeholder="This project significantly deepened my understanding of real-time database management and authentication flows..."
            maxRows={200} // Changed from 10 to 20
          />
        </div>

        <div className="mb-6">
          <label htmlFor="futureEnhancements" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Future Enhancements (Optional):
          </label>
          <DynamicTextarea
            id="futureEnhancements"
            value={futureEnhancements}
            onChange={(e) => setFutureEnhancements(e.target.value)}
            placeholder="Potential future enhancements include adding direct one-to-one messaging, file sharing capabilities..."
            maxRows={200} // Changed from 10 to 20
          />
        </div>

        {/* Dynamic Content Builder */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Dynamic Content Blocks (within Detailed Description)</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => addContentBlock('text')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
            Add Text Block
          </button>
          <button
            type="button"
            onClick={() => addContentBlock('image')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
            Add Image Block
          </button>
          <button
            type="button"
            onClick={() => addContentBlock('video')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
            Add Video Block
          </button>
          <button
            type="button"
            onClick={() => addContentBlock('code')}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
            Add Code Snippet
          </button>
        </div>

        {contentBlocks.map((block, index) => (
          <div key={block.id} 
          ref={index === contentBlocks.length - 1 ? lastBlockRef : null}
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-inner mb-4 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 capitalize">{block.type} Block {index + 1}</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => moveContentBlock(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
                  title="Move Up"
                >
                  ▲ {/* Up arrow */}
                </button>
                <button
                  type="button"
                  onClick={() => moveContentBlock(index, 'down')}
                  disabled={index === contentBlocks.length - 1}
                  className="p-1 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
                  title="Move Down"
                >
                  ▼ {/* Down arrow */}
                </button>
                <button
                  type="button"
                  onClick={() => removeContentBlock(index)}
                  className="p-1 rounded-full bg-red-400 text-white hover:bg-red-500"
                  title="Remove Block"
                >
                  ×
                </button>
              </div>
            </div>

            {block.type === 'text' && (
              <DynamicTextarea
                value={block.content}
                onChange={(e) => updateContentBlock(index, 'content', e.target.value)}
                placeholder="Enter your text content here..."
                maxRows={200}
              />
            )}
{block.type === 'image' && (
  <>
    <select
      value={block.sourceType || 'url'}
      onChange={(e) => {
        updateContentBlock(index, 'sourceType', e.target.value);
        // Reset fields when switching source type
        if (block.url && block.url.startsWith('blob:')) {
          URL.revokeObjectURL(block.url);
        }
        updateContentBlock(index, 'url', '');
        updateContentBlock(index, 'uploadedFile', null);
        updateContentBlock(index, 'error', '');
      }}
      className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500 mb-2"
    >
      <option value="url">Image URL</option>
      <option value="upload">Upload Image File</option>
    </select>

    {block.sourceType === 'url' && (
      <>
        <input
          type="url"
          className={`shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500 mb-2 ${validationErrors[`contentBlockUrl-${index}`] ? 'border-red-500' : ''}`}
          value={block.url}
          onChange={(e) => {
            updateContentBlock(index, 'url', e.target.value);
            setValidationErrors((prev) => ({ ...prev, [`contentBlockUrl-${index}`]: '' }));
            updateContentBlock(index, 'error', '');
          }}
          placeholder="Image URL (e.g., /images/my-image.png)"
        />
        {validationErrors[`contentBlockUrl-${index}`] && (
          <p className="text-red-500 text-xs italic mt-1">{validationErrors[`contentBlockUrl-${index}`]}</p>
        )}
      </>
    )}

    {block.sourceType === 'upload' && (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          const maxSizeMB = 10; // Limit to 10MB
          const allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

          if (file) {
            if (!allowedFormats.includes(file.type)) {
              showNotification('Please upload a supported image format (JPEG, PNG, GIF, WebP).', 'error');
              return;
            }
            if (file.size > maxSizeMB * 1024 * 1024) {
              showNotification(`File size exceeds ${maxSizeMB}MB limit.`, 'error');
              return;
            }
            if (block.url && block.url.startsWith('blob:')) {
              URL.revokeObjectURL(block.url);
            }
            const newUrl = URL.createObjectURL(file);
            updateContentBlock(index, 'uploadedFile', file);
            updateContentBlock(index, 'url', newUrl);
            updateContentBlock(index, 'error', '');
            setValidationErrors((prev) => ({ ...prev, [`contentBlockUrl-${index}`]: '' }));
          } else {
            showNotification('Please upload a valid image file.', 'error');
          }
        }}
        className="p-4 border-dashed border-2 rounded text-center mb-2 bg-gray-50 dark:bg-gray-600 dark:border-gray-500"
      >
        <p className="text-gray-700 dark:text-gray-300">Drag & drop image file here or click to upload (JPEG, PNG, GIF, WebP, max 10MB)</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => {
            const file = e.target.files[0];
            const maxSizeMB = 10; // Limit to 10MB
            const allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

            if (file) {
              if (!allowedFormats.includes(file.type)) {
                showNotification('Please upload a supported image format (JPEG, PNG, GIF, WebP).', 'error');
                return;
              }
              if (file.size > maxSizeMB * 1024 * 1024) {
                showNotification(`File size exceeds ${maxSizeMB}MB limit.`, 'error');
                return;
              }
              if (block.url && block.url.startsWith('blob:')) {
                URL.revokeObjectURL(block.url);
              }
              const newUrl = URL.createObjectURL(file);
              updateContentBlock(index, 'uploadedFile', file);
              updateContentBlock(index, 'url', newUrl);
              updateContentBlock(index, 'error', '');
              setValidationErrors((prev) => ({ ...prev, [`contentBlockUrl-${index}`]: '' }));
            } else {
              showNotification('Please upload a valid image file.', 'error');
            }
          }}
          className="block mt-2 mx-auto text-gray-700 dark:text-gray-200"
        />
      </div>
    )}

    {block.url && isValidUrl(block.url) && (
      <div className="mt-2 text-center">
        <img
          src={block.url}
          alt={block.alt || 'Image preview'}
          className="max-w-full h-auto rounded-lg shadow-md mx-auto"
          onError={(e) => {
            updateContentBlock(index, 'error', 'Error loading image.');
            e.target.src = 'https://placehold.co/300x200/FF0000/FFFFFF?text=Image+Error';
          }}
        />
        {block.error && <p className="text-red-500 text-xs italic mt-1">{block.error}</p>}
        <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Image Preview</p>
      </div>
    )}

    <input
      type="text"
      className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500 mb-2 mt-2"
      value={block.alt}
      onChange={(e) => updateContentBlock(index, 'alt', e.target.value)}
      placeholder="Alt text for image"
    />
    <input
      type="text"
      className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500"
      value={block.caption}
      onChange={(e) => updateContentBlock(index, 'caption', e.target.value)}
      placeholder="Image caption (optional)"
    />
  </>
)}
{block.type === 'video' && (
  <>
    <select
      value={block.sourceType || 'youtube'}
      onChange={(e) => updateContentBlock(index, 'sourceType', e.target.value)}
      className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500 mb-2"
    >
      <option value="youtube">YouTube URL</option>
      <option value="mp4">MP4 Link</option>
      <option value="upload">Upload Video File</option>
    </select>

    {(block.sourceType === 'youtube' || block.sourceType === 'mp4') && (
      <>
        <input
          type="url"
          className={`shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500 mb-2 ${validationErrors[`contentBlockUrl-${index}`] ? 'border-red-500' : ''}`}
          value={block.url || ''}
          onChange={(e) => {
            updateContentBlock(index, 'url', e.target.value);
            setValidationErrors((prev) => ({ ...prev, [`contentBlockUrl-${index}`]: '' }));
          }}
          placeholder={block.sourceType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/video.mp4'}
        />
        {validationErrors[`contentBlockUrl-${index}`] && (
          <p className="text-red-500 text-xs italic mt-1">{validationErrors[`contentBlockUrl-${index}`]}</p>
        )}
      </>
    )}

    {block.sourceType === 'upload' && (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('video/')) {
            updateContentBlock(index, 'uploadedFile', file);
            updateContentBlock(index, 'url', URL.createObjectURL(file));
            setValidationErrors((prev) => ({ ...prev, [`contentBlockUrl-${index}`]: '' }));
          } else {
            showNotification('Please upload a valid video file.', 'error');
          }
        }}
        className="p-4 border-dashed border-2 rounded text-center mb-2 bg-gray-50 dark:bg-gray-600 dark:border-gray-500"
      >
        <p className="text-gray-700 dark:text-gray-300">Drag & drop video file here or click to upload</p>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('video/')) {
              updateContentBlock(index, 'uploadedFile', file);
              updateContentBlock(index, 'url', URL.createObjectURL(file));
              setValidationErrors((prev) => ({ ...prev, [`contentBlockUrl-${index}`]: '' }));
            } else {
              showNotification('Please upload a valid video file.', 'error');
            }
          }}
          className="block mt-2 mx-auto text-gray-700 dark:text-gray-200"
        />
      </div>
    )}

    {block.url && isValidUrl(block.url) && (
      <div className="mt-2 aspect-w-16 aspect-h-9">
        {block.sourceType === 'youtube' ? (
          (() => {
            const videoId = getYouTubeVideoId(block.url);
            return videoId ? (
              <iframe
                className="w-full h-auto rounded-lg shadow-md mx-auto"
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={block.caption || 'YouTube Video Preview'}
              ></iframe>
            ) : (
              <p className="text-red-500 text-xs italic mt-1">Invalid YouTube URL. Please provide a valid YouTube link.</p>
            );
          })()
        ) : (
          <video
            controls
            src={block.url}
            className="w-full h-auto rounded-lg shadow-md mx-auto"
            onError={(e) => (e.target.nextSibling.textContent = 'Error loading video.')}
          ></video>
        )}
        <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">
          {block.sourceType === 'youtube' ? 'YouTube' : 'Video'} Preview
        </p>
      </div>
    )}

    <input
      type="text"
      className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500 mt-2"
      value={block.caption}
      onChange={(e) => updateContentBlock(index, 'caption', e.target.value)}
      placeholder="Video caption (optional)"
    />
  </>
)}
            {block.type === 'code' && (
              <>
                <input
                  type="text"
                  className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500 mb-2"
                  value={block.language}
                  onChange={(e) => updateContentBlock(index, 'language', e.target.value)}
                  placeholder="Code Language (e.g., javascript, python)"
                />
                <DynamicTextarea
                  value={block.code}
                  onChange={(e) => updateContentBlock(index, 'code', e.target.value)} // Direct update, not through block
                  placeholder="Paste your code snippet here..."
                  maxRows={200}
                />
                <input
                  type="text"
                  className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-600 dark:border-gray-500"
                  value={block.description}
                  onChange={(e) => updateContentBlock(index, 'description', e.target.value)}
                  placeholder="Description for this code snippet"
                />
                <button
                  onClick={() => generateCodeSnippetForBlock(index)}
                  disabled={codeGeminiLoadingIndex === index || isLoadingGemini}
                  className="mt-3 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {codeGeminiLoadingIndex === index ? 'Generating Code...' : 'Generate Code with ✨Gemini'}
                </button>
              </>
            )}
          </div>
        ))}

        {/* Technologies Tags */}
        <div className="mb-6">
          <label htmlFor="technologiesTags" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Technologies Used (Tags, Comma Separated):
          </label>
          <input
            type="text"
            id="technologiesTags"
            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            value={technologiesTags}
            onChange={(e) => setTechnologiesTags(e.target.value)}
            placeholder="Angular, Firebase Firestore, TypeScript, Tailwind CSS"
          />
        </div>

        {/* Author and SEO/Social Media Details */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">Author & SEO/Social Media Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="authorName" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Author Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="authorName"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.authorName ? 'border-red-500' : ''}`}
              value={authorName}
              onChange={(e) => { setAuthorName(e.target.value); setValidationErrors(prev => ({ ...prev, authorName: '' })); }}
              placeholder="Your Name Here"
              required
            />
            {validationErrors.authorName && <p className="text-red-500 text-xs italic mt-1">{validationErrors.authorName}</p>}
          </div>
          <div>
            <label htmlFor="linkedinUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              LinkedIn Profile URL:
            </label>
            <input
              type="url"
              id="linkedinUrl"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.linkedinUrl ? 'border-red-500' : ''}`}
              value={linkedinUrl}
              onChange={(e) => { setLinkedinUrl(e.target.value); setValidationErrors(prev => ({ ...prev, linkedinUrl: '' })); }}
              placeholder="https://www.linkedin.com/in/your-linkedin-profile"
            />
            {validationErrors.linkedinUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.linkedinUrl}</p>}
          </div>
          <div>
            <label htmlFor="jobTitle" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Job Title:
            </label>
            <input
              type="text"
              id="jobTitle"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Frontend Developer"
            />
          </div>
          <div>
            <label htmlFor="alumniOf" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Alumni Of:
            </label>
            <input
              type="text"
              id="alumniOf"
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              value={alumniOf}
              onChange={(e) => setAlumniOf(e.target.value)}
              placeholder="e.g., Your University/Institution"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="projectUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Project Canonical URL (for OG/Twitter):
            </label>
            <input
              type="url"
              id="projectUrl"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.projectUrl ? 'border-red-500' : ''}`}
              value={projectUrl}
              onChange={(e) => { setProjectUrl(e.target.value); setValidationErrors(prev => ({ ...prev, projectUrl: '' })); }}
              placeholder="https://your-username.github.io/your-project-name/index.html"
            />
            {validationErrors.projectUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.projectUrl}</p>}
          </div>
          <div>
            <label htmlFor="ogImageUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              OG Image URL (for social media previews):
            </label>
            <input
              type="url"
              id="ogImageUrl"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.ogImageUrl ? 'border-red-500' : ''}`}
              value={ogImageUrl}
              onChange={(e) => { setOgImageUrl(e.target.value); setValidationErrors(prev => ({ ...prev, ogImageUrl: '' })); }}
              placeholder="https://placehold.co/1200x630/E0E7FF/4338CA?text=Project+OG+Image"
            />
            {validationErrors.ogImageUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.ogImageUrl}</p>}
          </div>
          <div>
            <label htmlFor="twitterImageUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Twitter Image URL:
            </label>
            <input
              type="url"
              id="twitterImageUrl"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.twitterImageUrl ? 'border-red-500' : ''}`}
              value={twitterImageUrl}
              onChange={(e) => { setTwitterImageUrl(e.target.value); setValidationErrors(prev => ({ ...prev, twitterImageUrl: '' })); }}
              placeholder="https://placehold.co/1200x675/E0E7FF/4338CA?text=Project+Twitter+Image"
            />
            {validationErrors.twitterImageUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.twitterImageUrl}</p>}
          </div>
          <div>
            <label htmlFor="faviconUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Favicon URL:
            </label>
            <input
              type="url"
              id="faviconUrl"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.faviconUrl ? 'border-red-500' : ''}`}
              value={faviconUrl}
              onChange={(e) => { setFaviconUrl(e.target.value); setValidationErrors(prev => ({ ...prev, faviconUrl: '' })); }}
                            placeholder="https://placehold.co/32x32/E0E7FF/4338CA?text=Fav"
            />
            {validationErrors.faviconUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.faviconUrl}</p>}
          </div>
          <div>
            <label htmlFor="logoUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Logo URL:
            </label>
            <input
              type="url"
              id="logoUrl"
              className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${validationErrors.logoUrl ? 'border-red-500' : ''}`}
              value={logoUrl}
              onChange={(e) => { setLogoUrl(e.target.value); setValidationErrors(prev => ({ ...prev, logoUrl: '' })); }}
              placeholder="https://placehold.co/40x40/E0E7FF/4338CA?text=Logo"
            />
            {validationErrors.logoUrl && <p className="text-red-500 text-xs italic mt-1">{validationErrors.logoUrl}</p>}
          </div>
        </div>

        <button
          onClick={generateHtml}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Generate HTML
        </button>
<button
  onClick={downloadZip}
  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 mt-4"
>
  Download as ZIP
</button>

        {generatedHtml && (
          <div className="mt-10 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Generated HTML:</h2>
            <textarea
              ref={htmlOutputRef}
              readOnly
              rows="25"
              className="w-full p-4 bg-gray-800 text-green-400 font-mono text-sm rounded-lg border border-gray-700 resize-y focus:outline-none"
              value={generatedHtml}
            ></textarea>
            <button
              onClick={copyToClipboard}
              className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Copy HTML to Clipboard
            </button>
          </div>
        )}
      </div>
      {/* Live Preview Panel */}
      {showPreviewPanel && (
        <div className={`relative w-1/2 min-w-0 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out flex-1 overflow-y-auto ml-4`}>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4 text-center">Live Preview</h2>
          {isUpdatingPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-10 rounded-xl">
              <p className="text-gray-800 dark:text-gray-200 text-lg font-semibold animate-pulse">
                Updating preview...
              </p>
            </div>
          )}
          <iframe
            id="live-preview-iframe"
            title="Live HTML Preview"
            srcDoc={livePreviewHtml}
            className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            // Set min-height here as an inline style for the iframe itself, or rely on flex-1 to fill the parent.
            // style={{ minHeight: '80vh' }} is not needed if parent handles flex correctly
          ></iframe>
        </div>
      )}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </div>
  );

};

export default App;
