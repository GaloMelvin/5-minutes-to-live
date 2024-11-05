document.addEventListener('DOMContentLoaded', function() {
    const btnIniciar = document.getElementById('btnIniciar');
    const btnSalir = document.getElementById('btnSalir');

    btnIniciar.addEventListener('click', function() {
        window.location.href = '/inicio.html';
    });
});