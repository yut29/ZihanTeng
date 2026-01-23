/* ================= JS 逻辑核心 (完整版 + 网址路由) ================= */

let bgTimer = null;           
let slideTimer = null;        
let bgIdx = 0;                
let currentSlideIdx = 0;      
let currentLbWorkId = null;   
let currentLbIndex = 0;       
let activeLayerNum = 1;       
let currentViewingWorkId = null;

// 工具函数：获取文字
function getText(content) {
    if (!content) return "";
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
        return content.EN || content.CN || Object.values(content)[0] || "";
    }
    return "";
}

/* ================= 核心：URL 路由管理 (新功能) ================= */

// 1. 更新浏览器地址栏，不刷新页面
function updateUrl(type, id = null) {
    let newUrl = window.location.pathname;
    const params = new URLSearchParams();

    if (type === 'work' && id) {
        params.set('work', id);
    } else if (type && type !== 'news') {
        params.set('page', type);
    } 
    // 如果是 news，保持纯净域名 (不带参数)

    const queryString = params.toString();
    if (queryString) {
        newUrl += `?${queryString}`;
    }

    // 推送历史记录 (这样按浏览器的“后退”按钮才有用)
    window.history.pushState({ type, id }, "", newUrl);
}

// 2. 根据 URL 参数决定显示什么页面 (用于刷新或直接打开链接时)
function handleRouting() {
    const urlParams = new URLSearchParams(window.location.search);
    const workId = urlParams.get('work');
    const page = urlParams.get('page');

    if (workId) {
        // 如果链接里有作品ID，直接打开作品
        showWorkDetail(workId, false); // false = 不要再推历史记录了，因为已经在这里了
    } else if (page === 'works') {
        showWorksList(false);
    } else if (page === 'about') {
        showAbout(false);
    } else if (page === 'contact') {
        showContact(false);
    } else {
        // 默认显示 News
        showNews(false);
    }
}

// 3. 监听浏览器“后退/前进”按钮
window.onpopstate = function(event) {
    handleRouting();
};

/* ================= 初始化逻辑 ================= */

window.onload = () => {
    // 检查数据源
    if (typeof siteData === 'undefined') {
        console.error("错误：没有找到 siteData，请检查 data.js 是否正确引入");
        return;
    }
    
    initFirstBackground();
    startBackgroundTimer();
    initLightboxSwipe(); 

    // 延迟加载，配合开场动画
    setTimeout(() => { 
        // 【关键】页面加载完成后，根据 URL 决定显示哪个页面
        handleRouting(); 
    }, 2500);
};

/* ================= 1. 背景轮播逻辑 ================= */

function initFirstBackground() {
    if(!siteData.backgrounds || siteData.backgrounds.length === 0) return;
    const layer1 = document.getElementById('bg-layer-1');
    layer1.style.backgroundImage = `url('${siteData.backgrounds[0]}')`;
    layer1.classList.add('active');
    activeLayerNum = 1; bgIdx = 0; 
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

    const imgLoader = new Image();
    imgLoader.src = nextImgUrl;
    imgLoader.onload = () => {
        nextLayer.style.backgroundImage = `url('${nextImgUrl}')`;
        nextLayer.classList.add('active');
        activeLayer.classList.remove('active');
        activeLayerNum = nextLayerNum;
        bgIdx = nextIdx; 
    };
    imgLoader.onerror = () => { bgIdx = nextIdx; };
}

function stopBackgroundTimer() {
    if (bgTimer) { clearInterval(bgTimer); bgTimer = null; }
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
    startBackgroundTimer();
    currentViewingWorkId = null;
}

function clearActive() {
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
}

/* ================= 3. 内容渲染 (News, Works) ================= */

