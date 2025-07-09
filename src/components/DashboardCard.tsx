import React from 'react';
interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}
export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color
}) => {
  const getColorClass = () => {
    switch (color) {
      case 'blue':
        return 'from-blue-500 to-blue-600 bg-blue-500/20 text-blue-300';
      case 'yellow':
        return 'from-yellow-500 to-yellow-600 bg-yellow-500/20 text-yellow-300';
      case 'red':
        return 'from-red-500 to-red-600 bg-red-500/20 text-red-300';
      case 'purple':
        return 'from-purple-500 to-purple-600 bg-purple-500/20 text-purple-300';
      case 'green':
        return 'from-green-500 to-green-600 bg-green-500/20 text-green-300';
      default:
        return 'from-blue-500 to-blue-600 bg-blue-500/20 text-blue-300';
    }
  };
  return <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-white/20">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-400">{title}</h3>
          <div className="text-3xl font-bold mt-2">{value}</div>
        </div>
        <div className={`p-3 rounded-xl ${getColorClass()}`}>{icon}</div>
      </div>
    </div>;
};