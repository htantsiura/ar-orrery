import { NavigationDataComponent } from "SpectaclesNavigationKit.lspkg/NavigationDataComponent/NavigationDataComponent";

NavigationDataComponent

@component

export class getGeoPosition extends BaseScriptComponent 
{

    @input
    navigationComponent: NavigationDataComponent

    @input
    direction: SceneObject

    @input
    dataText: Text

    @input
    camera: SceneObject

    @input
    compass2: SceneObject



    //private geoData: any
    private flag_getDataReceived: Boolean = false

    public latitude: number
    public longitude: number
    public today: string
    public angleToNorth: vec3
    private newAngleToNorth: number

    private monthMap: { [key: number]: string } = {
        0: "January",
        1: "February",
        2: "March",
        3: "April",
        4: "May",
        5: "June",
        6: "July",
        7: "August",
        8: "September",
        9: "October",
        10: "November",
        11: "December"
    };

    onAwake() {
        let prevRot = 0;
        let userPosition = this.navigationComponent.getUserPosition();
        this.today = this.monthMap[new Date().getMonth()] + " " + new Date().getDate().toString()

        // callback, Called when the position has been updated
        userPosition.onUserPositionUpdated.add(() => {
            this.updateLocationText(userPosition);
            if(!this.flag_getDataReceived) {
                this.setSunDirection(userPosition);
                this.flag_getDataReceived = true;
            }
            
        });
        // try to instantly update the text, if the data is
        this.updateLocationText(userPosition);

        this.createEvent("UpdateEvent").bind(() => {
            this.compassArrow()
        })
    }

    updateLocationText(userPosition) {
        let geoData = userPosition.getGeoPosition();
        let northDirectionRad = userPosition.getBearing()
        let northDirectionDegrees = northDirectionRad * 180 / Math.PI
        this.newAngleToNorth = northDirectionDegrees

        if (geoData) {
            this.latitude = geoData.latitude.toFixed(5)
            this.longitude = geoData.longitude.toFixed(5) 
            this.dataText.text =    //"Lat: " + this.latitude + 
                                    //"\nLong: " + this.longitude + 
                                    "\nAngle to North: " + northDirectionDegrees.toFixed(1);
        } else {
            this.dataText.text = "Searching for GPS...";
        }
    }

    private setSunDirection(userPosition): void {
        let geoData = userPosition.getGeoPosition();
        let northDirectionRad = userPosition.getBearing()
        this.angleToNorth = new vec3(0, northDirectionRad, 0)
        let sunRotationQuat = quat.fromEulerAngles(this.angleToNorth.x, this.angleToNorth.y, this.angleToNorth.z)
        this.direction.getTransform().setWorldRotation(sunRotationQuat)
    }

    private compassArrow(): void {

        var compass2Pos = this.compass2.getTransform().getWorldPosition();
        var cameraPos = this.camera.getTransform().getWorldPosition();
        // 2. Вычисляем направление, НО исключаем разницу по высоте (ось Y)
        // Мы говорим: "Представь, что камера находится на том же уровне, что и паук"
        var direction = cameraPos.sub(compass2Pos);
        direction.y = 0; // Это ключевая строка! Она фиксирует объект в плоскости XZ
        // 3. Нормализуем вектор (делаем его длину равной 1)
        direction.normalize();
        // 4. Создаем поворот (зависит от вашего движка, пример для LookRotation)
        // Используем стандартный Up (0, 1, 0)
        var targetRotation = quat.lookAt(direction, new vec3(0, -1, 0));
        // 5. Применяем к пауку
        this.compass2.getTransform().setWorldRotation(targetRotation);
    }
}
