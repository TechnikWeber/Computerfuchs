import { Emoji } from '../../os/Emoji';

/** Noch leer – mit der Dateien-App landen hier bald gelöschte Dinge. */
export default function TrashApp() {
  return (
    <div className="trash">
      <Emoji name="wastebasket" size={120} />
      <h2>Der Papierkorb ist leer.</h2>
      <p>
        Wenn du später Bilder oder Briefe löschst, landen sie erst einmal hier. Solange sie im Papierkorb liegen, kannst du sie
        zurückholen.
      </p>
    </div>
  );
}
