import React, { useState, useEffect, useRef } from "react";
import { AiOutlineClockCircle } from "react-icons/ai";
import { FaChalkboardTeacher, FaEdit, FaTrash } from "react-icons/fa";
import { cn } from "../lib/utils";

interface Schedule {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  courseName: string;
  classroomName: string;
  color?: string;
  description?: string;
}

interface TimeTableProps {
  scheduleData: Schedule[];
  handleDelete?: (id: number) => void;
  handleEdit?: (id: number) => void;
  editUrl?: string;
  className?: string;
  customDays?: { id: number; name: string; fullName?: string }[];
  customTimeSlots?: string[];
  startTime?: string;
  endTime?: string;
  showOverlapWarning?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  compact?: boolean;
  showActions?: boolean;
  onEventClick?: (event: Schedule) => void;
  timezone?: string;
}

const defaultDays = [
  { id: 1, name: "Sat", fullName: "Saturday" },
  { id: 2, name: "Sun", fullName: "Sunday" },
  { id: 3, name: "Mon", fullName: "Monday" },
  { id: 4, name: "Tue", fullName: "Tuesday" },
  { id: 5, name: "Wed", fullName: "Wednesday" },
  { id: 6, name: "Thu", fullName: "Thursday" },
  { id: 7, name: "Fri", fullName: "Friday" },
];

const defaultTimeSlots = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];


const isTimeInRange = (time: string, startTime: string = "07:00", endTime: string = "16:00"): boolean => {
  const [hours, minutes] = time.split(":").map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startInMinutes = startHour * 60 + startMin;
  const endInMinutes = endHour * 60 + endMin;
  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
};

const timeToPosition = (time: string, startTime: string = "07:00", endTime: string = "16:00"): number => {
  const [hour, minute] = time.split(":").map(Number);
  const totalMinutes = hour * 60 + minute;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const startOfDay = startHour * 60 + startMin;
  const [endHour, endMin] = endTime.split(":").map(Number);
  const endOfDay = endHour * 60 + endMin;
  const totalDayMinutes = endOfDay - startOfDay;
  const minutesSinceStartOfDay = totalMinutes - startOfDay;
  return (minutesSinceStartOfDay / totalDayMinutes) * 100;
};

const calculateHeight = (startTime: string, endTime: string, dayStartTime: string = "07:00", dayEndTime: string = "16:00"): number => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;
  const durationInMinutes = endInMinutes - startInMinutes;
  const [dayStartHour, dayStartMin] = dayStartTime.split(":").map(Number);
  const [dayEndHour, dayEndMin] = dayEndTime.split(":").map(Number);
  const totalDayMinutes = (dayEndHour * 60 + dayEndMin) - (dayStartHour * 60 + dayStartMin);
  return (durationInMinutes / totalDayMinutes) * 100;
};

