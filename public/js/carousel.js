document.addEventListener('DOMContentLoaded', function() {
    // Initialize carousels for each subject
    const carousels = document.querySelectorAll('.subject-carousel');
    
    carousels.forEach(carousel => {
        const container = carousel.querySelector('.carousel-container');
        const quizzesCarousel = carousel.querySelector('.quizzes-carousel');
        const prevBtn = carousel.querySelector('.prev-btn');
        const nextBtn = carousel.querySelector('.next-btn');
        
        // Scroll amount (width of one card + gap)
        const cardWidth = 280; // card width
        const gap = 24; // gap between cards
        const scrollAmount = cardWidth + gap;
        
        // Update button states
        const updateButtons = () => {
            const scrollLeft = quizzesCarousel.scrollLeft;
            const maxScroll = quizzesCarousel.scrollWidth - quizzesCarousel.clientWidth;
            
            prevBtn.disabled = scrollLeft <= 0;
            nextBtn.disabled = scrollLeft >= maxScroll - 1; // -1 for floating point precision
        };
        
        // Scroll next
        nextBtn.addEventListener('click', () => {
            quizzesCarousel.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Scroll prev
        prevBtn.addEventListener('click', () => {
            quizzesCarousel.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Update buttons on scroll
        quizzesCarousel.addEventListener('scroll', () => {
            updateButtons();
        });
        
        // Initial button state
        updateButtons();
        
        // Update buttons on window resize
        window.addEventListener('resize', () => {
            updateButtons();
        });
    });
});