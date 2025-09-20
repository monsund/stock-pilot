import {
  Chart as ChartJS,
  TimeScale,        // <-- needed for `type: 'time'`
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // <-- enables date adapters for the time scale

// Financial chart controller + element
import {
  CandlestickController,
  CandlestickElement,
} from 'chartjs-chart-financial';

// Register everything exactly once
ChartJS.register(
  TimeScale,
  LinearScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

export { ChartJS };
