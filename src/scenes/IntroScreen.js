class IntroScreen {
    constructor(game) {
        this.game = game;
        this.initialized = false;
    }

    init() {
        this.initialized = true;
        console.log('Intro Screen initialized');
        
        // Auto-transition to main menu after 3 seconds
        setTimeout(() => {
            this.game.setScene('menu');
        }, 3000);
    }

    update(deltaTime) {
        // Update intro screen animations
    }

    render() {
        // Render intro screen
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nintendo NFS', canvas.width / 2, canvas.height / 2);
    }

    cleanup() {
        this.initialized = false;
    }
}

export default IntroScreen;