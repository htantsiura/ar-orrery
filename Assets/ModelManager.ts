import { getGeoPosition } from "getGeoPosition";
import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";
import { MyUIController } from "MyUIController";
import { NavigationDataComponent } from "SpectaclesNavigationKit.lspkg/NavigationDataComponent/NavigationDataComponent";
import { quaternionToPitch } from "SpectaclesNavigationKit.lspkg/NavigationDataComponent/NavigationUtils";
import { BaseToggleGroup } from "SpectaclesUIKit.lspkg/Scripts/Components/Toggle/BaseToggleGroup";
import { ToggleGroup } from "SpectaclesUIKit.lspkg/Scripts/Components/Toggle/ToggleGroup";



type CalendarDay = {
    day: number;
    month: number;
    year: number;
    angle: number;
};

type sunData = {
    index: number;
    declinationAngle: number;
    declinationQuat: quat;
    heightAngle: number
    heightQuat: quat;
    dayDuration: number;
    dawnAngle: number;
};

const mainDayIndex = {
    winter: 354,
    spring: 79,
    summer: 171,
    fall: 263
}
    
@component

export class ModelManager extends BaseScriptComponent 
{
    @input
    debugDayNumber: number

    @input
    earthRotated: SceneObject

    @input
    earthPlanet: SceneObject

    @input
    dateText: Text

    @input
    sunHeightRot: SceneObject

    @input
    rootSun: SceneObject

    @input
    sunPivot: SceneObject

    @input
    sun360: SceneObject

    @input
    navigationComponent: NavigationDataComponent

    @input
    uiControllerScript: MyUIController

    

    private dayAngle: number
    private todayAngle: number
    private todayIndex: number
    private currentIndex: number
    private lastIndex: number
    public dayMap: CalendarDay[]
    public sunMap: sunData[]
    private today: string
    private numOfDaysInYear: number
    private dayDelta: number = 11
    private flag_getDataReceived: Boolean = false
    private userPosition: any
    private tweenTime: number = 1500
    private longitudeOffset: number
    private isAnimating: boolean = false;
    private currentDayTimeIndex: number = 0
    private lastDayTimeIndex: number = 0
    private sunPivotZeroTrf: any

    private subscribers: ((val: number) => void)[] = [];

    
    onAwake() { 

        this.isAnimating = true;
        this.findYearAndDayAngle()
        this.sunPivotZeroTrf = this.sunPivot.getTransform()
        // this.setStartDataForModel()
        
        this.userPosition = this.navigationComponent.getUserPosition();
        // callback, Called when the position has been updated
        this.userPosition.onUserPositionUpdated.add(() => {
            if(!this.flag_getDataReceived) {
                this.uiControllerScript.addCallback((newValue) => {
                    this.getOnlyIndex(newValue)
                })
                this.setEarthPositionByDate(this.currentIndex) 
                this.longitudeOffset = this.userPosition.getGeoPosition().longitude * Math.PI / 180 
                this.userPlaceDirectedToSun(this.currentIndex)
                this.setSunPosition(this.currentIndex)
                
                this.flag_getDataReceived = true;
                this.isAnimating = false;
            }
        });

        this.uiControllerScript.addCallback((newValue) => {
            this.onDataReceived(newValue)
        })

        this.uiControllerScript.addCallbackDayTime((newValue) => {
            this.onDayTimeIndexReceived(newValue)
        })
    }


    private setEarthPositionByDate(index): void {
        let destinationRotOnOrbit = quat.fromEulerAngles(0, this.dayAngle * (index + 11), 0)
        this.earthRotated.getTransform().setLocalRotation(destinationRotOnOrbit)
    }

    private findYearAndDayAngle(): void {

        let dayNum = 0;
        let currentYear = new Date().getFullYear();
        if(currentYear % 4 === 0) {
            //leap year
            this.numOfDaysInYear = 366
        } else {
            //usual year
            this.numOfDaysInYear = 365
        }
        dayNum = this.debugDayNumber % this.numOfDaysInYear
        this.dayAngle = Math.PI * 2 / this.numOfDaysInYear
    }

