// js/components/progresso.js

const ProgressoComponent = {
    show: function(message = "Processando requisição...") {
        let overlay = document.getElementById('global-progress-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-progress-overlay';
            overlay.className = "fixed inset-0 bg-black/80 backdrop-blur-xs z-[9999] flex flex-col items-center justify-center space-y-4 font-sans";
            overlay.innerHTML = `
                <div class="w-12 h-12 border-4 border-[#caa85c]/20 border-t-[#caa85c] rounded-full animate-spin"></div>
                <p id="global-progress-text" class="text-xs font-mono tracking-widest text-gray-300 uppercase animate-pulse"></p>
            `;
            document.body.appendChild(overlay);
        }
        document.getElementById('global-progress-text').innerText = message;
        overlay.classList.remove('hidden');
    },

    hide: function() {
        const overlay = document.getElementById('global-progress-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
};

window.ProgressoComponent = ProgressoComponent;
