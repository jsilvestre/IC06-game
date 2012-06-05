function Planet() {
    
    this.id = "";
    this.name = "";
    this.zone = "";
    this.x = 0;
    this.y = 0;
    this.boundPlanets = [];
    
    this.resource = null;
    
    this.isSelected = false;
    this.isHovering = false;
    
    this.isUnderAttack = false;
    this.isColonizedByForce = false;
    this.isMassivelyInvaded = false;
    this.isGivenToPlayer = false;
    
    this.threatLvl = 0;
    this.hasLaboratory = false;
    
    this.displayThreatMeter = true;
    
    // Dessine la vue de la planète
    this.draw = function(canvasContext) {
        
        if(this.isSelected) {
            canvasContext.beginPath();
            canvasContext.fillStyle = "#FFF";
            canvasContext.fillRect(this.x, this.y, Config.PLANET_IMG, Config.PLANET_IMG);
            canvasContext.closePath();
        }

        if(this.isHovering) {
            canvasContext.beginPath();
            canvasContext.strokeStyle = "#0088FF";
            canvasContext.arc(this.x + Config.PLANET_IMG / 2, this.y + Config.PLANET_IMG / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.closePath();
        }
        
        if(this.isUnderAttack) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 5;
            canvasContext.strokeStyle = "#0088FF";
            canvasContext.arc(this.x + Config.PLANET_IMG / 2, this.y + Config.PLANET_IMG / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.lineWidth = 1;
            canvasContext.closePath();
        }        
        
        if(this.isColonizedByForce) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 5;
            canvasContext.strokeStyle = "#FF0000";
            canvasContext.arc(this.x + Config.PLANET_IMG / 2, this.y + Config.PLANET_IMG / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.lineWidth = 1;            
            canvasContext.closePath();
        }
        
        if(this.isMassivelyInvaded) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 5;
            canvasContext.strokeStyle = "#FFAA55";
            canvasContext.arc(this.x + Config.PLANET_IMG / 2, this.y + Config.PLANET_IMG / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.lineWidth = 1;            
            canvasContext.closePath();
        }
        
        if(this.isGivenToPlayer) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 5;
            canvasContext.strokeStyle = "#AA55FF";
            canvasContext.arc(this.x + Config.PLANET_IMG / 2, this.y + Config.PLANET_IMG / 2, 
                              Config.PLANET_HITBOX / 1.2, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.lineWidth = 1;            
            canvasContext.closePath();
        }

        if(this.hasLaboratory) {
            canvasContext.beginPath();
            canvasContext.lineWidth = 3;
            canvasContext.strokeStyle = "#E2E2E2";
            canvasContext.arc(this.x + Config.PLANET_IMG / 2, this.y + Config.PLANET_IMG / 2,
                              Config.PLANET_IMG / 1.7, 0, Math.PI*2, true);
            canvasContext.stroke();
            canvasContext.closePath();
        }
        
        canvasContext.beginPath();
        canvasContext.drawImage(this.resource, this.x, this.y);
        
        canvasContext.fillStyle = "#FFF";
        canvasContext.textAlign = "center";
        canvasContext.font = "9pt Verdana";
        canvasContext.fillText(this.name, this.x + Config.PLANET_IMG / 2, this.y + Config.PLANET_IMG + 15);
        canvasContext.closePath();
        
        if(this.displayThreatMeter) {
            this.drawThreatLvlMeter(canvasContext);
        }
    }
    
    this.drawThreatLvlMeter = function(canvasContext) {
        
        var meterWidth = 6;
        var xMeterL = this.x + Config.PLANET_IMG + 3;
        var xMeterR = this.x + Config.PLANET_IMG + 3 + meterWidth;
        
        canvasContext.beginPath();
        canvasContext.lineWidth = 1;
        canvasContext.strokeStyle = "#FFF";
        canvasContext.moveTo(xMeterL, this.y);
        canvasContext.lineTo(xMeterR, this.y);
        canvasContext.lineTo(xMeterR, this.y + Config.PLANET_IMG);
        canvasContext.lineTo(xMeterL, this.y + Config.PLANET_IMG);
        canvasContext.lineTo(xMeterL, this.y);
        canvasContext.stroke();

        
        if(this.threatLvl >= 1) {
            canvasContext.fillStyle = "yellow";
            canvasContext.fillRect(xMeterL, this.y + 20, meterWidth, 10);
        }
        
        if(this.threatLvl >= 2) {
            canvasContext.fillStyle = "orange";
            canvasContext.fillRect(xMeterL, this.y + 10, meterWidth, 10);
        }
        
        if(this.threatLvl >= 3) {
            canvasContext.fillStyle = "red";
            canvasContext.fillRect(xMeterL, this.y, meterWidth, 10);
        }

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
}