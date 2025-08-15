class Particle {
    constructor(x, y, vx, vy, life, color) {
        this.position = { x, y };
        this.velocity = { x: vx, y: vy };
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.alpha = 1;
    }

    update(deltaTime) {
        this.position.x += this.velocity.x * deltaTime * 0.001;
        this.position.y += this.velocity.y * deltaTime * 0.001;
        
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;
        
        // Apply gravity for certain particle types
        this.velocity.y += 50 * deltaTime * 0.001;
        
        return this.life > 0;
    }

    render(context) {
        context.save();
        context.globalAlpha = this.alpha;
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    static instance = null;

    static getInstance() {
        if (!ParticleSystem.instance) {
            ParticleSystem.instance = new ParticleSystem();
        }
        return ParticleSystem.instance;
    }

    static emit(type, position, count = 10) {
        const system = ParticleSystem.getInstance();
        system.emit(type, position, count);
    }

    emit(type, position, count = 10) {
        for (let i = 0; i < count; i++) {
            let particle;
            
            switch (type) {
                case 'drift':
                    particle = new Particle(
                        position.x + (Math.random() - 0.5) * 20,
                        position.y + (Math.random() - 0.5) * 20,
                        (Math.random() - 0.5) * 100,
                        (Math.random() - 0.5) * 100,
                        1000 + Math.random() * 1000,
                        `hsl(${Math.random() * 60 + 20}, 70%, 50%)`
                    );
                    break;
                    
                case 'boost':
                    particle = new Particle(
                        position.x + (Math.random() - 0.5) * 10,
                        position.y + 20,
                        (Math.random() - 0.5) * 50,
                        Math.random() * -100 - 50,
                        800 + Math.random() * 500,
                        `hsl(${Math.random() * 60 + 180}, 80%, 60%)`
                    );
                    break;
                    
                case 'collect':
                    particle = new Particle(
                        position.x + (Math.random() - 0.5) * 30,
                        position.y + (Math.random() - 0.5) * 30,
                        (Math.random() - 0.5) * 200,
                        Math.random() * -150 - 50,
                        600 + Math.random() * 400,
                        `hsl(${Math.random() * 60 + 40}, 100%, 70%)`
                    );
                    break;
                    
                default:
                    particle = new Particle(
                        position.x,
                        position.y,
                        (Math.random() - 0.5) * 100,
                        (Math.random() - 0.5) * 100,
                        1000,
                        '#ffffff'
                    );
            }
            
            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(particle => 
            particle.update(deltaTime)
        );
    }

    render(context) {
        this.particles.forEach(particle => {
            particle.render(context);
        });
    }

    static update(deltaTime) {
        const system = ParticleSystem.getInstance();
        system.update(deltaTime);
    }

    static render(context) {
        const system = ParticleSystem.getInstance();
        system.render(context);
    }
}

export default ParticleSystem;