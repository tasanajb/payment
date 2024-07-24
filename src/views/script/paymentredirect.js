document.addEventListener('DOMContentLoaded', function () {
    const redirectUrl = document.body.getAttribute('data-redirect-url');
    window.location.href = redirectUrl;
});