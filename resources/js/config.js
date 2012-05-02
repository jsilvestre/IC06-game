var Config = {
    
    moveInterval : 25, // l'interval entre deux tick pour le déplacement en ms
    moveTime : 1500, // le temps qu'un déplacement doit durer en ms
    
    LIMIT_DRAW_VERTICAL : 50, // le nombre de px minimum entre deux planètes liées (pour la liaison classique)
    
    PLANET_HITBOX : 30,
    
    CARD_TYPE_PLANET : "planet",
    CARD_TYPE_SPECIAL_EVENT : "specialevent",
    CARD_TYPE_MASSIVE_INVASION : "massiveincasion",
    
    NUM_ZONES : 4, // nombre de zones de jeu
    
    INVASION_SPEED_METER : [2, 2, 3, 3, 4, 4], // jauge de vitesse d'invasion
    
    FLASH_TYPE : { PLANET_UNDER_ATTACK : "planet_under_attack", 
                   PLANET_COLONIZED : "planet_colonized",
                   PLANET_MASSIVELY_INVADED : "planet_massively_invaded" },
    
    SYSTEM_NAME : "Système",
    
    ROLE_BRUTE : "role_brute",
    ROLE_PIRATE : "role_pirate",
    ROLE_ARCHITECT : "role_architecte",
    ROLE_EXPERT : "role_expert",
    ROLE_SPY : "role_informateur",
    ROLE_EXPLORER : "role_explorateur",
    ROLE_SHIELD : "role_bouclier",
};

var SingletonEngine = {
    engine : null,
}