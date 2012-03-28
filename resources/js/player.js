function Player() {
    
    this.id = 0;
    this.name = "Player";
    this.x = 0;
    this.y = 0;
    this.planet = null;
    this.isPlaying = false;
    
    // Dessine la vue du joueur
    this.draw  = function(canvasContext) {
    
        canvasContext.beginPath();
        canvasContext.fillStyle = "#d53ec4";
        canvasContext.fillRect(this.x, this.y, 5, 5);
        canvasContext.closePath();        
    }
    
    // Déplace le joueur sur une aurte planète
    this.move = function(planetDest, playerMoveIntervalId) {
        
        // distance entre deux points
        var distance = Math.sqrt(Math.pow(planetDest.y - this.planet.y, 2) + Math.pow(planetDest.x - this.planet.x, 2));

        // la vitesse à laquelle se déplace la vue du joueur
        var speed = Config.moveInterval * distance / Config.moveTime; // en pixel / tick
        
        // le coefficient directeur de la droite
        var coeff = (planetDest.y - this.planet.y) / (planetDest.x - this.planet.x);
        if((planetDest.x - this.planet.x) == 0) {
            coeff = 1;
        }
        
        // la variable d'ajustement de l'équation de la droite
        var adjust = this.y - this.x * coeff;
            
        var direction; // la direction du déplacement
        if(planetDest.x > this.planet.x || (planetDest.x == this.planet.x && planetDest.y > this.planet.y)) {
            direction = 1;
        }
        else {
            direction = -1;
        }

        // si l'équation de la droite est du type y = A on ne fait varier que le paramètre y
        if(coeff != 1) {
            this.x = this.x + speed * direction;
            this.y = this.x * coeff + adjust;
        }
        else {
            this.y = this.y + speed * direction;
        }

        // conditions d'arrêt : ne pas toucher à moins savoir ce qu'on fait
        if( ((planetDest.x > this.planet.x) && (((planetDest.y > this.planet.y) && (this.x > planetDest.x || this.y > planetDest.y)) ||
            (!(planetDest.y > this.planet.y) && (this.x > planetDest.x || this.y < planetDest.y)))) ||
            
            (!(planetDest.x > this.planet.x) && (((planetDest.y > this.planet.y) && (this.x < planetDest.x || this.y > planetDest.y)) ||
            (!(planetDest.y > this.planet.y) && (this.x < planetDest.x || this.y < planetDest.y)))) ) {
                
                this.setPlanet(planetDest);
                return planetDest;
        }
        
        return false;
    }
    
    // Affecte une nouvelle planète au joueur
    this.setPlanet = function(planetDest) {
        this.x = planetDest.x;
        this.y = planetDest.y;
        this.planet = planetDest;        
    }
}