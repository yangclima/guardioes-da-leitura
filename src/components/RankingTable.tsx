import styles from "./site.module.css";

export interface RankingColumn<T> {
  label: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
}

type Props<T> = {
  rows: T[];
  columns: RankingColumn<T>[];
  getKey: (row: T) => string;
  getPosition: (row: T) => number;
  empty: string;
  caption: string;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export function RankingTable<T>({ rows, columns, getKey, getPosition, empty, caption }: Props<T>) {
  if (rows.length === 0) {
    return <p className={styles.empty}>{empty}</p>;
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            {columns.map((c) => (
              <th key={c.label} scope="col" style={{ textAlign: c.align ?? "left" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pos = getPosition(row);
            return (
              <tr key={getKey(row)} className={pos <= 3 ? styles.podium : undefined}>
                <td className={styles.pos}>{MEDALS[pos - 1] ?? `${pos}º`}</td>
                {columns.map((c) => (
                  <td key={c.label} style={{ textAlign: c.align ?? "left" }}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
