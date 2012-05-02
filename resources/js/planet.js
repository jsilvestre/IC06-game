function Planet() {
    
    this.id = "";
    this.name = "";
    this.zone = "";
    this.x = 0;
    this.y = 0;
    this.boundPlanets = [];
    this.isSelected = false;
    this.isHovering = false;
    
    this.isUnderAttack = false;
    this.isColonizedByForce = false;
    this.isMassivelyInvaded = false;
    this.isGivenToPlayer = false;
    
    this.threatLvl = 0;
    this.hasLaboratory = false;
    
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
        
        if(this.isUnderAttack) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 5;
            canvasContext.strokeStyle = "#0088FF";
            canvasContext.arc(this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.lineWidth = 1;
            canvasContext.closePath();
        }        
        
        if(this.isColonizedByForce) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 5;
            canvasContext.strokeStyle = "#FF0000";
            canvasContext.arc(this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.lineWidth = 1;            
            canvasContext.closePath();
        }
        
        if(this.isMassivelyInvaded) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 5;
            canvasContext.strokeStyle = "#FFAA55";
            canvasContext.arc(this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.lineWidth = 1;            
            canvasContext.closePath();
        }
        
        if(this.isGivenToPlayer) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 5;
            canvasContext.strokeStyle = "#AA55FF";
            canvasContext.arc(this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.lineWidth = 1;            
            canvasContext.closePath();
        }

        if(this.hasLaboratory) {
            canvasContext.beginPath();
            canvasContext.strokeStyle = "#FF0088";
            canvasContext.arc(this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX / 2,
                              Config.PLANET_HITBOX / 1.7, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.closePath();
        }
        
        canvasContext.beginPath();
        canvasContext.fillStyle = this.getColorZone();
        canvasContext.fillRect(this.x, this.y, Config.PLANET_HITBOX, Config.PLANET_HITBOX);
        
        canvasContext.fillStyle = "#000";
        canvasContext.textAlign = "center";
        canvasContext.fillText(this.name, this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX + 15);
        canvasContext.fillText(this.threatLvl, this.x + Config.PLANET_HITBOX / 2, this.y + Config.PLANET_HITBOX / 2);        
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
            case "a" :
                return "red";
            case "b":
                return "blue";
            case "c":
                return "green";
            case "d":
                return "yellow";
            default:
                return "black";
        }
    }
}