import React from 'react';

export const PropertyCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse flex flex-col h-full">
      <div className="aspect-4/3 bg-gray-200" />
      <div className="p-5 space-y-3 flex-1">
        <div className="h-6 bg-gray-200 rounded-md w-1/3" />
        <div className="h-5 bg-gray-200 rounded-md w-3/4" />
        <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        <div className="pt-3 border-t border-gray-100 flex justify-between">
          <div className="h-4 bg-gray-200 rounded-md w-1/4" />
          <div className="h-4 bg-gray-200 rounded-md w-1/4" />
        </div>
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      <td className="p-4"><div className="h-4 bg-gray-200 rounded-md w-24" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded-md w-32" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded-md w-20" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded-md w-16" /></td>
      <td className="p-4"><div className="h-4 bg-gray-200 rounded-md w-20" /></td>
    </tr>
  );
};
