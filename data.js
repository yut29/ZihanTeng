const siteData = {
    currentLang: 'EN',
    ui: {
        EN: { news: "News", works: "Works", about: "About", contact: "Contact", back: "Back" },
        DE: { news: "Aktuelles", works: "Werke", about: "Über", contact: "Kontakt", back: "Zurück" },
        CN: { news: "新闻", works: "作品集", about: "关于", contact: "联系", back: "返回" }
    },
    // 全屏动图背景
    backgrounds: [
        "Bring Licht herein/DSCF6614.JPG",
        "Bring Licht herein/DSCF6685.JPG",
        "Bring Licht herein/DSCF6705.JPG",
        "Bring Licht herein/DSCF6710.JPG"
    ],
    // 15个预设作品
    works: [
        {
            id: "bring-licht-herein",
            name: { EN: "BRINGEN", DE: "BRING Licht herein", CN: "引光入室" },
            intro: { EN: "A 50-word description about the essence of light..A 50-word description about the essence of light.", CN: "这里是50字的作品短评...", DE: "Eine 50-Wörter-Beschreibung..." },
            concept: { EN: "500-word concept details..500-word concept details..500-word concept details..500-word concept details..500-word concept details..500-word concept details..500-word concept details..500-word concept details..500-word concept details..500-word concept details..500-word concept details..500-word concept details...", CN: "这里是500字的作品详细概念描述...", DE: "500-Wörter Konzept..." },
            images: [
                "Bring Licht herein/DSCF6710.JPG",
                "Bring Licht herein/DSCF6745.JPG",
                "Bring Licht herein/DSCF6746.JPG",
                "Bring Licht herein/DSCF6761.JPG",
                "Bring Licht herein/DSCF6621.JPG"
            ]
        },
        { id: "2020-exp", name: { EN: "2020年小实验", CN: "2020年小实验" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
        { id: "BBK", name: { EN: "bbk", CN: "bbk" }, intro: {CN:""}, concept: {CN:""}, images: [] },
    ],
    news: [
        {
            title: "TEN BY ONE",
            location: "PEAC Museum Freiburg",
            time: "21.09.2025 - 08.02.2026",
            details: {
                EN: "Opening 21.09.2025, 11h. Full info line 1\nLine 2\nLine 3\nLine 4",
                CN: "2025年9月21日11时开幕。详细信息第1行\n第2行\n第3行\n第4行"
            }

        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }, // <--- 注意这个逗号，它是连接两条数据的纽带
        {
            title: "新展览名称",
            location: "纽伦堡某画廊",
            time: "2026.03.01 - 2026.04.01",
            details: {
                EN: "New exhibition details line 1\nline 2",
                CN: "新展览详情第1行\n第2行",
                DE: "Neue Ausstellung Details..."
            }
        }
        
    ],
    about: {
        EN: "1000-word introduction...",
        CN: "1000字个人介绍..."
    },
    contact: {
        EN: "Email: zihan@example.com<br>Instagram: @zihanteng",
        CN: "邮箱: zihan@example.com<br>Instagram: @zihanteng"
    }
};