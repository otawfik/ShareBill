
import React from 'react';
import { ReceiptAnalysis, Friend } from '../types';

interface Props {
  analysis: ReceiptAnalysis;
  friends: Friend[];
  assignments: Record<string, string[]>;
}

const Summary: React.FC<Props> = ({ analysis, friends, assignments }) => {
  const getFriendTotals = () => {
    const friendTotals: Record<string, number> = {};
    friends.forEach(f => { friendTotals[f.id] = 0; });

    analysis.items.forEach(item => {
      const assigned = assignments[item.id] || [];
      if (assigned.length > 0) {
        const share = item.price / assigned.length;
        assigned.forEach(friendId => {
          friendTotals[friendId] += share;
        });
      }
    });

    // Calculate proportional tax and tip
    const totalSubtotal = Object.values(friendTotals).reduce((a, b) => a + b, 0);
    const taxAndTip = (analysis.tax || 0) + (analysis.tip || 0);

    const finals = friends.map(f => {
      const subtotal = friendTotals[f.id];
      const ratio = totalSubtotal > 0 ? subtotal / totalSubtotal : 0;
      const extra = ratio * taxAndTip;
      return {
        ...f,
        subtotal,
        extra,
        total: subtotal + extra
      };
    });

    return finals;
  };

  const totals = getFriendTotals();
  const unassignedTotal = analysis.items.reduce((sum, item) => {
    return sum + ((assignments[item.id]?.length || 0) === 0 ? item.price : 0);
  }, 0);

  return (
    <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-2xl space-y-8">
      <div className="flex justify-between items-end border-b border-indigo-800 pb-6">
        <div>
          <h3 className="text-indigo-300 text-xs font-bold tracking-widest uppercase mb-1">Total Bill</h3>
          <p className="text-4xl font-black">{analysis.currency || '$'}{analysis.total.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-indigo-300 text-[10px] font-medium">Subtotal: {analysis.currency}{analysis.subtotal.toFixed(2)}</p>
          <p className="text-indigo-300 text-[10px] font-medium">Tax + Tip: {analysis.currency}{(analysis.tax + analysis.tip).toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-indigo-300 text-xs font-bold tracking-widest uppercase">The Breakdown</h4>
        {totals.map(t => (
          <div key={t.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full border-2 border-indigo-500 shadow-xl" />
              <div>
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-[10px] text-indigo-400">Share: {analysis.currency}{t.subtotal.toFixed(2)} + Fees: {analysis.currency}{t.extra.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xl font-black text-indigo-100">{analysis.currency}{t.total.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {unassignedTotal > 0 && (
        <div className="bg-orange-500/20 border border-orange-500/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-xs font-bold text-orange-200">Wait! {analysis.currency}{unassignedTotal.toFixed(2)} of items are still unassigned.</p>
          </div>
        </div>
      )}

      <button 
        onClick={() => window.print()}
        className="w-full bg-white text-indigo-900 font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-50 active:scale-[0.98] transition-all"
      >
        Share with Friends
      </button>
    </div>
  );
};

export default Summary;
