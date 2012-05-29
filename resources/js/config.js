var Config = {
    
    moveInterval : 25, // l'interval entre deux tick pour le déplacement en ms
    moveTime : 1500, // le temps qu'un déplacement doit durer en ms
    
    LIMIT_DRAW_VERTICAL : 75, // le nombre de px minimum entre deux planètes liées (pour la liaison classique)
    
    PLANET_IMG : 30, // le côté de l'image planète en px
    PLANET_HITBOX : 40, // le côté de la hitbox de la planète en px
    
    CARD_TYPE_PLANET : "planet",
    CARD_TYPE_SPECIAL_EVENT : "specialevent",
    CARD_TYPE_MASSIVE_INVASION : "massiveincasion",
    
    SPECIAL_EVENT : {
        FRIENDLY_FIRE : 1,
        TREVE : 2,
        COUNTER_SPY : 3
    },
    
    // le temps ajouté à chaque phase lors du premier tour d'une partie "tutoriel"
    TUTORIAL : {
        TIME : {
            "TURN_DURATION" : 60000,
            "TIMER_BETWEEN_TURN" : 60000,
            "INVASION_PHASE_DURATION" : 10000 
        }
    },
    
    COUNTER_SPY_NUM_CARDS : 6,
    
    NUM_ZONES : 4, // nombre de zones de jeu
    
    INVASION_SPEED_METER : [2, 2, 3, 3, 4, 4], // jauge de vitesse d'invasion
    
    FLASH_TYPE : { PLANET_UNDER_ATTACK : "planet_under_attack", 
                   PLANET_COLONIZED : "planet_colonized",
                   PLANET_MASSIVELY_INVADED : "planet_massively_invaded",
                   INFORMATION_GIVEN : "information_given" },
    
    SYSTEM_NAME : "Système",
    
    ROLE_BRUTE : { label : "Brute", id : "role_brute" },
    ROLE_PIRATE : { label : "Pirate", id : "role_pirate" },
    ROLE_ARCHITECT : { label : "Architecte", id : "role_architect" },
    ROLE_EXPERT : { label : "Expert en armement", id : "role_expert" },
    ROLE_SPY : { label : "Informateur", id : "role_spy" },
    ROLE_SHIELD : { label : "Bouclier", id : "role_shield" },
};

var SingletonEngine = {
    engine : null,
}