const TimeTable: React.FC<TimeTableProps> = ({
  scheduleData,
  handleDelete,
  handleEdit,
  editUrl,
  className = "",
  customDays,
  customTimeSlots,
  startTime = "07:00",
  endTime = "16:00",
  showOverlapWarning = true,
  theme = 'auto',
  compact = false,
  showActions = true,
  onEventClick,
  timezone,
}) => {
  const days = customDays || defaultDays;
  const timeSlots = customTimeSlots || defaultTimeSlots;
  
  const [dropdownOpenId, setDropdownOpenId] = useState<number | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpenId !== null) {
        const dropdownRef = dropdownRefs.current[dropdownOpenId];
        const buttonRef = buttonRefs.current[dropdownOpenId];

        if (
          dropdownRef &&
          buttonRef &&
          !dropdownRef.contains(event.target as Node) &&
          !buttonRef.contains(event.target as Node)
        ) {
          setDropdownOpenId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpenId]);

  const toggleDropdown = (id: number) => {
    setDropdownOpenId(dropdownOpenId === id ? null : id);
  };

  const findOverlappingEvents = (
    currentEvent: Schedule,
    dayEvents: Schedule[],
  ) => {
    return dayEvents.filter(
      event =>
        event.id !== currentEvent.id &&
        ((event.startTime >= currentEvent.startTime &&
          event.startTime < currentEvent.endTime) ||
          (event.endTime > currentEvent.startTime &&
            event.endTime <= currentEvent.endTime) ||
          (event.startTime <= currentEvent.startTime &&
            event.endTime >= currentEvent.endTime)),
    );
  };

  const isEventVisible = (event: Schedule): boolean => {
    return isTimeInRange(event.startTime, startTime, endTime) && 
           isTimeInRange(event.endTime, startTime, endTime);
  };

  const getEventColor = (event: Schedule, hasOverlap: boolean): string => {
    if (event.color) return event.color;
    return hasOverlap ? 'bg-red-100 border-red-400 text-red-800' : 'bg-blue-100 border-blue-400 text-blue-800';
  };

  const themeClasses = {
    container: theme === 'dark' ? 'bg-gray-900 text-white' : 
               theme === 'light' ? 'bg-white text-gray-900' : 
               'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
    dayHeader: theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' :
               theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' :
               'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white',
    gridLine: theme === 'dark' ? 'border-gray-700' :
              theme === 'light' ? 'border-gray-200' :
              'border-gray-200 dark:border-gray-700',
    event: theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' :
           theme === 'light' ? 'bg-white border-gray-300 text-gray-900' :
           'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
  };

  return (
    <div className={cn("stockfish-components", className)}>
      <div className={cn("w-full overflow-x-auto", compact ? "mb-4" : "mb-20")}>
        <div className="grid w-full overflow-x-auto">
          <div className={cn("mx-3 rounded-xl p-6 min-w-[1200px] overflow-hidden shadow-lg border", themeClasses.container, theme === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
            <div className="flex justify-between mb-4">
              <div className={cn(compact ? 'w-16' : 'w-20', "flex items-center justify-center")}>
                <span className="text-sm font-medium opacity-60">Time</span>
              </div>
              {days.map((day) => (
                <div
                  key={day.id}
                  className={cn(compact ? 'w-16 px-2 py-1' : 'w-20 px-4 py-2', "rounded-lg text-center shadow-sm transition-all duration-200 hover:shadow-md", themeClasses.dayHeader)}
                  title={day.fullName}
                >
                  <div className={cn("font-semibold", compact ? 'text-xs' : 'text-sm')}>
                    {day.name}
                  </div>
                </div>
              ))}
            </div>

            <div className={cn("relative mt-4 flex", compact ? 'h-[800px]' : 'h-[1000px]')}>
              <div className="flex flex-col">
                {timeSlots.map((time, idx) => (
                  <div
                    key={idx}
                    className={cn(compact ? 'h-20' : 'h-[100px]', "pr-4 text-right font-medium text-sm opacity-75 flex items-start justify-end")}
                    style={{ paddingTop: compact ? '8px' : '12px' }}
                  >
                    {time}
                  </div>
                ))}
              </div>

              <div className="relative flex flex-1">
                <div className="absolute inset-0">
                  {timeSlots.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn("absolute w-full border-t opacity-30", themeClasses.gridLine)}
                      style={{ top: `${(idx * 100) / (timeSlots.length - 1)}%` }}
                    />
                  ))}
                </div>

                {days.map((day) => {
                  const dayEvents = scheduleData.filter((event) =>
                    event.day.toUpperCase().startsWith(day.name.toUpperCase()),
                  );

                  return (
                    <div
                      key={day.id}
                      className={cn("relative flex-1 border-l transition-all duration-200 hover:bg-opacity-50", themeClasses.gridLine)}
                    >
                      {dayEvents.filter(isEventVisible).map((event) => {
                        const top = timeToPosition(event.startTime, startTime, endTime);
                        const height = calculateHeight(event.startTime, event.endTime, startTime, endTime);
                        const [startHour, startMinute] = event.startTime.split(":").slice(0, 2).map(Number);
                        const [endHour, endMinute] = event.endTime.split(":").slice(0, 2).map(Number);
                        const start = startHour * 60 + startMinute;
                        const end = endHour * 60 + endMinute;
                        const duration = end - start;

                        let fontSize = compact ? "text-xs" : "text-sm";
                        if (duration >= 60) fontSize = compact ? "text-sm" : "text-lg";
                        else if (duration >= 40) fontSize = compact ? "text-xs" : "text-base";

                        const overlappingEvents = findOverlappingEvents(
                          event,
                          dayEvents.filter(isEventVisible),
                        );
                        const hasOverlap = overlappingEvents.length > 0;

                        return (
                          <React.Fragment key={event.id}>
                            <div
                              className={cn(
                                "group absolute left-1 right-1 overflow-hidden rounded-lg border-l-4 shadow-sm transition-all duration-200 cursor-pointer",
                                event.color || getEventColor(event, hasOverlap),
                                compact ? 'p-2' : duration >= 40 ? 'p-3' : 'p-2',
                                hasOverlap ? 'hover:z-40 hover:scale-105' : 'hover:shadow-md',
                                hoveredEvent === event.id ? 'z-50 scale-105 shadow-lg' : ''
                              )}
                              style={{
                                top: `${top}%`,
                                height: `${Math.max(height, compact ? 8 : 10)}%`,
                                opacity:
                                  hoveredEvent === null || hoveredEvent === event.id ? 1 : 0.7,
                              }}
                              onMouseEnter={() => setHoveredEvent(event.id)}
                              onMouseLeave={() => setHoveredEvent(null)}
                              onClick={() => onEventClick?.(event)}
                              title={event.description || `${event.courseName} - ${event.classroomName}`}
                            >
                              {showActions && (
                                <div className="absolute -right-1 -top-1 flex items-center gap-1">
                                  <button
                                    ref={(el) => {
                                      buttonRefs.current[event.id] = el;
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDropdown(event.id);
                                    }}
                                    className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  >
                                    <svg
                                      className="h-3 w-3 text-gray-600 dark:text-gray-300"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="1" />
                                      <circle cx="12" cy="5" r="1" />
                                      <circle cx="12" cy="19" r="1" />
                                    </svg>
                                  </button>
                                </div>
                              )}

                              <div className="mb-1 flex flex-col items-start leading-tight space-y-1">
                                <span className={cn("font-semibold truncate w-full block", fontSize)}>
                                  {event.courseName}
                                </span>

                                <span className={cn(
                                  "flex items-center gap-1 opacity-75",
                                  compact ? 'text-xs' : duration >= 60 ? 'text-sm' : duration >= 40 ? 'text-xs' : 'text-xs'
                                )}>
                                  <AiOutlineClockCircle className="flex-shrink-0" />
                                  <span className="truncate">
                                    {event.startTime.slice(0, 5)} - {event.endTime.slice(0, 5)}
                                  </span>
                                </span>

                                {!compact && (
                                  <span className={cn(
                                    "flex items-center gap-1 opacity-75",
                                    duration >= 60 ? 'text-sm' : duration >= 40 ? 'text-xs' : 'text-xs'
                                  )}>
                                    <FaChalkboardTeacher className="flex-shrink-0" />
                                    <span className="truncate">{event.classroomName}</span>
                                  </span>
                                )}
                              </div>

                              {hasOverlap && showOverlapWarning && hoveredEvent === event.id && (
                                <div className="absolute left-full top-0 ml-2 w-48 rounded-lg bg-white dark:bg-gray-800 p-3 shadow-xl border dark:border-gray-600 z-50">
                                  <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                                    ⚠️ Overlapping Schedules:
                                  </div>
                                  {overlappingEvents.map((overlap) => (
                                    <div key={overlap.id} className="mt-2 text-xs border-l-2 border-red-300 pl-2">
                                      <div className="font-medium">{overlap.courseName}</div>
                                      <div className="opacity-75">{`${overlap.startTime.slice(0, 5)} - ${overlap.endTime.slice(0, 5)}`}</div>
                                      <div className="opacity-75">{overlap.classroomName}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {dropdownOpenId === event.id && showActions && (
                              <div
                                ref={(el) => {
                                  dropdownRefs.current[event.id] = el;
                                }}
                                className="absolute right-2 z-50 w-32 rounded-lg bg-white dark:bg-gray-800 shadow-xl border dark:border-gray-600 overflow-hidden"
                                style={{ top: `${Math.max(top - 5, 0)}%` }}
                              >
                                {handleEdit && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (editUrl) {
                                        window.open(`${editUrl}/${event.id}`, '_blank');
                                      } else {
                                        handleEdit(event.id);
                                      }
                                      setDropdownOpenId(null);
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <FaEdit className="mr-2 h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    Edit
                                  </button>
                                )}
                                {handleDelete && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(event.id);
                                      setDropdownOpenId(null);
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <FaTrash className="mr-2 h-3 w-3" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {timezone && (
              <div className="mt-4 text-xs opacity-60 text-center">
                Timezone: {timezone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTable;