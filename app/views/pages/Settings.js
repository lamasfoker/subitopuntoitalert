import PushNotification from "../../services/PushNotification.js";
import Utils            from "../../services/Utils.js";
import ApiRequest       from "../../services/ApiRequest.js";

let Settings = {

    render: async () => {
        return /*html*/ `
            <main>
                <ul class="collection">
                    <li class="collection-item"><i class="material-icons">person</i>Alvin</li>
                    <li class="collection-item"><i class="material-icons">my_location</i>Reggio Emilia</li>
                    <li class="collection-item" id="notification-on"><i class="material-icons">notifications_active</i>Enable Notification</li>
                    <li class="collection-item" id="notification-off" style="display: none"><i class="material-icons">notifications_off</i><span id="notification-message"></span></li>
                    <li class="collection-item" id="send-push-button"><i class="material-icons">notifications</i>Notification Test</li>
                </ul>
            </main>
        `
    }

    , after_render: async (event) => {
        const headerTitle = null || document.getElementById('header-title');
        headerTitle.innerText = 'Impostazioni';
        Settings.notificationSubscribeHandler();
        Settings.notificationTestHandler();
    }

    , notificationTestHandler: () => {
        /**
         * START send_push_notification
         * this part handles the button that calls the endpoint that triggers a notification
         * in the real world, you wouldn't need this, because notifications are typically sent from backend logic
         */

        const sendPushButton = null || document.querySelector('#send-push-button');

        sendPushButton.addEventListener('click', async () => {
            const serviceWorkerRegistration = await navigator.serviceWorker.ready;
            const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
            if (!subscription) {
                alert('Please enable push notifications');
                return;
            }
            const contentEncoding = (PushManager.supportedContentEncodings || ['aesgcm'])[0];
            const jsonSubscription = subscription.toJSON();
            await ApiRequest.post(
                '/test-notification',
                JSON.stringify(Object.assign(jsonSubscription, {contentEncoding}))
            );
        });
    }

    , notificationSubscribeHandler: async () => {
        const notificationOn = null || document.getElementById('notification-on');
        const notificationOff = null || document.getElementById('notification-off');

        notificationOn.addEventListener('click', async function () {
            await PushNotification.push_subscribe();
            Settings.setNotificationActive(true);
            Settings.changeNotificationButtonState();
        });

        notificationOff.addEventListener('click', async function () {
            if (PushNotification.isNotificationPossible) {
                await PushNotification.push_unsubscribe();
                Settings.setNotificationActive(false);
                Settings.changeNotificationButtonState();
            }
        });

        if (!Utils.isBrowserCompatible()) {
            PushNotification.changeState('incompatible');
            Settings.changeNotificationButtonState();
            return;
        }

        try {
            await navigator.serviceWorker.register('/app/serviceWorker.js');
            await PushNotification.push_updateSubscription();
            Settings.changeNotificationButtonState();
        } catch (e) {
            PushNotification.changeState('incompatible');
            Settings.changeNotificationButtonState();
        }
    }

    , changeNotificationButtonState: () => {
        const notificationOn = null || document.getElementById('notification-on');
        const notificationOff = null || document.getElementById('notification-off');
        const notificationMessage = null || document.getElementById('notification-message');
        notificationMessage.innerHTML = PushNotification.notificationState;
        if (Settings.isNotificationActive()) {
            notificationOn.style.display = 'none';
            notificationOff.style.display = 'block';
        } else {
            notificationOn.style.display = 'block';
            notificationOff.style.display = 'none';
        }
    }

    , isNotificationActive: () => {
        return localStorage.getItem('isNotificationActive') === 'true';
    }

    , setNotificationActive: (state) => {
        localStorage.setItem('isNotificationActive', state);
    }
};

export default Settings;