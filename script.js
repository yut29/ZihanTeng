/* ================= JS 逻辑核心 (完整终极版) ================= */

let bgTimer = null;           // 背景轮播定时器
let slideTimer = null;        // 作品详情轮播定时器
let bgIdx = 0;                // 当前背景图索引
let currentSlideIdx = 0;      // 作品详情图索引
let currentLbWorkId = null;   // 灯箱当前作品ID
let currentLbIndex = 0;       // 灯箱当前图片索引
let activeLayerNum = 1;       // 当前显示的背景层 (1 or 2)

// 当前正在查看的作品 ID (用于左右切换)
let currentViewingWorkId = null;

// 【核心工具】自动识别文字或多语言对象
function getText(content) {
    if (!content) return "";
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
        return content.EN || content.CN || Object.values(content)[0] || "";
    }
    return "";
}

window.onload = () => {
    // 检查数据源
    if (typeof siteData === 'undefined') {
        console.error("错误：没有找到 siteData，请检查 data.js 是否正确引入");
        return;
    }
    
    initFirstBackground();
    startBackgroundTimer();
    
    // 延迟加载新闻，配合开场动画
    setTimeout(() => { showNews(); }, 2500);
    
    initLightboxSwipe(); 
};

/* ================= 1. 背景轮播逻辑 (防闪烁版) ================= */

function initFirstBackground() {
    if(!siteData.backgrounds || siteData.backgrounds.length === 0) return;
    
    const layer1 = document.getElementById('bg-layer-1');
    layer1.style.backgroundImage = `url('${siteData.backgrounds[0]}')`;
    layer1.classList.add('active');
    
    activeLayerNum = 1;
    bgIdx = 0; 
}

function startBackgroundTimer() {
    if (bgTimer) clearInterval(bgTimer);
    bgTimer = setInterval(() => { playNextBackground(); }, 5000);
}

function playNextBackground() {
    if(!siteData.backgrounds || siteData.backgrounds.length <= 1) return;

    const nextIdx = (bgIdx + 1) % siteData.backgrounds.length;
    const nextImgUrl = siteData.backgrounds[nextIdx];

    const activeLayer = document.getElementById(`bg-layer-${activeLayerNum}`);
    const nextLayerNum = activeLayerNum === 1 ? 2 : 1;
    const nextLayer = document.getElementById(`bg-layer-${nextLayerNum}`);

    // 预加载图片
    const imgLoader = new Image();
    imgLoader.src = nextImgUrl;
    
    imgLoader.onload = () => {
        // 图片下载完成后才切换，杜绝闪烁
        nextLayer.style.backgroundImage = `url('${nextImgUrl}')`;
        nextLayer.classList.add('active');
        activeLayer.classList.remove('active');
        
        activeLayerNum = nextLayerNum;
        bgIdx = nextIdx; 
    };

    imgLoader.onerror = () => {
        // 如果图片坏了，跳过索引继续
        bgIdx = nextIdx; 
    };
}

function stopBackgroundTimer() {
    if (bgTimer) {
        clearInterval(bgTimer);
        bgTimer = null;
    }
}

/* ================= 2. 页面状态管理 ================= */

function enterDetailMode() {
    stopBackgroundTimer(); 
    document.body.classList.add('detail-mode');
}

function exitDetailMode() {
    document.body.classList.remove('detail-mode');
    document.getElementById('detail-view').style.display = 'none';
    
    const main = document.getElementById('app');
    main.style.display = 'block'; 
    
    setTimeout(() => {
        main.style.opacity = '1'; 
        main.style.pointerEvents = 'auto';
    }, 50);

    if(slideTimer) clearInterval(slideTimer);
    
    // 恢复背景轮播
    startBackgroundTimer();
    currentViewingWorkId = null;
}

function clearActive() {
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
}

/* ================= 3. 内容渲染 (News, Works) ================= */

function showNews() {
    exitDetailMode(); clearActive();
    document.getElementById('nav-news').classList.add('active');
    
    let html = `<div class="list-container">`;
    (siteData.news || []).forEach((n, i) => {
        const rawDetail = getText(n.details);
        const detailText = rawDetail.replace(/\n/g, '<br>');
        
        html += `
        <div class="list-row">
            <h2 onclick="toggleNews(${i})">${getText(n.title)}</h2>
            <p>${getText(n.location)} | ${getText(n.time)}</p>
            <div id="news-box-${i}" class="news-detail-box">${detailText}</div>
        </div>`;
    });
    document.getElementById('app').innerHTML = html + `</div>`;
}

function toggleNews(i) {
    const el = document.getElementById(`news-box-${i}`);
    if(el) el.classList.toggle('open');
}

function showWorksList() {
    exitDetailMode(); clearActive();
    document.getElementById('nav-works').classList.add('active');
    
    let html = `<div class="list-container">`;
    (siteData.works || []).forEach(w => {
        html += `<div class="list-row" onclick="showWorkDetail('${w.id}')"><h2>${getText(w.name)}</h2></div>`;
    });
    document.getElementById('app').innerHTML = html + `</div>`;
}

