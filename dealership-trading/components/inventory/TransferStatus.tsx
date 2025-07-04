interface TransferStatusProps {
  status: 'available' | 'claimed' | 'in-transit' | 'delivered';
  className?: string;
}

export default function TransferStatus({ status, className = '' }: TransferStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-[#10b981]/20 text-[#10b981]';
      case 'claimed':
        return 'bg-[#f59e0b]/20 text-[#f59e0b]';
      case 'in-transit':
        return 'bg-[#3b82f6]/20 text-[#3b82f6]';
      case 'delivered':
        return 'bg-[#8b5cf6]/20 text-[#8b5cf6]';
      default:
        return 'bg-[#1f1f1f] text-gray-300';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'claimed':
        return 'Claimed';
      case 'in-transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()} ${className}`}
    >
      {getStatusLabel()}
    </span>
  );
}