function Planet() {
    
    this.id = "";
    this.name = "";
    this.zone = "";
    this.x = 0;
    this.y = 0;
    this.boundPlanets = [];
    this.isSelected = false;
    this.isHovering = false;
    
    // Dessine la vue de la planète
    this.draw = function(canvasContext) {
        
        if(this.isSelected) {
            canvasContext.beginPath();
            canvasContext.fillStyle = "#000";
            canvasContext.fillRect(this.x - 5, this.y - 5, Config.PLANET_HITBOX + 10, Config.PLANET_HITBOX + 10);
            canvasContext.closePath();
        }
        
        if(this.isHovering) {
            canvasContext.beginPath();
            canvasContext.strokeStyle = "#0088FF";
            canvasContext.arc(this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.closePath();
        }
        
        canvasContext.beginPath();
        canvasContext.fillStyle = this.getColorZone();
        canvasContext.fillRect(this.x, this.y, Config.PLANET_HITBOX, Config.PLANET_HITBOX);
        
        canvasContext.fillStyle = "#000";
        canvasContext.textAlign = "center";
        canvasContext.fillText(this.name, this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX + 15);
        canvasContext.closePath();
    }
    
    this.isBoundTo = function(planet) {
        for(var i = 0; i < this.boundPlanets.length; i++) {
            if(this.boundPlanets[i] == planet.id) {
                return true;
            }
        }
        
        return false;
    }
    
    // Donne la couleur en fonction de la zone de la planète
    this.getColorZone = function() {
        switch(this.zone) {
            case "threat-a" :
                return "red";
            case "threat-b":
                return "blue";
            case "threat-c":
                return "green";
            case "threat-d":
                return "yellow";
            default:
                return "black";
        }
    }
}