/* ================= 4. 作品详情与切换逻辑 ================= */

function switchWork(direction) {
    if (!currentViewingWorkId) return;
    
    const works = siteData.works || [];
    const currentIndex = works.findIndex(w => w.id === currentViewingWorkId);
    
    if (currentIndex === -1) return;

    // 计算下一个索引 (循环播放)
    let newIndex = currentIndex + direction;
    if (newIndex >= works.length) newIndex = 0;
    if (newIndex < 0) newIndex = works.length - 1;

    showWorkDetail(works[newIndex].id);
}

function showWorkDetail(id) {
    const work = siteData.works.find(w => w.id === id);
    if(!work) return;

    currentViewingWorkId = id;

    // 清理旧定时器
    if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }

    enterDetailMode(); 
    
    const main = document.getElementById('app');
    main.style.opacity = '0'; main.style.pointerEvents = 'none'; main.style.display = 'none'; 
    
    const overlay = document.getElementById('detail-view');
    if (overlay.style.display !== 'block') {
        overlay.style.display = 'block';
        overlay.scrollTop = 0;
    }
    
    currentSlideIdx = 0;
    
    const name = getText(work.name);
    const intro = getText(work.intro);
    const concept = getText(work.concept);
    
    // 图标 SVG 定义
    const prevIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="square"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    const nextIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="square"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    
    const closeButtonIcon = `
        <svg class="btn-holes" viewBox="0 0 24 24"><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/><circle cx="15" cy="15" r="1.5" fill="currentColor"/></svg>
        <svg class="btn-cross" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    `;

    // 图片处理
    const hasImages = work.images && work.images.length > 0;
    const mainImgSrc = hasImages ? work.images[0] : '';
    let dotsHtml = '';
    let controlsHtml = '';
    
    if (hasImages && work.images.length > 1) {
        dotsHtml = '<div class="slider-dots">';
        work.images.forEach((_, idx) => {
            dotsHtml += `<span class="dot ${idx===0?'active':''}" onclick="goToSlide('${id}', ${idx})"></span>`;
        });
        dotsHtml += '</div>';

        controlsHtml = `
            <div class="slider-controls-row">
                <div class="nav-btn nav-prev" onclick="changeSlide('${id}', -1)">${prevIcon}</div>
                <div class="nav-btn nav-next" onclick="changeSlide('${id}', 1)">${nextIcon}</div>
            </div>
        `;
    }

    const imageHtml = hasImages ? `
        <div class="media-wrapper">
            <div class="img-box">
                <img id="main-slide" src="${mainImgSrc}" onclick="openLightbox('${id}')">
                ${controlsHtml}
            </div>
            ${dotsHtml}
        </div>
    ` : '';

    // 渲染详情页 HTML (含长尾箭头切换按钮)
    overlay.innerHTML = `
        <div class="close-btn" onclick="showWorksList()">
            ${closeButtonIcon}
        </div>

        <div class="work-switch-btn work-prev" onclick="switchWork(-1)" title="Previous Work">
            <svg viewBox="0 0 50 50">
                <line x1="45" y1="25" x2="5" y2="25"></line>
                <polyline points="15 15 5 25 15 35"></polyline>
            </svg>
        </div>

        <div class="work-switch-btn work-next" onclick="switchWork(1)" title="Next Work">
            <svg viewBox="0 0 50 50">
                <line x1="5" y1="25" x2="45" y2="25"></line>
                <polyline points="35 15 45 25 35 35"></polyline>
            </svg>
        </div>

        <div class="detail-layout">
            <h2 class="detail-title">${name}</h2>
            <div class="detail-content-row">
                <div class="text-col">
                    <span class="intro">${intro}</span>
                    <div class="concept">${concept}</div>
                </div>
                <div class="media-col">
                    ${imageHtml}
                </div>
            </div>
        </div>
    `;

    if(hasImages && work.images.length > 1) {
        slideTimer = setInterval(() => changeSlide(id, 1), 3000);
        initInlineSwipe(id);
    }
}

/* ================= 5. Lightbox & Slider 逻辑 ================= */

function handleLightboxImageClick(e) {
    if (window.innerWidth <= 768) {
        const width = window.innerWidth;
        const clickX = e.clientX;
        if (clickX < width / 2) changeLightboxSlide(-1);
        else changeLightboxSlide(1);
        e.stopPropagation(); 
    } else {
        document.getElementById('lightbox').style.display = 'none';
    }
}

let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; 

function initInlineSwipe(id) {
    const img = document.getElementById('main-slide');
    if(!img) return;
    img.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, {passive: true});
    img.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe(dir => changeSlide(id, dir));
    }, {passive: true});
}

function initLightboxSwipe() {
    const img = document.getElementById('lightbox-img');
    if(!img) return;
    img.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, {passive: true});
    img.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe(dir => changeLightboxSlide(dir));
    }, {passive: true});
}

function handleSwipe(callback) {
    const diffX = touchStartX - touchEndX;
    if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) callback(1); 
        else callback(-1);
    }
}

