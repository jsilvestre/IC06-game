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
            "TIMER_BETWEEN_TURN" : 90000,
            "INVASION_PHASE_DURATION" : 10000 
        }
    },
    
    FIRST_TURN_PREPARATION_DURATION : 85000,
    
    COUNTER_SPY_NUM_CARDS : 6,
    
    NUM_ZONES : 4, // nombre de zones de jeu
    
    INVASION_SPEED_METER : [2, 2, 3, 3, 4, 4], // jauge de vitesse d'invasion
    
    FLASH_TYPE : { PLANET_UNDER_ATTACK : "planet_under_attack", 
                   PLANET_COLONIZED : "planet_colonized",
                   PLANET_MASSIVELY_INVADED : "planet_massively_invaded",
                   INFORMATION_GIVEN : "information_given",
                   THREAT_METER : "threat_meter" },
    
    SYSTEM_NAME : "QG",
    
    ROLE_BRUTE : { label : "Brute", id : "role_brute", desc : "Lorqu'il combat, fait chuter le niveau de menace à 0. De plus, si la brute se déplace sur une planète dont l'arme a été découverte, le niveau de menace tombe automatiquement à 0." },
    ROLE_PIRATE : { label : "Pirate", id : "role_pirate", desc : "Peut déplacer les autres joueurs selon les mêmes modalités, en utilisant ses propres ressources." },
    ROLE_ARCHITECT : { label : "Architecte", id : "role_architect", desc : "Peut construire un laboratoire de recherche sans utiliser de guide touristique." },
    ROLE_EXPERT : { label : "Expert en armement", id : "role_expert", desc : "N'a besoin que de 4 guides touristiques de la même zone au lieu de 5." },
    ROLE_SPY : { label : "Informateur", id : "role_spy", desc : "Peut donner une carte sans utiliser de guide touristique." },
    ROLE_SHIELD : { label : "Bouclier", id : "role_shield", desc : "Le niveau de menace de la planète sur laquelle il se trouve ne peut pas augmenter." },
    
    MESS : {
        
        TUTO_START : {
            value : "Bienvenue dans le mode tutoriel. Vous aurez plus de temps pour développer votre stratégie lors du premier tour et vous bénéficierez de quelques explications.<br />Sachez tout d'abord que tous les messages peuvent être relus en passant la souris sur l'onglet 'événements' en haut à droite de l'écran.",
            duration : 10000
        },
        
        TUTO_EXPL_A : {
            value : "Le but du jeu est de découvrir les armes des 4 zones : bleue, rouge, jaune et verte. Pour cela vous devrez rassembler 5 guides touristiques de planète de la même zone sur un seul personnage et utiliser l'action 'assembler une arme' sur une planète de cette zone.",
            timeBeforeLog : 8000,
            duration : 20000
        },
        
        TUTO_EXPL_B : {
            value : "Commencez donc par consulter l'inventaire de chacun des joueurs en passant votre souris sur leur pseudo en haut à gauche de l'écran. C'est le premier geste à effectuer au début de chaque partie pour planifier vos premiers déplacements sur la carte et vous donner un premier objectif.",
            timeBeforeLog : 25000,
            duration : 20000
        },
        
        TUTO_EXPL_C : {
            value : "Tour après tour, vos ennemis vont envahir des planètes. Chaque planète a un niveau de menace representé par une barre verticale à 3 niveaux à sa droite. Si une planète est attaquée alors que son niveau de menace est à 3, une colonisation forcée est déclenchée et les planètes adjacentes sont attaquées à leur tour. Au bout de 10 colonisations forcées, vous perdrez ! Alors surveillez le niveau de menace des planètes et faites attention aux réactions en chaînes !",
            timeBeforeLog : 40000,
            duration : 25000
        },
        
        TUTO_EXPL_D : {
            value : "Il n'existe qu'un guide touristique par planète et lorsqu'ils sont tous distribués, vous perdez la partie ! Utilisez les avec parcimonie. Rappelez-vous que la majorité des actions utilisent des guides touristiques.",
            timeBeforeLog : 60000,
            duration : 25000
        },
        
        TUTO_EXPL_E : {
            value : "Vous voyez ces cercles violets ? Ils indiquent les planètes dont vous venez de recevoir le guide touristique.",
            timeBeforeLog : 75000,
            duration : 8000
        },
        
        TUTO_EXPL_F : {
            value : "Lors de la phase d'invasion, les planètes attaquées ont leur jauge de menace qui clignote. Si vous voyez un cercle rouge c'est qu'il y a une colonisation forcée !",
            duration : 10000
        },
        
        TUTO_EXPL_G : {
            value : "A vous de jouer. Allez vous effectuer un don de carte ou plutôt un déplacement ? Ou peut-être comptez-vous engager le combat sur une planète ? A vous de décider !",
            duration : 5000
        },
        
        START : {
            value : "La partie va débuter. Vous bénéficiez d'un temps supplémentaire lors du premier tour pour préparer votre stratégie. Soyez prêt !",
            duration : 5000
        },
        
        PIRATE_ROLE : {
            value : "En tant que Pirate, vous pouvez déplacer les autres joueurs avec vos propres PA et guides touristiques. Pour cela, sélectionnez le joueur en cliquant sur son nom en haut à gauche puis effectuez les déplacements comme vous en avez l'habitude.",
            duration : 15000
        }
    }
};

var SingletonEngine = {
    engine : null,
}