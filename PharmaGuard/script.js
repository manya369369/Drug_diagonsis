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
        body.classList.toggle('light');
        localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
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

    // VCF File Upload Functionality
    const vcfUploadBox = document.getElementById('vcfUploadBox');
    const vcfFileInput = document.getElementById('vcfFileInput');
    const fileName = document.getElementById('fileName');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileList = document.getElementById('fileList');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const themeToggleIntro = document.getElementById('themeToggleIntro');

    // Maximum file size: 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    let uploadedFiles = [];

    // Theme toggle for intro section
    themeToggleIntro.addEventListener('click', () => {
        body.classList.toggle('light');
        localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
    });

    // Restore theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light');
    }

    // Click to browse
    vcfUploadBox.addEventListener('click', () => {
        vcfFileInput.click();
    });

    // Handle file selection from input
    vcfFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            files.forEach(file => {
                validateAndAddFile(file);
            });
        }
    });

    // Drag and drop functionality
    vcfUploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        vcfUploadBox.classList.add('drag-over');
    });

    vcfUploadBox.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        vcfUploadBox.classList.remove('drag-over');
    });

    vcfUploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        vcfUploadBox.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            validateAndAddFile(file);
        });
    });

    // Validate and add file to list
    function validateAndAddFile(file) {
        // Clear error message
        fileName.textContent = '';
        fileName.classList.remove('error');

        // Check file extension
        if (!file.name.endsWith('.vcf')) {
            fileName.textContent = '❌ Error: Only .vcf files are accepted';
            fileName.classList.add('error');
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            fileName.textContent = `❌ Error: File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit`;
            fileName.classList.add('error');
            return;
        }

        // Check if file already exists
        if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
            fileName.textContent = '⚠️ This file is already uploaded';
            fileName.classList.add('error');
            return;
        }

        // Add file to the list
        uploadedFiles.push(file);
        updateFileList();
        vcfFileInput.value = '';
    }

    // Update file list display
    function updateFileList() {
        if (uploadedFiles.length === 0) {
            fileListContainer.style.display = 'none';
            fileName.textContent = '';
            return;
        }

        fileList.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const fileItemDiv = document.createElement('div');
            fileItemDiv.className = 'file-item';
            fileItemDiv.innerHTML = `
                <div class="file-info">
                    <div class="file-check">✓</div>
                    <div class="file-details">
                        <div class="file-name-text">${file.name}</div>
                        <div class="file-size">${(file.size / 1024).toFixed(2)} KB</div>
                    </div>
                </div>
                <button class="file-remove-btn" data-index="${index}">Remove</button>
            `;
            fileList.appendChild(fileItemDiv);
        });

        // Add remove button listeners
        document.querySelectorAll('.file-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                uploadedFiles.splice(index, 1);
                updateFileList();
            });
        });

        fileListContainer.style.display = 'block';
    }

    // Add more files button
    addMoreBtn.addEventListener('click', () => {
        vcfFileInput.click();
    });

    // Analyze button
    analyzeBtn.addEventListener('click', () => {
        if (uploadedFiles.length > 0) {
            // Show success message
            const fileCount = uploadedFiles.length;
            fileName.textContent = `✓ Ready to analyze ${fileCount} file(s)`;
            fileName.classList.remove('error');
            // Here you would typically send the files to your backend
            console.log('Files ready for analysis:', uploadedFiles);
        }
    });

    // Drug Section Functionality with Multi-Drug Support
    const drugInput = document.getElementById('drugInput');
    const drugDropdownList = document.getElementById('drugDropdownList');
    const drugOptions = document.querySelectorAll('.drug-option');
    const analyzeDrugBtn = document.getElementById('analyzeDrugBtn');
    const selectedDrugsContainer = document.getElementById('selectedDrugsContainer');
    
    // Track selected drugs
    let selectedDrugs = [];
    let defaultDrugOptions = ['CODEINE', 'WARFARIN', 'CLOPIDOGREL', 'SIMVASTATIN', 'AZATHIOPRINE', 'FLUOROURACIL'];

    // Show dropdown when input is clicked
    drugInput.addEventListener('click', () => {
        drugDropdownList.style.display = drugDropdownList.style.display === 'none' ? 'block' : 'none';
    });

    // Handle typing in input - show filtered dropdown
    drugInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toUpperCase().trim();
        const allOptions = document.querySelectorAll('.drug-option');
        
        if (searchTerm.length > 0) {
            allOptions.forEach(option => {
                const value = option.getAttribute('data-value');
                if (value.includes(searchTerm)) {
                    option.style.display = 'block';
                } else {
                    option.style.display = 'none';
                }
            });
            drugDropdownList.style.display = 'block';
        } else {
            allOptions.forEach(option => {
                option.style.display = 'block';
            });
        }
    });

    // Handle option selection from dropdown
    function setupDropdownOptionListeners() {
        const allOptions = document.querySelectorAll('.drug-option');
        allOptions.forEach(option => {
            // Remove old listeners by cloning
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
        });
        
        document.querySelectorAll('.drug-option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                addDrugToList(value);
                drugInput.value = '';
                drugDropdownList.style.display = 'none';
            });

            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = 'rgba(0, 245, 255, 0.15)';
            });

            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = '';
            });
        });
    }

    // Initialize dropdown listeners
    setupDropdownOptionListeners();

    // Handle Enter key to add drug
    drugInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const drugName = drugInput.value.trim().toUpperCase();
            
            if (drugName) {
                addDrugToList(drugName);
                drugInput.value = '';
                drugDropdownList.style.display = 'none';
            }
        }
    });

    // Add drug to selected list
    function addDrugToList(drugName) {
        const upperName = drugName.toUpperCase().trim();
        
        if (!upperName) return;
        
        // Check for duplicates (case-insensitive)
        if (selectedDrugs.some(d => d.toUpperCase() === upperName)) {
            // Show duplicate feedback
            drugInput.style.borderColor = 'rgba(255, 165, 0, 0.6)';
            drugInput.style.boxShadow = '0 0 10px rgba(255, 165, 0, 0.3)';
            setTimeout(() => {
                drugInput.style.borderColor = '';
                drugInput.style.boxShadow = '';
            }, 1000);
            return;
        }
        
        selectedDrugs.push(upperName);
        renderDrugPills();
        console.log('Drug added:', upperName, 'Selected drugs:', selectedDrugs);
    }

    // Render drug pills
    function renderDrugPills() {
        selectedDrugsContainer.innerHTML = '';
        
        selectedDrugs.forEach((drug, index) => {
            const pill = document.createElement('div');
            pill.className = 'drug-pill';
            pill.innerHTML = `
                ${drug}
                <span class="drug-pill-close" data-index="${index}">×</span>
            `;
            selectedDrugsContainer.appendChild(pill);
            
            // Add close handler
            pill.querySelector('.drug-pill-close').addEventListener('click', () => {
                removeDrugFromList(index);
            });
        });
        
        // Update analyze button to include all selected drugs
        updateAnalyzeButtonState();
    }

    // Remove drug from selected list
    function removeDrugFromList(index) {
        const removedDrug = selectedDrugs[index];
        selectedDrugs.splice(index, 1);
        renderDrugPills();
        console.log('Drug removed:', removedDrug, 'Remaining drugs:', selectedDrugs);
    }

    // Update analyze button state
    function updateAnalyzeButtonState() {
        const btnContent = analyzeDrugBtn.querySelector('.btn-content');
        if (selectedDrugs.length > 0) {
            btnContent.textContent = `Analyze ${selectedDrugs.length} Drug(s)`;
        } else {
            btnContent.textContent = 'Analyze Pharmacogenomic Risk';
        }
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.drug-input-wrapper')) {
            drugDropdownList.style.display = 'none';
        }
    });

    // Analyze button with enhanced loading state
    analyzeDrugBtn.addEventListener('click', () => {
        if (selectedDrugs.length === 0) {
            drugInput.style.borderColor = '#ff6b6b';
            setTimeout(() => {
                drugInput.style.borderColor = '';
            }, 2000);
            return;
        }

        // Show loading state
        const btnContent = analyzeDrugBtn.querySelector('.btn-content');
        const btnLoading = analyzeDrugBtn.querySelector('.btn-loading');

        btnContent.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        analyzeDrugBtn.disabled = true;
        analyzeDrugBtn.classList.add('loading');

        // Simulate API call (2.5 seconds)
        setTimeout(() => {
            btnContent.style.display = 'inline';
            btnLoading.style.display = 'none';
            analyzeDrugBtn.disabled = false;
            analyzeDrugBtn.classList.remove('loading');

            // Log analysis
            console.log('Pharmacogenomic Risk Analysis:', {
                drugs: selectedDrugs,
                uploadedFiles: uploadedFiles,
                timestamp: new Date().toISOString()
            });
        }, 2500);
    });

    // Action Buttons
    const addDrugBtn = document.getElementById('addDrugBtn');
    const removeDrugBtn = document.getElementById('removeDrugBtn');

    // Add New Drug - Add typed value to list or focus input
    addDrugBtn.addEventListener('click', () => {
        const currentInput = drugInput.value.trim().toUpperCase();
        
        if (currentInput) {
            // Add the current input value to selected drugs
            addDrugToList(currentInput);
            drugInput.value = '';
            drugDropdownList.style.display = 'none';
        }
        
        // Highlight animation and focus
        drugInput.style.borderColor = 'rgba(0, 212, 255, 0.6)';
        drugInput.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.4)';
        drugInput.focus();

        setTimeout(() => {
            drugInput.style.borderColor = '';
            drugInput.style.boxShadow = '';
        }, 1500);

        console.log('Add new drug initiated');
    });

    // Remove Current Drug - Remove last from selected or show message
    removeDrugBtn.addEventListener('click', () => {
        if (selectedDrugs.length > 0) {
            const lastIndex = selectedDrugs.length - 1;
            removeDrugFromList(lastIndex);
        } else {
            // Shake animation if empty
            removeDrugBtn.style.animation = 'shake 0.5s ease-in-out';
            removeDrugBtn.style.borderColor = 'rgba(255, 0, 85, 0.6)';

            setTimeout(() => {
                removeDrugBtn.style.animation = '';
                removeDrugBtn.style.borderColor = '';
            }, 500);

            console.log('No drugs to remove');
        }
    });
});