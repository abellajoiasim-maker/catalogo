// FILE: /js/components/progresso.js

import { formatarMoeda } from '../utils/money.js';

/**
 * Componente que renderiza a régua visual da barra de progresso de descontos no carrinho.
 * Mantém intacta a UX de engajamento baseada no valor acumulado no subtotal.
 * @param {Object} dadosProgresso - Dados mapeados de descontos obtidos do descontoService.
 * @param {Object|null} proximaFaixa - Objeto contendo o valor mínimo e percentual da meta seguinte.
 * @returns {string} String HTML estruturada.
 */
export function Progresso(dadosProgresso, proximaFaixa) {
    const subtotal = dadosProgresso.subtotal || 0;
    const percentualAtual = dadosProgresso.percentualProgressivo || 0;

    let mensagemUxEstrategica = '';
    let percentualBarraVisual = 100;

    if (proximaFaixa) {
        const faltaParaMeta = proximaFaixa.min - subtotal;
        percentualBarraVisual = (subtotal / proximaFaixa.min) * 100;
        mensagemUxEstrategica = `Adicione mais <span class="font-bold font-mono text-[#caa85c]">${formatarMoeda(faltaParaMeta)}</span> para ganhar <span class="font-bold text-[#caa85c]">${proximaFaixa.percentual}% de desconto!</span>`;
    } else {
        mensagemUxEstrategica = `🎉 Parabéns! Você atingiu o nível máximo de <span class="font-bold text-[#caa85c]">${percentualAtual}% de desconto em atacado!</span>`;
    }

    return `
        <div class="bg-gray-950 border border-gray-900 rounded-xl p-4 sm:p-5 shadow-inner">
            <div class="flex justify-between items-center mb-2 flex-wrap gap-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Progresso de Desconto Atacado</span>
                <span class="text-sm font-bold font-mono text-[#caa85c] bg-[#caa85c]/10 px-2 py-0.5 rounded border border-[#caa85c]/20">
                    Desconto Atual: ${percentualAtual}%
                </span>
            </div>
            
            <div class="w-full bg-gray-900 rounded-full h-3.5 p-0.5 border border-gray-800">
                <div 
                    class="bg-gradient-to-r from-[#bfa054] to-[#caa85c] h-2 rounded-full transition-all duration-500 ease-out shadow" 
                    style="width: ${Math.min(100, Math.max(0, percentualBarraVisual))}%"
                ></div>
            </div>
            
            <p class="text-xs text-gray-300 mt-3 flex items-center justify-center text-center bg-black/40 py-2 rounded-lg px-2">
                ${mensagemUxEstrategica}
            </p>
        </div>
    `;
}