function changeSlide(id, dir) {
    const work = siteData.works.find(w => w.id === id);
    if(!work || !work.images || work.images.length === 0) return;
    currentSlideIdx = (currentSlideIdx + dir + work.images.length) % work.images.length;
    updateSlideView(work);
}

function goToSlide(id, index) {
    const work = siteData.works.find(w => w.id === id);
    currentSlideIdx = index;
    if (slideTimer) clearInterval(slideTimer);
    slideTimer = setInterval(() => changeSlide(id, 1), 3000);
    updateSlideView(work);
}

function updateSlideView(work) {
    const img = document.getElementById('main-slide');
    if(!img) return;
    img.style.opacity = 0.5;
    setTimeout(() => {
        img.src = work.images[currentSlideIdx];
        img.onload = () => { img.style.opacity = 1; };
    }, 300);
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
        if (idx === currentSlideIdx) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function openLightbox(workId) {
    currentLbWorkId = workId;
    currentLbIndex = currentSlideIdx; 
    const work = siteData.works.find(w => w.id === workId);
    if(!work || !work.images) return;
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = work.images[currentLbIndex];
    lb.style.display = 'flex';
}

function changeLightboxSlide(dir) {
    const work = siteData.works.find(w => w.id === currentLbWorkId);
    if(!work) return;
    currentLbIndex = (currentLbIndex + dir + work.images.length) % work.images.length;
    const img = document.getElementById('lightbox-img');
    img.style.opacity = 0.5;
    setTimeout(() => {
        img.src = work.images[currentLbIndex];
        img.onload = () => { img.style.opacity = 1; };
    }, 200);
}

function closeLightbox(e) {
    if(e.target.id === 'lightbox') document.getElementById('lightbox').style.display = 'none';
}

/* ================= 6. About & Contact ================= */

function showAbout() {
    exitDetailMode(); clearActive();
    document.getElementById('nav-about').classList.add('active');
    
    // 双层结构解决 Flex 布局下加粗标签错位问题
    document.getElementById('app').innerHTML = `
        <div class="center-page">
            <div style="max-width:800px; margin:0 auto; text-align: left; width: 100%;">
                ${getText(siteData.about)}
            </div>
        </div>
    `;
}

function showContact() {
    exitDetailMode(); clearActive();
    document.getElementById('nav-contact').classList.add('active');
    
    // 隐私保护的小盾牌图标
    const shieldIcon = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>`;

    document.getElementById('app').innerHTML = `
        <div class="center-page">
            <div class="contact-container">
                ${getText(siteData.contact)}
                
                <div class="privacy-trigger" onclick="togglePrivacy(true)">
                    ${shieldIcon}
                    <span>Datenschutzerklärung / Privacy Policy</span>
                </div>
            </div>
        </div>

        <div id="privacy-overlay" class="privacy-overlay" onclick="togglePrivacy(false)">
            <div class="privacy-content" onclick="event.stopPropagation()">
                <div class="privacy-scroll-area">
                    <div class="privacy-lang-section">
                        <h3>Datenschutzerklärung</h3>
                        <p><strong>1. Verantwortliche Person</strong><br>
                        Zihan Teng, Künstler*in<br>E-Mail: info@zihanteng.com</p>
                        <p><strong>2. Zugriffsdaten</strong><br>Beim Besuch werden Server-Logfiles (IP, Browser) automatisch erfasst. Diese sind technisch notwendig.</p>
                        <p><strong>3. Kontaktaufnahme</strong><br>Per E-Mail gesendete Daten werden nur zur Bearbeitung Ihrer Anfrage gespeichert.</p>
                        <p><strong>4. Externe Links</strong><br>Keine Verantwortung für Datenschutzpraktiken externer Links (z.B. Instagram).</p>
                        <p><strong>5. Ihre Rechte</strong><br>Recht auf Auskunft, Berichtigung oder Löschung unter info@zihanteng.com.</p>
                    </div>

                    <hr style="border:0; border-top:1px solid #333; margin: 30px 0;">

                    <div class="privacy-lang-section">
                        <h3>Privacy Policy</h3>
                        <p><strong>1. Data Controller</strong><br>
                        Zihan Teng, Artist<br>Email: info@zihanteng.com</p>
                        <p><strong>2. Data Collection</strong><br>Technical info (IP, browser) is collected automatically for security purposes.</p>
                        <p><strong>3. Contact</strong><br>Data sent via email is used solely to process your request.</p>
                        <p><strong>4. External Links</strong><br>Not responsible for external platforms like Instagram.</p>
                        <p><strong>5. Your Rights</strong><br>Right to access, correct, or delete personal data.</p>
                    </div>
                </div>
                <button class="privacy-close" onclick="togglePrivacy(false)">CLOSE</button>
            </div>
        </div>
    `;
}

// 控制弹窗显示和隐藏的逻辑
function togglePrivacy(show) {
    const overlay = document.getElementById('privacy-overlay');
    if (!overlay) return;
    overlay.style.display = show ? 'flex' : 'none';
    // 弹窗出现时，禁止底层页面滚动（手机端体验优化）
    document.body.style.overflow = show ? 'hidden' : '';
}