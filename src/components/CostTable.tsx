import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CostRow } from '../data/mockData';

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CostTable({ rows }: { rows: CostRow[] }) {
  const totalRow = rows.find(r => r.tipo === 'Total');
  const bodyRows = rows.filter(r => r.tipo !== 'Total');

  return (
    <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#1e2a5e] hover:bg-[#1e2a5e]">
            <TableHead className="text-white font-semibold">Concepto</TableHead>
            <TableHead className="text-white font-semibold text-center">Tipo</TableHead>
            <TableHead className="text-white font-semibold text-right">c.u. /kg</TableHead>
            <TableHead className="text-white font-semibold text-right">c.u. /min</TableHead>
            <TableHead className="text-white font-semibold text-right">Importe</TableHead>
            <TableHead className="text-white font-semibold text-right">% Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bodyRows.map((row, i) => {
            const isSubtotal = row.tipo === 'Subtotal';
            const isVar = row.tipo === 'Variable';

            return (
              <TableRow
                key={i}
                className={isSubtotal ? 'bg-muted font-semibold' : ''}
              >
                <TableCell>{row.concepto}</TableCell>
                <TableCell className="text-center">
                  {!isSubtotal && (
                    <Badge
                      variant="secondary"
                      className={isVar
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-100'
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-100'}
                    >
                      {row.tipo}
                    </Badge>
                  )}
                  {isSubtotal && (
                    <Badge
                      variant="secondary"
                      className={row.concepto.includes('Variable')
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-100'
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-100'}
                    >
                      {row.concepto.includes('Variable') ? 'Variable' : 'Fijo'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{fmtCurrency(row.cuKg)}</TableCell>
                <TableCell className="text-right">{fmtCurrency(row.cuMin)}</TableCell>
                <TableCell className="text-right">{fmtCurrency(row.importe)}</TableCell>
                <TableCell className="text-right">{row.pct.toFixed(1)}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        {totalRow && (
          <TableFooter>
            <TableRow className="bg-[#1e2a5e] text-white hover:bg-[#1e2a5e] font-bold">
              <TableCell>{totalRow.concepto}</TableCell>
              <TableCell />
              <TableCell className="text-right">{fmtCurrency(totalRow.cuKg)}</TableCell>
              <TableCell className="text-right">{fmtCurrency(totalRow.cuMin)}</TableCell>
              <TableCell className="text-right">{fmtCurrency(totalRow.importe)}</TableCell>
              <TableCell className="text-right">{totalRow.pct.toFixed(1)}%</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
