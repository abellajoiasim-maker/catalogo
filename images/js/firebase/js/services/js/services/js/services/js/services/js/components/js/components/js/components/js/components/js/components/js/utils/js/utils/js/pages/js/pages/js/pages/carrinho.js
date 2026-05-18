import { db } from '../utils/firebase-medusa.js';
import { getCart, clearCart, renderCartItems } from '../components/cart.js';
import { formatCurrency } from '../utils/helpers.js';

export function initCheckout() {
    // Renderiza a lista de compras inicial no checkout
    renderCartItems('resumo', 'total');

    // Associa a ação ao botão de envio seguro
    const btnFinalizar = document.querySelector('button[onclick="finalizarPedido()"]');
    if (btnFinalizar) {
        // Remove onclick inline para evitar colisão modular e injeta escuta purificada
        btnFinalizar.removeAttribute('onclick');
        btnFinalizar.addEventListener('click', processarEnvioPedido);
    }
}

function processarEnvioPedido() {
    const nome = document.getElementById('nome')?.value.trim();
    const telefone = document.getElementById('telefone')?.value.trim();
    const endereco = document.getElementById('endereco')?.value.trim();
    const carrinho = getCart();

    if (!carrinho.length) return alert("Seu carrinho está completamente vazio.");
    if (!nome) return alert("O campo Nome é obrigatório para envio do pedido.");
    if (!telefone) return alert("O campo WhatsApp é obrigatório.");

    let totalGeral = 0;
    const itensMapeados = carrinho.map(item => {
        const preco = parseFloat(item.precoFinal || item.preco || 0);
        const qtd = parseInt(item.quantidade || 1);
        const subtotal = Math.round((preco * qtd) * 100) / 100;
        totalGeral += subtotal;

        return {
            nome: item.nome || "Produto",
            preco: preco,
            qtd: qtd,
            subtotal: subtotal,
            variacao: item.variacao || ""
        };
    });

    totalGeral = Math.round(totalGeral * 100) / 100;

    const novoPedido = {
        cliente: {
            nome: nome,
            telefone: telefone,
            endereco: endereco || "Não informado"
        },
        itens: itensMapeados,
        total: totalGeral,
        status: "novo",
        criadoEm: Date.now()
    };

    // CORREÇÃO CRÍTICA DO BUG DE SUMIÇO: Salva exatamente no nó "pedidos" esperado pelo Admin
    db.ref("pedidos").push(novoPedido)
        .then(() => {
            alert("Pedido enviado com absoluto sucesso para a Abella Joias!");
            clearCart();
            location.href = "index.html";
        })
        .catch((err) => {
            console.error("Erro ao persistir pedido:", err);
            alert("Erro operacional ao transmitir pedido para o banco. Tente novamente.");
        });
}