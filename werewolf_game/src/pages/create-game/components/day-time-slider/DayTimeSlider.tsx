import './DayTimeSlider.css'
import * as React from "react";

interface DayTimeSliderProps {
    dayTimeRange: number[];
    dayTime: number;
    setDayTime: (value: number) => void;
}

function DayTimeSlider({ dayTimeRange, dayTime, setDayTime }: DayTimeSliderProps) {
    const handleDayTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDayTime(parseInt(e.target.value));
    };

    return (
        <div className="day-time-slider">
            <label htmlFor="dayTalkTime">Day duration: <div className="slider-data-txt">{dayTime}sec</div></label>
            <input
                type="range"
                id="dayTalkTime"
                min={dayTimeRange[0]}
                max={dayTimeRange[1]}
                value={dayTime}
                onChange={handleDayTimeChange}
            />
        </div>
    )
}

export default DayTimeSlider;