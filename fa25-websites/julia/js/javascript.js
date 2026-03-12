document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll('.fade-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = Array.from(elements).indexOf(entry.target);
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 200); // 200ms stagger
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
});

function showTip(button, message) {
    let tipContainer = button.nextElementSibling;

    if (!tipContainer || !tipContainer.classList.contains('tip-message')) {
        tipContainer = document.createElement('div');
        tipContainer.classList.add('tip-message', 'fade-scroll');
        button.parentNode.appendChild(tipContainer);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        observer.observe(tipContainer);
    }

    tipContainer.style.display = 'inline-block';
    tipContainer.textContent = message;
}
