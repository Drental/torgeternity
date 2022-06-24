export async function torgMigration(){
    const currentVersion = game.system.data.version
    const migrationVersion = game.settings.get("torgeternity", "migrationVersion")


    //if current version is not newer than migration version, nothing to do here aside from maybe some module specific migrations for premium content
    if(!isNewerVersion(currentVersion, migrationVersion)){
        //If module images need updating, do that
        if(game.settings.get("torgeternity", "moduleImageUpdate")){
            await migrateImagestoWebp({system:false, modules: true})
            ui.notifications.info("Premium Content Image Migration Complete")
        }
        return
    }/**/ 

    //check for new worlds, which don't need migrating, and set their migration version accordingly
    if(migrationVersion === "1.0.0" && isNewWorld()) {
        await game.settings.set("torgeternity", "migrationVersion", currentVersion)
        console.log("Torg: New World Detected, skipping migration")
        return
    }
    //show a UI warning
    ui.notifications.warn("Migrating Torg system version to "+currentVersion) //TODO: Localize this

    //migrations up to 2.4.0
    if (isNewerVersion("2.4.0", migrationVersion)) {
        // code to migrate missile weappon groupName
        game.actors.forEach(async act => {
                if (act.data.data.skills.missileWeapons.groupName != "combat") {
                    await act.update({ "data.skills.missileWeapons.groupName": "combat" })
                    ui.notifications.info(act.name + " : migrated")
                }

            })
        //TODO: Add compendium actor migration here?

        // code to migrate new game settings
        let deckSettings = game.settings.get("torgeternity", "deckSetting")
        if (deckSettings.stormknightsHands) {
            deckSettings.stormknights = deckSettings.stormknightsHands;
            deckSettings.stormknightsHands = null;
            await game.settings.set("torgeternity", "deckSetting", deckSettings);

        }
    }

    if(isNewerVersion("2.5.0", migrationVersion)){

        //Deck settings migration to use id
        let deckSetting = game.settings.get("torgeternity", "deckSetting")
        let deckKeys = Object.keys(deckSetting)
        for(let key of deckKeys){
            if (key === "stormknights" || key === "stormknightsHands") continue
            let deck = game.cards.getName(deckSetting[key])
            if(!deck){
                deck = game.cards.get(deckSetting[key])
                if(!deck){
                    delete deckSetting[key]
                    ui.notifications.error("Torg Eternity: Migrating setting for deck " + key + "failed.  Deck settings will need to be reconfigured manually")
                }
                continue
            }
            deckSetting[key] = deck.id
        }
        game.settings.set("torgeternity", "deckSetting", deckSetting)
        
        await migrateImagestoWebp({system:true, modules:true})
        

    }
    /*************************************************************
    New migrations go here.

    For migration to version X.Y.Z:

    if(isNewerVersion("X.Y.Z", migrationVersion)){
        //whatever migration code is needed from previous version
    }

    **************************************************************/

    await game.settings.set("torgeternity", "migrationVersion", currentVersion)

    ui.notifications.info("System Migration Complete")

}

//Function to test if a world is a new world, to hude my hacky approach under a nice rug
function isNewWorld(){
    //a whole bunch of tests which would return true for a new world, until I find a neater solution
    //Some of these are subject to race conditions, as automatic setup would make them false - but they should all be slower than the simple check, and worst case for a false negative is an unnecessary migration which won't harm anything.
    let retVal = !!(
        game.scenes.size < 1 &&
        game.actors.size < 1 &&
        game.cards.size < 1 &&
        game.items.size < 1 &&
        game.settings.get("torgeternity", "welcomeMessage") &&
        game.settings.get("torgeternity", "setUpCards")
    )

    return retVal
}

async function migrateImagestoWebp(options = {system: true, modules: true}){
    let moduleUpdates = {"te001-core-rulebook": false, "te004-living-land": false, "te006-nile-empire": false}
    function isModuleImage(oldImg){
        let modules = [
            //name: module id/name, oldVersion: Version prior to image updates, pathArray: array of (root) folders containing only webp images in which images have been updated
            {name: "te001-core-rulebook", oldVersion: "1.5.0", pathArray: []}, 
            {name: "te004-living-land", oldVersion: "1.2.0", pathArray: ["/cards/"]},
            {name: "te006-nile-empire", oldVersion: "0.1", pathArray: ["/images/cards/"]}
        ]
        let retVal = false
        for(let module of modules){
            let modData = game.modules.get(module.name)
            if(!modData) continue
            if(!isNewerVersion(modData.data.version, module.oldVersion)){
                moduleUpdates[module.name] = true
                continue
            }
            if(oldImg.includes(module.name)) {
                for(let path of pathArray){
                    if(oldImg.includes(path)) retVal = true
                }
        }
        }
        return retVal
    }

    function isSystemImage(oldImg){
        if(!oldImg.includes("/torgeternity/")) return false
        let retVal = false
        let pathArray = [
            "/cards/",
            "/images/deutsch/"
        ]
        for(let path of pathArray){
            if(oldImg.includes(path)) retVal = true
        }
        return retVal
    }
    //Deck back image migration
    function imageToWebp(oldImg){
        let img = oldImg
        if(
             (options.system && isSystemImage(oldImg)) || 
             (options.modules && isModuleImage(oldImg))
        ){
            let imgarray = img.split(".")
            let extensions = ["png", "jpg", "jpeg"]
            if(extensions.includes(imgarray[imgarray.length -1].toLowerCase())){
                imgarray[imgarray.length -1] = "webp"
                img = imgarray.join(".")
            }
        }
        return img 

    }

    function updateAllImagesData(document){
        let oldImg= document.data.img
        return {img: imageToWebp(oldImg)}
    }

    function embedsImageData(collection){
        let updates = []
        for(let document of collection){
            updates.push({_id: document.id, img: imageToWebp(document.data.img)})
        }
        return updates
    }

    await game.cards.updateAll(updateAllImagesData)
    

    //Card image migration
    function changeCardImages(document){
        let cards = document.cards
        let updates = []
        for(let card of cards){
            let _id = card.id
            let img = imageToWebp(card.img)
            let face = duplicate(card.data.faces[0])
            face.img = img
            updates.push({_id, faces: [face]})
        }
        return updates
    }
    for (let deck of game.cards){
        await deck.updateEmbeddedDocuments("Card", changeCardImages(deck))
    }
    ui.notifications.info("Migrated card images to webp format")

    /*********
    //COMMENTED OUT SINCE THESE IMAGES AREN'T CHANGED YET
    //world item images migration
    await game.items.updateAll(updateAllImagesData)

    //migrate actor and prototype token images
    function ActorsImageData(document){
        let update = updateAllImagesData(document)
        let tokenImg = document.data.token.img
        update.token = {img: imageToWebp(tokenImg)}
        return update
    }
    
    await game.actors.updateAll(ActorsImageData)
    ui.notifications.info("Migrated actor images to webp format")

    //migrate item images on actors
    for(let actor of game.actors){
        actor.updateEmbeddedDocuments("Item", embedsImageData(actor.items))
    }

    //migrate tokens on scenes
    for(let scene of game.scenes){
        scene.updateEmbeddedDocuments("Token", embedsImageData(scene.tokens))
    }
    ui.notifications.info("Migrated token images to webp format")
    ********/

    //If any modules need an update, flag it to the user
    for(let key of Object.keys(moduleUpdates)){
        if(moduleUpdates.key){
            ui.notifications.warn("Update available for premium content " +key)
            game.settings.set("torgeternity", "moduleImageUpdate")
        }
    }

}