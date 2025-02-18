document.addEventListener("DOMContentLoaded", function() {
    const textContainer = document.querySelector('.text-container');
    const progressBar = document.getElementById('progress-bar');
    const chapters = document.querySelectorAll('.chapter');

    textContainer.addEventListener('scroll', () => {
        let currentChapter = null;
        let containerTop = textContainer.getBoundingClientRect().top;

        chapters.forEach(chapter => {
            const chapterTop = chapter.getBoundingClientRect().top - containerTop;
            const chapterBottom = chapterTop + chapter.offsetHeight;

            if (chapterTop <= 0 && chapterBottom > 0) {
                currentChapter = chapter;
            }
        });

        if (currentChapter) {
            const chapterRect = currentChapter.getBoundingClientRect();
            const containerRect = textContainer.getBoundingClientRect();
            const chapterHeight = chapterRect.height;
            const scrollPosition = containerRect.top - chapterRect.top;
            const progress = (scrollPosition / chapterHeight) * 100;
            progressBar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        } else {
            progressBar.style.width = '0%';
        }
    });
});