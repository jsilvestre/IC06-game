function Map() {
    
    this.canvas = null;
    this.planets = new Array();
    this.resource = null;
    
    // Dessine la vue de la map
    this.draw = function(canvasContext) {

        canvasContext.drawImage(this.resource, 0, 0, 1280, 800);
        
        var splitTmp1, splitTmp2;
        
        for(var i in this.planets) {
            this.planets[i].draw(canvasContext); // dessine la planète
            
            // dessines les relations entre cette planète et les autres
            for(var j = 0; j < this.planets[i].boundPlanets.length; j++) {
                
                // évite de dessiner deux fois la relation. Seulement vrai si lors de la création du modèle on respecte l'ordre
                if(this.planets[i].id <  this.planets[i].boundPlanets[j]) {
                    this.drawRelation(canvasContext, this.planets[i], this.planets[this.planets[i].boundPlanets[j]]);
                }
            }
        }
    }
    
    // Dessine les liens entre les planètes
    this.drawRelation = function(canvasContext, planetSource, planetDest) {
        canvasContext.beginPath();
        
        var additionner = [0, 0];
        
        canvasContext.strokeStyle = "#FFF";
        
        // si la distance entre les deux planètes est trop petite, on dessine le trait verticalement
        if(Math.abs(planetSource.x - planetDest.x) < Config.LIMIT_DRAW_VERTICAL) {
            
            // permet de supprimer la notion d'ordre dans les relations (JSON)
            if(planetSource.y - planetDest.y <= 0) {
                additionner[0] = Config.PLANET_HITBOX;
                additionner[1] = 0;
            }
            else {
                additionner[0] = 0;
                additionner[1] = Config.PLANET_HITBOX;
            }
            
            canvasContext.moveTo(planetSource.x + Config.PLANET_HITBOX / 2, planetSource.y + additionner[0]);
            canvasContext.lineTo(planetDest.x + Config.PLANET_HITBOX / 2, planetDest.y + additionner[1]);
        }
        else {

            // permet de supprimer la notion d'ordre dans les relations (JSON)
            if(planetSource.x - planetDest.x <= 0) {
                additionner[0] = Config.PLANET_HITBOX;
                additionner[1] = 0;
            }
            else {
                additionner[0] = 0;
                additionner[1] = Config.PLANET_HITBOX;
            }            
            
            canvasContext.moveTo(planetSource.x + additionner[0], planetSource.y + Config.PLANET_HITBOX / 2);
            canvasContext.lineTo(planetDest.x + additionner[1], planetDest.y + Config.PLANET_HITBOX / 2);
        }

        canvasContext.stroke();
        canvasContext.closePath();        
    }
    
    this.searchPlanet = function(x, y) {
        for(var i in this.planets) {
            if(this.planets[i].x <= x && this.planets[i].x + Config.PLANET_HITBOX >= x &&
               this.planets[i].y <= y && this.planets[i].y + Config.PLANET_HITBOX >= y) {
                return this.planets[i];
            }
        }
        
        return null;
    }
    
    this.removePlanetHighlights = function() {
        for(var i in this.planets) {
            this.planets[i].isHovering = false;
            this.planets[i].isUnderAttack = false;
            this.planets[i].isColonizedByForce = false;
            this.planets[i].isMassivelyInvaded = false;
            this.planets[i].isGivenToPlayer = false;
        }
    }
}