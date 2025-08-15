class EndScreen {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.time = 0;
    }

    init() {
        console.log('End Screen initialized');
    }

    update(deltaTime) {
        // Handle input to return to menu
        if (this.game.inputManager.isKeyJustPressed('Enter') || this.game.inputManager.isKeyJustPressed('Space')) {
            this.game.setScene('menu');
        }
    }

    render() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Race Complete!', canvas.width / 2, 100);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${this.score}`, canvas.width / 2, 150);
        ctx.fillText(`Time: ${this.time}s`, canvas.width / 2, 180);
        
        ctx.font = '18px Arial';
        ctx.fillText('Press ENTER or SPACE to continue', canvas.width / 2, canvas.height - 50);
    }

    cleanup() {
        // Reset scores and stats
    }

    setResults(score, time) {
        this.score = score;
        this.time = time;
    }
}

export default EndScreen;