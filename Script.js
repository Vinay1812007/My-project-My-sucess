document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Setup the Intersection Observer
    const observerOptions = {
        root: null, // Use the viewport
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the class that forces the CSS transition
                entry.target.classList.add('active');
                // Optional: Stop observing once animated (for performance)
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 2. Target all elements with the 'scroll-reveal' class
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    scrollElements.forEach(el => observer.observe(el));

    // 3. Optional: Mouse Parallax Effect for the Ambient Glow
    const glow = document.querySelector('.ambient-glow');
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        // Move the glow slightly opposite to mouse direction
        glow.style.transform = `translate(-${x * 30}px, -${y * 30}px)`;
    });
});
