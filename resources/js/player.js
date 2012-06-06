function Player() {
    
    this.id = 0;
    this.name = "Player";
    this.x = 0;
    this.y = 0;
    this.planet = null;
    this.isPlaying = false;
    this.inventory = new Deck();
    this.pa = 100;
    this.role = null;
    this.resource = null;
    
    // Dessine la vue du joueur
    this.draw  = function(canvasContext, position) {
        
        var x = this.x;
        var y = this.y;
        if(position == 1) {
            x = this.x - 4;
            y = this.y - 4;
        }
        if(position == 2) {
            x = this.x - 4 + 18;
            y = this.y - 4;
        }
        else if(position == 3) {
            x = this.x + 6;
            y = this.y + 16;
        }
        
        canvasContext.beginPath();
        canvasContext.drawImage(this.resource, x, y);
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
    
    this.fight = function(planet) {

        this.pa = this.pa - 1;
        
        if(this.hasRole(Config.ROLE_BRUTE)) {
            planet.threatLvl = 0;
        }
        else {
            planet.threatLvl = planet.threatLvl - 1;
        }
    }
    
    this.buildLaboratory = function(planet, card) {
        planet.hasLaboratory = true;
        this.pa = this.pa - 1;
        
        if(!this.hasRole(Config.ROLE_ARCHITECT)) {
            this.inventory.removeCard(card.id);
        } 
    }
    
    this.createWeapon = function(selectedCards) {        
        this.pa = this.pa - 1;
        
        for(i = 0; i < selectedCards.length; i++) {
            this.inventory.removeCard(selectedCards[i].id);
        }
    }
    
    this.hasRole = function(roleName) {
        return this.role.id == roleName.id;
    }
}