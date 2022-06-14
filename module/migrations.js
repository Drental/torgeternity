export async function torgMigration(){
    const currentVersion = game.system.data.version
    const migrationVersion = game.settings.get("torgeternity", "migrationVersion")

    //if current version is not newer than migration version, nothing to do here
    if(!isNewerVersion(currentVersion, migrationVersion)) return

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
            ui.notifications.warn("updating system settings .............")
            deckSettings.stormknights = deckSettings.stormknightsHands;
            deckSettings.stormknightsHands = null;
            await game.settings.set("torgeternity", "deckSetting", deckSettings);

        }
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