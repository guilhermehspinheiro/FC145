/**
 * 145FC Web Application Logic
 * Powered by JavaScript Vanilla - Persistência em LocalStorage
 */

// --- DADOS INICIAIS MOCKADOS ---
const DEFAULT_PLAYERS = [];
const DEFAULT_MATCHES = [];
const DEFAULT_STATS = [];

// --- COORDENADAS TÁTICAS (PERCENTUAL EM RELAÇÃO AO CAMPO DE 480x580) ---
const FORMATIONS = {
    "4-3-3": [
        { role: "Goleiro", top: 90, left: 50, label: "GK" },
        { role: "Lateral Direito", top: 72, left: 85, label: "LD" },
        { role: "Zagueiro Direito", top: 78, left: 62, label: "ZD" },
        { role: "Zagueiro Esquerdo", top: 78, left: 38, label: "ZE" },
        { role: "Lateral Esquerdo", top: 72, left: 15, label: "LE" },
        { role: "Volante", top: 58, left: 50, label: "VOL" },
        { role: "Meia Direito", top: 48, left: 72, label: "MC" },
        { role: "Meia Esquerdo", top: 48, left: 28, label: "MC" },
        { role: "Ponta Direita", top: 22, left: 80, label: "PD" },
        { role: "Centroavante", top: 16, left: 50, label: "CA" },
        { role: "Ponta Esquerda", top: 22, left: 20, label: "PE" }
    ],
    "4-4-2": [
        { role: "Goleiro", top: 90, left: 50, label: "GK" },
        { role: "Lateral Direito", top: 72, left: 85, label: "LD" },
        { role: "Zagueiro Direito", top: 78, left: 62, label: "ZD" },
        { role: "Zagueiro Esquerdo", top: 78, left: 38, label: "ZE" },
        { role: "Lateral Esquerdo", top: 72, left: 15, label: "LE" },
        { role: "Volante Direito", top: 54, left: 65, label: "VOL" },
        { role: "Volante Esquerdo", top: 54, left: 35, label: "VOL" },
        { role: "Meia Direito", top: 44, left: 80, label: "MD" },
        { role: "Meia Esquerdo", top: 44, left: 20, label: "ME" },
        { role: "Atacante Direito", top: 18, left: 60, label: "AT" },
        { role: "Atacante Esquerdo", top: 18, left: 40, label: "AT" }
    ],
    "3-5-2": [
        { role: "Goleiro", top: 90, left: 50, label: "GK" },
        { role: "Zagueiro Direito", top: 78, left: 75, label: "ZD" },
        { role: "Zagueiro Central", top: 80, left: 50, label: "ZC" },
        { role: "Zagueiro Esquerdo", top: 78, left: 25, label: "ZE" },
        { role: "Volante Central", top: 58, left: 50, label: "VOL" },
        { role: "Meia Direito", top: 46, left: 68, label: "MC" },
        { role: "Meia Esquerdo", top: 46, left: 32, label: "MC" },
        { role: "Ala Direito", top: 40, left: 88, label: "AD" },
        { role: "Ala Esquerdo", top: 40, left: 12, label: "AE" },
        { role: "Atacante Direito", top: 18, left: 60, label: "AT" },
        { role: "Atacante Esquerdo", top: 18, left: 40, label: "AT" }
    ],
    "5-3-2": [
        { role: "Goleiro", top: 90, left: 50, label: "GK" },
        { role: "Ala Direito", top: 70, left: 88, label: "AD" },
        { role: "Zagueiro Direito", top: 78, left: 68, label: "ZD" },
        { role: "Zagueiro Central", top: 80, left: 50, label: "ZC" },
        { role: "Zagueiro Esquerdo", top: 78, left: 32, label: "ZE" },
        { role: "Ala Esquerdo", top: 70, left: 12, label: "AE" },
        { role: "Volante Central", top: 54, left: 50, label: "VOL" },
        { role: "Meia Direito", top: 45, left: 72, label: "MC" },
        { role: "Meia Esquerdo", top: 45, left: 28, label: "MC" },
        { role: "Atacante Direito", top: 18, left: 60, label: "AT" },
        { role: "Atacante Esquerdo", top: 18, left: 40, label: "AT" }
    ]
};

// --- APLICAÇÃO ---
class App145FC {
    constructor() {
        this.players = [];
        this.matches = [];
        this.stats = [];
        this.users = JSON.parse(localStorage.getItem("145fc_users")) || [
            { username: "admin", password: "123", photo: null }
        ];
        this.loggedInUser = null;
        this.loginMode = "login";
        
        this.selectedFormation = "4-3-3";
        this.activeMatchId = "";
        this.selectedFieldPlayerIndex = null; // Índice do nó do campo selecionado para troca
        
        // Estado dos Timers
        this.timers = {
            gk: { interval: null, remaining: 600, running: false },
            df: { interval: null, remaining: 480, running: false },
            mc: { interval: null, remaining: 480, running: false },
            at: { interval: null, remaining: 360, running: false }
        };

        // Propriedades da Prancheta
        this.boardDrawing = false;
        this.boardContext = null;
        this.boardOpponentsVisible = true;
        this.boardPenColor = "#0055ff";
        this.boardPenSize = 4;
    }

    init() {
        // Carrega dados do LocalStorage ou usa Defaults
        this.loadData();
        
        // Verifica Autenticação
        this.checkAuth();
        
        // Define o primeiro jogo como ativo por padrão
        if (this.matches.length > 0) {
            this.activeMatchId = this.matches[0].id;
        }

        // Registrar Event Listeners
        this.registerEvents();

        // Renderiza as telas
        this.renderAll();
        
        // Inicializa as datas
        this.updateDateDisplay();

        // Inicializa a Prancheta
        this.initChalkboard();
    }

    // --- CARGA E PERSISTÊNCIA DE DADOS ---
    loadData() {
        const savedPlayers = localStorage.getItem("145fc_players");
        const savedMatches = localStorage.getItem("145fc_matches");
        const savedStats = localStorage.getItem("145fc_stats");
        const savedFormation = localStorage.getItem("145fc_tactical_formation");

        this.players = savedPlayers ? JSON.parse(savedPlayers) : [...DEFAULT_PLAYERS];
        this.matches = savedMatches ? JSON.parse(savedMatches) : [...DEFAULT_MATCHES];
        this.stats = savedStats ? JSON.parse(savedStats) : [...DEFAULT_STATS];
        
        if (savedFormation && FORMATIONS[savedFormation]) {
            this.selectedFormation = savedFormation;
            document.getElementById("formation-select").value = savedFormation;
        }

        // Se for a primeira vez inicializando os dados mockados, salva no localStorage
        if (!savedPlayers) this.savePlayers();
        if (!savedMatches) this.saveMatches();
        if (!savedStats) this.saveStats();
    }

    savePlayers() {
        localStorage.setItem("145fc_players", JSON.stringify(this.players));
    }

    saveUsers() {
        localStorage.setItem("145fc_users", JSON.stringify(this.users));
    }

    checkAuth() {
        const user = localStorage.getItem("145fc_logged_in_user");
        if (user) {
            this.loggedInUser = JSON.parse(user);
            document.getElementById("login-container").classList.add("hidden");
            document.querySelector(".app-container").classList.remove("hidden");
            this.updateSidebarUserProfile();
        } else {
            this.loggedInUser = null;
            document.getElementById("login-container").classList.remove("hidden");
            document.querySelector(".app-container").classList.add("hidden");
            this.toggleLoginRegister("login");
        }
    }

