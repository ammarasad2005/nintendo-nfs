class Physics {
    static calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static calculateAngle(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return Math.atan2(dy, dx);
    }

    static normalizeVector(vector) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude === 0) return { x: 0, y: 0 };
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude
        };
    }

    static addVectors(v1, v2) {
        return {
            x: v1.x + v2.x,
            y: v1.y + v2.y
        };
    }

    static subtractVectors(v1, v2) {
        return {
            x: v1.x - v2.x,
            y: v1.y - v2.y
        };
    }

    static multiplyVector(vector, scalar) {
        return {
            x: vector.x * scalar,
            y: vector.y * scalar
        };
    }

    static dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    static checkCircleCollision(circle1, circle2) {
        const distance = this.calculateDistance(circle1.position, circle2.position);
        return distance < (circle1.radius + circle2.radius);
    }

    static checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    static applyFriction(velocity, friction, deltaTime) {
        const frictionForce = this.multiplyVector(
            this.normalizeVector(velocity), 
            -friction * deltaTime
        );
        
        const newVelocity = this.addVectors(velocity, frictionForce);
        
        // Stop very small velocities to prevent jitter
        if (Math.abs(newVelocity.x) < 0.01) newVelocity.x = 0;
        if (Math.abs(newVelocity.y) < 0.01) newVelocity.y = 0;
        
        return newVelocity;
    }

    static limitVelocity(velocity, maxSpeed) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > maxSpeed) {
            return this.multiplyVector(this.normalizeVector(velocity), maxSpeed);
        }
        return velocity;
    }
}

export default Physics;