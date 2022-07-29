/**
 * A Tour subclass that will show specificities of the torg system */


export default class TorgTour extends Tour {

    /** @override */


    //this _preStep method is empty in the parent Class Tour
    //it is called before the next step is called
    async _preStep() {

        // Close currently open applications
        if (this.stepIndex === 0) {
            for (const app of Object.values(ui.windows)) {
                app.close();
            }
        }

        if (this.title === "Torg-system-tour") {
            console.log(this)
            await this.manageTorgSteps();
        }

        await super._preStep();

    }

    /* -------------------------------------------- */

    /**
     * Handle Step setup for the Installing a System Tour
     * @return {Promise<void>}
     * @private
     */
    async manageTorgSteps() {

        //checking valid step
        if (this.currentStep != -1 && this.currentStep.id) {
            //managing callbacks dependding on current step id
            switch (this.currentStep.id) {
                case "external-links":
                    document.getElementById("logo").click();

                    break;
                case "rules reference":
                    //clicking button after 2s
                    setTimeout(async () => {
                        document.getElementsByClassName("one")[0].click();

                    }, 2000);
                    break;
                case "control buttons":
                    for (const app of Object.values(ui.windows)) {
                        app.close();
                    };

                    // there is a bug while clicking a control 
                    //document.getElementsByClassName("scene-control")[8].click();


                    break;
                case "setting":
                    ui.sidebar.tabs.settings.activate();
                    break;

                case "config":
                    await game.settings.sheet.render(true);
                    break;


                case "system config":
                    game.settings.sheet.activateTab("system");
                    break;

                default: break;
            }

        }

    }
}
