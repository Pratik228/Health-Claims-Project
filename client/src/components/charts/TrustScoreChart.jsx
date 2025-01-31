/* eslint-disable react/prop-types */
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function TrustScoreChart({ data, options }) {
  return (
    <div className="w-full h-[400px] relative">
      <Line
        data={data}
        options={{
          ...options,
          maintainAspectRatio: false,
        }}
      />
    </div>
  );
}

export default TrustScoreChart;
