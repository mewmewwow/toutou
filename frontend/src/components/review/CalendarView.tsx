import { useMemo } from 'react';
import { CalendarData } from '../../hooks/useReview';

interface CalendarViewProps {
  data: CalendarData[];
  onDateClick?: (date: string) => void;
}

/**
 * Calendar heatmap view showing review activity
 */
export function CalendarView({ data, onDateClick }: CalendarViewProps) {
  // Create a map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, CalendarData>();
    data.forEach((d) => map.set(d.date, d));
    return map;
  }, [data]);

  // Generate weeks for the past 12 weeks
  const weeks = useMemo(() => {
    const result: Array<Array<{ date: string; data: CalendarData | null }>> = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83); // ~12 weeks

    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: Array<{ date: string; data: CalendarData | null }> = [];

    for (let i = 0; i < 84; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      currentWeek.push({
        date: dateStr,
        data: dataMap.get(dateStr) || null,
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    return result;
  }, [dataMap]);

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; position: number }> = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const date = new Date(week[0].date);
      const month = date.getMonth();

      if (month !== lastMonth) {
        labels.push({
          month: date.toLocaleDateString('zh-CN', { month: 'short' }),
          position: weekIndex,
        });
        lastMonth = month;
      }
    });

    return labels;
  }, [weeks]);

  return (
    <div className="bg-white rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-4">复习日历</h3>

      {/* Month labels */}
      <div className="flex mb-2 text-xs text-gray-400 pl-7">
        {monthLabels.map((label, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: `${label.position * 16 + 28}px` }}
          >
            {label.month}
          </span>
        ))}
      </div>

      <div className="flex relative">
        {/* Day labels */}
        <div className="flex flex-col justify-around text-xs text-gray-400 pr-2">
          <span>一</span>
          <span>三</span>
          <span>五</span>
        </div>

        {/* Calendar grid */}
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <button
                  key={day.date}
                  className={`w-3 h-3 rounded-sm ${getIntensityClass(day.data?.intensity ?? -1)} hover:ring-2 hover:ring-primary-300`}
                  title={`${day.date}: ${day.data?.reviewCount ?? 0} 次复习`}
                  onClick={() => onDateClick?.(day.date)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-4 text-xs text-gray-400">
        <span>少</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-green-200" />
        <div className="w-3 h-3 rounded-sm bg-green-300" />
        <div className="w-3 h-3 rounded-sm bg-green-500" />
        <div className="w-3 h-3 rounded-sm bg-green-700" />
        <span>多</span>
      </div>
    </div>
  );
}

function getIntensityClass(intensity: number): string {
  switch (intensity) {
    case -1: return 'bg-gray-50'; // Future/no data
    case 0: return 'bg-gray-100';
    case 1: return 'bg-green-200';
    case 2: return 'bg-green-300';
    case 3: return 'bg-green-500';
    case 4: return 'bg-green-700';
    default: return 'bg-gray-100';
  }
}

export default CalendarView;
