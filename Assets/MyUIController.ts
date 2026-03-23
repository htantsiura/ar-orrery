import { MonthButton } from "MonthButton";
import { NavigationDataComponent } from "SpectaclesNavigationKit.lspkg/NavigationDataComponent/NavigationDataComponent";

const mainDayIndex = {
    winter: 354,
    spring: 80,
    summer: 171,
    fall: 263
}

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
    noonAngle: number;
    dawnAngle: number;
    sunsetAngle: number;
    midnightAngle: number
    sunNoonAngle: number;
    sunDawnAngle: number;
    sunSunsetAngle: number;
    sunMidnightAngle: number
};

type MonthInfo = {
  index: number;
  day: number;
  month: string;
  short: string;
};




@component
export class MyUIController extends BaseScriptComponent {

    @input
    navigationComponent: NavigationDataComponent

    @input
    monthButtonScript: MonthButton

    @input
    yearUI: SceneObject

    @input
    dayUI: SceneObject

    public monthInfo: MonthInfo[] = [
        { index: 0,  day: 0,   month: "January",   short: "Jan" },
        { index: 1,  day: 31,  month: "February",  short: "Feb" },
        { index: 2,  day: 59,  month: "March",     short: "Mar" },
        { index: 3,  day: 90,  month: "April",     short: "Apr" },
        { index: 4,  day: 120, month: "May",       short: "May" },
        { index: 5,  day: 151, month: "June",      short: "Jun" },
        { index: 6,  day: 181, month: "July",      short: "Jul" },
        { index: 7,  day: 212, month: "August",    short: "Aug" },
        { index: 8,  day: 243, month: "September", short: "Sep" },
        { index: 9,  day: 273, month: "October",   short: "Oct" },
        { index: 10, day: 304, month: "November",  short: "Nov" },
        { index: 11, day: 334, month: "December",  short: "Dec" }
    ];


    private lastIndex: number
    private currentIndex: number
    private todayIndex: number
    private numOfDaysInYear
    public dayMap: CalendarDay[]
    public sunMap: sunData[]
    private subscribers: ((val: number) => void)[] = [];
    private subscribersDayTime: ((val: number) => void)[] = [];
    private userPosition
    private longitudeOffset: number = 0
    private flag_getDataReceived: Boolean = false
    private dayAngle: number
    private dayTimeIndex: number
    private myCallback: ((val: number) => void) | null = null

    onAwake() {

        this.numOfDaysInYear = this.yearDuration()
        this.dayMap = this.generateDayMap();
        this.findTodayArrayIndex()

        this.userPosition = this.navigationComponent.getUserPosition();
        this.userPosition.onUserPositionUpdated.add(() => {
            if(!this.flag_getDataReceived) {
                this.longitudeOffset = this.userPosition.getGeoPosition().longitude * Math.PI / 180 

                this.sunMap = this.generateSunDataMap()
                this.currentIndex = this.todayIndex
                this.sendIndex = this.currentIndex
                
                this.flag_getDataReceived = true;                
            }
        });

        // this.createEvent("OnStartEvent").bind(() => {
        //    this.sendIndex = this.currentIndex
        // });
        
    }

    private generateDayMap(): CalendarDay[] {
        const map: CalendarDay[] = [];
        const now = new Date();
        const year = now.getFullYear(); 
        this.dayAngle = 360 / this.numOfDaysInYear * (Math.PI / 180)

        for (let i = 0; i < this.numOfDaysInYear; i++) {
            const date = new Date(year, 0, 1 + i); 
            let monthName = global.localizationSystem.getMonth(date); 
            map.push({
                day: date.getDate(),
                month: date.getMonth() + 1,
                year: year,
                angle: this.dayAngle * i
            });
        }
        return map;
        
    }

    private generateSunDataMap(): sunData[] {
        const map: sunData[] = [];
        let geoData = this.userPosition.getGeoPosition();
        for(let i = 0; i < this.numOfDaysInYear; i++) {

            
            let noonAng =  - Math.PI + this.dayAngle * (i + 11) - this.longitudeOffset
            let midnightAng = this.dayAngle * (i + 11) - this.longitudeOffset
            let sunNoonAng = 0
            let sunMidnightAng = Math.PI

            const angleInDegrees = (360 / this.numOfDaysInYear) * (i + 285);
            const angleInRadians = angleInDegrees * (Math.PI / 180);
            const sunDeclination = 23.44 * Math.sin(angleInRadians);
            const sunDeclinationRad = sunDeclination * Math.PI / 180
            const sunDeclinationQuat = quat.fromEulerAngles(sunDeclinationRad, 0, 0)
            // print("declination " + sunDeclination)
            let sunHeightAngle = 90 - geoData.latitude + sunDeclination
            let sunHeight = sunHeightAngle * Math.PI / 180
            let sunHeightQuat = quat.fromEulerAngles(-sunHeight, 0, 0);

            let latitudeRad = geoData.latitude * Math.PI / 180

            // day duration
            const cosWs = -Math.tan(latitudeRad) * Math.tan(sunDeclinationRad);
            let dayLengthHours = 0,
                dawnAng = 0,
                sunsetAng = 0,
                sunDawnAng = 0,
                sunSunsetAng = 0
    
            // check is polar day or night
            if (cosWs >= 1) {
                dayLengthHours = 0;
            } 
            else if (cosWs <= -1) {
                dayLengthHours = 24;
            } 
            else {
                const ws = Math.acos(cosWs);
                dayLengthHours = (2 / 15) * (ws * 180 / Math.PI);
                dawnAng = noonAng - ws;
                sunsetAng = noonAng + ws;
                sunDawnAng = sunNoonAng + ws;
                sunSunsetAng = sunNoonAng - ws;
            }
        
            map.push({
                index: i,
                declinationAngle: angleInDegrees,
                declinationQuat: sunDeclinationQuat,
                heightAngle: sunHeightAngle,
                heightQuat: sunHeightQuat,
                dayDuration: dayLengthHours,
                noonAngle: noonAng,
                dawnAngle: dawnAng,
                sunsetAngle: sunsetAng,
                midnightAngle: midnightAng,
                sunNoonAngle: sunNoonAng,
                sunDawnAngle: sunDawnAng,
                sunSunsetAngle: sunSunsetAng,
                sunMidnightAngle: sunMidnightAng
            })
        }
        return map;
    }

