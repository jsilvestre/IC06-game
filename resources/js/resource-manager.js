function ResourceManager() {
    
    this.loadImages = function(callback) {
        
        var images = {};
        var loadedImages = 0;
        var numImages = 0;
        
        var images = {
            "map" : null,
            "planets" : [],
            "roles" : []
        };

        numImages = Resources.planets.names.length + Resources.roles.names.length + 1;
        
        // We load the background
        images.map = new Image();
        images.map.onload = function() {
            if(++loadedImages >= numImages) {
                callback(images);
            }
        };
        images.map.src = Resources.map.background;
        
        // We load the planets
        var id;
        for(var i = 0; i < Resources.planets.names.length; i++) {
            id = Resources.planets.names[i];
            images.planets[id] = new Image();
            images.planets[id].onload = function() {
                if(++loadedImages >= numImages) {
                    callback(images);
                }
            };

            images.planets[id].src = Resources.planets.prefix+"P"+id+".png";
        }
        
        // We load the roles' pictures
        var id;
        for(var i = 0; i < Resources.roles.names.length; i++) {
            id = Resources.roles.names[i];
            images.roles[id] = new Image();
            images.roles[id].onload = function() {
                if(++loadedImages >= numImages) {
                    callback(images);
                }
            };

            images.roles[id].src = Resources.roles.prefix+id+".png";
        }
    }
    
    
}

var Resources = {
    
    map : {
        "prefix" : "resources/maps/",
        "background" : "resources/images/map-background-4.png"
    },
    
    roles : {
        "prefix" : "resources/images/roles/",
        "names" :
            [
                "role_brute", "role_architect", "role_pirate", "role_spy", "role_shield", "role_expert"
            ]
        
    },

    planets : {
        "prefix" : "resources/images/planets/",
        "names" :
            [
                "1-a", "1-b", "1-c", "1-d",
                "2-a", "2-b", "2-c", "2-d",
                "3-a", "3-b", "3-c", "3-d",
                "4-a", "4-b", "4-c", "4-d",
                "5-a", "5-b", "5-c", "5-d",
                "6-a", "6-b", "6-c", "6-d",
                "7-a", "7-b", "7-c", "7-d",
                "8-a", "8-b", "8-c", "8-d",
                "9-a", "9-b", "9-c", "9-d",
                "10-a", "10-b", "10-c", "10-d"
            ]
        }
}