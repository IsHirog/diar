import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const GROQ_API_KEY = "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";

// ---------------------------
// 1. SISTEMA DE LOGIN (Lock Screen)
// ---------------------------
onAuthStateChanged(auth, user => {
    // Se NÃO estiver logado, substitui todo o HTML pela tela de login
    if (!user) {
        document.body.innerHTML = `
        <div class="h-screen flex flex-col items-center justify-center bg-[#111111] text-gray-200 font-sans p-4 fade-in">
            <div class="w-full max-w-xs space-y-4">
                <h1 class="text-2xl font-normal text-center text-gray-400 mb-6 tracking-widest">:: SYSTEM LOGIN ::</h1>
                
                <input type="email" id="email" placeholder="user@id" 
                    class="w-full bg-[#0a0a0a] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-900 placeholder-gray-700 font-mono">
                
                <input type="password" id="pass" placeholder="access_key" 
                    class="w-full bg-[#0a0a0a] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-900 placeholder-gray-700 font-mono">
                
                <button id="login-btn" 
                    class="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white py-2 rounded transition-colors text-xs uppercase tracking-widest border border-gray-700">
                    Authenticate
                </button>
                <p id="error-msg" class="text-red-500 text-xs text-center font-mono h-4 mt-2"></p>
            </div>
        </div>
        `;

        document.getElementById("login-btn").addEventListener("click", async () => {
            const email = document.getElementById("email").value;
            const pass = document.getElementById("pass").value;
            const btn = document.getElementById("login-btn");
            const errorMsg = document.getElementById("error-msg");

            try {
                btn.textContent = "Verifying...";
                btn.disabled = true;
                await signInWithEmailAndPassword(auth, email, pass);
                window.location.reload(); // Recarrega para mostrar a interface real
            } catch (error) {
                console.error(error);
                btn.textContent = "Authenticate";
                btn.disabled = false;
                errorMsg.textContent = "Access Denied: Invalid credentials.";
            }
        });
        return; // Para a execução do script aqui se não tiver user
    }

    // Se tiver usuário logado, inicializa a lógica do app:
    initializeAppLogic(user);
});


