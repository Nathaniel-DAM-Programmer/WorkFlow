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

function eliminarJuego(id) {
    listaDeJuegos = listaDeJuegos.filter(function(juego) {
        return juego.id !== id;
    });
    localStorage.setItem("mis_juegos", JSON.stringify(listaDeJuegos));
    actualizarVista();
}

elFormulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const valorNombre = document.getElementById("nombre").value.trim();
    const valorGenero = document.getElementById("genero").value;
    const valorPlataforma = document.getElementById("lugar").value.trim();
    const valorFecha = document.getElementById("fecha").value;

    const fechaLimite = new Date(valorFecha);
    const ahora = new Date();
    const cincoMinutos = 5 * 60 * 1000;

    if (!valorFecha || isNaN(fechaLimite.getTime())) {
        alert("La fecha y hora no son válidas. Por favor elige una fecha y hora correctas.");
        return;
    }

    if (fechaLimite <= ahora) {
        alert("La fecha y hora deben ser futuras. Elige una fecha que aún no haya pasado.");
        return;
    }

    if (fechaLimite.getTime() - ahora.getTime() < cincoMinutos) {
        alert("El plazo mínimo es de 5 minutos. Elige una fecha que esté al menos 5 minutos en el futuro.");
        return;
    }

    const nuevoJuego = {
        id: Math.floor(Math.random() * 1000000),
        titulo: valorNombre,
        estilo: valorGenero,
        lugar: valorPlataforma,
        fechaLimite: fechaLimite.toISOString()
    };

    listaDeJuegos.push(nuevoJuego);
    localStorage.setItem("mis_juegos", JSON.stringify(listaDeJuegos));

    await programarRecordatorio(nuevoJuego);

    elFormulario.reset();
    actualizarVista();
});

async function programarRecordatorio(tarea) {
    if (!tarea.fechaLimite) return;

    const fechaLimite = new Date(tarea.fechaLimite);
    const ahora = new Date();
    const tresHoras = 3 * 60 * 60 * 1000;
    const tresMinutos = 3 * 60 * 1000;
    const notificaciones = [];

    if (isNaN(fechaLimite.getTime())) return;

    const fechaAvisoTresHoras = new Date(fechaLimite.getTime() - tresHoras);
    const fechaAvisoTresMinutos = new Date(fechaLimite.getTime() - tresMinutos);

    if (fechaAvisoTresHoras > ahora) {
        notificaciones.push({
            title: "⏳ Aviso: quedan 3 horas",
            body: `Quedan 3 horas para: ${tarea.titulo}`,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: fechaAvisoTresHoras },
            channelId: 'workflow-canal',
            smallIcon: 'ic_launcher_round',
            actionTypeId: ''
        });
    }

    if (fechaAvisoTresMinutos > ahora) {
        notificaciones.push({
            title: "⏳ Aviso: quedan 3 minutos",
            body: `Quedan 3 minutos para: ${tarea.titulo}`,
            id: Math.floor(Math.random() * 100000) + 100000,
            schedule: { at: fechaAvisoTresMinutos },
            channelId: 'workflow-canal',
            smallIcon: 'ic_launcher_round',
            actionTypeId: ''
        });
    }

    if (notificaciones.length === 0) return;

    try {
        let permisos = await Capacitor.Plugins.LocalNotifications.checkPermissions();
        if (permisos.display !== 'granted') {
            permisos = await Capacitor.Plugins.LocalNotifications.requestPermissions();
        }

        if (permisos.display === 'granted') {
            await Capacitor.Plugins.LocalNotifications.createChannel({
                id: 'workflow-canal',
                name: 'Avisos de Tareas',
                description: 'Canal para recordatorios de Workflow',
                importance: 5,
                visibility: 1
            });

            await Capacitor.Plugins.LocalNotifications.schedule({
                notifications: notificaciones
            });

            const mensajesProgramados = notificaciones.map(n => {
                const hora = n.schedule.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `${n.title.replace('⏳ ', '')} a las ${hora}`;
            });

            alert("Notificaciones programadas: " + mensajesProgramados.join(' y ') + ".");
        } else {
            alert("No puedo avisarte porque no aceptaste las notificaciones.");
        }
    } catch (error) {
        console.error("Fallo crítico en notificaciones:", error);
    }
}
