const { createApp } = Vue;

createApp({
    data() {
        return {
            scrolled: false,
            menuActive: false,
            selectedLanguage: 'zh',
            projects: [
                {
                    id: 'pizza-bot',
                    name: 'Pizza Recommendation Bot',
                    nameZh: '🍕 披薩智慧推薦機器人',
                    badge: 'Featured App',
                    badgeZh: '精選應用',
                    description: 'A smart decision-making pizza picker for Pizza Hut and Domino\'s official menus, featuring party sizes, flavor cravings, budget filters, and instant pizza matching.',
                    descriptionZh: '專為解決「今晚吃哪款披薩」選擇困難打造的智慧推薦小幫手。整合必勝客與達美樂完整菜單數據，支援聚會人數、肉食/海鮮/素食口味、預算區間等精準推薦。',
                    icon: 'fa-pizza-slice',
                    link: './pizza-bot/index.html',
                    demo: './pizza-bot/index.html',
                    github: 'https://github.com/lilujj03-oss/lilujj03-oss.github.io/tree/main/pizza-bot',
                    color: '#d97706',
                    bgStyle: {
                        background: 'linear-gradient(135deg, #b45309 0%, #78350f 50%, #0f172a 100%)'
                    }
                },
                {
                    id: 'style-demos',
                    name: '18 Visual Design Styles Library',
                    nameZh: '🎨 18 大頂級視覺風格展示庫',
                    badge: 'Interactive Tool',
                    badgeZh: '互動設計工具庫',
                    description: 'An interactive design showcase featuring 18 distinctive UI aesthetics including Apple Minimal, Cyberpunk, Neo-Brutalism, Neumorphism, Retro 8-Bit, and Vaporwave.',
                    descriptionZh: '收錄了 18 種當代頂級網頁視覺設計流派的即時切換展示庫。涵蓋極簡蘋果風、黑白極客、賽博霓虹、包浩斯、新粗獷、新擬物、水墨、多巴胺與重工金屬等多元風格。',
                    icon: 'fa-palette',
                    link: './style-demos.html',
                    demo: './style-demos.html',
                    github: 'https://github.com/lilujj03-oss/lilujj03-oss.github.io/blob/main/style-demos.html',
                    color: '#ec4899',
                    bgStyle: {
                        background: 'linear-gradient(135deg, #be185d 0%, #7c3aed 50%, #0f172a 100%)'
                    }
                },
                {
                    id: 'profile-v1',
                    name: 'Developer Profile v1 (Minimalist Dark)',
                    nameZh: '💻 個人自介 v1 · 極簡暗色風',
                    badge: 'Profile v1',
                    badgeZh: '自介版本 1',
                    description: 'A minimalist dark GitHub developer profile focusing on clean typography, core coding skills, curiosity, and continuous creation.',
                    descriptionZh: '極簡工程師暗色主題個人自介。呈現 Hello World 初心、核心開發技能棧（HTML/CSS/JS/Git）、持續創作與好奇心理念。',
                    icon: 'fa-terminal',
                    link: './version-1/index.html',
                    demo: './version-1/index.html',
                    github: 'https://github.com/lilujj03-oss',
                    color: '#334155',
                    bgStyle: {
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                    }
                },
                {
                    id: 'profile-v2',
                    name: 'Editorial Profile v2 (About Me Card)',
                    nameZh: '🎨 個人自介 v2 · 典雅雜誌卡片風',
                    badge: 'Profile v2',
                    badgeZh: '自介版本 2',
                    description: 'An elegant editorial two-column card profile styled with Cormorant Garamond serif fonts, online status indicator, and interactive skill chips.',
                    descriptionZh: '典雅雜誌雙欄卡片風格自介頁。採用 Cormorant Garamond 襯線字體、在線狀態頭像徽章、核心工具標籤與探索者自我介紹。',
                    icon: 'fa-id-card',
                    link: './AboutMe/index-zh.html',
                    demo: './AboutMe/index-zh.html',
                    github: 'https://github.com/lilujj03-oss',
                    color: '#d97706',
                    bgStyle: {
                        background: 'linear-gradient(135deg, #78350f 0%, #1e293b 100%)'
                    }
                },
                {
                    id: 'profile-v3',
                    name: 'Interactive Profile v3 (Cyber Glassmorphism)',
                    nameZh: '✨ 個人自介 v3 · 現代科技互動風',
                    badge: 'Profile v3',
                    badgeZh: '自介版本 3',
                    description: 'A cutting-edge glassmorphism developer profile featuring live terminal outputs, dynamic tabs, animated status badges, and cyber neon glows.',
                    descriptionZh: '現代毛玻璃與賽博光感個人自介。包含動態終端機指令模擬 (whoami / cat)、分頁式技能圖卡、學習哲學與流暢微動畫體驗。',
                    icon: 'fa-wand-magic-sparkles',
                    link: './version-3/index.html',
                    demo: './version-3/index.html',
                    github: 'https://github.com/lilujj03-oss',
                    color: '#6366f1',
                    bgStyle: {
                        background: 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 60%, #0a0f1d 100%)'
                    }
                }
            ]
        };
    },
    methods: {
        toggleMenu() {
            this.menuActive = !this.menuActive;
        },
        changeLanguage() {
            // Smooth text update handled reactively by Vue 3
        },
        handleScroll() {
            this.scrolled = window.scrollY > 30;
        },
        initAnimations() {
            if (typeof gsap !== 'undefined') {
                // Hero entrance animation
                gsap.to('.hero h1', {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    ease: 'power3.out',
                    delay: 0.15
                });
                gsap.to('.hero h2', {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    ease: 'power3.out',
                    delay: 0.35
                });
                gsap.to('.hero-actions', {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    ease: 'power3.out',
                    delay: 0.55
                });

                // Gallery items stagger animation
                if (typeof ScrollTrigger !== 'undefined') {
                    gsap.registerPlugin(ScrollTrigger);
                    gsap.to('.gallery-item', {
                        scrollTrigger: {
                            trigger: '.gallery-grid',
                            start: 'top 85%'
                        },
                        opacity: 1,
                        scale: 1,
                        duration: 0.7,
                        stagger: 0.12,
                        ease: 'back.out(1.4)'
                    });
                } else {
                    gsap.to('.gallery-item', {
                        opacity: 1,
                        scale: 1,
                        duration: 0.7,
                        stagger: 0.12,
                        delay: 0.4
                    });
                }
            } else {
                // Fallback if GSAP is not loaded
                document.querySelectorAll('.hero h1, .hero h2, .hero-actions').forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                });
                document.querySelectorAll('.gallery-item').forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                });
            }
        }
    },
    mounted() {
        window.addEventListener('scroll', this.handleScroll);
        this.$nextTick(() => {
            setTimeout(() => {
                this.initAnimations();
            }, 80);
        });
    },
    beforeUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
    }
}).mount('#app');