// ---------------------------
// 2. LÓGICA DO APP (Só roda se logado)
// ---------------------------
function initializeAppLogic(user) {

    // --- Referências UI ---
    const reviewToggle = document.getElementById("review-toggle");
    const previewPanel = document.getElementById("preview-panel");
    const previewTextDiv = document.getElementById("preview-text");
    const btnRefresh = document.getElementById("btn-refresh");
    const btnConfirm = document.getElementById("btn-confirm");
    const btnCancel = document.getElementById("btn-cancel");
    const entryContent = document.getElementById("entry-content");
    const mainSendButton = document.getElementById("send-button");
    const tagsToggle = document.getElementById("tags-toggle");
    const metadataFields = document.getElementById("metadata-fields");

    let tempPrivateId = null;
    let currentGeneratedText = "";
    let originalTextCache = "";

    // --- Relógio ---
    function updateTimestamp() {
        const now = new Date();
        document.getElementById("timestamp").textContent = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    setInterval(updateTimestamp, 1000);
    updateTimestamp();

    // --- Tabs & Toggles ---
    function toggleFields() {
        metadataFields.classList.toggle("hidden", !tagsToggle.checked);
    }
    tagsToggle.addEventListener("change", toggleFields);

    window.switchTab = (view) => {
        const isWrite = view === 'write';
        document.getElementById('view-write').classList.toggle('hidden', !isWrite);
        document.getElementById('view-read').classList.toggle('hidden', isWrite);
        document.getElementById('tab-write').className = isWrite ? "pb-3 text-sm font-mono uppercase tracking-wide transition-all tab-active" : "pb-3 text-sm font-mono uppercase tracking-wide transition-all tab-inactive";
        document.getElementById('tab-read').className = !isWrite ? "pb-3 text-sm font-mono uppercase tracking-wide transition-all tab-active" : "pb-3 text-sm font-mono uppercase tracking-wide transition-all tab-inactive";
    }
    document.getElementById('tab-write').onclick = () => switchTab('write');
    document.getElementById('tab-read').onclick = () => switchTab('read');

    // --- Função IA (Groq) ---
    async function generateSignal(inputText) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `# ATUE COMO: Um "Observador Silencioso" e anônimo. Você é um narrador que traduz a experiência interna de alguém para o papel, sem filtros morais ou etiquetas sociais.

                                # TAREFA:
                                Reescreva o relato do usuário como uma narração em terceira pessoa. O texto deve parecer um trecho de um livro sobre os pensamentos reais e crus de um personagem anônimo.

                                # REGRAS DE PRIVACIDADE (CRÍTICO):
                                1. ANONIMATO TOTAL: Troque nomes próprios (pessoas, empresas, cidades) por descritores genéricos (ex: "o chefe", "aquela empresa", "o garoto").
                                2. SEM DATAS: Remova datas ou locais exatos. O tempo e o espaço devem ser vagos.
                                3. RELACIONAMENTOS: Seja vago. Mencione a existência de outros, mas mantenha uma "névoa" sobre quem são exatamente ou o status da relação. Não entre em detalhes íntimos.

                                # REGRAS DE ESTILO E TOM (IMPORTANTE):
                                1. TOM NATURAL E CRU: Não seja formal, acadêmico ou robótico. O texto deve soar como um pensamento real.
                                2. LINGUAGEM: Mantenha a intensidade do texto original. Se o relato original tiver palavrões ou revolta, mantenha isso na narração. Não "limpe" o vocabulário.
                                3. SEM MANEIRISMOS: Não use gírias forçadas, nem palavras difíceis ou poéticas demais. Escreva de forma direta e seca.
                                4. POSTURA: Levemente melancólico e observador, mas neutro. Não julgue, não dê conselhos e não tente resolver nada. Apenas narre o fato/sentimento.
                                5. Mantenha curto (máximo 3 frases)
                                `
                    },
                    { role: "user", content: inputText }
                ],
                temperature: 0.8,
                max_tokens: 200
            })
        });

        if (!response.ok) throw new Error("IA Failed");
        const data = await response.json();
        return data.choices[0].message.content;
    }

    // --- Envio (Submit) ---
    document.getElementById("entry-form").addEventListener("submit", async e => {
        e.preventDefault();
        if (!entryContent.value.trim()) return;

        originalTextCache = entryContent.value;
        mainSendButton.disabled = true;
        mainSendButton.textContent = "Saving Private...";

        try {
            // 1. Salva Privado
            const tagsInput = document.getElementById("tags-input");
            const docRef = await addDoc(collection(db, "entries"), {
                content: originalTextCache,
                tags: tagsToggle.checked ? tagsInput.value.split(" ").filter(Boolean) : [],
                createdAt: serverTimestamp(),
                owner: user.uid
            });
            tempPrivateId = docRef.id;

            // 2. Verifica Review Mode
            if (reviewToggle.checked) {
                mainSendButton.textContent = "Generating Preview...";
                previewPanel.classList.remove("hidden");
                previewTextDiv.textContent = "Diar AI is thinking...";
                previewTextDiv.classList.add("animate-pulse");

                currentGeneratedText = await generateSignal(originalTextCache);

                previewTextDiv.classList.remove("animate-pulse");
                previewTextDiv.textContent = currentGeneratedText;
                mainSendButton.textContent = "In Review";

            } else {
                mainSendButton.textContent = "Encrypting...";
                const abstractText = await generateSignal(originalTextCache);

                await addDoc(collection(db, "public_signals"), {
                    content: abstractText,
                    originalEntryId: tempPrivateId,
                    createdAt: serverTimestamp(),
                    type: "AUTO_LOG"
                });

                finishProcess();
            }

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
            mainSendButton.disabled = false;
            mainSendButton.textContent = "Commit";
            previewPanel.classList.add("hidden");
        }
    });

    // --- Botões Review ---
    btnRefresh.onclick = async () => {
        previewTextDiv.classList.add("animate-pulse");
        previewTextDiv.textContent = "Re-rolling...";
        btnRefresh.disabled = true;
        try {
            currentGeneratedText = await generateSignal(originalTextCache);
            previewTextDiv.textContent = currentGeneratedText;
        } catch (err) {
            previewTextDiv.textContent = "Error: " + err.message;
        } finally {
            previewTextDiv.classList.remove("animate-pulse");
            btnRefresh.disabled = false;
        }
    };

    btnConfirm.onclick = async () => {
        btnConfirm.textContent = "Publishing...";
        btnConfirm.disabled = true;
        try {
            await addDoc(collection(db, "public_signals"), {
                content: currentGeneratedText,
                originalEntryId: tempPrivateId,
                createdAt: serverTimestamp(),
                type: "REVIEWED_LOG"
            });
            previewPanel.classList.add("hidden");
            finishProcess();
        } catch (err) {
            alert("Save failed: " + err.message);
            btnConfirm.disabled = false;
            btnConfirm.textContent = "[ CONFIRM ]";
        }
    };

    btnCancel.onclick = () => {
        previewPanel.classList.add("hidden");
        alert("Saved privately only.");
        finishProcess(true);
    };

    function finishProcess(cancelled = false) {
        entryContent.value = "";
        document.getElementById("tags-input").value = "";
        tagsToggle.checked = false;
        toggleFields();

        if (!cancelled) {
            mainSendButton.textContent = ":: SUCCESS ::";
            mainSendButton.classList.add("text-green-500", "border-green-500");
            setTimeout(() => {
                mainSendButton.textContent = "Commit";
                mainSendButton.classList.remove("text-green-500", "border-green-500");
                mainSendButton.disabled = false;
            }, 2500);
        } else {
            mainSendButton.textContent = "Commit";
            mainSendButton.disabled = false;
        }
        btnConfirm.textContent = "[ CONFIRM ]";
        btnConfirm.disabled = false;
    }

    // --- Feed (Memory) ---
    const feed = document.getElementById('feed');
    const q = query(collection(db, "entries"), where("owner", "==", user.uid), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        feed.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : "..";
            feed.insertAdjacentHTML('beforeend', `
                <article class="border-l-2 border-gray-800 pl-4 py-1">
                    <div class="flex justify-between mb-2">
                        <span class="font-mono text-xs text-gray-600">${dateStr}</span>
                        ${data.tags && data.tags.length > 0 ? `<span class="text-xs text-gray-500 font-mono">[${data.tags.join(' ')}]</span>` : ''}
                    </div>
                    <div class="text-gray-400 text-sm mb-2 whitespace-pre-wrap">${data.content}</div>
                    <div class="text-[10px] text-green-900/50 font-mono tracking-widest uppercase">:: LOGGED ::</div>
                </article>
            `);
        });
        document.getElementById('status-indicator').textContent = `${snapshot.size} blocks active`;
    });
}