    private setSunPosition(index) {
        let sunItem = this.uiControllerScript.sunMap[this.currentIndex]
        this.tweenEcliptica(this.rootSun.getTransform(), sunItem.declinationQuat, this.tweenTime)
        this.tweenEcliptica(this.sunHeightRot.getTransform(), sunItem.heightQuat, this.tweenTime)
    }

    private userPlaceDirectedToSun(newIndex): void {
        let dayItem = this.uiControllerScript.dayMap[newIndex + 11].angle
        let angle = Math.PI + dayItem - this.longitudeOffset
        let earthAxleRot = quat.fromEulerAngles(0, angle, 0)
        this.earthPlanet.getTransform().setLocalRotation(earthAxleRot)
    }

    private theWholeModelRotation(newIndex, t) {

        if(this.isAnimating) {
            return;
        }
        this.isAnimating = true;

        this.tweenEarthOrbitRotation(this.currentIndex, this.tweenTime)
        this.setSunPosition(this.currentIndex)
        this.tweenSun360Rotation(this.tweenTime)

        this.isAnimating = false;
    }

    private tweenEarthOrbitRotation(index, t): void { 
        let transform = this.earthRotated.getTransform()
        let angle = (index + 11) * this.dayAngle
        let newQuat = quat.fromEulerAngles(0, angle, 0)

        LSTween.rotateToLocal(
            transform,
            newQuat,
            t
        )
        .easing(Easing.Quadratic.InOut)
        .start(); 
    }

    private tweenEcliptica(transform, quatern, t): void {
        LSTween.rotateToLocal(
            transform,
            quatern,
            t
        )
        .easing(Easing.Quadratic.InOut)
        .start(); 
    }

    private dayTime(dayTimeIndex): void {

        this.currentDayTimeIndex = dayTimeIndex
        let sunPivotTrf = this.sunPivot.getTransform()

        if (dayTimeIndex === 0) {
            let angle = this.uiControllerScript.sunMap[this.currentIndex].sunNoonAngle
            let newQuat = quat.fromEulerAngles(0, angle, 0)
            this.tweenSunDayRotation(sunPivotTrf, newQuat, this.tweenTime)
            this.lastDayTimeIndex = dayTimeIndex

        }
        if(dayTimeIndex === 1) {
            let angle = this.uiControllerScript.sunMap[this.currentIndex].sunDawnAngle
            
            let dayDuration = this.uiControllerScript.sunMap[this.currentIndex].dayDuration
            print("DAY ANGLE = " + angle)
            print("DAY DURATION = " + dayDuration)
            print("LAST DAY TIME INDEX BEFORE EXECUTION = " + this.lastDayTimeIndex)
            let newQuat = quat.fromEulerAngles(0, angle, 0)
            if(dayDuration >= 12.05 && this.lastDayTimeIndex === 2) {
                let zeroAngle = this.uiControllerScript.sunMap[this.currentIndex].sunNoonAngle
                let zeroQuat = quat.fromEulerAngles(0, zeroAngle, 0)
                newQuat = quat.fromEulerAngles(0, angle, 0)
                this.tweenSunDayRotation_Half1(sunPivotTrf, zeroQuat, newQuat, this.tweenTime)
                // this.tweenSunDayRotation_Half2(this.sunPivotZeroTrf, newQuat, this.tweenTime)
            } else {
                print("DAY DURATION < 12 OR IT WAS NOON BEFORE")
                this.tweenSunDayRotation(sunPivotTrf, newQuat, this.tweenTime)
            } 
           
            this.lastDayTimeIndex = dayTimeIndex
            print("LAST DAY TIME INDEX AFTER EXECUTION = " + this.lastDayTimeIndex)
        }
        if(dayTimeIndex === 2) {
            let angle = this.uiControllerScript.sunMap[this.currentIndex].sunSunsetAngle
            let dayDuration = this.uiControllerScript.sunMap[this.currentIndex].dayDuration
            print("DAY ANGLE = " + angle)
            print("DAY DURATION = " + dayDuration)
            print("LAST DAY TIME INDEX BEFORE EXECUTION = " + this.lastDayTimeIndex)
            let newQuat = quat.fromEulerAngles(0, angle, 0)
            if(dayDuration >= 12.05 && this.lastDayTimeIndex === 1) {
                print("dayDuration >= 12 && this.lastDayTimeIndex === 1")
                let zeroAngle = this.uiControllerScript.sunMap[this.currentIndex].sunNoonAngle
                let zeroQuat = quat.fromEulerAngles(0, zeroAngle, 0)
                newQuat = quat.fromEulerAngles(0, angle, 0)
                this.tweenSunDayRotation_Half1(sunPivotTrf, zeroQuat, newQuat, this.tweenTime)
                // this.tweenSunDayRotation_Half2(this.sunPivotZeroTrf, newQuat, this.tweenTime)
            } else {
                print("DAY DURATION < 12 OR IT WAS NOON BEFORE")
                this.tweenSunDayRotation(sunPivotTrf, newQuat, this.tweenTime)
            }

            
            
            this.lastDayTimeIndex = dayTimeIndex
            print("LAST DAY TIME INDEX AFTER EXECUTION = " + this.lastDayTimeIndex)
        }
        if(dayTimeIndex === 3) {
            let angle = this.uiControllerScript.sunMap[this.currentIndex].sunMidnightAngle
            let newQuat = quat.fromEulerAngles(0, angle, 0)
            this.tweenSunDayRotation(sunPivotTrf, newQuat, this.tweenTime)
            this.lastDayTimeIndex = dayTimeIndex
        }
    }

