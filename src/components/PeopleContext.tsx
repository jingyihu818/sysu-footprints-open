import type { HistoryEvent, Source } from "../types/content";

export default function PeopleContext({ event, events, sources, onEvent }: {
  event: HistoryEvent; events: HistoryEvent[]; sources: Source[]; onEvent?: (id: string) => void;
}) {
  if (!event.people?.length) return null;
  return <section className="people-context" aria-label="人物与这段历史">
    <p className="eyebrow">人物与这段历史</p>
    {event.people.map(person => {
      const related = events.filter(item => item.id !== event.id && item.people?.some(p => p.name === person.name));
      return <article key={person.name} data-person={person.name}>
        <h4>{person.name}</h4><p>{person.role}</p>
        <div className="person-sources">{person.sourceIds.map(id => {
          const source = sources.find(item => item.id === id);
          return source?.url ? <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : null;
        })}</div>
        {related.length > 0 && onEvent && <details><summary>循着人物继续读 · {related.length} 段经历</summary>
          <p className="person-path-note">以下档案分别记载其经历；先后呈现不表示事件之间必有因果关系。</p>
          <ol>{related.map(item => <li key={item.id}><button type="button" onClick={() => onEvent(item.id)}>{item.date.label} · {item.title}</button></li>)}</ol>
        </details>}
      </article>;
    })}
  </section>;
}

export function EvidenceSupplements({ event, sources }: { event: HistoryEvent; sources: Source[] }) {
  if (!event.supplements?.length) return null;
  return <section className="evidence-supplements" aria-label="相关史料细读">
    {event.supplements.map(note => <article key={note.title}>
      <h4>{note.title}</h4><p>{note.text}</p>
      {note.sourceIds.map(id => {
        const source = sources.find(item => item.id === id);
        return source?.url ? <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : null;
      })}
    </article>)}
  </section>;
}
