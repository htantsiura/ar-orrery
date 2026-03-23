import { MyUIController } from "MyUIController";

@component
export class SunScript extends BaseScriptComponent {

    @input
    uiControllerScript: MyUIController

    @input
    sunPivot: SceneObject

    @input
    sunText: Text

    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            
        })

        this.uiControllerScript.addCallback((newValue) => {
            this.onDataReceived(newValue)
        })
   }

    private onDataReceived(index: number) {
        
        if(this.uiControllerScript.sunMap) {
            print("got " + index)
            let dayItem = this.uiControllerScript.dayMap[index]
            let sunItem = this.uiControllerScript.sunMap[index]
            let sunAngle = sunItem.heightAngle.toFixed(0) + "°" + ((sunItem.heightAngle % 1) * 60).toFixed(0) + "'"
            let dayDuration = sunItem.dayDuration.toFixed(0) + "h " + ((sunItem.heightAngle % 1) * 60).toFixed(0) + "m"
            this.sunText.text = dayItem.day.toString() + "." + dayItem.month.toString() + "." + dayItem.year.toString() 
                                + "\n" + "Sun height: " + sunAngle //sunItem.heightAngle.toFixed(1) + "°"
                                + "\n" + "Day duration: " + dayDuration
        }
    }
}
