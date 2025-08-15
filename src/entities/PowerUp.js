class PowerUp {
    constructor(type, position) {
        this.type = type;
        this.position = position;
        this.isActive = true;
        this.sprite = null;
        this.collectEffect = null;
        this.animationTime = 0;
        
        this.initializeType(type);
    }

    initializeType(type) {
        switch(type) {
            case 'boost':
                this.sprite = {
                    width: 24,
                    height: 24,
                    draw: (ctx, x, y) => {
                        ctx.fillStyle = '#ffff00';
                        ctx.fillRect(x - 12, y - 12, 24, 24);
                        ctx.fillStyle = '#ff8800';
                        ctx.fillRect(x - 8, y - 8, 16, 16);
                    }
                };
                this.collectEffect = (car) => {
                    car.boostAmount += 3;
                };
                break;
            case 'star':
                this.sprite = {
                    width: 24,
                    height: 24,
                    draw: (ctx, x, y) => {
                        ctx.fillStyle = '#ffff00';
                        ctx.beginPath();
                        for (let i = 0; i < 5; i++) {
                            const angle = (i * 2 * Math.PI) / 5;
                            const px = x + Math.cos(angle) * 12;
                            const py = y + Math.sin(angle) * 12;
                            if (i === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.closePath();
                        ctx.fill();
                    }
                };
                this.collectEffect = (car) => {
                    car.isInvincible = true;
                    setTimeout(() => car.isInvincible = false, 10000);
                };
                break;
            default:
                this.sprite = {
                    width: 20,
                    height: 20,
                    draw: (ctx, x, y) => {
                        ctx.fillStyle = '#00ff00';
                        ctx.fillRect(x - 10, y - 10, 20, 20);
                    }
                };
                this.collectEffect = (car) => {
                    console.log('Unknown power-up collected');
                };
        }
    }

    update(deltaTime) {
        if (!this.isActive) return;
        
        // Animate power-up
        this.animationTime += deltaTime;
    }

    collect(car) {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.collectEffect(car);
        console.log(`Power-up collected: ${this.type}`);
    }

    checkCollision(car) {
        if (!this.isActive) return false;
        
        const dx = this.position.x - car.position.x;
        const dy = this.position.y - car.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 30; // Collision radius
    }

    render(context) {
        if (!this.isActive) return;
        
        // Add floating animation
        const floatOffset = Math.sin(this.animationTime * 0.005) * 5;
        const renderY = this.position.y + floatOffset;
        
        if (this.sprite) {
            this.sprite.draw(context, this.position.x, renderY);
        }
    }
}

export default PowerUp;