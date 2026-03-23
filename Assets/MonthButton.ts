import { MyUIController } from "MyUIController"

MyUIController

@component

export class MonthButton extends BaseScriptComponent {

    @input
    monthNumber: number

    @input
    uiControllerScript: MyUIController

    private _monthIndex: number

    onAwake() {
        this.setupMonthIndex(this.monthNumber)
        

        this.createEvent("OnStartEvent").bind(() => {
            this.getSceneObject().getChild(0).getComponent("Text").text = this.uiControllerScript.monthInfo[this.monthNumber].short
        })

    }

    private setupMonthIndex(index): void {
        this._monthIndex = this.monthNumber
    }

    public get monthIndex(): number {
        return this._monthIndex
    }
}
