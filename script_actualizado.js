// Estado de la aplicación
let carrito = [];
let reservasConfirmadas = [];

const paquetesPrecios = {
  "Torres del Paine Full Day": 89990,
  "Puerto Varas Express": 54990,
  "Chiloé Tradición Day Tour": 59990,
  "Pucón Aventura 1 Día": 64990,
  "Valdivia Río y Ciudad": 52990
};

// Menú móvil
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.querySelector(".nav-links");
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    // Configurar la fecha mínima (1 día de anticipación)
    configurarFechaMinima();
    
    // Render inicial del carrito e inventario
    renderizarLista();
    renderizarInventario();
});

// Eventos de botones "Reservar paquete"
document.querySelectorAll(".package-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const paqueteNombre = e.target.getAttribute("data-package");
        if(paqueteNombre) {
            agregarItem(paqueteNombre);
            // Hacer scroll suave hacia la sección del carrito
            const carritoSeccion = document.getElementById("carrito");
            if (carritoSeccion) {
                carritoSeccion.scrollIntoView({ behavior: "smooth" });
            }
        }
    });
});

// Funciones Modulares del Carrito
function agregarItem(paqueteNombre) {
    const precio = paquetesPrecios[paqueteNombre] || 0;
    const id = Date.now(); // ID único
    
    // Limitar a un solo paquete: vaciamos el carrito antes de agregar el nuevo
    carrito = [];
    
    carrito.push({ id, nombre: paqueteNombre, precio });
    
    // Auto-seleccionar en el formulario para facilitar la reserva
    const paqueteSelect = document.getElementById("paquete-select");
    if (paqueteSelect) {
        paqueteSelect.value = paqueteNombre;
    }
    
    renderizarLista();
    mostrarToast(`Se seleccionó "${paqueteNombre}" como tu destino`);
}

function eliminarItem(id) {
    carrito = carrito.filter(item => item.id !== id);
    renderizarLista();
}

function renderizarLista() {
    const cartItemsDiv = document.getElementById("cart-items");
    const cartTotalSpan = document.getElementById("cart-total");
    
    if (!cartItemsDiv || !cartTotalSpan) return;
    
    // Limpieza segura del DOM sin innerHTML
    while(cartItemsDiv.firstChild) {
        cartItemsDiv.removeChild(cartItemsDiv.firstChild);
    }
    
    if (carrito.length === 0) {
        const p = document.createElement("p");
        p.className = "empty-cart-msg";
        p.textContent = "Aún no has seleccionado ningún paquete.";
        cartItemsDiv.appendChild(p);
        cartTotalSpan.textContent = "$0";
        return;
    }
    
    let total = 0;
    
    // Renderizado seguro iterando el arreglo
    carrito.forEach(item => {
        total += item.precio;
        
        const itemDiv = document.createElement("div");
        itemDiv.className = "cart-item";
        
        const infoDiv = document.createElement("div");
        infoDiv.className = "cart-item-info";
        
        const h4 = document.createElement("h4");
        h4.textContent = item.nombre;
        
        const pPrecio = document.createElement("p");
        pPrecio.textContent = `$${item.precio.toLocaleString("es-CL")}`;
        
        infoDiv.appendChild(h4);
        infoDiv.appendChild(pPrecio);
        
        const removeBtn = document.createElement("button");
        removeBtn.className = "cart-item-remove";
        removeBtn.textContent = "Eliminar";
        removeBtn.onclick = () => eliminarItem(item.id);
        
        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(removeBtn);
        
        cartItemsDiv.appendChild(itemDiv);
    });
    
    cartTotalSpan.textContent = `$${total.toLocaleString("es-CL")}`;
}

function mostrarToast(mensaje) {
    const toast = document.getElementById("toast");
    if(toast) {
        toast.textContent = mensaje;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
}

// Funciones del Inventario de Reservas
function ofuscarNombre(nombreCompleto) {
    const partes = nombreCompleto.trim().split(/\s+/);
    const ofuscadas = partes.map(parte => {
        if (parte.length <= 2) return parte + "****";
        return parte.substring(0, 2) + "****";
    });
    return ofuscadas.join(" ");
}

function renderizarInventario() {
    const listDiv = document.getElementById("inventory-list");
    if (!listDiv) return;
    
    while(listDiv.firstChild) {
        listDiv.removeChild(listDiv.firstChild);
    }
    
    if (reservasConfirmadas.length === 0) {
        const p = document.createElement("p");
        p.className = "empty-cart-msg";
        p.textContent = "No hay reservas recientes.";
        listDiv.appendChild(p);
        return;
    }
    
    // Mostrar desde la más reciente a la más antigua
    const reservasInvertidas = [...reservasConfirmadas].reverse();
    
    reservasInvertidas.forEach(res => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "inventory-item";
        
        const infoDiv = document.createElement("div");
        
        const nombreP = document.createElement("div");
        nombreP.className = "inventory-item-name";
        nombreP.textContent = ofuscarNombre(res.nombre);
        
        const paqueteP = document.createElement("div");
        paqueteP.className = "inventory-item-package";
        paqueteP.textContent = res.paquete;
        
        infoDiv.appendChild(nombreP);
        infoDiv.appendChild(paqueteP);
        
        const dateP = document.createElement("div");
        dateP.className = "inventory-item-date";
        
        // Formatear fecha para que se vea mejor (ej. de 2026-05-02 a 02/05/2026)
        const partes = res.fecha.split("-");
        if (partes.length === 3) {
            dateP.textContent = `${partes[2]}/${partes[1]}/${partes[0]}`;
        } else {
            dateP.textContent = res.fecha;
        }
        
        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(dateP);
        
        listDiv.appendChild(itemDiv);
    });
}

