class MainMenu {
    constructor(game) {
        this.game = game;
        this.selectedOption = 0;
        this.menuOptions = ['Start Game', 'Options', 'Credits'];
    }

    init() {
        console.log('Main Menu initialized');
    }

    update(deltaTime) {
        // Handle menu navigation
        if (this.game.inputManager.isKeyJustPressed('ArrowUp') && this.selectedOption > 0) {
            this.selectedOption--;
        }
        if (this.game.inputManager.isKeyJustPressed('ArrowDown') && this.selectedOption < this.menuOptions.length - 1) {
            this.selectedOption++;
        }
        if (this.game.inputManager.isKeyJustPressed('Enter')) {
            this.selectOption();
        }
    }

    selectOption() {
        switch (this.selectedOption) {
            case 0: // Start Game
                this.game.setScene('gameplay');
                break;
            case 1: // Options
                console.log('Options selected');
                break;
            case 2: // Credits
                console.log('Credits selected');
                break;
        }
    }

    render() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#001122';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nintendo NFS', canvas.width / 2, 100);
        
        // Render menu options
        this.menuOptions.forEach((option, index) => {
            ctx.fillStyle = index === this.selectedOption ? '#ffff00' : '#ffffff';
            ctx.font = '24px Arial';
            ctx.fillText(option, canvas.width / 2, 200 + index * 50);
        });
    }

    cleanup() {
        this.selectedOption = 0;
    }
}

export default MainMenu;