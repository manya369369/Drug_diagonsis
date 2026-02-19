document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    const ctaButton = document.getElementById('ctaButton');
    const heroSection = document.getElementById('hero');
    const transitionOverlay = document.getElementById('transition-overlay');
    const dashboardSection = document.getElementById('dashboard');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();

    // Particle class - Pollen-like dispersal from invisible center region
    class Particle {
        constructor(centerX, centerY, canvasWidth, canvasHeight) {
            // Spawn within small invisible radius (5-12px) around center
            // Prevents visible cluster while allowing immediate launch
            const spawnRadius = Math.random() * 7 + 5; // 5-12px
            const spawnAngle = Math.random() * Math.PI * 2;
            
            // Store initial spawn position
            this.startX = centerX + Math.cos(spawnAngle) * spawnRadius;
            this.startY = centerY + Math.sin(spawnAngle) * spawnRadius;
            
            // Current position starts at spawn point
            this.x = this.startX;
            this.y = this.startY;
            
            this.size = Math.random() * 1 + 2; // 2px-3px with variation
            this.baseOpacity = Math.random() * 0.25 + 0.5; // 0.5-0.75
            this.opacity = this.baseOpacity;
            this.color = Math.random() > 0.5 ? '#00d4ff' : '#00b8d4';
            
            // RANDOM angle for pollen-like dispersal (not sequential)
            const angle = Math.random() * Math.PI * 2;
            
            // Direction vector based on angle
            this.directionX = Math.cos(angle);
            this.directionY = Math.sin(angle);
            
            // Calculate spread distance to fill entire screen
            const screenDiagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
            const maxSpreadDistance = screenDiagonal * 0.6;
            
            // More natural radius variance for pollen-like effect
            const radiusVariance = Math.random() * maxSpreadDistance * 0.15 - maxSpreadDistance * 0.08;
            const spreadDistance = maxSpreadDistance * 0.5 + radiusVariance;
            
            // Calculate final target position from spawn point
            this.targetX = this.startX + this.directionX * spreadDistance;
            this.targetY = this.startY + this.directionY * spreadDistance;
            
            // Clamp to screen with margin
            this.targetX = Math.max(-50, Math.min(canvasWidth + 50, this.targetX));
            this.targetY = Math.max(-50, Math.min(canvasHeight + 50, this.targetY));
            
            // Spreading animation (3-5 seconds, immediate launch)
            this.spreadDuration = Math.random() * 2000 + 3000; // 3-5 seconds
            this.spreadProgress = 0;
            this.isSpreadComplete = false;
        }

        update(deltaTime) {
            // Immediate spread - no accumulation phase
            if (!this.isSpreadComplete) {
                this.spreadProgress += deltaTime / this.spreadDuration;

                if (this.spreadProgress >= 1) {
                    this.spreadProgress = 1;
                    this.isSpreadComplete = true;
                    this.x = this.targetX;
                    this.y = this.targetY;
                } else {
                    // Ease-out function (power 2.5) - soft pollen-like deceleration
                    const easeOutProgress = 1 - Math.pow(1 - this.spreadProgress, 2.5);
                    
                    // Linear interpolation from start to target with ease-out
                    this.x = this.startX + (this.targetX - this.startX) * easeOutProgress;
                    this.y = this.startY + (this.targetY - this.startY) * easeOutProgress;
                }
            } else {
                // Maintain final position - particles settle softly
                this.x = this.targetX;
                this.y = this.targetY;
            }
        }

        draw(ctx) {
            if (this.opacity <= 0) return;

            ctx.save();
            ctx.globalAlpha = this.opacity;

            // Draw soft particle with subtle glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();

            // Subtle glow effect (low shadowBlur)
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 4;
            ctx.fill();

            ctx.restore();
        }

        isAnimationComplete() {
            return this.isSpreadComplete;
        }
    }

    // Get canvas dimensions
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    // Create particles
    let particles = [];
    const particleCount = 700; // Exactly 700 particles
    
    function createParticles() {
        particles = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(centerX, centerY, canvas.width, canvas.height));
        }
    }

    createParticles();

    // Animation state
    let lastTime = performance.now();
    let allParticlesComplete = false;
    let animationActive = true;

    // Optimized animation loop
    function animate(currentTime) {
        const deltaTime = Math.min(currentTime - lastTime, 16.67); // Cap at ~16.67ms (60fps)
        lastTime = currentTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let anyParticleAnimating = false;

        // Batch update and draw for performance
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            particle.update(deltaTime);
            particle.draw(ctx);

            if (!particle.isAnimationComplete()) {
                anyParticleAnimating = true;
            }
        }

        // Continue animation while particles are moving
        if (anyParticleAnimating && animationActive) {
            requestAnimationFrame(animate);
        } else {
            allParticlesComplete = true;
            animationActive = false;
        }
    }

    // Start animation
    requestAnimationFrame(animate);

    // CTA button interaction
    ctaButton.addEventListener('click', () => {
        animationActive = false;
        setTimeout(() => {
            heroSection.style.opacity = '0';
            transitionOverlay.style.opacity = '1';
            setTimeout(() => {
                heroSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                setTimeout(() => {
                    dashboardSection.style.opacity = '1';
                    transitionOverlay.style.opacity = '0';
                }, 500);
            }, 1000);
        }, 500);
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        themeToggle.textContent = body.classList.contains('dark-theme') ? '☀️' : '🌙';
    });

    // Recreate particles on resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;
        createParticles();
        lastTime = performance.now();
        allParticlesComplete = false;
        animationActive = true;
        requestAnimationFrame(animate);
    });
});