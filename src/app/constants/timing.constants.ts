/**
 * AI Timing Constants
 * 
 * Zentrale Definition aller setTimeout-Verzögerungen für KI-Aktionen.
 * Diese Werte steuern das Tempo des KI-Spiels und können für
 * verschiedene Schwierigkeitsstufen angepasst werden.
 */
export const AI_TIMING = {
  /** Verzögerung bevor KI "Mau" oder "Mau-Mau" sagt (300ms) */
  ANNOUNCEMENT_DELAY: 300,
  
  /** Verzögerung bevor KI Damenrunde ankündigt/beendet (400ms) */
  QUEEN_ROUND_DELAY: 400,
  
  /** Verzögerung für Strafkarten-Aufnahme (500ms) */
  PENALTY_PICKUP_DELAY: 500,
  
  /** Verzögerung bevor KI eine Karte spielt oder zieht (600ms) */
  ACTION_DELAY: 600,
  
  /** Verzögerung bevor nächster Zug / KI-Spielzug startet (1000ms) */
  TURN_DELAY: 1000,
  
  /** Verzögerung zwischen dem Ziehen mehrerer Karten (300ms) */
  DRAW_CARD_DELAY: 300,
  
  /** Verzögerung nach dem Ziehen bevor Zug beendet wird (500ms) */
  END_TURN_DELAY: 500,
  
  /** Verzögerung für Farbwahl nach Bube (400ms) */
  SUIT_CHOICE_DELAY: 400
} as const;

/** Type für AI_TIMING Schlüssel */
export type AITimingKey = keyof typeof AI_TIMING;
