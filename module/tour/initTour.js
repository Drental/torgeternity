
import TorgTour from './TorgTour.js';
export async function initSystemTour() {


    try {
        const torgSystemTour = await TorgTour.fromJSON("/systems/torgeternity/module/tour/torgTour.json");
        game.tours.register("torgeternity", "system tour", torgSystemTour);
        await torgSystemTour.reset();
        await torgSystemTour.start();
    }
    catch (err) {
        ui.notifications.error('error while loading the system tour (see console)')
        console.error(err);
    }
}

