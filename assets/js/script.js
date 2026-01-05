import { db } from "./firebaseConfig.js"; 
import { collection, query, orderBy, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- LÓGICA DE TEMA (DARK/LIGHT) ---
const themeBtn = document.getElementById('theme-toggle');
const html = document.documentElement;

// 1. Carrega tema salvo
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
} else {
    html.classList.remove('dark');
}

// 2. Botão de troca
themeBtn.addEventListener('click', () => {
    html.classList.toggle('dark');
    
    if (html.classList.contains('dark')) {
        localStorage.theme = 'dark';
    } else {
        localStorage.theme = 'light';
    }
});

// --- LÓGICA DO FEED (BLOG) ---
const feedContainer = document.getElementById('public-feed');
const q = query(
    collection(db, "public_signals"), 
    orderBy("createdAt", "desc"), 
    limit(20)
);

onSnapshot(q, (snapshot) => {
    feedContainer.innerHTML = ""; 

    if (snapshot.empty) {
        feedContainer.innerHTML = `
            <div class="text-center py-20 border border-dashed border-sys-border rounded opacity-50 font-mono text-xs text-sys-meta">
                // DATABASE_EMPTY
            </div>`;
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        const date = data.createdAt ? data.createdAt.toDate() : new Date();
        
        // Data formatada
        const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
        const year = date.getFullYear();
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // HTML do Card (Estilo Blog Limpo)
        const html = `
            <article class="blog-card group cursor-default mb-12">
                <div class="flex items-baseline gap-4 mb-4 font-mono text-xs text-sys-meta uppercase tracking-wider">
                    <span class="text-sys-red group-hover:underline decoration-sys-red/50 offset-4">
                        ${data.type || 'SYS_LOG'}
                    </span>
                    <span>//</span>
                    <span>${day}, ${year}</span>
                    <span>@ ${time}</span>
                </div>
                
                <div class="prose prose-lg max-w-none">
                    <p class="text-sys-text text-lg md:text-xl leading-relaxed font-light transition-colors duration-300">
                        ${data.content}
                    </p>
                </div>

                <div class="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2">
                    <div class="h-px w-6 bg-sys-red"></div>
                    <span class="text-[10px] font-mono text-sys-meta">ID: ${doc.id}</span>
                </div>
            </article>
        `;
        
        feedContainer.insertAdjacentHTML('beforeend', html);
    });
}, (err) => {
    console.error(err);
    feedContainer.innerHTML = `<div class="text-sys-red font-mono text-center">CONNECTION_LOST</div>`;
});