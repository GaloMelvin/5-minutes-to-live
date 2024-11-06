document.addEventListener('DOMContentLoaded', function() {
    const btnIniciar = document.getElementById('btnIniciar');
    const btnSalir = document.getElementById('btnSalir');

    btnIniciar.addEventListener('click', function() {
        window.location.href = '/index.html';
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const btnPersonajes = document.getElementById('btnPersonajes');
    const btnSalir = document.getElementById('btnSalir');

    btnPersonajes.addEventListener('click', function() {
        window.location.href = '/personajes.html';
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const btnLimite = document.getElementById('btnLimite');
    const btnSalir = document.getElementById('btnSalir');

    btnLimite.addEventListener('click', function() {
        window.location.href = '/infinito.html';
    });
});

// Activa o desactiva pantalla completa y guarda el estado
document.getElementById('btnPantallaCompleta').addEventListener('click', function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        localStorage.setItem('pantallaCompleta', 'true'); // Guarda el estado
    } else {
        document.exitFullscreen();
        localStorage.setItem('pantallaCompleta', 'false'); // Guarda el estado
    }
});

// Al cargar la página, verifica si debe estar en pantalla completa
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('pantallaCompleta') === 'true' && !document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    }
});