import type { CostRow } from '../data/mockData';

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CostTable({ rows }: { rows: CostRow[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1e2a5e] text-white">
            <th className="text-left px-4 py-3 font-semibold">Concepto</th>
            <th className="text-center px-4 py-3 font-semibold">Tipo</th>
            <th className="text-right px-4 py-3 font-semibold">c.u. /kg</th>
            <th className="text-right px-4 py-3 font-semibold">c.u. /min</th>
            <th className="text-right px-4 py-3 font-semibold">Importe</th>
            <th className="text-right px-4 py-3 font-semibold">% Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isSubtotal = row.tipo === 'Subtotal';
            const isTotal = row.tipo === 'Total';
            const isVar = row.tipo === 'Variable';

            const rowClass = isTotal
              ? 'bg-[#1e2a5e] text-white font-bold'
              : isSubtotal
              ? 'bg-gray-100 font-semibold text-gray-700'
              : i % 2 === 0
              ? 'bg-white hover:bg-gray-50'
              : 'bg-gray-50 hover:bg-gray-100';

            return (
              <tr key={i} className={`transition-colors ${rowClass}`}>
                <td className="px-4 py-2.5">{row.concepto}</td>
                <td className="px-4 py-2.5 text-center">
                  {!isSubtotal && !isTotal && (
                    <span className={`text-xs font-medium ${isVar ? 'text-blue-500' : 'text-orange-500'}`}>
                      {row.tipo}
                    </span>
                  )}
                  {isSubtotal && (
                    <span className={`text-xs font-medium ${row.concepto.includes('Variable') ? 'text-blue-500' : 'text-orange-500'}`}>
                      {row.concepto.includes('Variable') ? 'Variable' : 'Fijo'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">{fmtCurrency(row.cuKg)}</td>
                <td className="px-4 py-2.5 text-right">{fmtCurrency(row.cuMin)}</td>
                <td className="px-4 py-2.5 text-right">{fmtCurrency(row.importe)}</td>
                <td className="px-4 py-2.5 text-right">{row.pct.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