    updateSidebarUserProfile() {
        const nameEl = document.getElementById("sidebar-user-name");
        const avatarEl = document.getElementById("sidebar-user-avatar");
        
        if (this.loggedInUser && nameEl && avatarEl) {
            nameEl.innerText = this.loggedInUser.username;
            if (this.loggedInUser.photo) {
                avatarEl.style.backgroundImage = `url(${this.loggedInUser.photo})`;
                avatarEl.style.backgroundColor = "transparent";
            } else {
                avatarEl.style.backgroundImage = "none";
                avatarEl.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }
        }
    }

    toggleLoginRegister(mode) {
        this.loginMode = mode;
        const titleEl = document.getElementById("login-title");
        const subtitleEl = document.getElementById("login-subtitle");
        const submitBtnText = document.getElementById("login-btn-text");
        const toggleLink = document.getElementById("toggle-register-link");
        const registerFields = document.getElementById("register-only-fields");
        const passwordInput = document.getElementById("login-password");
        const loginForm = document.getElementById("login-form");

        if (loginForm) loginForm.reset();

        if (mode === "login") {
            titleEl.innerText = "Acesso ao Painel 145FC";
            subtitleEl.innerText = "Faça login para gerenciar o time";
            submitBtnText.innerText = "Entrar";
            toggleLink.innerText = "Não tem conta? Cadastre-se aqui";
            registerFields.classList.add("hidden");
            passwordInput.required = true;
        } else {
            titleEl.innerText = "Criar Conta - 145FC";
            subtitleEl.innerText = "Cadastre seu jogador para entrar no painel";
            submitBtnText.innerText = "Cadastrar e Entrar";
            toggleLink.innerText = "Já tem uma conta? Faça login";
            registerFields.classList.remove("hidden");
            passwordInput.required = true;
        }
    }

    login(username, password) {
        const found = this.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        if (found) {
            localStorage.setItem("145fc_logged_in_user", JSON.stringify(found));
            this.showToast(`Bem-vindo, ${found.username}!`);
            this.checkAuth();
            this.renderAll();
        } else {
            this.showToast("Erro: Usuário ou senha incorretos.");
        }
    }

    register(username, password, number, position, photoData) {
        if (this.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            this.showToast("Erro: Nome de usuário já está cadastrado.");
            return;
        }

        const newUser = {
            username,
            password,
            photo: photoData
        };

        this.users.push(newUser);
        this.saveUsers();

        // Cria o jogador no elenco correspondente
        const nextNumber = number || (this.players.length > 0 ? Math.max(...this.players.map(p => p.number)) + 1 : 10);
        const newPlayer = {
            id: "p_" + Date.now(),
            name: username,
            number: nextNumber,
            position: position || "Meio-Campo",
            photo: photoData
        };

        this.players.push(newPlayer);
        this.savePlayers();

        // Autentica e inicia
        localStorage.setItem("145fc_logged_in_user", JSON.stringify(newUser));
        this.showToast(`Conta criada! Bem-vindo, ${username}!`);
        
        // Atualiza telas
        this.populateDropdowns();
        this.renderAvailablePlayersList();
        this.checkAuth();
        this.renderAll();
    }

    logout() {
        localStorage.removeItem("145fc_logged_in_user");
        this.showToast("Você saiu da conta.");
        this.checkAuth();
    }

    compressImage(file, callback) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                
                canvas.width = 120;
                canvas.height = 120;
                
                const size = Math.min(img.width, img.height);
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;
                
