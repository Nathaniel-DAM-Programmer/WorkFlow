const elFormulario = document.getElementById("formulario-juego");
const elContenedor = document.getElementById("contenedor-lista");

let listaDeJuegos = [];
let datosGuardados = localStorage.getItem("mis_juegos");

if (datosGuardados !== null) {
    listaDeJuegos = JSON.parse(datosGuardados);
}

actualizarVista();

function actualizarVista() {
    elContenedor.innerHTML = "";

    listaDeJuegos.forEach(function(juego) {
        // Formateamos la fecha para que se vea amigable en la tarjeta
        const fechaFormateada = juego.fechaLimite ? new Date(juego.fechaLimite).toLocaleString() : "Sin fecha";

        elContenedor.innerHTML = elContenedor.innerHTML + `
            <article class="tarjeta-noticia ${juego.estilo}">
                <button class="deleteBtn" onclick="eliminarJuego(${juego.id})">&times;</button>
                <span class="categoria-etiqueta ${juego.estilo}">${juego.estilo}</span>
                <h2 class="h_Noticias">${juego.titulo}</h2>
                <p><strong>Lugar:</strong> ${juego.lugar}</p>
                <p><strong>Límite:</strong> ${fechaFormateada}</p>
            </article>
        `;
    });
}

elFormulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const valorNombre = document.getElementById("nombre").value;
    const valorGenero = document.getElementById("genero").value;
    const valorPlataforma = document.getElementById("lugar").value;
    const valorFecha = document.getElementById("fecha").value; 

    const nuevoJuego = {
        id: Date.now(),
        titulo: valorNombre,
        estilo: valorGenero,
        lugar: valorPlataforma,
        fechaLimite: valorFecha
    };

    listaDeJuegos.push(nuevoJuego);
    localStorage.setItem("mis_juegos", JSON.stringify(listaDeJuegos));

    // LLAMADA A LA NOTIFICACIÓN
    await programarRecordatorio(nuevoJuego);

    elFormulario.reset();
    actualizarVista();
});

// Función nueva para gestionar la alerta de 3 horas antes
async function programarRecordatorio(tarea) {
    if (!tarea.fechaLimite) return;

    const fechaLimite = new Date(tarea.fechaLimite);
    const tiempoNotificacion = fechaLimite.getTime() - (3 * 60 * 60 * 1000);
    const fechaNotificacion = new Date(tiempoNotificacion);

    // Solo programamos si la notificación caería en el futuro
    if (fechaNotificacion > new Date()) {
        try {
            await Capacitor.Plugins.LocalNotifications.schedule({
                notifications: [
                    {
                        title: "¡Recordatorio de Tarea!",
                        body: `Faltan 3 horas para: ${tarea.titulo}`,
                        id: tarea.id,
                        schedule: { at: fechaNotificacion },
                        sound: null,
                        attachments: null,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
            console.log("Notificación programada para:", fechaNotificacion.toLocaleString());
        } catch (error) {
            console.error("Error al programar la notificación:", error);
        }
    }
}

function eliminarJuego(idABuscar) {
    listaDeJuegos = listaDeJuegos.filter(function(item) {
        return item.id !== idABuscar;
    });

    localStorage.setItem("mis_juegos", JSON.stringify(listaDeJuegos));
    
    // Al eliminar la tarea, también cancelamos su notificación pendiente
    cancelarNotificacion(idABuscar);
    
    actualizarVista();
}

async function cancelarNotificacion(id) {
    try {
        await Capacitor.Plugins.LocalNotifications.cancel({
            notifications: [{ id: id }]
        });
    } catch (e) {
        console.log("No había notificación pendiente para borrar.");
    }
}