document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.menu a');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');

    function navigateMenu(direction) {
        const currentIndex = Array.from(links).findIndex(link => link.classList.contains('active'));
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex < 0 || newIndex >= links.length) return;
        links[newIndex].click();
        updateButtonStates(newIndex, links.length);
    }

    function updateButtonStates(currentIndex, totalItems) {
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === totalItems - 1;
    }

    function makeActive(event) {
        event.preventDefault();
        links.forEach(link => link.classList.remove('active'));
        this.classList.add('active');
        const currentIndex = Array.from(links).findIndex(link => link.classList.contains('active'));
        updateButtonStates(currentIndex, links.length);
    }

    links.forEach(link => link.addEventListener('click', makeActive));
    prevButton.addEventListener('click', () => navigateMenu('prev'));
    nextButton.addEventListener('click', () => navigateMenu('next'));

    const initialIndex = Array.from(links).findIndex(link => link.classList.contains('active'));
    updateButtonStates(initialIndex, links.length);

    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 39) { // Right arrow key
            navigateMenu('next');
        }
        if (event.keyCode === 37) { // Left arrow key
            navigateMenu('prev');
        }
    });
});