                ctx.drawImage(img, x, y, size, size, 0, 0, 120, 120);
                callback(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    saveMatches() {
        localStorage.setItem("145fc_matches", JSON.stringify(this.matches));
    }

    saveStats() {
        localStorage.setItem("145fc_stats", JSON.stringify(this.stats));
    }

    saveFormation() {
        localStorage.setItem("145fc_tactical_formation", this.selectedFormation);
    }

    // --- EVENT LISTENERS REGISTRATION ---
    registerEvents() {
        // Navegação de Abas
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const tabId = link.getAttribute("data-tab");
                this.switchTab(tabId);
                
                // Fecha menu no mobile após clique
                document.querySelector(".sidebar").classList.remove("open");
            });
        });

        // Toggle do Menu Mobile
        document.getElementById("menu-toggle").addEventListener("click", () => {
            document.querySelector(".sidebar").classList.toggle("open");
        });

        // Formação do Campo
        document.getElementById("formation-select").addEventListener("change", (e) => {
            this.selectedFormation = e.target.value;
            this.saveFormation();
            this.selectedFieldPlayerIndex = null;
            this.renderTacticalField();
            this.renderDashboardLineup();
            this.showToast("Esquema tático alterado para " + this.selectedFormation);
        });

        // Botão Copiar Escalação
        document.getElementById("share-lineup-btn").addEventListener("click", () => {
            this.copyLineupToClipboard();
        });

        // Abas secundárias do painel lateral (Jogadores / Novo Jogador)
        document.querySelectorAll(".panel-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".panel-tab-btn").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".panel-tab-content").forEach(c => c.classList.remove("active"));
                
                btn.classList.add("active");
                const targetTab = btn.getAttribute("data-panel-tab");
                document.getElementById(`panel-${targetTab}`).classList.add("active");
            });
        });

        // Pesquisa de Jogadores no Painel
        document.getElementById("player-search").addEventListener("input", (e) => {
            this.renderAvailablePlayersList(e.target.value);
        });

        // Formulário de Cadastro de Jogador
        document.getElementById("add-player-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.addNewPlayer();
        });

        // Login / Register Form Submit
        const loginForm = document.getElementById("login-form");
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const usernameInput = document.getElementById("login-username");
                const passwordInput = document.getElementById("login-password");
                const numberInput = document.getElementById("register-number");
                const positionInput = document.getElementById("register-position");
                const photoInput = document.getElementById("register-photo");

                const username = usernameInput.value.trim();
                const password = passwordInput.value;

                if (this.loginMode === "login") {
                    this.login(username, password);
                } else {
                    const number = parseInt(numberInput.value) || 0;
                    const position = positionInput.value;

                    const proceedReg = (photoData = null) => {
                        this.register(username, password, number, position, photoData);
                    };

                    if (photoInput && photoInput.files && photoInput.files[0]) {
                        this.compressImage(photoInput.files[0], (compressedData) => {
                            proceedReg(compressedData);
                        });
                    } else {
                        proceedReg(null);
                    }
                }
            });
        }

        // Toggle Login / Register Link
        const toggleLink = document.getElementById("toggle-register-link");
        if (toggleLink) {
            toggleLink.addEventListener("click", (e) => {
                e.preventDefault();
                const currentMode = this.loginMode || "login";
                this.toggleLoginRegister(currentMode === "login" ? "register" : "login");
            });
        }

        // Jogos: Modal Collapsible de Adicionar Jogo
        document.getElementById("open-add-match-btn").addEventListener("click", () => {
            document.getElementById("add-match-card").classList.remove("hidden");
        });
        
        const closeMatchForm = () => {
            document.getElementById("add-match-card").classList.add("hidden");
            document.getElementById("add-match-form").reset();
        };
        document.getElementById("close-add-match-btn").addEventListener("click", closeMatchForm);
        document.getElementById("cancel-match-btn").addEventListener("click", closeMatchForm);

        // Formulário de Adicionar Jogo
        document.getElementById("add-match-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.addNewMatch();
            closeMatchForm();
        });

        // RSVP WhatsApp Copy
        document.getElementById("share-rsvp-btn").addEventListener("click", () => {
            this.copyRsvpToClipboard();
        });

        // Treinos: Navegação por posição
        document.querySelectorAll(".position-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".position-tab-btn").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".training-tab-content").forEach(c => c.classList.remove("active"));
                
                btn.classList.add("active");
                const targetPos = btn.getAttribute("data-pos-tab");
                document.getElementById(`training-${targetPos}`).classList.add("active");
            });
        });

        // Nutrição: Calculadora de Hidratação
        document.getElementById("hydration-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.calculateHydration();
        });

        // Estatísticas: Formulário Scout Collapsible
        document.getElementById("open-add-stat-btn").addEventListener("click", () => {
            document.getElementById("add-stat-card").classList.remove("hidden");
        });
        
        const closeStatForm = () => {
            document.getElementById("add-stat-card").classList.add("hidden");
            document.getElementById("add-stat-form").reset();
        };
        document.getElementById("close-add-stat-btn").addEventListener("click", closeStatForm);
        document.getElementById("cancel-stat-btn").addEventListener("click", closeStatForm);

        document.getElementById("add-stat-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.addScoutEntry();
            closeStatForm();
        });

        // --- EVENTOS DA PRANCHETA TÁTICA ---
        // Formação inicial da Prancheta
        const boardFormSelect = document.getElementById("board-formation-select");
        if (boardFormSelect) {
            boardFormSelect.addEventListener("change", (e) => {
                this.resetBoardPlayers(e.target.value);
                this.showToast(`Prancheta resetada no esquema ${e.target.value}`);
            });
        }

        // Alternar adversários
        const toggleOppsBtn = document.getElementById("toggle-opponents-btn");
        if (toggleOppsBtn) {
            toggleOppsBtn.addEventListener("click", () => {
                this.boardOpponentsVisible = !this.boardOpponentsVisible;
                document.getElementById("board-away-players-layer").classList.toggle("hidden", !this.boardOpponentsVisible);
                toggleOppsBtn.innerHTML = this.boardOpponentsVisible 
                    ? `<i class="fa-solid fa-eye-slash"></i> Oponentes` 
                    : `<i class="fa-solid fa-eye"></i> Oponentes`;
                this.showToast(this.boardOpponentsVisible ? "Tokens adversários exibidos." : "Tokens adversários ocultados.");
            });
        }

        // Limpar desenhos
        const clearBoardBtn = document.getElementById("clear-board-drawings-btn");
        if (clearBoardBtn) {
            clearBoardBtn.addEventListener("click", () => {
                this.clearBoardDrawings();
                this.showToast("Desenhos da prancheta limpos.");
            });
        }

        // Resetar posições
        const resetBoardBtn = document.getElementById("reset-board-players-btn");
        if (resetBoardBtn) {
            resetBoardBtn.addEventListener("click", () => {
                const form = document.getElementById("board-formation-select").value;
                this.resetBoardPlayers(form);
                this.showToast("Posições dos jogadores resetadas.");
            });
        }

        // Paleta de Cores
        document.querySelectorAll(".color-swatch").forEach(swatch => {
            swatch.addEventListener("click", () => {
                document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
                swatch.classList.add("active");
                this.boardPenColor = swatch.getAttribute("data-color");
            });
        });

        // Espessura do Pincel
        const penSizeRange = document.getElementById("board-pen-size");
        if (penSizeRange) {
            penSizeRange.addEventListener("input", (e) => {
                this.boardPenSize = parseInt(e.target.value);
            });
        }
    }

    // --- RENDERIZADORES GERAIS ---
    renderAll() {
        this.renderDashboardMatch();
        this.renderDashboardLineup();
        this.renderDashboardStats();
        
        this.renderTacticalField();
        this.renderAvailablePlayersList();
        
        this.renderMatchesList();
        this.renderRsvpPanel();
        
        this.renderStatsTables();
        this.populateDropdowns();
    }

    switchTab(tabId) {
        document.querySelectorAll(".nav-link").forEach(link => {
            if (link.getAttribute("data-tab") === tabId) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });

        document.querySelectorAll(".tab-content").forEach(content => {
            if (content.getAttribute("id") === tabId) {
                content.classList.add("active");
            } else {
                content.classList.remove("active");
            }
        });

        // Rerenderizações específicas ao focar nas abas
        if (tabId === "tactical") {
            this.renderTacticalField();
        } else if (tabId === "dashboard") {
            this.renderDashboardMatch();
            this.renderDashboardLineup();
        } else if (tabId === "board") {
            // Redimensiona o canvas para ajustar à área física visível e limpa/inicia contexto
            setTimeout(() => {
                this.resizeBoardCanvas();
            }, 100);
        }
    }

    updateDateDisplay() {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const todayStr = new Date().toLocaleDateString('pt-BR', options);
        document.getElementById("current-date-span").innerText = todayStr;
    }

    // --- TOAST NOTIFICATION ---
    showToast(message) {
        const toast = document.getElementById("toast");
        toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // --- POPULAR DROPDOWNS ---
    populateDropdowns() {
        // Dropdown no painel RSVP
        const rsvpSelect = document.getElementById("rsvp-player-select");
        if (rsvpSelect) {
            rsvpSelect.innerHTML = this.players
                .map(p => `<option value="${p.id}">${p.name} (${p.number}) - ${p.position}</option>`)
                .join("");
        }

        // Dropdown no painel de scout estatístico
        const statSelect = document.getElementById("stat-player-select");
        if (statSelect) {
            statSelect.innerHTML = this.players
                .map(p => `<option value="${p.id}">${p.name} (${p.number})</option>`)
                .join("");
        }
    }

    // ==========================================================================
    // SEÇÃO: DASHBOARD
    // ==========================================================================
    renderDashboardMatch() {
        const activeMatch = this.matches.find(m => m.id === this.activeMatchId);
        if (!activeMatch) {
            document.getElementById("dash-match-opponent").innerText = "Sem Jogo";
            return;
        }

        document.getElementById("dash-match-opponent").innerText = activeMatch.opponent;
        
        // Formata data
        const dateObj = new Date(activeMatch.date + 'T00:00:00');
        const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayMonth = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        document.getElementById("dash-match-date").innerText = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayMonth}`;
        
        document.getElementById("dash-match-time").innerText = activeMatch.time;
        document.getElementById("dash-match-location").innerText = activeMatch.location;
        document.getElementById("dash-match-jersey").innerText = activeMatch.jersey || "Padrão";

        // Métricas de RSVP
        let yes = 0, maybe = 0, no = 0;
        this.players.forEach(p => {
            const status = activeMatch.rsvp[p.id];
            if (status === "yes") yes++;
            else if (status === "maybe") maybe++;
            else if (status === "no") no++;
        });

        document.getElementById("dash-rsvp-yes").innerText = yes;
        document.getElementById("dash-rsvp-maybe").innerText = maybe;
        document.getElementById("dash-rsvp-no").innerText = no;
    }

    renderDashboardLineup() {
        const miniField = document.getElementById("mini-field-players");
        if (!miniField) return;
        miniField.innerHTML = "";

        const positions = FORMATIONS[this.selectedFormation];
        
        // Recupera a escalação salva ou usa os primeiros 11 jogadores
        const lineupPlayerIds = this.getLineupForFormation(this.selectedFormation);

        positions.forEach((pos, idx) => {
            const playerId = lineupPlayerIds[idx];
            const player = this.players.find(p => p.id === playerId);
            
            const container = document.createElement("div");
            container.className = "mini-player-container";
            
            // Inline positioning and layout styles to bypass CSS cache
            container.style.position = "absolute";
            container.style.transform = "translate(-50%, -50%)";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.alignItems = "center";
            container.style.zIndex = "10";
            container.style.top = `${pos.top}%`;
            container.style.left = `${pos.left}%`;

            const node = document.createElement("div");
            node.className = "mini-player-node";
            node.style.position = "static";
            node.style.transform = "none";
            
            if (player) {
                container.title = `${player.name} (${player.number}) - ${pos.role}`;
                if (player.photo) {
                    node.classList.add("has-photo");
                    node.style.backgroundImage = `url(${player.photo})`;
                }
            } else {
                container.title = `Vazio - ${pos.role}`;
                node.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
                node.style.boxShadow = "none";
            }

            const nameLabel = document.createElement("div");
            nameLabel.className = "mini-player-name";
            nameLabel.innerText = player ? player.name : pos.label;
            
            // Inline label styles to bypass CSS cache
            nameLabel.style.fontSize = "0.52rem";
            nameLabel.style.color = "#fff";
            nameLabel.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
            nameLabel.style.padding = "1px 3px";
            nameLabel.style.borderRadius = "2px";
            nameLabel.style.whiteSpace = "nowrap";
            nameLabel.style.marginTop = "2px";
            nameLabel.style.maxWidth = "55px";
            nameLabel.style.overflow = "hidden";
            nameLabel.style.textOverflow = "ellipsis";
            nameLabel.style.border = "0.5px solid rgba(255, 255, 255, 0.1)";
            
            container.appendChild(node);
            container.appendChild(nameLabel);
            miniField.appendChild(container);
        });

        document.getElementById("dash-lineup-formation").innerText = this.selectedFormation;
    }

    renderDashboardStats() {
        // Encontra Artilheiro
        const sortedGoals = [...this.stats].sort((a, b) => b.goals - a.goals);
        if (sortedGoals.length > 0 && sortedGoals[0].goals > 0) {
            const p = this.players.find(pl => pl.id === sortedGoals[0].playerId);
            document.getElementById("dash-top-scorer").innerText = p ? `${p.name} (${sortedGoals[0].goals} gols)` : "Nenhum gol";
        } else {
            document.getElementById("dash-top-scorer").innerText = "Nenhum gol";
        }

        // Encontra Assistências
        const sortedAssists = [...this.stats].sort((a, b) => b.assists - a.assists);
        if (sortedAssists.length > 0 && sortedAssists[0].assists > 0) {
            const p = this.players.find(pl => pl.id === sortedAssists[0].playerId);
            document.getElementById("dash-top-assister").innerText = p ? `${p.name} (${sortedAssists[0].assists} ass.)` : "Nenhuma assist.";
        } else {
            document.getElementById("dash-top-assister").innerText = "Nenhuma assist.";
        }
    }


    // ==========================================================================
    // SEÇÃO: ESCALAÇÃO TÁTICA & CAMPO INTERATIVO
    // ==========================================================================
    getLineupKey(formation) {
        return `145fc_lineup_${formation}`;
    }

    getLineupForFormation(formation) {
        const savedLineup = localStorage.getItem(this.getLineupKey(formation));
        if (savedLineup) {
            return JSON.parse(savedLineup);
        }
        
        // Default: Pega os primeiros 11 jogadores disponíveis
        const defaults = [];
        for (let i = 0; i < 11; i++) {
            if (this.players[i]) {
                defaults.push(this.players[i].id);
            } else {
                defaults.push(null);
            }
        }
        return defaults;
    }

    saveLineupForFormation(formation, lineup) {
        localStorage.setItem(this.getLineupKey(formation), JSON.stringify(lineup));
    }

    renderTacticalField() {
        const pitch = document.getElementById("pitch-players-layer");
        if (!pitch) return;
        pitch.innerHTML = "";

        const positions = FORMATIONS[this.selectedFormation];
        const lineupPlayerIds = this.getLineupForFormation(this.selectedFormation);

        positions.forEach((pos, idx) => {
            const playerId = lineupPlayerIds[idx];
            const player = this.players.find(p => p.id === playerId);
            
            const playerDiv = document.createElement("div");
            playerDiv.className = "pitch-player";
            if (this.selectedFieldPlayerIndex === idx) {
                playerDiv.classList.add("selected");
            }
            playerDiv.style.top = `${pos.top}%`;
            playerDiv.style.left = `${pos.left}%`;
            
            // Clicar no jogador do campo marca ele como "selecionado para troca"
            playerDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                this.selectFieldPlayer(idx);
            });

            // Estrutura visual da Camisa
            const jersey = document.createElement("div");
            jersey.className = "jersey-circle";
            if (player) {
                if (player.photo) {
                    jersey.classList.add("has-photo");
                    jersey.style.backgroundImage = `url(${player.photo})`;
                    jersey.innerText = "";
                } else {
                    jersey.innerText = player.number;
                }
            } else {
                jersey.innerHTML = `<i class="fa-solid fa-plus" style="font-size: 0.8rem; opacity: 0.6"></i>`;
                jersey.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
                jersey.style.borderColor = "rgba(255, 255, 255, 0.2)";
                jersey.style.boxShadow = "none";
            }

            const nameBadge = document.createElement("div");
            nameBadge.className = "player-field-name";
            nameBadge.innerText = player ? player.name : pos.label;
            
            playerDiv.appendChild(jersey);
            playerDiv.appendChild(nameBadge);
            pitch.appendChild(playerDiv);
        });

        // Limpa seleção ao clicar fora das camisas no campo
        document.getElementById("football-pitch").addEventListener("click", () => {
            if (this.selectedFieldPlayerIndex !== null) {
                this.selectedFieldPlayerIndex = null;
                this.renderTacticalField();
            }
        });
    }

    selectFieldPlayer(index) {
        if (this.selectedFieldPlayerIndex === index) {
            this.selectedFieldPlayerIndex = null;
        } else {
            this.selectedFieldPlayerIndex = index;
            const positions = FORMATIONS[this.selectedFormation];
            this.showToast(`Selecione um jogador na barra lateral para colocar na posição de ${positions[index].role}.`);
        }
        this.renderTacticalField();
    }

    renderAvailablePlayersList(filterQuery = "") {
        const pool = document.getElementById("available-players-pool");
        if (!pool) return;
        pool.innerHTML = "";

        const query = filterQuery.toLowerCase().trim();
        const lineupPlayerIds = this.getLineupForFormation(this.selectedFormation);

        this.players.forEach(player => {
            // Filtro de busca
            if (query && !player.name.toLowerCase().includes(query) && !player.position.toLowerCase().includes(query)) {
                return;
            }

            const isStarting = lineupPlayerIds.includes(player.id);

            const item = document.createElement("div");
            item.className = "squad-player-item";
            
            // Se o jogador estiver na escalação titular, ganha estilo sutil
            if (isStarting) {
                item.style.opacity = "0.6";
                item.style.borderStyle = "dashed";
            }

            item.addEventListener("click", () => {
                this.handlePlayerPoolClick(player.id);
            });

            const badgeContent = player.photo 
                ? `<div class="user-avatar" style="width:28px; height:28px; border:1px solid var(--primary-color); background-image:url(${player.photo})"></div>` 
                : player.number;

            item.innerHTML = `
                <div class="squad-player-info">
                    <div class="player-badge-num" style="${player.photo ? 'padding:0; background:none; border:none; display:flex; align-items:center; justify-content:center;' : ''}">${badgeContent}</div>
                    <div>
                        <div class="squad-player-name">${player.name} ${isStarting ? '<span style="font-size:0.7rem; color:var(--primary-color)">(Titular)</span>' : ''}</div>
                        <div class="squad-player-pos">${player.position}</div>
                    </div>
                </div>
                <button class="btn-remove-player" title="Excluir Jogador" onclick="event.stopPropagation(); app.deletePlayer('${player.id}')">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            `;
            pool.appendChild(item);
        });
    }

    handlePlayerPoolClick(playerId) {
        if (this.selectedFieldPlayerIndex === null) {
            this.showToast("Selecione primeiro uma camisa preta no campo de futebol acima para substituí-la.");
            return;
        }

        const lineup = this.getLineupForFormation(this.selectedFormation);
        const alreadyInLineupIdx = lineup.indexOf(playerId);

        // Se o jogador selecionado na lista já estiver em outra posição no campo
        if (alreadyInLineupIdx !== -1) {
            // Faz a troca simples de posições entre as duas camisas
            const currentPlayerAtPosition = lineup[this.selectedFieldPlayerIndex];
            lineup[alreadyInLineupIdx] = currentPlayerAtPosition;
            lineup[this.selectedFieldPlayerIndex] = playerId;
            this.showToast("Jogadores trocaram de posições no campo.");
        } else {
            // Substituição simples
            lineup[this.selectedFieldPlayerIndex] = playerId;
            const player = this.players.find(p => p.id === playerId);
            this.showToast(`${player.name} entrou na escalação.`);
        }

        this.saveLineupForFormation(this.selectedFormation, lineup);
        this.selectedFieldPlayerIndex = null;
        this.renderTacticalField();
        this.renderAvailablePlayersList();
        this.renderDashboardLineup();
    }

    addNewPlayer() {
        const nameInput = document.getElementById("new-player-name");
        const numberInput = document.getElementById("new-player-number");
        const positionInput = document.getElementById("new-player-position");
        const photoInput = document.getElementById("new-player-photo");

        const name = nameInput.value.trim();
        const number = parseInt(numberInput.value);
        const position = positionInput.value;

        // Valida número de camisa já existente
        if (this.players.some(p => p.number === number)) {
            this.showToast(`Erro: A camisa número ${number} já está sendo usada!`);
            return;
        }

        const proceed = (photoData = null) => {
            const newPlayer = {
                id: "p_" + Date.now(),
                name,
                number,
                position,
                photo: photoData
            };

            this.players.push(newPlayer);
            this.savePlayers();
            this.populateDropdowns();
            this.renderAvailablePlayersList();

            // Limpa formulário e joga de volta na lista
            nameInput.value = "";
            numberInput.value = "";
            if (photoInput) photoInput.value = "";
            document.querySelector("[data-panel-tab='players-list']").click();
            
            this.showToast(`${name} foi cadastrado no elenco!`);
        };

        if (photoInput && photoInput.files && photoInput.files[0]) {
            this.compressImage(photoInput.files[0], (compressedData) => {
                proceed(compressedData);
            });
        } else {
            proceed(null);
        }
    }

    deletePlayer(playerId) {
        if (!confirm("Tem certeza que deseja excluir este jogador? Ele será removido de todas as escalações e dados de jogos.")) {
            return;
        }

        // Remove do elenco
        this.players = this.players.filter(p => p.id !== playerId);
        this.savePlayers();

        // Limpa escalações salvas
        Object.keys(FORMATIONS).forEach(form => {
            const lineup = this.getLineupForFormation(form);
            const idx = lineup.indexOf(playerId);
            if (idx !== -1) {
                lineup[idx] = null;
                this.saveLineupForFormation(form, lineup);
            }
        });

        // Limpa scouts
        this.stats = this.stats.filter(s => s.playerId !== playerId);
        this.saveStats();

        // Limpa presenças em jogos
        this.matches.forEach(m => {
            if (m.rsvp[playerId]) {
                delete m.rsvp[playerId];
            }
        });
        this.saveMatches();

        this.populateDropdowns();
        this.renderAll();
        this.showToast("Jogador removido com sucesso.");
    }

    // ==========================================================================
    // SEÇÃO: JOGOS & LISTA DE PRESENÇA (RSVP)
    // ==========================================================================
    renderMatchesList() {
        const container = document.getElementById("matches-cards-container");
        if (!container) return;
        container.innerHTML = "";

        if (this.matches.length === 0) {
            container.innerHTML = `<p class="subtitle">Nenhum confronto agendado. Clique em "Novo Jogo" para cadastrar!</p>`;
            return;
        }

        // Ordena por data mais recente
        const sorted = [...this.matches].sort((a,b) => new Date(a.date) - new Date(b.date));

        sorted.forEach(match => {
            const card = document.createElement("div");
            card.className = "match-item-card";
            if (match.id === this.activeMatchId) {
                card.classList.add("selected");
            }

            // Conta confirmados
            let confirmedCount = 0;
            Object.values(match.rsvp).forEach(val => { if (val === "yes") confirmedCount++; });

            const dateFormatted = new Date(match.date + 'T00:00:00').toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'});

            card.innerHTML = `
                <div class="match-info-main">
                    <h3>145FC vs ${match.opponent}</h3>
                    <span>Data: ${dateFormatted} às ${match.time}</span>
                </div>
                <div class="match-info-details">
                    <div><i class="fa-solid fa-location-dot"></i> ${match.location}</div>
                    <div><i class="fa-solid fa-shirt"></i> Uniforme: ${match.jersey || "Preto/Verde"}</div>
                </div>
                <div class="match-item-actions">
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); app.deleteMatch('${match.id}')" title="Excluir Jogo">
                        <i class="fa-solid fa-trash-can text-red"></i>
                    </button>
                    <span class="badge" style="display:flex; align-items:center; gap:0.25rem"><i class="fa-solid fa-user-check"></i> ${confirmedCount}</span>
                </div>
            `;

            card.addEventListener("click", () => {
                this.activeMatchId = match.id;
                this.renderMatchesList();
                this.renderRsvpPanel();
                this.renderDashboardMatch();
            });

            container.appendChild(card);
        });
    }

    renderRsvpPanel() {
        const panel = document.getElementById("rsvp-detail-panel");
        const match = this.matches.find(m => m.id === this.activeMatchId);
        
        if (!match || this.matches.length === 0) {
            panel.classList.add("hidden");
            return;
        }
        panel.classList.remove("hidden");

        const yesList = document.getElementById("rsvp-yes-list");
        const maybeList = document.getElementById("rsvp-maybe-list");
        const noList = document.getElementById("rsvp-no-list");

        yesList.innerHTML = "";
        maybeList.innerHTML = "";
        noList.innerHTML = "";

        let yes = 0, maybe = 0, no = 0;

        this.players.forEach(p => {
            const status = match.rsvp[p.id] || "no-response";
            
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${p.name} (${p.number})</span>
                <span class="squad-player-pos">${p.position}</span>
            `;

            if (status === "yes") {
                yesList.appendChild(li);
                yes++;
            } else if (status === "maybe") {
                maybeList.appendChild(li);
                maybe++;
            } else if (status === "no") {
                noList.appendChild(li);
                no++;
            }
        });

        document.getElementById("rsvp-yes-count").innerText = yes;
        document.getElementById("rsvp-maybe-count").innerText = maybe;
        document.getElementById("rsvp-no-count").innerText = no;
    }

    updatePlayerRsvp(status) {
        const match = this.matches.find(m => m.id === this.activeMatchId);
        const playerId = document.getElementById("rsvp-player-select").value;

        if (!match || !playerId) return;

        match.rsvp[playerId] = status;
        this.saveMatches();
        this.renderRsvpPanel();
        this.renderMatchesList();
        this.renderDashboardMatch();
        
        const player = this.players.find(p => p.id === playerId);
        const statusText = status === "yes" ? "confirmou presença!" : status === "maybe" ? "colocou dúvida." : "confirmou ausência.";
        this.showToast(`${player.name} ${statusText}`);
    }

    addNewMatch() {
        const opponent = document.getElementById("match-opponent").value.trim();
        const date = document.getElementById("match-date").value;
        const time = document.getElementById("match-time").value;
        const location = document.getElementById("match-location").value.trim();
        const mapsLink = document.getElementById("match-maps-link").value.trim();
        const jersey = document.getElementById("match-jersey").value.trim() || "Preto/Verde";

        const newMatch = {
            id: "m_" + Date.now(),
            opponent,
            date,
            time,
            location,
            mapsLink,
            jersey,
            rsvp: {}
        };

        this.matches.push(newMatch);
        this.saveMatches();
        this.activeMatchId = newMatch.id;
        
        this.renderMatchesList();
        this.renderRsvpPanel();
        this.renderDashboardMatch();

        this.showToast(`Jogo contra ${opponent} marcado para ${date}!`);
    }

    deleteMatch(matchId) {
        if (!confirm("Tem certeza que deseja excluir esta partida permanentemente?")) {
            return;
        }

        this.matches = this.matches.filter(m => m.id !== matchId);
        this.saveMatches();
        
        if (this.matches.length > 0) {
            this.activeMatchId = this.matches[0].id;
        } else {
            this.activeMatchId = "";
        }

        this.renderMatchesList();
        this.renderRsvpPanel();
        this.renderDashboardMatch();
        this.showToast("Jogo excluído.");
    }

    // ==========================================================================
    // SEÇÃO: TREINAMENTO & CRONÔMETRO
    // ==========================================================================
    toggleTimer(pos) {
        const tState = this.timers[pos];
        const btnIcon = document.getElementById(`timer-icon-${pos}`);
        
        if (tState.running) {
            // Pause
            clearInterval(tState.interval);
            tState.running = false;
            if (btnIcon) {
                btnIcon.className = "fa-solid fa-play";
                btnIcon.parentElement.innerHTML = `<i class="fa-solid fa-play" id="timer-icon-${pos}"></i> Retomar`;
            }
        } else {
            // Start
            tState.running = true;
            if (btnIcon) {
                btnIcon.className = "fa-solid fa-pause";
                btnIcon.parentElement.innerHTML = `<i class="fa-solid fa-pause" id="timer-icon-${pos}"></i> Pausar`;
            }
            
            tState.interval = setInterval(() => {
                tState.remaining--;
                this.updateTimerDisplay(pos);

                if (tState.remaining <= 0) {
                    clearInterval(tState.interval);
                    tState.running = false;
                    this.playAlarmSound();
                    alert(`O aquecimento da posição [${pos.toUpperCase()}] acabou! Partiu pro jogo! ⚽🔥`);
                    this.resetTimer(pos, pos === 'gk' ? 600 : pos === 'at' ? 360 : 480);
                }
            }, 1000);
        }
    }

    resetTimer(pos, durationSeconds) {
        const tState = this.timers[pos];
        clearInterval(tState.interval);
        tState.remaining = durationSeconds;
        tState.running = false;
        
        const btn = document.querySelector(`#training-${pos} .timer-controls .btn-success`);
        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-play" id="timer-icon-${pos}"></i> Iniciar`;
        }
        
        this.updateTimerDisplay(pos);
    }

    updateTimerDisplay(pos) {
        const tState = this.timers[pos];
        const minutes = Math.floor(tState.remaining / 60);
        const seconds = tState.remaining % 60;
        const displayStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById(`timer-display-pos-${pos}` || `timer-display-${pos}`).innerText = displayStr;
    }

    // Beep sonoro usando Web Audio API (100% livre de assets externos)
    playAlarmSound() {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            
            osc.connect(gain);
            gain.connect(context.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, context.currentTime); // Tom lá agudo
            gain.gain.setValueAtTime(0.5, context.currentTime);
            
            // Beep intermitente por 2 segundos
            osc.start();
            setTimeout(() => osc.stop(), 300);
            setTimeout(() => {
                const osc2 = context.createOscillator();
                const gain2 = context.createGain();
                osc2.connect(gain2);
                gain2.connect(context.destination);
                osc2.type = "sine";
                osc2.frequency.setValueAtTime(880, context.currentTime);
                gain2.gain.setValueAtTime(0.5, context.currentTime);
                osc2.start();
                setTimeout(() => osc2.stop(), 300);
            }, 500);
            setTimeout(() => {
                const osc3 = context.createOscillator();
                const gain3 = context.createGain();
                osc3.connect(gain3);
                gain3.connect(context.destination);
                osc3.type = "sine";
                osc3.frequency.setValueAtTime(1000, context.currentTime);
                gain3.gain.setValueAtTime(0.5, context.currentTime);
                osc3.start();
                setTimeout(() => osc3.stop(), 500);
            }, 1000);
        } catch (e) {
            console.error("Não foi possível tocar o bipe de áudio devido à restrição do navegador.", e);
        }
    }

    // ==========================================================================
    // SEÇÃO: NUTRIÇÃO & HIDRATION CALCULATOR
    // ==========================================================================
    calculateHydration() {
        const weight = parseFloat(document.getElementById("calc-weight").value);
        const intensity = document.getElementById("calc-intensity").value;

        if (isNaN(weight) || weight <= 0) return;

        // Cálculos Base
        let preVol = weight * 7;      // 7 ml/kg
        let duringVol = weight * 3;   // 3 ml/kg por 15 min
        let postVol = weight * 15;    // 15 ml/kg pós-jogo

        // Ajuste por intensidade
        if (intensity === "high") {
            preVol *= 1.15;
            duringVol *= 1.25;
            postVol *= 1.20;
        }

        // Formatação (Arredondamento para litros ou ml)
        const formatVol = (val) => val >= 1000 ? `${(val/1000).toFixed(2)}L` : `${Math.round(val)}ml`;

        document.getElementById("res-pre").innerText = formatVol(preVol);
        document.getElementById("res-during").innerText = formatVol(duringVol);
        document.getElementById("res-post").innerText = formatVol(postVol);

        document.getElementById("hydration-results").classList.remove("hidden");
        this.showToast("Plano de hidratação calculado com sucesso!");
    }

    // ==========================================================================
    // SEÇÃO: ESTATÍSTICAS (ARTILHARIA / SCOUT)
    // ==========================================================================
    renderStatsTables() {
        const artilhariaBody = document.getElementById("artilharia-table-body");
        const assistenciasBody = document.getElementById("assistencias-table-body");
        const motmBody = document.getElementById("motm-table-body");

        if (!artilhariaBody) return;

        // Agrupa os scouts de cada jogador
        const playerStats = this.players.map(player => {
            const scout = this.stats.find(s => s.playerId === player.id) || { goals: 0, assists: 0, motm: 0 };
            return {
                player,
                goals: scout.goals || 0,
                assists: scout.assists || 0,
                motm: scout.motm || 0
            };
        });

        // 1. Renderiza Artilharia
        const sortedGoals = [...playerStats]
            .filter(ps => ps.goals > 0)
            .sort((a,b) => b.goals - a.goals);
        
        artilhariaBody.innerHTML = sortedGoals.length > 0
            ? sortedGoals.map((ps, idx) => `
                <tr>
                    <td class="rank-num">${idx + 1}°</td>
                    <td><strong>${ps.player.name}</strong></td>
                    <td>${ps.player.number}</td>
                    <td class="text-center text-green" style="font-weight:800">${ps.goals}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="4" class="subtitle text-center">Nenhum gol registrado.</td></tr>`;

        // 2. Renderiza Assistências
        const sortedAssists = [...playerStats]
            .filter(ps => ps.assists > 0)
            .sort((a,b) => b.assists - a.assists);

        assistenciasBody.innerHTML = sortedAssists.length > 0
            ? sortedAssists.map((ps, idx) => `
                <tr>
                    <td class="rank-num">${idx + 1}°</td>
                    <td><strong>${ps.player.name}</strong></td>
                    <td>${ps.player.number}</td>
                    <td class="text-center text-blue" style="font-weight:800">${ps.assists}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="4" class="subtitle text-center">Nenhuma assistência registrada.</td></tr>`;

        // 3. Renderiza MOTM
        const sortedMotm = [...playerStats]
            .filter(ps => ps.motm > 0)
            .sort((a,b) => b.motm - a.motm);

        motmBody.innerHTML = sortedMotm.length > 0
            ? sortedMotm.map((ps, idx) => `
                <tr>
                    <td class="rank-num">${idx + 1}°</td>
                    <td><strong>${ps.player.name}</strong></td>
                    <td>${ps.player.number}</td>
                    <td class="text-center text-yellow" style="font-weight:800">${ps.motm} 🏆</td>
                </tr>
            `).join("")
            : `<tr><td colspan="4" class="subtitle text-center">Nenhum prêmio de melhor do jogo registrado.</td></tr>`;
    }

    addScoutEntry() {
        const playerId = document.getElementById("stat-player-select").value;
        const type = document.getElementById("stat-type").value;
        const count = parseInt(document.getElementById("stat-count").value);

        if (!playerId || isNaN(count) || count <= 0) return;

        let playerScout = this.stats.find(s => s.playerId === playerId);

        if (!playerScout) {
            playerScout = { playerId, goals: 0, assists: 0, motm: 0 };
            this.stats.push(playerScout);
        }

        if (type === "goal") {
            playerScout.goals = (playerScout.goals || 0) + count;
        } else if (type === "assist") {
            playerScout.assists = (playerScout.assists || 0) + count;
        } else if (type === "motm") {
            playerScout.motm = (playerScout.motm || 0) + count;
        }

        this.saveStats();
        this.renderStatsTables();
        this.renderDashboardStats();
        
        const player = this.players.find(p => p.id === playerId);
        const actionText = type === "goal" ? "gol(s)" : type === "assist" ? "assistência(s)" : "prêmio(s) de melhor do jogo";
        this.showToast(`Adicionado ${count} ${actionText} para ${player.name}.`);
    }


    // ==========================================================================
    // COMPARTILHAMENTO VIA WHATSAPP (CLIPBOARD COPY)
    // ==========================================================================
    copyLineupToClipboard() {
        const positions = FORMATIONS[this.selectedFormation];
        const lineupPlayerIds = this.getLineupForFormation(this.selectedFormation);

        let text = `⚽ *145FC - ESCALAÇÃO OFICIAL*\n`;
        text += `Esquema Tático: *${this.selectedFormation}*\n\n`;
        text += `📋 *Titulares:* \n`;

        positions.forEach((pos, idx) => {
            const playerId = lineupPlayerIds[idx];
            const player = this.players.find(p => p.id === playerId);
            const numText = player ? `[${player.number.toString().padStart(2, '0')}]` : `[  ]`;
            const nameText = player ? player.name : "Vago";
            text += `${numText} ${pos.label}: *${nameText}*\n`;
        });

        // Adiciona reservas
        const benchPlayers = this.players.filter(p => !lineupPlayerIds.includes(p.id));
        if (benchPlayers.length > 0) {
            text += `\n🔄 *Reservas:* \n`;
            benchPlayers.forEach(p => {
                text += `- [${p.number.toString().padStart(2, '0')}] ${p.name} (${p.position})\n`;
            });
        }

        text += `\n💪 _Partiu pro jogo time! Pra cima!_ 🟢⚔️`;

        navigator.clipboard.writeText(text)
            .then(() => this.showToast("Escalação copiada! Cole no grupo do WhatsApp."))
            .catch(err => {
                console.error("Falha ao copiar texto", err);
                this.showToast("Erro ao copiar escalação.");
            });
    }

    copyRsvpToClipboard() {
        const match = this.matches.find(m => m.id === this.activeMatchId);
        if (!match) return;

        const dateFormatted = new Date(match.date + 'T00:00:00').toLocaleDateString('pt-BR', {day: 'numeric', month: 'numeric'});

        let text = `📅 *CONFIRMAÇÃO DE PRESENÇA - 145FC*\n`;
        text += `⚔️ *Jogo:* 145FC vs ${match.opponent}\n`;
        text += `📆 *Data:* ${dateFormatted} às ${match.time}\n`;
        text += `📍 *Local:* ${match.location}\n`;
        text += `👕 *Uniforme:* ${match.jersey || "Preto/Verde"}\n\n`;

        let yes = [], maybe = [], no = [], noResponse = [];

        this.players.forEach(p => {
            const status = match.rsvp[p.id];
            if (status === "yes") yes.push(p);
            else if (status === "maybe") maybe.push(p);
            else if (status === "no") no.push(p);
            else noResponse.push(p);
        });

        text += `✅ *Confirmados (${yes.length}):*\n`;
        if (yes.length > 0) {
            yes.forEach(p => { text += `- ${p.name} (${p.position})\n`; });
        } else {
            text += ` Nenhum confirmado ainda.\n`;
        }

        text += `\n❓ *Dúvida (${maybe.length}):*\n`;
        if (maybe.length > 0) {
            maybe.forEach(p => { text += `- ${p.name}\n`; });
        } else {
            text += ` Ninguém na dúvida.\n`;
        }

        text += `\n❌ *Ausentes (${no.length}):*\n`;
        if (no.length > 0) {
            no.forEach(p => { text += `- ${p.name}\n`; });
        } else {
            text += ` Nenhuma ausência.\n`;
        }

        if (noResponse.length > 0) {
            text += `\n⏳ *Aguardando resposta (${noResponse.length}):*\n`;
            text += ` ${noResponse.map(p => p.name).join(", ")}\n`;
        }

        text += `\n⚠️ _Se você ainda não respondeu, responda no app!_`;

        navigator.clipboard.writeText(text)
            .then(() => this.showToast("Lista de presença copiada! Cole no WhatsApp."))
            .catch(err => {
                console.error("Falha ao copiar texto", err);
                this.showToast("Erro ao copiar presença.");
            });
    }

    // ==========================================================================
    // PRANCHETA TÁTICA DO TREINADOR - LOGICA DE ARRASTAR E DESENHAR
    // ==========================================================================
    initChalkboard() {
        const canvas = document.getElementById("chalkboard-canvas");
        if (!canvas) return;

        // Inicia Contexto de Desenho
        this.boardContext = canvas.getContext("2d");

        // Eventos de Desenho no Canvas (Mouse & Toque)
        const onStartDraw = (e) => {
            const coords = this.getCanvasCoords(e, canvas);
            this.boardDrawing = true;
            this.boardContext.beginPath();
            this.boardContext.moveTo(coords.x, coords.y);
            
            // Configurações do pincel
            this.boardContext.strokeStyle = this.boardPenColor;
            this.boardContext.lineWidth = this.boardPenSize;
            this.boardContext.lineCap = "round";
            this.boardContext.lineJoin = "round";
        };

        const onMoveDraw = (e) => {
            if (!this.boardDrawing) return;
            const coords = this.getCanvasCoords(e, canvas);
            this.boardContext.lineTo(coords.x, coords.y);
            this.boardContext.stroke();

            // Previne scroll em mobile
            if (e.cancelable) e.preventDefault();
        };

        const onEndDraw = () => {
            this.boardDrawing = false;
        };

        // Mouse Events
        canvas.addEventListener("mousedown", onStartDraw);
        canvas.addEventListener("mousemove", onMoveDraw);
        canvas.addEventListener("mouseup", onEndDraw);
        canvas.addEventListener("mouseleave", onEndDraw);

        // Touch Events (Celular / Tablet)
        canvas.addEventListener("touchstart", onStartDraw, { passive: false });
        canvas.addEventListener("touchmove", onMoveDraw, { passive: false });
        canvas.addEventListener("touchend", onEndDraw);

        // Renderiza jogadores na prancheta
        this.resetBoardPlayers(this.selectedFormation);
    }

    getCanvasCoords(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // Corrige a escala caso o canvas tenha dimensões CSS diferentes do buffer interno
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    resizeBoardCanvas() {
        const canvas = document.getElementById("chalkboard-canvas");
        if (!canvas) return;

        // Salva o desenho atual antes de redimensionar
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(canvas, 0, 0);

        // Redimensiona o canvas físico
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Restaura configurações de contexto
        this.boardContext = canvas.getContext("2d");
        this.boardContext.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    }

    clearBoardDrawings() {
        const canvas = document.getElementById("chalkboard-canvas");
        if (!canvas || !this.boardContext) return;
        this.boardContext.clearRect(0, 0, canvas.width, canvas.height);
    }

    resetBoardPlayers(formation) {
        const homeLayer = document.getElementById("board-home-players-layer");
        const awayLayer = document.getElementById("board-away-players-layer");
        const pitch = document.getElementById("chalkboard-pitch");

        if (!homeLayer || !awayLayer || !pitch) return;

        homeLayer.innerHTML = "";
        awayLayer.innerHTML = "";

        const positions = FORMATIONS[formation] || FORMATIONS["4-3-3"];

        // 1. Renderiza Time Casa (Blue)
        positions.forEach((pos, idx) => {
            const token = document.createElement("div");
            token.className = "board-player-token home";
            token.style.top = `${pos.top}%`;
            token.style.left = `${pos.left}%`;
            
            // Adiciona dica do nome correspondente ao titular
            const lineup = this.getLineupForFormation(formation);
            const player = this.players.find(p => p.id === lineup[idx]);
            token.title = player ? `${player.name} (${pos.role})` : pos.role;

            if (player) {
                if (player.photo) {
                    token.classList.add("has-photo");
                    token.style.backgroundImage = `url(${player.photo})`;
                    token.innerText = "";
                } else {
                    token.innerText = player.number;
                }
            } else {
                token.innerText = idx + 1; // Número sequencial se não houver titular
            }

            this.makeTokenDraggable(token, pitch);
            homeLayer.appendChild(token);
        });

        // 2. Renderiza Time Visitante (Vermelho) - Posicionamento Espelhado
        positions.forEach((pos, idx) => {
            const token = document.createElement("div");
            token.className = "board-player-token away";
            // Espelha o Y (top = 100 - top) e o X (left = 100 - left) para simular o ataque do outro time
            token.style.top = `${100 - pos.top}%`;
            token.style.left = `${100 - pos.left}%`;
            token.innerText = idx + 1;
            token.title = `Adversário (${pos.role})`;

            this.makeTokenDraggable(token, pitch);
            awayLayer.appendChild(token);
        });
    }

    makeTokenDraggable(token, pitch) {
        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;

        const dragStart = (e) => {
            // Evita que o canvas desenhe ao arrastar o jogador
            e.stopPropagation();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;
            
            // Coleta posição atual em pixels
            startLeft = token.offsetLeft;
            startTop = token.offsetTop;

            document.addEventListener("mousemove", dragMove);
            document.addEventListener("mouseup", dragEnd);
            document.addEventListener("touchmove", dragMove, { passive: false });
            document.addEventListener("touchend", dragEnd);
        };

        const dragMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            // Restringe aos limites do campo
            const maxW = pitch.clientWidth;
            const maxH = pitch.clientHeight;

            newLeft = Math.max(0, Math.min(newLeft, maxW));
            newTop = Math.max(0, Math.min(newTop, maxH));

            // Transforma em percentual para manter responsividade
            const pctLeft = (newLeft / maxW) * 100;
            const pctTop = (newTop / maxH) * 100;

            token.style.left = `${pctLeft}%`;
            token.style.top = `${pctTop}%`;

            // Impede rolagem da tela em mobile ao arrastar
            if (e.cancelable) e.preventDefault();
        };

        const dragEnd = () => {
            document.removeEventListener("mousemove", dragMove);
            document.removeEventListener("mouseup", dragEnd);
            document.removeEventListener("touchmove", dragMove);
            document.removeEventListener("touchend", dragEnd);
        };

        token.addEventListener("mousedown", dragStart);
        token.addEventListener("touchstart", dragStart, { passive: false });
    }
}

// Inicializa a Instância Global da App
const app = new App145FC();
window.onload = () => {
    app.init();
};
// Torna global para chamadas inline no HTML
window.app = app;