    private tweenSunDayRotation(transform, quaternion, t) {
            LSTween.rotateToLocal(
                transform,
                quaternion,
                t
            )
            .onComplete(() => {print("TWEEN EXECUTED")})
            .easing(Easing.Quadratic.InOut)
            .start(); 
    }

    private tweenSunDayRotation_Half1(transform, quaternion1, quaternion2, t) {
            LSTween.rotateToLocal(
                transform,
                quaternion1,
                t / 2
            )
            .onComplete(() => {
                this.tweenSunDayRotation_Half2(transform, quaternion2, t)
            })
            .easing(Easing.Quadratic.In)
            .start(); 
    }

    private tweenSunDayRotation_Half2(transform, quaternion2, t) {
            LSTween.rotateToLocal(
                transform,
                quaternion2,
                t / 2
            )
            .onComplete(() => {print("TWEEN EXECUTED")})
            .easing(Easing.Quadratic.Out)
            .start(); 
    }

    private tweenSun360Rotation(t):void {
        let currentAngle = this.uiControllerScript.sunMap[this.currentIndex].sunNoonAngle
        let currentQuat = quat.fromEulerAngles(0, currentAngle, 0)
        let transform = this.sunPivot.getTransform()
        this.tweenSunDayRotation(transform, currentQuat, this.tweenTime)
        this.lastDayTimeIndex = 0;

        let startRot = this.sun360.getTransform().getLocalRotation()
        let transform360 = this.sun360.getTransform()

        LSTween.rawTween(t)
            .onUpdate((objAxle) => {
                let angleAxle = objAxle.t * -Math.PI * 2;
                let rotationStepAxle = quat.fromEulerAngles(0, angleAxle, 0);
                let finalRotation = startRot.multiply(rotationStepAxle);
                transform360.setLocalRotation(finalRotation);
            })
            .onComplete(() => {
                this.sun360.getTransform().setLocalRotation(quat.fromEulerAngles(0, 0, 0))
            })
            .easing(Easing.Quadratic.InOut)
            .start(); 
    }
   
    private onDataReceived(index: number) {
        this.lastIndex = this.currentIndex
        this.currentIndex = index;
        this.theWholeModelRotation(this.currentIndex, this.tweenTime)
    }

    private getOnlyIndex(index: number) {
        this.currentIndex = index;
    }

    private onDayTimeIndexReceived(index: number) {
        this.dayTime(index) // 0
    }

}
