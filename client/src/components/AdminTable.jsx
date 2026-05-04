export default function AdminTable({ columns, rows, actions }) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2 font-medium">{c.label}</th>
            ))}
            {actions && <th className="px-4 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id} className="border-t hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {actions && <td className="px-4 py-2 space-x-2">{actions(row)}</td>}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-6 text-center text-slate-500">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