    private buttonWinter(): void {
        if(this.numOfDaysInYear === 365) {
            this.currentIndex = mainDayIndex.winter
        } else {
            this.currentIndex = mainDayIndex.winter + 1
        }
        print(this.currentIndex)  
        this.sendIndex = this.currentIndex
    }

    private buttonSpring(): void {
        if(this.numOfDaysInYear === 365) {
            this.currentIndex = mainDayIndex.spring
        } else {
            this.currentIndex = mainDayIndex.spring + 1
        }
        print(this.currentIndex)  
        this.sendIndex = this.currentIndex
    }

    private buttonSummer(): void {
        if(this.numOfDaysInYear === 365) {
            this.currentIndex = mainDayIndex.summer
        } else {
            this.currentIndex = mainDayIndex.summer + 1
        }
        print(this.currentIndex)  
        this.sendIndex = this.currentIndex
    }

    private buttonFall(): void {
        if(this.numOfDaysInYear === 365) {
            this.currentIndex = mainDayIndex.fall
        } else {
            this.currentIndex = mainDayIndex.fall + 1
        }
        print(this.currentIndex)  
        this.sendIndex = this.currentIndex
    }

    private buttonNext(): void {
        this.currentIndex++
        this.sendIndex = this.currentIndex
        print(this.currentIndex)  
    }

    private buttonPrevious(): void {
        this.currentIndex--
        this.sendIndex = this.currentIndex
        print(this.currentIndex)  
    }

    private buttonToday(): void {
        this.currentIndex = this.todayIndex
        this.sendIndex = this.currentIndex
        print(this.currentIndex)  
    }

    private buttonDawn(): void {
        this.dayTimeIndex = 1;
        this.sendDayTimeIndex = this.dayTimeIndex
    }

    private buttonSunset(): void {
        this.dayTimeIndex = 2;
        this.sendDayTimeIndex = this.dayTimeIndex
    }

    private buttonNoon(): void {
        this.dayTimeIndex = 0;
        this.sendDayTimeIndex = this.dayTimeIndex
    }

    private buttonMidNight(): void {
        this.dayTimeIndex = 3;
        this.sendDayTimeIndex = this.dayTimeIndex
    }

    private yearDaySwitcher(): void {

    }

    private yearDuration(): number {
        let currentYear = new Date().getFullYear();
        if(currentYear % 4 === 0) {
            return 366
        } else {
            return 365
        }
    }

    private findTodayArrayIndex(): void {
        let todayString = new Date().getDate().toString() + "." + (new Date().getMonth() + 1).toString()
        for (let i = 0; i < this.numOfDaysInYear; i++) {
            let dayItem = this.dayMap[i]
            let dayFromArrayString = dayItem.day.toString() + "." + dayItem.month.toString()
            if(dayFromArrayString === todayString) {
                this.todayIndex = i
                this.currentIndex = i
                print(this.currentIndex)
                return
            }
        }
    }

    public addCallback(newFunction: (val: number) => void) {
        this.subscribers.push(newFunction);
    }

    public set sendIndex (newValue: number) {
        this.currentIndex = newValue;
        for (let i = 0; i < this.subscribers.length; i++) {
            this.subscribers[i](newValue);
        }
    }

    public addCallbackDayTime(newFunction: (val: number) => void) {
        this.subscribersDayTime.push(newFunction);
    }

    public setCallback(functionFromOtherScript: (val: number) => void) {
        this.myCallback = functionFromOtherScript;
    }

    public set sendDayTimeIndex(newValue: number) {
        this.dayTimeIndex = newValue;
        for (let i = 0; i < this.subscribers.length; i++) {
            this.subscribersDayTime[i](newValue);
        }
    }

    private buttonMonth0(): void {
        this.currentIndex = this.monthInfo[0].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth1(): void {
        this.currentIndex = this.monthInfo[1].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth2(): void {
        this.currentIndex = this.monthInfo[2].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth3(): void {
        this.currentIndex = this.monthInfo[3].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth4(): void {
        this.currentIndex = this.monthInfo[4].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth5(): void {
        this.currentIndex = this.monthInfo[5].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth6(): void {
        this.currentIndex = this.monthInfo[6].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth7(): void {
        this.currentIndex = this.monthInfo[7].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth8(): void {
        this.currentIndex = this.monthInfo[8].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth9(): void {
        this.currentIndex = this.monthInfo[9].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth10(): void {
        this.currentIndex = this.monthInfo[10].day
        this.sendIndex = this.currentIndex
    }

    private buttonMonth11(): void {
        this.currentIndex = this.monthInfo[11].day
        this.sendIndex = this.currentIndex
    }

}