// Funciones Modulares de Validación (Formulario)
function configurarFechaMinima() {
    const inputFecha = document.getElementById("fecha");
    if (inputFecha) {
        const hoy = new Date();
        // Sumar 1 día para garantizar al menos 1 día de anticipación
        hoy.setDate(hoy.getDate() + 1);
        
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        
        inputFecha.min = `${year}-${month}-${day}`;
    }
}

function validarEntrada(campoId, regex, errorId, mensaje) {
    const input = document.getElementById(campoId);
    const errorSpan = document.getElementById(errorId);
    
    if (!input || !errorSpan) return false;
    
    const valorLimpio = input.value.trim(); // Sanitización básica quitando espacios
    
    if (!regex.test(valorLimpio)) {
        input.classList.add("invalid");
        errorSpan.textContent = mensaje;
        return false;
    } else {
        input.classList.remove("invalid");
        errorSpan.textContent = "";
        return true;
    }
}

function validarFechaMinima() {
    const input = document.getElementById("fecha");
    const errorSpan = document.getElementById("error-fecha");
    
    if (!input || !errorSpan) return false;
    
    if (!input.value) {
        input.classList.add("invalid");
        errorSpan.textContent = "La fecha es obligatoria.";
        return false;
    }
    
    // Obtener la fecha seleccionada vs la fecha mínima (mañana)
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    hoy.setDate(hoy.getDate() + 1);
    
    // El input.value es de la forma "YYYY-MM-DD"
    const partesFecha = input.value.split("-");
    const fechaSeleccionada = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
    
    if (fechaSeleccionada < hoy) {
        input.classList.add("invalid");
        errorSpan.textContent = "Debe ser al menos con 1 día de anticipación.";
        return false;
    }
    
    input.classList.remove("invalid");
    errorSpan.textContent = "";
    return true;
}

function validarSelect(campoId, errorId) {
    const select = document.getElementById(campoId);
    const errorSpan = document.getElementById(errorId);
    
    if (!select || !errorSpan) return false;
    
    if (select.value === "") {
        select.classList.add("invalid");
        errorSpan.textContent = "Por favor selecciona un destino.";
        return false;
    } else {
        select.classList.remove("invalid");
        errorSpan.textContent = "";
        return true;
    }
}

function validarNumero(campoId, errorId, min) {
    const input = document.getElementById(campoId);
    const errorSpan = document.getElementById(errorId);
    
    if (!input || !errorSpan) return false;
    
    const valor = parseInt(input.value, 10);
    
    if (isNaN(valor) || valor < min) {
        input.classList.add("invalid");
        errorSpan.textContent = `Debe ser al menos ${min}.`;
        return false;
    } else {
        input.classList.remove("invalid");
        errorSpan.textContent = "";
        return true;
    }
}

// Manejo del Envío del Formulario
const formReserva = document.getElementById("reserva-form");
if (formReserva) {
    formReserva.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/;
        const regexEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        const regexRut = /^[0-9]{7,8}-[0-9Kk]$/;
        
        const isNombreValido = validarEntrada("nombre", regexNombre, "error-nombre", "Ingresa un nombre válido (solo letras, mín. 3 caracteres).");
        const isRutValido = validarEntrada("rut", regexRut, "error-rut", "Ingresa un RUT válido (Ej. 12345678-9).");
        const isEmailValido = validarEntrada("email", regexEmail, "error-email", "Ingresa un correo electrónico válido.");
        const isPersonasValido = validarNumero("personas", "error-personas", 1);
        const isFechaValida = validarFechaMinima();
        const isSelectValido = validarSelect("paquete-select", "error-select");
        
        if (isNombreValido && isRutValido && isEmailValido && isPersonasValido && isFechaValida && isSelectValido) {
            if (carrito.length === 0) {
                // Validación adicional: asegurar que tenga algo en el carrito
                mostrarToast("Tu carrito está vacío. ¡Agrega un paquete primero!");
                return;
            }
            
            const valorNombre = document.getElementById("nombre").value.trim();
            const valorRut = document.getElementById("rut").value.trim().toUpperCase();
            const valorFecha = document.getElementById("fecha").value;
            const valorPaquete = document.getElementById("paquete-select").value;
            
            // Comprobar si ya existe una reserva para este RUT en esa misma fecha
            const reservaExistente = reservasConfirmadas.find(res => res.rut === valorRut && res.fecha === valorFecha);
            if (reservaExistente) {
                const inputRut = document.getElementById("rut");
                inputRut.classList.add("invalid");
                document.getElementById("error-rut").textContent = "Ya tienes una reserva para esta fecha.";
                
                const inputFecha = document.getElementById("fecha");
                inputFecha.classList.add("invalid");
                document.getElementById("error-fecha").textContent = "El RUT ingresado ya reservó este día.";
                return;
            }
            
            // Éxito: Guardar la reserva
            reservasConfirmadas.push({ rut: valorRut, fecha: valorFecha, nombre: valorNombre, paquete: valorPaquete });
            
            // Éxito: Simular el guardado y mostrar mensaje
            const successMsg = document.getElementById("form-success");
            successMsg.classList.remove("hidden");
            
            // Resetear el formulario y el carrito
            formReserva.reset();
            carrito = [];
            renderizarLista();
            renderizarInventario(); // Actualizar el inventario
            
            // Ocultar mensaje después de 5 segundos
            setTimeout(() => {
                successMsg.classList.add("hidden");
            }, 5000);
        }
    });
}
