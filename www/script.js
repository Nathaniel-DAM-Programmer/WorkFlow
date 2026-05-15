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
        // Formateamos la fecha para que se vea bonita
        const fechaFormateada = juego.fechaLimite ? new Date(juego.fechaLimite).toLocaleString() : "Sin fecha";

        elContenedor.innerHTML = elContenedor.innerHTML + `
            <article class="tarjeta-noticia ${juego.estilo}">
                <button class="deleteBtn" onclick="eliminarJuego(${juego.id})">&times;</button>
                
                <p class="texto-importancia">
                    Importancia: <span class="valor-importancia ${juego.estilo}">${juego.estilo}</span>
                </p>
                
                <h2 class="h_Noticias">${juego.titulo}</h2>
                <p><strong>Lugar:</strong> ${juego.lugar}</p>
                
                <p style="font-size: 0.9rem; margin-top: 10px;">⏰ <strong>Límite:</strong> ${fechaFormateada}</p>
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
        id: Math.floor(Math.random() * 1000000), 
        titulo: valorNombre,
        estilo: valorGenero,
        lugar: valorPlataforma,
        fechaLimite: valorFecha
    };

    listaDeJuegos.push(nuevoJuego);
    localStorage.setItem("mis_juegos", JSON.stringify(listaDeJuegos));

    await programarRecordatorio(nuevoJuego);

    elFormulario.reset();
    actualizarVista();
});

async function programarRecordatorio(tarea) {
    if (!tarea.fechaLimite) return;

    const fechaNotificacion = new Date(tarea.fechaLimite);

    if (fechaNotificacion > new Date()) {
        try {
            
            const permiso = await Capacitor.Plugins.LocalNotifications.requestPermissions();
            
            if (permiso.display === 'granted') {
                await Capacitor.Plugins.LocalNotifications.schedule({
                    notifications: [
                        {
                            title: "¡Workflow Alert!",
                            body: `Es hora de: ${tarea.titulo}`,
                            id: tarea.id,
                            schedule: { at: fechaNotificacion },
                            sound: null
                        }
                    ]
                });
                alert("Notificación programada para las: " + fechaNotificacion.toLocaleString());
            }
        } catch (error) {
            console.error("Error al programar:", error);
        }
    } else {
        alert("La fecha seleccionada ya pasó. Elige una hora futura.");
    }
}

function eliminarJuego(idABuscar) {
    listaDeJuegos = listaDeJuegos.filter(function(item) {
        return item.id !== idABuscar;
    });
    localStorage.setItem("mis_juegos", JSON.stringify(listaDeJuegos));
    cancelarNotificacion(idABuscar);
    actualizarVista();
}

async function cancelarNotificacion(id) {
    try {
        await Capacitor.Plugins.LocalNotifications.cancel({
            notifications: [{ id: id }]
        });
    } catch (e) {
        console.log("No había notificación.");
    }
}