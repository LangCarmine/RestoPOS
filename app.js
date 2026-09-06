let contadorComandas = parseInt(localStorage.getItem('contador_restopos')) || 1; 

const inputsQty = document.querySelectorAll('.input-qty');
const totalEnVivo = document.getElementById('total-en-vivo');
const btnEnviar = document.getElementById('btn-enviar');
const resumenPedido = document.getElementById('resumen-pedido');
const textoCantidad = document.getElementById('texto-cantidad-platillos');
const formComanda = document.getElementById('form-comanda');
const fechaActual = document.getElementById('fecha-actual');

if (fechaActual) {
    const fechaOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    fechaActual.textContent = new Date().toLocaleDateString('es-ES', fechaOptions);
}

if (formComanda) {
    function actualizarTotal() {
        let sumaTotal = 0;
        let totalPlatillos = 0;
        
        inputsQty.forEach(campo => {
            const cantidad = parseInt(campo.value) || 0;
            const precio = parseFloat(campo.getAttribute('data-precio'));
            sumaTotal += cantidad * precio;
            totalPlatillos += cantidad;
        });
        
        totalEnVivo.textContent = `$${sumaTotal.toFixed(2)}`;

        if (totalPlatillos === 1) {
            textoCantidad.textContent = '1 platillo seleccionado';
        } else {
            textoCantidad.textContent = `${totalPlatillos} platillos seleccionados`;
        }

        if (sumaTotal > 0) {
            resumenPedido.classList.remove('oculto');
            btnEnviar.classList.add('activo');
            btnEnviar.removeAttribute('disabled');
        } else {
            resumenPedido.classList.add('oculto');
            btnEnviar.classList.remove('activo');
            btnEnviar.setAttribute('disabled', 'true');
        }
    }

    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.nextElementSibling;
            let valor = parseInt(input.value);
            if (valor > 0) {
                input.value = valor - 1;
                actualizarTotal();
            }
        });
    });

    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            input.value = parseInt(input.value) + 1;
            actualizarTotal();
        });
    });

    formComanda.addEventListener('submit', function(e) {
        e.preventDefault();

        const cliente = document.getElementById('cliente').value;
        const mesa = document.getElementById('mesa').value;
        const especificaciones = document.getElementById('especificaciones').value;
        const horaFormateada = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const numeroComanda = `#CMD-${contadorComandas.toString().padStart(3, '0')}`;

        let htmlPlatillos = '';
        let costoTotal = 0;

        inputsQty.forEach(campo => {
            const cantidad = parseInt(campo.value) || 0;
            if (cantidad > 0) {
                const precio = parseFloat(campo.getAttribute('data-precio'));
                const nombre = campo.getAttribute('data-nombre');
                const subtotal = cantidad * precio;
                costoTotal += subtotal;
                
                htmlPlatillos += `
                    <li>
                        <span class="qty-badge">${cantidad}x</span> 
                        ${nombre} 
                        <span class="item-precio">$${subtotal.toFixed(2)}</span>
                    </li>`;
            }
        });

        const nuevaComanda = {
            id: Date.now(),
            numero: numeroComanda,
            cliente: cliente,
            mesa: mesa,
            pedido: htmlPlatillos,
            especificaciones: especificaciones,
            total: costoTotal.toFixed(2),
            hora: horaFormateada
        };

        let comandasDB = JSON.parse(localStorage.getItem('restopos_db')) || [];
        comandasDB.push(nuevaComanda);
        localStorage.setItem('restopos_db', JSON.stringify(comandasDB));

        contadorComandas++;
        localStorage.setItem('contador_restopos', contadorComandas);

        formComanda.reset();
        inputsQty.forEach(input => input.value = 0);
        actualizarTotal();
        
        renderizarComandas();
    });
}

function renderizarComandas() {
    const tablero = document.getElementById('tablero-cocina');
    if (!tablero) return;

    let comandasDB = JSON.parse(localStorage.getItem('restopos_db')) || [];
    tablero.innerHTML = '';
    
    const badgePedidos = document.getElementById('badge-pedidos');
    const textoContadorPedidos = document.getElementById('texto-contador-pedidos');
    
    if (badgePedidos) badgePedidos.textContent = comandasDB.length;
    if (textoContadorPedidos) textoContadorPedidos.textContent = comandasDB.length === 1 ? '1 pedido en curso' : `${comandasDB.length} pedidos en curso`;

    comandasDB.forEach(comanda => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'comanda-card';
        tarjeta.innerHTML = `
            <div class="comanda-header">
                <div class="info-cliente-mesa">
                    <span class="etiqueta-mesa">Mesa ${comanda.mesa}</span>
                    <span class="nombre-cliente">${comanda.cliente}</span>
                </div>
                <div style="text-align: right;">
                    <span style="color: var(--red-accent); font-weight: 800; display: block;">${comanda.numero}</span>
                    <span class="hora-pedido">Esperando desde: ${comanda.hora}</span>
                </div>
            </div>
            <ul class="lista-pedido">
                ${comanda.pedido}
            </ul>
            
            ${comanda.especificaciones ? `
            <div class="notas-box">
                Nota: ${comanda.especificaciones}
            </div>` : ''}
            
            <div class="total-comanda">
                <button type="button" class="btn-completar" onclick="completarComanda(${comanda.id})">✔ Completar</button>
                <span>Total $${comanda.total}</span>
            </div>
        `;
        tablero.appendChild(tarjeta);
    });
}

window.completarComanda = function(id) {
    let comandasDB = JSON.parse(localStorage.getItem('restopos_db')) || [];
    comandasDB = comandasDB.filter(c => c.id !== id);
    localStorage.setItem('restopos_db', JSON.stringify(comandasDB));
    renderizarComandas();
}

setInterval(renderizarComandas, 2000);
renderizarComandas();