function showNews(updateHistory = true) {
    if(updateHistory) updateUrl('news');
    
    exitDetailMode(); clearActive();
    document.getElementById('nav-news').classList.add('active');
    
    let html = `<div class="list-container">`;
    (siteData.news || []).forEach((n, i) => {
        const detailText = getText(n.details).replace(/\n/g, '<br>');
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

function showWorksList(updateHistory = true) {
    if(updateHistory) updateUrl('works');

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

    let newIndex = currentIndex + direction;
    if (newIndex >= works.length) newIndex = 0;
    if (newIndex < 0) newIndex = works.length - 1;

    showWorkDetail(works[newIndex].id);
}

function showWorkDetail(id, updateHistory = true) {
    const work = siteData.works.find(w => w.id === id);
    if(!work) return;

    // 【关键】更新 URL，例如变成 zihanteng.com/?work=riss
    if(updateHistory) updateUrl('work', id);

    currentViewingWorkId = id;
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
    
    const prevIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="square"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    const nextIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="square"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    const closeButtonIcon = `<svg class="btn-holes" viewBox="0 0 24 24"><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/><circle cx="15" cy="15" r="1.5" fill="currentColor"/></svg><svg class="btn-cross" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

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

        controlsHtml = `<div class="slider-controls-row"><div class="nav-btn nav-prev" onclick="changeSlide('${id}', -1)">${prevIcon}</div><div class="nav-btn nav-next" onclick="changeSlide('${id}', 1)">${nextIcon}</div></div>`;
    }

    const imageHtml = hasImages ? `
        <div class="media-wrapper">
            <div class="img-box">
                <img id="main-slide" src="${mainImgSrc}" onclick="openLightbox('${id}')">
                ${controlsHtml}
            </div>
            ${dotsHtml}
        </div>` : '';

    overlay.innerHTML = `
        <div class="close-btn" onclick="showWorksList()">
            ${closeButtonIcon}
        </div>
        <div class="work-switch-btn work-prev" onclick="switchWork(-1)" title="Previous Work">
            <svg viewBox="0 0 50 50"><line x1="45" y1="25" x2="5" y2="25"></line><polyline points="15 15 5 25 15 35"></polyline></svg>
        </div>
        <div class="work-switch-btn work-next" onclick="switchWork(1)" title="Next Work">
            <svg viewBox="0 0 50 50"><line x1="5" y1="25" x2="45" y2="25"></line><polyline points="35 15 45 25 35 35"></polyline></svg>
        </div>
        <div class="detail-layout">
            <h2 class="detail-title">${name}</h2>
            <div class="detail-content-row">
                <div class="text-col">
                    <span class="intro">${intro}</span>
                    <div class="concept">${concept}</div>
                </div>
                <div class="media-col">${imageHtml}</div>
            </div>
        </div>`;

    if(hasImages && work.images.length > 1) {
        slideTimer = setInterval(() => changeSlide(id, 1), 3000);
        initInlineSwipe(id);
    }
}

/* ================= 5. Lightbox & Slider 逻辑 ================= */

function handleLightboxImageClick(e) {
    if (window.innerWidth <= 768) {
        if (e.clientX < window.innerWidth / 2) changeLightboxSlide(-1); else changeLightboxSlide(1);
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
    
    // 淡出
    img.style.opacity = "0";
    
    setTimeout(() => {
        const nextSrc = work.images[currentSlideIdx];
        const tempImg = new Image();
        tempImg.src = nextSrc;
        
        tempImg.onload = () => {
            img.src = nextSrc; 
            // 淡入
            requestAnimationFrame(() => { img.style.opacity = "1"; });
        };
    }, 300); 
    
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlideIdx);
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

function showAbout(updateHistory = true) {
    if(updateHistory) updateUrl('about');

    exitDetailMode(); clearActive();
    document.getElementById('nav-about').classList.add('active');
    document.getElementById('app').innerHTML = `
        <div class="center-page">
            <div style="max-width:800px; margin:0 auto; text-align: left; width: 100%;">
                ${getText(siteData.about)}
            </div>
        </div>
    `;
}

function showContact(updateHistory = true) {
    if(updateHistory) updateUrl('contact');

    exitDetailMode(); clearActive();
    document.getElementById('nav-contact').classList.add('active');
    
    const shieldIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;

    document.getElementById('app').innerHTML = `
        <div class="center-page">
            <div class="contact-container">
                <div class="contact-info">${getText(siteData.contact)}</div>
                <div class="contact-footer">
                    <div class="credits-line">Design & Code: YutongLiu0129@gmail.com</div>
                    <div class="privacy-trigger" onclick="togglePrivacy(true)">
                        ${shieldIcon}<span>Datenschutzerklärung / Privacy Policy</span>
                    </div>
                </div>
            </div>
        </div>
        <div id="privacy-overlay" class="privacy-overlay" onclick="togglePrivacy(false)">
            <div class="privacy-content" onclick="event.stopPropagation()">
                <div class="privacy-scroll-area">
                    <div class="privacy-lang-section">
                        <h3>Datenschutzerklärung</h3>
                        <p><strong>1. Verantwortliche Person</strong><br>Zihan Teng, Künstler*in<br>E-Mail: info@zihanteng.com</p>
                        <p><strong>2. Zugriffsdaten</strong><br>Beim Besuch werden Server-Logfiles (IP, Browser) automatisch erfasst.</p>
                        <p><strong>3. Kontaktaufnahme</strong><br>Per E-Mail gesendete Daten werden nur zur Bearbeitung Ihrer Anfrage gespeichert.</p>
                        <p><strong>4. Externe Links</strong><br>Keine Verantwortung für Datenschutzpraktiken externer Links.</p>
                        <p><strong>5. Ihre Rechte</strong><br>Recht auf Auskunft, Berichtigung oder Löschung unter info@zihanteng.com.</p>
                    </div>
                    <hr style="border:0; border-top:1px solid #333; margin: 30px 0;">
                    <div class="privacy-lang-section">
                        <h3>Privacy Policy</h3>
                        <p><strong>1. Data Controller</strong><br>Zihan Teng, Artist<br>Email: info@zihanteng.com</p>
                        <p><strong>2. Data Collection</strong><br>Technical info (IP, browser) is collected automatically for security purposes.</p>
                        <p><strong>3. Contact</strong><br>Data sent via email is used solely to process your request.</p>
                        <p><strong>4. External Links</strong><br>Not responsible for external platforms like Instagram.</p>
                        <p><strong>5. Your Rights</strong><br>You have the right to request access to, correction, or deletion of your personal data.</p>
                    </div>
                </div>
                <button class="privacy-close" onclick="togglePrivacy(false)">CLOSE</button>
            </div>
        </div>
    `;
}

function togglePrivacy(show) {
    const overlay = document.getElementById('privacy-overlay');
    if (!overlay) return;
    overlay.style.display = show ? 'flex' : 'none';
    document.body.style.overflow = show ? 'hidden' : '';
}