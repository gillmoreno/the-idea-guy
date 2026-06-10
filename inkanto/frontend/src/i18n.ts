export type Locale = "it" | "es" | "en";

const dict: Record<string, Record<Locale, string>> = {
  app_tag: { it: "il tuo laboratorio di storie", es: "tu taller de historias", en: "your story workshop" },
  login: { it: "Entra", es: "Entrar", en: "Log in" },
  register: { it: "Crea il tuo posto", es: "Crea tu lugar", en: "Create your spot" },
  username: { it: "Nome utente", es: "Nombre de usuario", en: "Username" },
  password: { it: "Parola segreta", es: "Palabra secreta", en: "Password" },
  display_name: { it: "Come ti chiami?", es: "¿Cómo te llamas?", en: "What's your name?" },
  family_code: { it: "Codice di famiglia", es: "Código de familia", en: "Family code" },
  no_account: { it: "Prima volta qui?", es: "¿Primera vez aquí?", en: "First time here?" },
  have_account: { it: "Hai già il tuo posto?", es: "¿Ya tienes tu lugar?", en: "Already have a spot?" },
  my_stories: { it: "Le mie storie", es: "Mis historias", en: "My stories" },
  new_story: { it: "Nuova storia", es: "Nueva historia", en: "New story" },
  new_story_title: { it: "Come si chiama la tua storia?", es: "¿Cómo se llama tu historia?", en: "What is your story called?" },
  create: { it: "Crea", es: "Crear", en: "Create" },
  cancel: { it: "Annulla", es: "Cancelar", en: "Cancel" },
  save: { it: "Salva", es: "Guardar", en: "Save" },
  saved: { it: "Salvato ✓", es: "Guardado ✓", en: "Saved ✓" },
  delete: { it: "Elimina", es: "Eliminar", en: "Delete" },
  logout: { it: "Esci", es: "Salir", en: "Log out" },
  empty_stories: { it: "Nessuna storia ancora. La prima pagina ti aspetta!", es: "Ninguna historia todavía. ¡La primera página te espera!", en: "No stories yet. The first page is waiting!" },
  tab_idea: { it: "Idea", es: "Idea", en: "Idea" },
  tab_outline: { it: "Scaletta", es: "Esquema", en: "Outline" },
  tab_chapters: { it: "Capitoli", es: "Capítulos", en: "Chapters" },
  tab_world: { it: "Mondo", es: "Mundo", en: "World" },
  idea_label: { it: "L'idea della tua storia", es: "La idea de tu historia", en: "Your story idea" },
  idea_hint: { it: "Chi vuole cosa? E cosa glielo impedisce?", es: "¿Quién quiere qué? ¿Y qué se lo impide?", en: "Who wants what? And what stands in the way?" },
  voice_label: { it: "La voce della storia", es: "La voz de la historia", en: "The story's voice" },
  voice_hint: { it: "Chi racconta? Buffa o da brividi? Come quale autore? (la carta della voce)", es: "¿Quién narra? ¿Divertida o de escalofríos? ¿Como qué autor? (la carta de la voz)", en: "Who tells it? Funny or chilling? Like which author? (the voice card)" },
  find_voice: { it: "Trova la voce con il coach", es: "Encuentra la voz con el coach", en: "Find the voice with the coach" },
  add_beat: { it: "Aggiungi gradino", es: "Añadir peldaño", en: "Add beat" },
  beat_title_ph: { it: "Cosa succede?", es: "¿Qué pasa?", en: "What happens?" },
  beat_summary_ph: { it: "Racconta in una frase...", es: "Cuéntalo en una frase...", en: "Tell it in one sentence..." },
  add_chapter: { it: "Nuovo capitolo", es: "Nuevo capítulo", en: "New chapter" },
  chapter_title_ph: { it: "Titolo del capitolo", es: "Título del capítulo", en: "Chapter title" },
  write_here: { it: "Scrivi qui la tua storia...", es: "Escribe aquí tu historia...", en: "Write your story here..." },
  status_bozza: { it: "Bozza", es: "Borrador", en: "Draft" },
  status_finito: { it: "Finito!", es: "¡Terminado!", en: "Done!" },
  characters: { it: "Personaggi", es: "Personajes", en: "Characters" },
  places: { it: "Luoghi", es: "Lugares", en: "Places" },
  objects: { it: "Oggetti", es: "Objetos", en: "Objects" },
  add: { it: "Aggiungi", es: "Añadir", en: "Add" },
  name_ph: { it: "Nome", es: "Nombre", en: "Name" },
  summary_ph: { it: "Chi è? Com'è?", es: "¿Quién es? ¿Cómo es?", en: "Who or what is it?" },
  notes_ph: { it: "Segreti, scoperte, dettagli...", es: "Secretos, descubrimientos, detalles...", en: "Secrets, discoveries, details..." },
  coach: { it: "Coach", es: "Coach", en: "Coach" },
  coach_input_ph: { it: "Scrivi al tuo coach...", es: "Escríbele a tu coach...", en: "Write to your coach..." },
  coach_thinking: { it: "Il coach sta pensando…", es: "El coach está pensando…", en: "The coach is thinking…" },
  coach_error: { it: "Ops, il coach ha avuto un problema. Riprova!", es: "Ups, el coach tuvo un problema. ¡Inténtalo de nuevo!", en: "Oops, the coach hit a snag. Try again!" },
  back: { it: "Indietro", es: "Atrás", en: "Back" },
  tab_book: { it: "Libro", es: "Libro", en: "Book" },
  book_by: { it: "una storia di", es: "una historia de", en: "a story by" },
  draft_badge: { it: "bozza", es: "borrador", en: "draft" },
  book_empty: { it: "Scrivi il primo capitolo e il tuo libro apparirà qui!", es: "¡Escribe el primer capítulo y tu libro aparecerá aquí!", en: "Write the first chapter and your book will appear here!" },
  print_pdf: { it: "Stampa / PDF", es: "Imprimir / PDF", en: "Print / PDF" },
  share: { it: "Condividi", es: "Compartir", en: "Share" },
  share_hint: { it: "Chi ha il link può leggere il libro (solo lettura).", es: "Quien tenga el enlace puede leer el libro (solo lectura).", en: "Anyone with the link can read the book (read-only)." },
  share_copied: { it: "Link copiato! 📋", es: "¡Enlace copiado! 📋", en: "Link copied! 📋" },
  share_stop: { it: "Smetti di condividere", es: "Dejar de compartir", en: "Stop sharing" },
  book_world: { it: "Il mondo della storia", es: "El mundo de la historia", en: "The world of the story" },
  words: { it: "parole", es: "palabras", en: "words" },
  chapter_one: { it: "capitolo", es: "capítulo", en: "chapter" },
  chapters_many: { it: "capitoli", es: "capítulos", en: "chapters" },
  made_with: { it: "Scritto con Inkanto ✨", es: "Escrito con Inkanto ✨", en: "Written with Inkanto ✨" },
  book_not_found: { it: "Questo libro non è più condiviso.", es: "Este libro ya no está compartido.", en: "This book is no longer shared." },
  confirm_delete: { it: "Sicura di volerlo eliminare?", es: "¿Segura de que quieres eliminarlo?", en: "Sure you want to delete it?" },
};

let current: Locale = (localStorage.getItem("inkanto_locale") as Locale) || "it";

export function setLocale(locale: string) {
  if (locale === "it" || locale === "es" || locale === "en") {
    current = locale;
    localStorage.setItem("inkanto_locale", locale);
  }
}

export function getLocale(): Locale {
  return current;
}

export function t(key: string): string {
  return dict[key]?.[current] ?? key;
}
